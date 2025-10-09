import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileText,
  Home,
  RotateCcw,
} from 'lucide-react';

const QuizResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    resultId,
    fileName,
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    percentage,
    timeSpent,
    detailedAnswers,
  } = location.state || {};

  useEffect(() => {
    if (!resultId) {
      navigate('/quiz/upload');
    }
  }, [resultId, navigate]);

  if (!resultId) {
    return null;
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getPerformanceMessage = () => {
    if (percentage >= 90) return { text: 'Excellent!', color: 'text-green-600' };
    if (percentage >= 75) return { text: 'Great Job!', color: 'text-blue-600' };
    if (percentage >= 60) return { text: 'Good Effort!', color: 'text-orange-600' };
    return { text: 'Keep Practicing!', color: 'text-red-600' };
  };

  const performance = getPerformanceMessage();
  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Quiz Results
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{fileName}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 mb-8 text-white shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{performance.text}</h2>
              <p className="text-blue-100">You scored {percentage}%</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{percentage}%</div>
            <div className="text-blue-100">Score</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="text-blue-100 text-sm">Total Questions</div>
                <div className="text-2xl font-bold">{totalQuestions}</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/30 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-blue-100 text-sm">Correct</div>
                <div className="text-2xl font-bold text-green-300">
                  {correctAnswers}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/30 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-blue-100 text-sm">Wrong</div>
                <div className="text-2xl font-bold text-red-300">
                  {wrongAnswers}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Time Spent
            </h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatTime(timeSpent)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Average: {Math.round(timeSpent / totalQuestions)}s per question
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Accuracy
            </h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {percentage}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {correctAnswers} out of {totalQuestions} correct
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Detailed Answer Review
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Review each question with explanations
          </p>
        </div>

        <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
          {detailedAnswers.map((answer, index) => (
            <div
              key={answer.questionId}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-5"
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`
                  w-8 h-8 rounded-lg flex items-center justify-center font-bold flex-shrink-0
                  ${
                    answer.isCorrect
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  }
                `}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white mb-3">
                    {answer.question}
                  </p>

                  <div className="space-y-2 mb-4">
                    {answer.options.map((option, optIndex) => {
                      const isUserAnswer = answer.userAnswer === optIndex;
                      const isCorrectAnswer = answer.correctAnswer === optIndex;

                      return (
                        <div
                          key={optIndex}
                          className={`
                          p-3 rounded-lg border
                          ${
                            isCorrectAnswer
                              ? 'bg-green-50 dark:bg-green-900/10 border-green-500'
                              : isUserAnswer && !answer.isCorrect
                              ? 'bg-red-50 dark:bg-red-900/10 border-red-500'
                              : 'border-gray-200 dark:border-gray-700'
                          }
                        `}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {optionLabels[optIndex]}.
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {option}
                            </span>
                            {isCorrectAnswer && (
                              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 ml-auto" />
                            )}
                            {isUserAnswer && !answer.isCorrect && (
                              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 ml-auto" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Explanation:
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {answer.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          Back to Dashboard
        </button>

        <button
          onClick={() => navigate('/quiz/history')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 flex items-center gap-2"
        >
          <FileText className="w-5 h-5" />
          View History
        </button>

        <button
          onClick={() => navigate('/quiz/upload')}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Take Another Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizResult;
