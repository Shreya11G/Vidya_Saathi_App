import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  StickyNote,
  Timer,
  Bot,
  Briefcase,
  TrendingUp,
  Link as LinkIcon,
  Clock,
  Target,
  BookOpen,
  Award,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [tasksRes, notesRes, linksRes, streaksRes] = await Promise.all([
          axios.get('/tasks/stats'),
          axios.get('/notes/stats'),
          axios.get('/links/stats'),
          axios.get('/streaks')
        ]);

        setStats({
          tasks: {
            total: tasksRes.data.data.overview.totalTasks || 0,
            completed: tasksRes.data.data.overview.completedTasks || 0,
            pending: tasksRes.data.data.overview.pendingTasks || 0,
            dueToday: tasksRes.data.data.overview.dueTodayTasks || 0
          },
          notes: {
            total: notesRes.data.data.overview.totalNotes || 0,
            pinned: notesRes.data.data.overview.pinnedNotes || 0
          },
          links: {
            total: linksRes.data.data.overview.totalLinks || 0,
            favorites: linksRes.data.data.overview.favoriteLinks || 0
          },
          streaks: {
            current: streaksRes.data.data.currentStreak || 0,
            longest: streaksRes.data.data.longestStreak || 0,
            tasksToday: streaksRes.data.data.tasksCompletedToday || 0
          }
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setStats({
          tasks: { total: 0, completed: 0, pending: 0, dueToday: 0 },
          notes: { total: 0, pinned: 0 },
          links: { total: 0, favorites: 0 },
          streaks: { current: 0, longest: 0, tasksToday: 0 }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    { icon: CheckSquare, title: 'Add Task', description: 'Create a new todo item', path: '/tasks', color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600' },
    { icon: StickyNote, title: 'New Note', description: 'Quick sticky note', path: '/notes', color: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-600' },
    { icon: Timer, title: 'Start Pomodoro', description: 'Focus session', path: '/pomodoro', color: 'bg-red-500', hoverColor: 'hover:bg-red-600' },
    { icon: Bot, title: 'Ask AI Tutor', description: 'Get study help', path: '/ai-tutor', color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600' },
    { icon: Briefcase, title: 'Career Advice', description: 'Plan your future', path: '/career', color: 'bg-green-500', hoverColor: 'hover:bg-green-600' },
    { icon: LinkIcon, title: 'Save Link', description: 'Bookmark resource', path: '/links', color: 'bg-indigo-500', hoverColor: 'hover:bg-indigo-600' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {user?.name}! 👋
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Ready to continue your learning journey? Here's your progress at a glance.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Award className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Streak */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats?.streaks.current}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Best: {stats?.streaks.longest} days</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Tasks Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasks Today</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.tasks.dueToday}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{stats?.tasks.completed} completed</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Notes Count */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Notes</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats?.notes.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{stats?.notes.pinned} pinned</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <StickyNote className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Study Links */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Study Links</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.links.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{stats?.links.favorites} favorites</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className={`${action.color} ${action.hoverColor} text-white rounded-xl p-4 transition-all duration-200 transform hover:scale-105 hover:shadow-lg group`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <action.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs opacity-80">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Today's Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Focus</h3>
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Complete {stats?.tasks.dueToday || 0} tasks due today
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Maintain your {stats?.streaks.current}-day streak
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Start a focused study session
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Explore Features</h3>
            <BookOpen className="w-5 h-5 text-purple-500" />
          </div>
          <div className="space-y-4">
            <Link
              to="/ai-tutor"
              className="block p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    AI-Powered Tutoring
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Get instant help with any study topic from our AI tutor
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/memory-game"
              className="block p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    Memory Training Game
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Improve focus and memory with our brain training games
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/career"
              className="block p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    Career Guidance
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Get personalized career advice and planning support
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Study Time Recommendation */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Perfect time for a study session! 📚</h3>
            <p className="text-blue-100 mb-4">
              Based on your activity, now would be a great time to start a focused study session.
            </p>
            <Link
              to="/pomodoro"
              className="inline-flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <Timer className="w-4 h-4" />
              <span>Start 25-minute session</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <Clock className="w-16 h-16 text-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
