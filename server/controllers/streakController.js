import User from '../models/User.js';
import Task from '../models/Task.js';

const ACTIVE_USER_FILTER = { isActive: { $ne: false } };

const getLocalDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getChartTimezone = () =>
  process.env.APP_TIMEZONE ||
  Intl.DateTimeFormat().resolvedOptions().timeZone ||
  'UTC';

export const getUserStreaks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Expire stale streaks before calculating rank
    user.validateCurrentStreak();
    await user.save({ validateBeforeSave: false });
    
    // Calculate additional streak statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const chartTimezone = getChartTimezone();

    // Get task completion data for charts/graphs
    const [
      tasksLast7Days,
      tasksLast30Days,
      totalTasksAllTime,
      usersAbove,
      totalUsers,
      topUsers
    ] = await Promise.all([
      // Tasks completed in last 7 days
      Task.aggregate([
        {
          $match: {
            userId: req.user._id,
            completed: true,
            completedAt: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$completedAt',
                timezone: chartTimezone
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Tasks completed in last 30 days
      Task.aggregate([
        {
          $match: {
            userId: req.user._id,
            completed: true,
            completedAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$completedAt',
                timezone: chartTimezone
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Total tasks completed all time
      Task.countDocuments({
        userId: req.user._id,
        completed: true
      }),
      
      // Users ranked above current user (by current streak, then longest streak)
      User.countDocuments({
        ...ACTIVE_USER_FILTER,
        $or: [
          { 'streaks.currentStreak': { $gt: user.streaks.currentStreak } },
          {
            'streaks.currentStreak': user.streaks.currentStreak,
            'streaks.longestStreak': { $gt: user.streaks.longestStreak }
          }
        ]
      }),

      // Total active users on the platform
      User.countDocuments(ACTIVE_USER_FILTER),

      // Top users for leaderboard
      User.find(ACTIVE_USER_FILTER)
        .select('name streaks.currentStreak streaks.longestStreak')
        .sort({
          'streaks.currentStreak': -1,
          'streaks.longestStreak': -1,
          name: 1
        })
        .limit(10)
        .lean()
    ]);

    const streakRanking = Math.min(usersAbove + 1, Math.max(totalUsers, 1));

    const leaderboard = [];
    let lastRank = 0;
    for (let i = 0; i < topUsers.length; i++) {
      const entry = topUsers[i];
      const rank =
        i === 0 ||
        entry.streaks.currentStreak !== topUsers[i - 1].streaks.currentStreak
          ? i + 1
          : lastRank;
      lastRank = rank;
      leaderboard.push({
        rank,
        name: entry.name,
        currentStreak: entry.streaks.currentStreak,
        longestStreak: entry.streaks.longestStreak,
        isCurrentUser: entry._id.toString() === req.user._id.toString()
      });
    }
    
    // Calculate streak achievements/badges
    const achievements = calculateAchievements(user.streaks, totalTasksAllTime);
    
    // Calculate daily task completion for the last 7 days
    const last7DaysData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = getLocalDateKey(date);
      
      const dayData = tasksLast7Days.find(d => d._id === dateStr);
      last7DaysData.push({
        date: dateStr,
        tasks: dayData ? dayData.count : 0,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    
    // Calculate monthly data for last 30 days
    const last30DaysData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = getLocalDateKey(date);
      
      const dayData = tasksLast30Days.find(d => d._id === dateStr);
      last30DaysData.push({
        date: dateStr,
        tasks: dayData ? dayData.count : 0
      });
    }
    
    // Calculate streak health (how consistent the user is)
    const streakHealth = calculateStreakHealth(last30DaysData);
    
    res.status(200).json({
      success: true,
      data: {
        currentStreak: user.streaks.currentStreak,
        longestStreak: user.streaks.longestStreak,
        totalTasksCompleted: user.streaks.totalTasksCompleted,
        tasksCompletedToday: user.streaks.tasksCompletedToday,
        lastLoginDate: user.streaks.lastLoginDate,
        lastTaskCompletionDate: user.streaks.lastTaskCompletionDate,
        streakRanking,
        totalUsers,
        leaderboard,
        achievements,
        streakHealth,
        chartData: {
          last7Days: last7DaysData,
          last30Days: last30DaysData
        },
        statistics: {
          averageTasksPerDay: last30DaysData.length > 0 
            ? Math.round(last30DaysData.reduce((sum, day) => sum + day.tasks, 0) / last30DaysData.length * 10) / 10
            : 0,
          mostProductiveDay: getMostProductiveDay(last7DaysData),
          totalTasksAllTime
        }
      }
    });
    
  } catch (error) {
    console.error('Get user streaks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve streak information'
    });
  }
};

// Update User Streak
 // Manually updates streak information (for admin or special cases)
 
export const updateStreak = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update login streak validation
    user.updateLoginStreak();
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
      success: true,
      message: 'Streak updated successfully',
      data: {
        currentStreak: user.streaks.currentStreak,
        longestStreak: user.streaks.longestStreak,
        lastLoginDate: user.streaks.lastLoginDate
      }
    });
    
  } catch (error) {
    console.error('Update streak error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update streak'
    });
  }
};

// Helper function to calculate user achievements/badges
 // Based on streak milestones and task completion
 
function calculateAchievements(streaks, totalTasks) {
  const achievements = [];
  
  // Streak-based achievements
  if (streaks.currentStreak >= 7) {
    achievements.push({
      id: 'week_warrior',
      title: 'Week Warrior',
      description: 'Maintained a 7-day streak',
      icon: '🗓️',
      unlockedAt: new Date(),
      category: 'streak'
    });
  }
  
  if (streaks.currentStreak >= 30) {
    achievements.push({
      id: 'month_master',
      title: 'Month Master',
      description: 'Maintained a 30-day streak',
      icon: '📅',
      unlockedAt: new Date(),
      category: 'streak'
    });
  }
  
  if (streaks.currentStreak >= 100) {
    achievements.push({
      id: 'century_champion',
      title: 'Century Champion',
      description: 'Maintained a 100-day streak',
      icon: '💯',
      unlockedAt: new Date(),
      category: 'streak'
    });
  }
  
  if (streaks.longestStreak >= 365) {
    achievements.push({
      id: 'year_legend',
      title: 'Year Legend',
      description: 'Achieved a 365-day streak',
      icon: '👑',
      unlockedAt: new Date(),
      category: 'streak'
    });
  }
  
  // Task-based achievements
  if (totalTasks >= 10) {
    achievements.push({
      id: 'task_starter',
      title: 'Task Starter',
      description: 'Completed 10 tasks',
      icon: '✅',
      unlockedAt: new Date(),
      category: 'tasks'
    });
  }
  
  if (totalTasks >= 100) {
    achievements.push({
      id: 'task_master',
      title: 'Task Master',
      description: 'Completed 100 tasks',
      icon: '🏆',
      unlockedAt: new Date(),
      category: 'tasks'
    });
  }
  
  if (totalTasks >= 500) {
    achievements.push({
      id: 'task_legend',
      title: 'Task Legend',
      description: 'Completed 500 tasks',
      icon: '⭐',
      unlockedAt: new Date(),
      category: 'tasks'
    });
  }
  
  // Daily achievements
  if (streaks.tasksCompletedToday >= 5) {
    achievements.push({
      id: 'daily_achiever',
      title: 'Daily Achiever',
      description: 'Completed 5+ tasks in one day',
      icon: '🚀',
      unlockedAt: new Date(),
      category: 'daily'
    });
  }
  
  if (streaks.tasksCompletedToday >= 10) {
    achievements.push({
      id: 'super_productive',
      title: 'Super Productive',
      description: 'Completed 10+ tasks in one day',
      icon: '⚡',
      unlockedAt: new Date(),
      category: 'daily'
    });
  }
  
  return achievements;
}


 // Helper function to calculate streak health
 // Returns a score from 0-100 based on consistency
 
function calculateStreakHealth(last30DaysData) {
  if (!last30DaysData || last30DaysData.length === 0) {
    return {
      score: 0,
      status: 'Poor',
      color: '#ef4444',
      daysActive: 0,
      totalDays: 0
    };
  }
  
  const daysWithTasks = last30DaysData.filter(day => day.tasks > 0).length;
  const consistencyScore = Math.round((daysWithTasks / last30DaysData.length) * 100);
  
  let healthStatus = 'Poor';
  let healthColor = '#ef4444'; // red
  
  if (consistencyScore >= 80) {
    healthStatus = 'Excellent';
    healthColor = '#10b981'; // green
  } else if (consistencyScore >= 60) {
    healthStatus = 'Good';
    healthColor = '#f59e0b'; // amber
  } else if (consistencyScore >= 40) {
    healthStatus = 'Fair';
    healthColor = '#f97316'; // orange
  }
  
  return {
    score: consistencyScore,
    status: healthStatus,
    color: healthColor,
    daysActive: daysWithTasks,
    totalDays: last30DaysData.length
  };
}

// Helper function to find the most productive day of the week
 
function getMostProductiveDay(last7DaysData) {
  if (!last7DaysData || last7DaysData.length === 0) return null;

  const mostProductiveDay = last7DaysData.reduce((max, day) =>
    day.tasks > max.tasks ? day : max
  );

  if (mostProductiveDay.tasks === 0) {
    return { day: 'N/A', tasks: 0, date: null };
  }

  return {
    day: mostProductiveDay.dayName,
    tasks: mostProductiveDay.tasks,
    date: mostProductiveDay.date
  };
}