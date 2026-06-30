import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const STORAGE_KEYS = {
  MODE: 'pomodoro.mode',
  IS_RUNNING: 'pomodoro.isRunning',
  END_AT: 'pomodoro.endAt',
  SETTINGS: 'pomodoro.settings',
  COMPLETED: 'pomodoro.completed',
  TOTAL_WORK: 'pomodoro.totalWork',
};

const DEFAULT_SETTINGS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
};

const PomodoroContext = createContext(null);

const minutesToSeconds = (m) => Math.max(1, Math.floor(m)) * 60;

const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio not available
  }
};

export const PomodoroProvider = ({ children }) => {
  const { user } = useAuth();

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const defaults = {
      ...DEFAULT_SETTINGS,
      workDuration: user?.preferences?.pomodoroSettings?.workDuration || 25,
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const [mode, setMode] = useState(
    () => localStorage.getItem(STORAGE_KEYS.MODE) || 'work'
  );
  const [isRunning, setIsRunning] = useState(
    () => localStorage.getItem(STORAGE_KEYS.IS_RUNNING) === 'true'
  );
  const [endAt, setEndAt] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.END_AT);
    return saved ? parseInt(saved, 10) : null;
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(() =>
    parseInt(localStorage.getItem(STORAGE_KEYS.COMPLETED) || '0', 10)
  );
  const [totalWorkTime, setTotalWorkTime] = useState(() =>
    parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_WORK) || '0', 10)
  );

  const audioRef = useRef(null);
  const tickRef = useRef(null);
  const completingRef = useRef(false);

  const getDurationForMode = useCallback(
    (m) => {
      switch (m) {
        case 'work':
          return minutesToSeconds(settings.workDuration);
        case 'shortBreak':
          return minutesToSeconds(settings.shortBreakDuration);
        case 'longBreak':
          return minutesToSeconds(settings.longBreakDuration);
        default:
          return minutesToSeconds(settings.workDuration);
      }
    },
    [settings]
  );

  const computeTimeLeft = useCallback(
    (deadline, currentMode = mode) => {
      if (!deadline) return getDurationForMode(currentMode);
      return Math.max(0, Math.round((deadline - Date.now()) / 1000));
    },
    [getDurationForMode, mode]
  );

  const notifyAndSound = useCallback(
    (title, body) => {
      if (settings.soundEnabled) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => playBeep());
        } else {
          playBeep();
        }
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, { body, icon: '/vite.svg' });
        } catch {
          // Notification failed
        }
      }

      toast.success(body, { icon: '⏰', duration: 5000 });
    },
    [settings.soundEnabled]
  );

  const handleTimerComplete = useCallback(() => {
    if (completingRef.current) return;
    completingRef.current = true;

    setIsRunning(false);
    setEndAt(null);
    setTimeLeft(0);
    localStorage.setItem(STORAGE_KEYS.IS_RUNNING, 'false');
    localStorage.removeItem(STORAGE_KEYS.END_AT);

    const currentMode = localStorage.getItem(STORAGE_KEYS.MODE) || 'work';
    const savedSettings = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}'
    );
    const mergedSettings = { ...DEFAULT_SETTINGS, ...savedSettings };
    const currentCompleted = parseInt(
      localStorage.getItem(STORAGE_KEYS.COMPLETED) || '0',
      10
    );

    if (currentMode === 'work') {
      const nextCompleted = currentCompleted + 1;
      setCompletedSessions(nextCompleted);
      localStorage.setItem(STORAGE_KEYS.COMPLETED, String(nextCompleted));

      notifyAndSound(
        'Concentration Time Ended!',
        'Great job! You can take a break now.'
      );

      const isLong = nextCompleted % mergedSettings.longBreakInterval === 0;
      const nextMode = isLong ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      localStorage.setItem(STORAGE_KEYS.MODE, nextMode);

      const nextDuration = minutesToSeconds(
        isLong
          ? mergedSettings.longBreakDuration
          : mergedSettings.shortBreakDuration
      );
      setTimeLeft(nextDuration);

      if (mergedSettings.autoStartBreaks) {
        const deadline = Date.now() + nextDuration * 1000;
        setEndAt(deadline);
        setIsRunning(true);
        localStorage.setItem(STORAGE_KEYS.END_AT, String(deadline));
        localStorage.setItem(STORAGE_KEYS.IS_RUNNING, 'true');
      }
    } else {
      notifyAndSound('Break Over', 'Time to get back to focus!');
      setMode('work');
      localStorage.setItem(STORAGE_KEYS.MODE, 'work');
      const workDuration = minutesToSeconds(mergedSettings.workDuration);
      setTimeLeft(workDuration);

      if (mergedSettings.autoStartWork) {
        const deadline = Date.now() + workDuration * 1000;
        setEndAt(deadline);
        setIsRunning(true);
        localStorage.setItem(STORAGE_KEYS.END_AT, String(deadline));
        localStorage.setItem(STORAGE_KEYS.IS_RUNNING, 'true');
      }
    }

    setTimeout(() => {
      completingRef.current = false;
    }, 1000);
  }, [notifyAndSound]);

  // Request notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODE, mode);
  }, [mode]);

  // Global tick — runs on every page while timer is active
  useEffect(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }

    const tick = () => {
      if (!endAt) return;
      const left = computeTimeLeft(endAt);
      setTimeLeft(left);
      if (left <= 0) {
        if (tickRef.current) clearInterval(tickRef.current);
        tickRef.current = null;
        handleTimerComplete();
      }
    };

    if (isRunning && endAt) {
      tick();
      tickRef.current = setInterval(tick, 1000);
    } else {
      setTimeLeft(getDurationForMode(mode));
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [
    isRunning,
    endAt,
    mode,
    computeTimeLeft,
    getDurationForMode,
    handleTimerComplete,
  ]);

  // Catch timer expiry when tab was backgrounded or user navigates back
  useEffect(() => {
    const checkExpiry = () => {
      if (isRunning && endAt && Date.now() >= endAt) {
        handleTimerComplete();
      }
    };

    checkExpiry();
    document.addEventListener('visibilitychange', checkExpiry);
    window.addEventListener('focus', checkExpiry);

    return () => {
      document.removeEventListener('visibilitychange', checkExpiry);
      window.removeEventListener('focus', checkExpiry);
    };
  }, [isRunning, endAt, handleTimerComplete]);

  // Track total work time globally
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

  const startTimer = useCallback(() => {
    const durationSec = getDurationForMode(mode);
    const deadline = Date.now() + durationSec * 1000;
    setEndAt(deadline);
    setIsRunning(true);
    localStorage.setItem(STORAGE_KEYS.END_AT, String(deadline));
    localStorage.setItem(STORAGE_KEYS.IS_RUNNING, 'true');
  }, [getDurationForMode, mode]);

  const handlePlayPause = useCallback(() => {
    if (isRunning) {
      const left = computeTimeLeft(endAt);
      setTimeLeft(left);
      setIsRunning(false);
      setEndAt(null);
      localStorage.setItem(STORAGE_KEYS.IS_RUNNING, 'false');
      localStorage.removeItem(STORAGE_KEYS.END_AT);
    } else {
      const deadline = Date.now() + timeLeft * 1000;
      setEndAt(deadline);
      setIsRunning(true);
      localStorage.setItem(STORAGE_KEYS.END_AT, String(deadline));
      localStorage.setItem(STORAGE_KEYS.IS_RUNNING, 'true');
    }
  }, [isRunning, endAt, timeLeft, computeTimeLeft]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setEndAt(null);
    localStorage.setItem(STORAGE_KEYS.IS_RUNNING, 'false');
    localStorage.removeItem(STORAGE_KEYS.END_AT);
    setTimeLeft(getDurationForMode(mode));
  }, [getDurationForMode, mode]);

  const handleModeSwitch = useCallback(
    (newMode) => {
      setIsRunning(false);
      setEndAt(null);
      setMode(newMode);
      localStorage.setItem(STORAGE_KEYS.IS_RUNNING, 'false');
      localStorage.removeItem(STORAGE_KEYS.END_AT);
      localStorage.setItem(STORAGE_KEYS.MODE, newMode);
      setTimeLeft(getDurationForMode(newMode));
    },
    [getDurationForMode]
  );

  const getProgress = useCallback(() => {
    const total = getDurationForMode(mode);
    if (total === 0) return 0;
    return ((total - timeLeft) / total) * 100;
  }, [getDurationForMode, mode, timeLeft]);

  return (
    <PomodoroContext.Provider
      value={{
        mode,
        isRunning,
        timeLeft,
        settings,
        setSettings,
        completedSessions,
        totalWorkTime,
        startTimer,
        handlePlayPause,
        handleReset,
        handleModeSwitch,
        getDurationForMode,
        getProgress,
      }}
    >
      {children}
      <audio ref={audioRef} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within PomodoroProvider');
  }
  return context;
};
