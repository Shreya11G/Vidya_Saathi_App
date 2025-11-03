import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const QuizSetup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, fileName, fileSize, totalQuestions } = location.state || {};

  const [selectedCount, setSelectedCount] = useState(30);
  const [isStarting, setIsStarting] = useState(false);

  if (!sessionId) {
    navigate('/quiz/upload');
    return null;
  }

  const questionOptions = [30, 60, 90, 100];

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

const timePerQuestion = 60; // seconds
const estimatedTime = Math.ceil((selectedCount * timePerQuestion) / 60);


  const handleStartQuiz = async () => {
    setIsStarting(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/quiz/start',
        {
          sessionId,
          numberOfQuestions: selectedCount,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        toast.success('Quiz started! Good luck!');

        navigate('/quiz/take', {
          state: {
            sessionId: response.data.data.sessionId,
            fileName: response.data.data.fileName,
            questions: response.data.data.questions,
            totalQuestions: response.data.data.totalQuestions,
            timePerQuestion: response.data.data.timePerQuestion,
          },
        });
        if(selectedCount > totalQuestions) setSelectedCount(totalQuestions);

      }
    } catch (error) {
      console.error('Start quiz error:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to start quiz. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Quiz Setup
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your quiz settings before you begin
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {fileName}
              </h3>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatFileSize(fileSize)}
                </span>
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {totalQuestions} questions generated
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            How many questions would you like to attempt?
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {questionOptions.map((count) => (
              <button
                key={count}
                onClick={() => setSelectedCount(count)}
                className={`
                  relative p-6 rounded-xl border-2 transition-all transform hover:scale-105
                  ${
                    selectedCount === count
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }
                `}
              >
                {selectedCount === count && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {count}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    questions
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Estimated Time
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {estimatedTime} minutes
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Time Per Question
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    60 seconds
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800 mb-8">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Quiz Rules:
            </h4>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Each question has 60 seconds to answer</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Timer automatically moves to next question when time expires</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>You can navigate between questions using Previous/Next buttons</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Your progress is automatically saved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Submit the quiz when you're done to see your results</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/quiz/upload')}
              disabled={isStarting}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>

            <button
              onClick={handleStartQuiz}
              disabled={isStarting}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  Start Quiz
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QuizSetup;
