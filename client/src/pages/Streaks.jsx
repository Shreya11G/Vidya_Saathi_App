import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Award,
  Target,
  Flame,
  CheckCircle,
  Clock,
  BarChart3,
  Trophy,
  Users
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';


  // Streaks Component
  // Displays user progress, streaks, and achievements
  // Features: Streak tracking, progress visualization, achievement badges
 

const Streaks = () => {
  // State for streak data from backend
  const [streakData, setStreakData] = useState(null);
  
  // State for loading indicator
  const [loading, setLoading] = useState(true);
  
  // State for selected time period for charts
  const [selectedPeriod, setSelectedPeriod] = useState('7days');

  // Fetch streak data from backend on component mount
   
  useEffect(() => {
    fetchStreakData();

    const refreshOnFocus = () => fetchStreakData();
    window.addEventListener('focus', refreshOnFocus);
    return () => window.removeEventListener('focus', refreshOnFocus);
  }, []);

  // Fetch streak data from API
   
  const fetchStreakData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/streaks');
      setStreakData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch streak data:', error);
      toast.error('Failed to load streak data');
    } finally {
      setLoading(false);
    }
  };

  // Get streak status color and message
   
  const getStreakStatus = (streak) => {
    if (streak === 0) {
      return {
        color: 'text-gray-500',
        bgColor: 'bg-[var(--bg-secondary)]',
        message: 'Start your streak today!'
      };
    } else if (streak < 7) {
      return {
        color: 'text-blue-600',
        bgColor: 'bg-[var(--bg-secondary)]',
        message: 'Building momentum!'
      };
    } else if (streak < 30) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-900/20',
        message: 'Great consistency!'
      };
    } else {
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-900/20',
        message: 'Streak master!'
      };
    }
  };

  // Get achievement category color
   
  const getAchievementColor = (category) => {
    switch (category) {
      case 'streak':
        return 'bg-orange-900/20 text-orange-400';
      case 'tasks':
        return 'bg-blue-900/20 text-blue-400';
      case 'daily':
        return 'bg-green-900/20 text-green-400';
      default:
        return 'bg-[var(--bg-secondary)] text-gray-800 dark:text-gray-400';
    }
  };

  // Format date for display
   
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get chart data based on selected period
   
  const getChartData = () => {
    if (!streakData) return [];
    return selectedPeriod === '7days' ? streakData.chartData.last7Days : streakData.chartData.last30Days;
  };

  // Get maximum tasks for chart scaling
   
  const getMaxTasks = () => {
    const data = getChartData();
    return Math.max(...data.map(d => d.tasks), 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!streakData) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-secondary)]">Failed to load streak data</p>
      </div>
    );
  }

  const streakStatus = getStreakStatus(streakData.currentStreak);
  const streakHealth = streakData.streakHealth?.score !== undefined
    ? streakData.streakHealth
    : { score: 0, status: 'Poor', color: '#ef4444' };
  const totalUsers = streakData.totalUsers ?? 0;
  const userRank = streakData.streakRanking ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Streaks & Progress
          </h1>
          <p className="text-[var(--text-secondary)]">
            Track your consistency and celebrate achievements
          </p>
        </div>
        
        {/* Streak Flame Icon */}
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${streakStatus.bgColor}`}>
          <Flame className={`w-6 h-6 ${streakStatus.color}`} />
        </div>
      </div>

      {/* Main Streak Display */}
      <div className={`${streakStatus.bgColor} rounded-2xl p-8 text-center`}>
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Flame className={`w-8 h-8 ${streakStatus.color}`} />
          <div className={`text-6xl font-bold ${streakStatus.color}`}>
            {streakData.currentStreak}
          </div>
          <Flame className={`w-8 h-8 ${streakStatus.color}`} />
        </div>
        
        <h2 className={`text-2xl font-bold ${streakStatus.color} mb-2`}>
          Day Streak
        </h2>
        <p className={`${streakStatus.color} opacity-80 mb-4`}>
          {streakStatus.message}
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm">
          <div>
            <div className={`font-semibold ${streakStatus.color}`}>
              {streakData.longestStreak}
            </div>
            <div className={`${streakStatus.color} opacity-70`}>
              Best Streak
            </div>
          </div>
          <div>
            <div className={`font-semibold ${streakStatus.color}`}>
              #{userRank}
              {totalUsers > 0 && (
                <span className="text-sm font-normal opacity-80">
                  {' '}/ {totalUsers}
                </span>
              )}
            </div>
            <div className={`${streakStatus.color} opacity-70`}>
              {totalUsers > 0 ? `of ${totalUsers} users` : 'Ranking'}
            </div>
          </div>
          <div>
            <div className={`font-semibold ${streakStatus.color}`}>
              {streakData.tasksCompletedToday}
            </div>
            <div className={`${streakStatus.color} opacity-70`}>
              Today
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tasks */}
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Total Tasks</p>
              <p className="text-3xl font-bold text-blue-400">
                {streakData.statistics.totalTasksAllTime}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Average Tasks */}
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Daily Average</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {streakData.statistics.averageTasksPerDay}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Streak Health */}
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Streak Health</p>
              <p className="text-3xl font-bold" style={{ color: streakHealth.color }}>
                {streakHealth.score}%
              </p>
              <p className="text-xs" style={{ color: streakHealth.color }}>
                {streakHealth.status}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Most Productive Day */}
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Best Day</p>
              <p className="text-3xl font-bold text-orange-400">
                {streakData.statistics.mostProductiveDay?.day || 'N/A'}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {streakData.statistics.mostProductiveDay?.tasks || 0} tasks
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Activity Overview
          </h3>
          
          {/* Period Selector */}
          <div className="flex bg-[var(--bg-primary)] rounded-lg p-1">
            <button
              onClick={() => setSelectedPeriod('7days')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === '7days'
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setSelectedPeriod('30days')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === '30days'
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-4">
          {selectedPeriod === '7days' ? (
            // 7-day detailed view
            <div className="grid grid-cols-7 gap-2">
              {getChartData().map((day, index) => {
                const maxTasks = getMaxTasks();
                const barHeight = day.tasks > 0
                  ? Math.max((day.tasks / maxTasks) * 100, 12)
                  : 8;

                return (
                  <div key={index} className="text-center">
                    <div className="h-32 flex items-end justify-center mb-2">
                      <div
                        className={`w-full max-w-[2rem] rounded-t transition-all duration-300 border border-[var(--border-color)] ${
                          day.tasks > 0
                            ? 'bg-blue-500 border-blue-400'
                            : 'bg-[var(--bg-primary)]'
                        }`}
                        style={{ height: `${barHeight}%` }}
                        title={`${day.tasks} tasks on ${formatDate(day.date)}`}
                      />
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {day.dayName}
                    </div>
                    <div className="text-xs font-medium text-[var(--text-secondary)]">
                      {day.tasks}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // 30-day heatmap view
            <div className="grid grid-cols-10 gap-1.5">
              {getChartData().map((day, index) => {
                const maxTasks = getMaxTasks();
                const intensity = maxTasks > 0 ? day.tasks / maxTasks : 0;

                return (
                  <div
                    key={index}
                    className={`w-full aspect-square max-w-[1.75rem] rounded transition-all duration-200 border border-[var(--border-color)] ${
                      day.tasks === 0
                        ? 'bg-[var(--bg-primary)]'
                        : intensity > 0.75
                        ? 'bg-green-600 border-green-500'
                        : intensity > 0.5
                        ? 'bg-green-500 border-green-400'
                        : intensity > 0.25
                        ? 'bg-green-400 border-green-300'
                        : 'bg-green-300 border-green-200'
                    }`}
                    title={`${day.tasks} tasks on ${formatDate(day.date)}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Streak Leaderboard
          </h3>
          <span className="ml-auto flex items-center gap-1 text-sm text-[var(--text-secondary)]">
            <Users className="w-4 h-4" />
            {totalUsers} active users
          </span>
        </div>

        {!streakData.leaderboard?.length ? (
          <p className="text-center text-[var(--text-secondary)] py-6">
            No rankings yet. Complete tasks daily to climb the board!
          </p>
        ) : (
          <div className="space-y-2">
            {streakData.leaderboard.map((entry) => (
              <div
                key={`${entry.rank}-${entry.name}`}
                className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                  entry.isCurrentUser
                    ? 'bg-blue-500/10 border border-blue-500/30'
                    : 'hover:bg-[var(--bg-primary)]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    entry.rank === 1
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : entry.rank === 2
                      ? 'bg-gray-400/20 text-gray-400'
                      : entry.rank === 3
                      ? 'bg-orange-500/20 text-orange-500'
                      : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'
                  }`}
                >
                  {entry.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] truncate">
                    {entry.name}
                    {entry.isCurrentUser && (
                      <span className="ml-2 text-xs text-blue-500">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Best: {entry.longestStreak} days
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="font-bold text-[var(--text-primary)]">
                    {entry.currentStreak}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements */}
      <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Award className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Achievements
          </h3>
        </div>

        {streakData.achievements.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">
              Complete tasks and maintain streaks to unlock achievements!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {streakData.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 ${getAchievementColor(achievement.category)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">
                      {achievement.title}
                    </h4>
                    <p className="text-sm opacity-80 mb-2">
                      {achievement.description}
                    </p>
                    <p className="text-xs opacity-60">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Motivational Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Keep Going! 🚀</h3>
            <p className="text-blue-100 mb-4">
              {streakData.currentStreak === 0
                ? "Start your journey today by completing your first task!"
                : streakData.currentStreak < 7
                ? `You're ${7 - streakData.currentStreak} days away from your first week streak!`
                : streakData.currentStreak < 30
                ? `Amazing! You're ${30 - streakData.currentStreak} days away from a month-long streak!`
                : "Incredible dedication! You're a true streak master!"
              }
            </p>
            <div className="text-sm text-blue-200">
              💡 Tip: Complete at least one task daily to maintain your streak
            </div>
          </div>
          <div className="hidden md:block">
            <Clock className="w-16 h-16 text-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Streaks;
