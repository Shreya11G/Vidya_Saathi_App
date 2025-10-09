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

const Pomodoro = () => {
  const { user } = useAuth();
  
  // Timer state
  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalWorkTime, setTotalWorkTime] = useState(0);
  
  // Settings state
  const [settings, setSettings] = useState({
    workDuration: user?.preferences?.pomodoroSettings?.workDuration || 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const duration = getDurationForMode(mode);
    setTimeLeft(duration * 60);
  }, [mode, settings]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (isRunning && mode === 'work') {
      const workInterval = setInterval(() => setTotalWorkTime(prev => prev + 1), 1000);
      return () => clearInterval(workInterval);
    }
  }, [isRunning, mode]);

  const getDurationForMode = (currentMode) => {
    switch (currentMode) {
      case 'work': return settings.workDuration;
      case 'shortBreak': return settings.shortBreakDuration;
      case 'longBreak': return settings.longBreakDuration;
      default: return settings.workDuration;
    }
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (settings.soundEnabled && audioRef.current) audioRef.current.play().catch(console.error);

    if ('Notification' in window && Notification.permission === 'granted') {
      const message = mode === 'work'
        ? 'Work session completed! Time for a break.'
        : 'Break time is over! Ready to get back to work?';
      new Notification('VidyaSathi Pomodoro', { body: message, icon: '/favicon.ico' });
    }

    if (mode === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      const isLongBreak = newCompletedSessions % settings.longBreakInterval === 0;
      setMode(isLongBreak ? 'longBreak' : 'shortBreak');
      if (settings.autoStartBreaks) setTimeout(() => setIsRunning(true), 1000);
    } else {
      setMode('work');
      if (settings.autoStartWork) setTimeout(() => setIsRunning(true), 1000);
    }
  };

  const handlePlayPause = () => setIsRunning(!isRunning);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getDurationForMode(mode) * 60);
  };
  const handleModeSwitch = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
  };

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
    const totalDuration = getDurationForMode(mode) * 60;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  };

  useEffect(() => requestNotificationPermission(), []);

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
          <button onClick={handlePlayPause} className={`flex items-center justify-center w-16 h-16 rounded-full ${modeInfo.color} bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}>
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
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
                  <input type="number" min="1" max="60" value={settings.workDuration} onChange={(e) => setSettings(prev => ({ ...prev, workDuration: parseInt(e.target.value) || 25 }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/>
                </div>
                {/* Short Break Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Short Break Duration (minutes)</label>
                  <input type="number" min="1" max="30" value={settings.shortBreakDuration} onChange={(e) => setSettings(prev => ({ ...prev, shortBreakDuration: parseInt(e.target.value) || 5 }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/>
                </div>
                {/* Long Break Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Long Break Duration (minutes)</label>
                  <input type="number" min="1" max="60" value={settings.longBreakDuration} onChange={(e) => setSettings(prev => ({ ...prev, longBreakDuration: parseInt(e.target.value) || 15 }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/>
                </div>
                {/* Long Break Interval */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Long Break Interval (sessions)</label>
                  <input type="number" min="2" max="10" value={settings.longBreakInterval} onChange={(e) => setSettings(prev => ({ ...prev, longBreakInterval: parseInt(e.target.value) || 4 }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/>
                </div>

                {/* Auto-start & Sound */}
                <div className="space-y-3">
                  <label className="flex items-center"><input type="checkbox" checked={settings.autoStartBreaks} onChange={(e)=>setSettings(prev=>({...prev,autoStartBreaks:e.target.checked}))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Auto-start breaks</span></label>
                  <label className="flex items-center"><input type="checkbox" checked={settings.autoStartWork} onChange={(e)=>setSettings(prev=>({...prev,autoStartWork:e.target.checked}))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Auto-start work sessions</span></label>
                  <label className="flex items-center"><input type="checkbox" checked={settings.soundEnabled} onChange={(e)=>setSettings(prev=>({...prev,soundEnabled:e.target.checked}))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">Sound notifications {settings.soundEnabled ? <Volume2 className="w-4 h-4 ml-1"/> : <VolumeX className="w-4 h-4 ml-1"/>}</span></label>
                </div>

                <button onClick={()=>setShowSettings(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">Save Settings</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT" type="audio/wav"/>
      </audio>
    </div>
  );
};

export default Pomodoro;
