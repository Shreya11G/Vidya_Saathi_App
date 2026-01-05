import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Eye,
  Upload,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const QuizHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuizHistory();
  }, []);

  const fetchQuizHistory = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/quiz/history', {
        withCredentials: true,
      });

      if (response.data.success) {
        setHistory(response.data.data.results);
        setStatistics(response.data.data.statistics);
      }
    } catch (error) {
      console.error('Fetch history error:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to load quiz history';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 75) return 'text-blue-400';
    if (percentage >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (percentage) => {
    if (percentage >= 90)
      return 'bg-green-900/20 border-green-800';
    if (percentage >= 75)
      return 'bg-blue-900/20 border-blue-800';
    if (percentage >= 60)
      return 'bg-orange-900/20 border-orange-800';
    return 'bg-red-900/20 border-red-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading quiz history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Quiz History
            </h1>
            <p className="text-[var(--text-secondary)]">
              Track your progress and review past attempts
            </p>
          </div>
          <button
            onClick={() => navigate('/quiz/upload')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            New Quiz
          </button>
        </div>
      </motion.div>

      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[var(--bg-primary)] rounded-xl p-6 shadow-lg border border-[var(--border-color)]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-[var(--text-primary)]">
                  Total Quizzes
                </div>
                <div className="text-2xl font-bold text-[var(--text-secondary)]">
                  {statistics.totalQuizzes}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--bg-primary)] rounded-xl p-6 shadow-lg border border-[var(--border-color)]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-sm text-[var(--text-primary)]">
                  Average Score
                </div>
                <div className="text-2xl font-bold text-[var(--text-secondary)]">
                  {statistics.averageScore}%
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[var(--bg-primary)] rounded-xl p-6 shadow-lg border border-[var(--border-color)]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <div className="text-sm text-[var(--text-primary)]">
                  Best Score
                </div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {statistics.bestScore}%
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[var(--bg-secondary)] rounded-xl p-12 text-center shadow-lg border border-[var(--border-color)]"
        >
          <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-[var(--text-secondary)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            No Quiz History Yet
          </h3>
          <p className="text-[var(--text-secondary)] mb-6">
            Start taking quizzes to see your progress here
          </p>
          <button
            onClick={() => navigate('/quiz/upload')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 inline-flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Take Your First Quiz
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[var(--bg-secondary)] rounded-xl shadow-lg border border-[var(--border-color)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {history.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--text-secondary)] truncate">
                            {item.fileName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                        <Calendar className="w-4 h-4" />
                        {formatDate(item.completedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {item.totalQuestions}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${getScoreBgColor(
                          item.percentage
                        )}`}
                      >
                        <span
                          className={`text-sm font-bold ${getScoreColor(
                            item.percentage
                          )}`}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                        <Clock className="w-4 h-4" />
                        {formatTime(item.timeSpent)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          toast.error('Detailed view requires result ID from submission');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default QuizHistory;
