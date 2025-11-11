import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const PomodoroContext = createContext();

export const PomodoroProvider = ({ children }) => {
  const [mode, setMode] = useState(localStorage.getItem('mode') || 'work');
  const [isRunning, setIsRunning] = useState(localStorage.getItem('isRunning') === 'true');
  const [endAt, setEndAt] = useState(parseInt(localStorage.getItem('endAt') || 0));
  const [timeLeft, setTimeLeft] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef(null);

  const getDuration = (mode) => {
    if (mode === 'work') return 25 * 60;
    if (mode === 'shortBreak') return 5 * 60;
    return 15 * 60;
  };

  const computeTimeLeft = (deadline) => Math.max(0, Math.floor((deadline - Date.now()) / 1000));

  useEffect(() => {
    const tick = setInterval(() => {
      if (isRunning && endAt) {
        const left = computeTimeLeft(endAt);
        setTimeLeft(left);

        if (left <= 0) {
          clearInterval(tick);
          handleComplete();
        }
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [isRunning, endAt]);

  const handleComplete = () => {
    setIsRunning(false);
    localStorage.removeItem('endAt');

    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ Pomodoro Complete!', {
        body: 'Concentration session done! Take a short break.',
        icon: '/favicon.ico',
      });
    }

    alert('⏰ Pomodoro Complete! You can rest now.');
  };

  const startTimer = (newMode = mode) => {
    const deadline = Date.now() + getDuration(newMode) * 1000;
    setEndAt(deadline);
    localStorage.setItem('endAt', String(deadline));
    localStorage.setItem('mode', newMode);
    setMode(newMode);
    setIsRunning(true);
    localStorage.setItem('isRunning', 'true');
  };

  const pauseTimer = () => {
    setIsRunning(false);
    localStorage.setItem('isRunning', 'false');
  };

  const resetTimer = () => {
    setIsRunning(false);
    setEndAt(0);
    localStorage.removeItem('endAt');
    setTimeLeft(getDuration(mode));
  };

  return (
    <PomodoroContext.Provider value={{
      mode, isRunning, timeLeft, startTimer, pauseTimer, resetTimer, setSoundEnabled
    }}>
      {children}
      <audio ref={audioRef}>
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = () => useContext(PomodoroContext);
