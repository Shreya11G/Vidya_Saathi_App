import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Coffee,
  BookOpen,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEYS = {
  MODE: 'pomodoro.mode',
  IS_RUNNING: 'pomodoro.isRunning',
  END_AT: 'pomodoro.endAt',            // ms timestamp
  SETTINGS: 'pomodoro.settings',
  COMPLETED: 'pomodoro.completed',
  TOTAL_WORK: 'pomodoro.totalWork',
};

const Pomodoro = () => {
  const { user } = useAuth();

  // ----- Settings (persisted) -----
  const defaultSettings = {
    workDuration: user?.preferences?.pomodoroSettings?.workDuration || 25, // minutes
    shortBreakDuration: 5,  // minutes
    longBreakDuration: 15,  // minutes
    longBreakInterval: 4,   // sessions
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true,
  };

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  // ----- Mode / Timer state (persisted) -----
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEYS.MODE) || 'work');
  const [isRunning, setIsRunning] = useState(() => localStorage.getItem(STORAGE_KEYS.IS_RUNNING) === 'true');

  // When running, we rely on absolute end time
  const [endAt, setEndAt] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.END_AT);
    return saved ? parseInt(saved, 10) : null;
  });

  const [timeLeft, setTimeLeft] = useState(0); // seconds, derived from endAt
  const [completedSessions, setCompletedSessions] = useState(() =>
    parseInt(localStorage.getItem(STORAGE_KEYS.COMPLETED) || '0', 10)
  );
  const [totalWorkTime, setTotalWorkTime] = useState(() =>
    parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_WORK) || '0', 10)
  );

  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef(null);
  const tickRef = useRef(null); // interval id

  // ----- Helpers -----
  const minutesToSeconds = (m) => Math.max(1, Math.floor(m)) * 60;

  const getDurationForMode = (m) => {
    switch (m) {
      case 'work': return minutesToSeconds(settings.workDuration);
      case 'shortBreak': return minutesToSeconds(settings.shortBreakDuration);
      case 'longBreak': return minutesToSeconds(settings.longBreakDuration);
      default: return minutesToSeconds(settings.workDuration);
    }
  };

  const computeTimeLeft = (deadline) => {
    if (!deadline) return getDurationForMode(mode);
    return Math.max(0, Math.round((deadline - Date.now()) / 1000));
  };

  // ----- Persist settings whenever they change -----
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // ----- Request notification permission once -----
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // ----- On mount, derive timeLeft from endAt; also on visibility change -----
  useEffect(() => {
    const recalc = () => {
      if (isRunning && endAt) {
        setTimeLeft(computeTimeLeft(endAt));
      } else {
        // not running -> show full duration for current mode
        setTimeLeft(getDurationForMode(mode));
      }
    };
    recalc();

    const onVisibility = () => recalc();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // ----- Keep localStorage in sync for mode/isRunning/endAt -----
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODE, mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_RUNNING, String(isRunning));
  }, [isRunning]);

  useEffect(() => {
    if (endAt) localStorage.setItem(STORAGE_KEYS.END_AT, String(endAt));
    else localStorage.removeItem(STORAGE_KEYS.END_AT);
  }, [endAt]);

  // ----- Tick loop based on absolute endAt -----
  useEffect(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (isRunning && endAt) {
      // tick every second; compute from absolute time
      tickRef.current = setInterval(() => {
        const left = computeTimeLeft(endAt);
        setTimeLeft(left);
        if (left <= 0) {
          clearInterval(tickRef.current);
          tickRef.current = null;
          handleTimerComplete();
        }
      }, 1000);
    } else {
      // stopped -> just display full duration for current mode
      setTimeLeft(getDurationForMode(mode));
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, endAt, mode, settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration]);

  // ----- Track total work time only when running + work mode -----
  useEffect(() => {
    let workInterval;
    if (isRunning && mode === 'work') {
      workInterval = setInterval(() => {
        setTotalWorkTime((prev) => {
          const next = prev + 1;
          localStorage.setItem(STORAGE_KEYS.TOTAL_WORK, String(next));
          return next;
        });
      }, 1000);
    }
    return () => workInterval && clearInterval(workInterval);
  }, [isRunning, mode]);

  // ----- Actions -----
  const startTimer = () => {
    const durationSec = getDurationForMode(mode);
    const deadline = Date.now() + durationSec * 1000;
    setEndAt(deadline);
    setIsRunning(true);
  };

  const handlePlayPause = () => {
    if (isRunning) {
      // pause -> freeze timeLeft and clear endAt
      const left = computeTimeLeft(endAt);
      setTimeLeft(left);
      setIsRunning(false);
      setEndAt(null);
    } else {
      // resume -> set new endAt based on current timeLeft
      const deadline = Date.now() + timeLeft * 1000;
      setEndAt(deadline);
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setEndAt(null);
    setTimeLeft(getDurationForMode(mode));
  };

  const handleModeSwitch = (newMode) => {
    setIsRunning(false);
    setEndAt(null);
    setMode(newMode);
    setTimeLeft(getDurationForMode(newMode));
  };

  const notifyAndSound = (title, body) => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.ico' });
      } catch {}
    }
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    setEndAt(null);
    setTimeLeft(0);

    const isWork = mode === 'work';
    if (isWork) {
      const nextCompleted = completedSessions + 1;
      setCompletedSessions(nextCompleted);
      localStorage.setItem(STORAGE_KEYS.COMPLETED, String(nextCompleted));
      notifyAndSound('⏰ Concentration Time Ended!', 'Great job! You can take a break now.');
      // decide next mode
      const isLong = nextCompleted % settings.longBreakInterval === 0;
      const nextMode = isLong ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      setTimeLeft(getDurationForMode(nextMode));
      if (settings.autoStartBreaks) {
        const deadline = Date.now() + getDurationForMode(nextMode) * 1000;
        setEndAt(deadline);
        setIsRunning(true);
      }
    } else {
      // break finished
      notifyAndSound('🔔 Break Over', 'Time to get back to focus!');
      setMode('work');
      setTimeLeft(getDurationForMode('work'));
      if (settings.autoStartWork) {
        const deadline = Date.now() + getDurationForMode('work') * 1000;
        setEndAt(deadline);
        setIsRunning(true);
      }
    }
  };

  // ----- UI helpers -----
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getProgress = () => {
    const total = getDurationForMode(mode);
    return ((total - timeLeft) / total) * 100;
  };

  const getModeInfo = () => {
    switch (mode) {
      case 'work':
        return { title: 'Focus Time', icon: BookOpen, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800' };
      case 'shortBreak':
        return { title: 'Short Break', icon: Coffee, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800' };
      case 'longBreak':
        return { title: 'Long Break', icon: Coffee, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800' };
      default: return {};
    }
  };

  const modeInfo = getModeInfo();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Pomodoro Timer</h1>
        <p className="text-gray-600 dark:text-gray-400">Stay focused with the Pomodoro Technique</p>
      </div>

      {/* Timer */}
      <div className={`${modeInfo.bgColor} ${modeInfo.borderColor} border-2 rounded-2xl p-8 text-center`}>
        <div className="flex items-center justify-center space-x-2 mb-6">
          <modeInfo.icon className={`w-6 h-6 ${modeInfo.color}`} />
          <h2 className={`text-xl font-semibold ${modeInfo.color}`}>{modeInfo.title}</h2>
        </div>

        <div className="relative mb-8">
          <div className="relative w-64 h-64 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none" className="text-gray-200 dark:text-gray-700" />
              <circle
                cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                className={modeInfo.color} style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-mono font-bold text-gray-900 dark:text-white">{formatTime(timeLeft)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">{Math.round(getProgress())}% complete</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <button
            onClick={() => (isRunning ? handlePlayPause() : startTimer())}
            className={`flex items-center justify-center w-16 h-16 rounded-full ${modeInfo.color} bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>
          <button onClick={handlePlayPause} className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button onClick={handleReset} className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={() => setShowSettings(true)} className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center justify-center space-x-2">
          <button onClick={() => handleModeSwitch('work')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'work' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Work</button>
          <button onClick={() => handleModeSwitch('shortBreak')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'shortBreak' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Short Break</button>
          <button onClick={() => handleModeSwitch('longBreak')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'longBreak' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Long Break</button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">{completedSessions}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed Sessions</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">{formatDuration(totalWorkTime)}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Focus Time</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">{Math.ceil(completedSessions / settings.longBreakInterval)}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pomodoro Cycles</div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Timer Settings</h2>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">×</button>
              </div>

              <div className="space-y-4">
                {/* Work Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Work Duration (minutes)</label>
                  <input type="number" min="1" max="90" value={settings.workDuration} onChange={(e) => setSettings(prev => ({ ...prev, workDuration: parseInt(e.target.value) || 25 }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/>
                </div>
                {/* Short Break Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Short Break Duration (minutes)</label>
                  <input type="number" min="1" max="60" value={settings.shortBreakDuration} onChange={(e) => setSettings(prev => ({ ...prev, shortBreakDuration: parseInt(e.target.value) || 5 }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/>
                </div>
                {/* Long Break Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Long Break Duration (minutes)</label>
                  <input type="number" min="1" max="120" value={settings.longBreakDuration} onChange={(e) => setSettings(prev => ({ ...prev, longBreakDuration: parseInt(e.target.value) || 15 }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/>
                </div>
                {/* Long Break Interval */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Long Break Interval (sessions)</label>
                  <input type="number" min="2" max="12" value={settings.longBreakInterval} onChange={(e) => setSettings(prev => ({ ...prev, longBreakInterval: parseInt(e.target.value) || 4 }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/>
                </div>

                {/* Auto-start & Sound */}
                <div className="space-y-3">
                  <label className="flex items-center"><input type="checkbox" checked={settings.autoStartBreaks} onChange={(e)=>setSettings(prev=>({...prev,autoStartBreaks:e.target.checked}))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Auto-start breaks</span></label>
                  <label className="flex items-center"><input type="checkbox" checked={settings.autoStartWork} onChange={(e)=>setSettings(prev=>({...prev,autoStartWork:e.target.checked}))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Auto-start work sessions</span></label>
                  <label className="flex items-center">
                    <input type="checkbox" checked={settings.soundEnabled} onChange={(e)=>setSettings(prev=>({...prev,soundEnabled:e.target.checked}))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                      Sound notifications {settings.soundEnabled ? <Volume2 className="w-4 h-4 ml-1"/> : <VolumeX className="w-4 h-4 ml-1"/>}
                    </span>
                  </label>
                </div>

                <button onClick={()=>setShowSettings(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">Save Settings</button>
              </div>
            </div>
          </div>
        </div>
      )}

     <audio ref={audioRef} preload="auto">
    <source src="/notification.mp3" type="audio/mpeg" />
    </audio>

    </div>
  );
};

export default Pomodoro;
