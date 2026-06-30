import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Coffee,
  BookOpen,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { usePomodoro } from '../contexts/PomodoroContext';

const Pomodoro = () => {
  const {
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
    getProgress,
  } = usePomodoro();

  const [showSettings, setShowSettings] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getModeInfo = () => {
    switch (mode) {
      case 'work':
        return {
          title: 'Focus Time',
          icon: BookOpen,
          color: 'text-red-600',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-800',
        };
      case 'shortBreak':
        return {
          title: 'Short Break',
          icon: Coffee,
          color: 'text-green-600',
          bgColor: 'dark:bg-green-900/20',
          borderColor: 'border-green-800',
        };
      case 'longBreak':
        return {
          title: 'Long Break',
          icon: Coffee,
          color: 'text-blue-600',
          bgColor: 'bg-blue-900/20',
          borderColor: 'border-blue-800',
        };
      default:
        return {};
    }
  };

  const modeInfo = getModeInfo();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
          Pomodoro Timer
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)]">
          Stay focused with the Pomodoro Technique
        </p>
        {isRunning && (
          <p className="text-xs text-blue-500 mt-2">
            Timer runs in the background — you'll be notified when it ends
          </p>
        )}
      </div>

      {/* Timer */}
      <div
        className={`${modeInfo.bgColor} ${modeInfo.borderColor} border-2 rounded-2xl p-6 sm:p-8 text-center`}
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <modeInfo.icon className={`w-6 h-6 ${modeInfo.color}`} />
          <h2 className={`text-xl font-semibold ${modeInfo.color}`}>
            {modeInfo.title}
          </h2>
        </div>

        <div className="relative mb-8">
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 mx-auto">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                className={modeInfo.color}
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-[var(--text-primary)]">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-[var(--text-secondary)] mt-2">
                  {Math.round(getProgress())}% complete
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => (isRunning ? handlePlayPause() : startTimer())}
            className={`flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full ${modeInfo.color} bg-[var(--bg-secondary)] shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95`}
            aria-label={isRunning ? 'Pause timer' : 'Start timer'}
          >
            {isRunning ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
            aria-label="Timer settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => handleModeSwitch('work')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'work'
                ? 'bg-red-600 text-white'
                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            Work
          </button>
          <button
            onClick={() => handleModeSwitch('shortBreak')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'shortBreak'
                ? 'bg-green-600 text-white'
                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            Short Break
          </button>
          <button
            onClick={() => handleModeSwitch('longBreak')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'longBreak'
                ? 'bg-blue-600 text-white'
                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            Long Break
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            {completedSessions}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            Completed Sessions
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            {formatDuration(totalWorkTime)}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            Total Focus Time
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            {Math.ceil(completedSessions / settings.longBreakInterval)}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            Pomodoro Cycles
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-secondary)] rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Timer Settings
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Work Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={settings.workDuration}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        workDuration: parseInt(e.target.value) || 25,
                      }))
                    }
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Short Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.shortBreakDuration}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        shortBreakDuration: parseInt(e.target.value) || 5,
                      }))
                    }
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Long Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={settings.longBreakDuration}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        longBreakDuration: parseInt(e.target.value) || 15,
                      }))
                    }
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Long Break Interval (sessions)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="12"
                    value={settings.longBreakInterval}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        longBreakInterval: parseInt(e.target.value) || 4,
                      }))
                    }
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.autoStartBreaks}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          autoStartBreaks: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-[var(--text-secondary)]">
                      Auto-start breaks
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.autoStartWork}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          autoStartWork: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-[var(--text-secondary)]">
                      Auto-start work sessions
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          soundEnabled: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-[var(--text-secondary)] flex items-center gap-1">
                      Sound notifications
                      {settings.soundEnabled ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <VolumeX className="w-4 h-4" />
                      )}
                    </span>
                  </label>
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pomodoro;
