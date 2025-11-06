import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
// import axios from 'axios';
import api from '../api/axios';


const QuizTake = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, fileName, questions, totalQuestions, timePerQuestion } =
    location.state || {};

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion || 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!sessionId || !questions) {
      navigate('/quiz/upload');
    }
  }, [sessionId, questions, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextQuestion();
          return timePerQuestion || 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  if (!sessionId || !questions) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (optionIndex) => {
    const existingAnswerIndex = answers.findIndex(
      (a) => a.questionId === currentQuestion.id
    );

    if (existingAnswerIndex !== -1) {
      const newAnswers = [...answers];
      newAnswers[existingAnswerIndex] = {
        questionId: currentQuestion.id,
        selectedAnswer: optionIndex,
      };
      setAnswers(newAnswers);
    } else {
      setAnswers([
        ...answers,
        {
          questionId: currentQuestion.id,
          selectedAnswer: optionIndex,
        },
      ]);
    }
  };

  const getSelectedAnswer = () => {
    const answer = answers.find((a) => a.questionId === currentQuestion.id);
    return answer ? answer.selectedAnswer : null;
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setTimeLeft(timePerQuestion || 60);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeLeft(timePerQuestion || 60);
    }
  };

  const handleSubmitQuiz = async () => {
    if (answers.length < totalQuestions) {
      const unanswered = totalQuestions - answers.length;
      if (
        !window.confirm(
          `You have ${unanswered} unanswered question(s). Submit anyway?`
        )
      ) {
        return;
      }
    }

    setIsSubmitting(true);

    const allAnswers = questions.map((q) => {
      const existingAnswer = answers.find((a) => a.questionId === q.id);
      return {
        questionId: q.id,
        selectedAnswer: existingAnswer?.selectedAnswer ?? -1,
      };
    });

    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/quiz/submit',
        {
          sessionId,
          answers: allAnswers,
          timeSpent,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        toast.success('Quiz submitted successfully!');

        navigate('/quiz/result', {
          state: {
            resultId: response.data.data.resultId,
            fileName,
            totalQuestions: response.data.data.totalQuestions,
            correctAnswers: response.data.data.correctAnswers,
            wrongAnswers: response.data.data.wrongAnswers,
            percentage: response.data.data.percentage,
            timeSpent: response.data.data.timeSpent,
            detailedAnswers: response.data.data.detailedAnswers,
          },
        });
      }
    } catch (error) {
      console.error('Submit quiz error:', error);
      const errorMessage =
        error.response?.data?.message ||
        'Failed to submit quiz. Please try again.';
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const answeredCount = answers.length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {fileName}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Answered
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {answeredCount}/{totalQuestions}
              </div>
            </div>

            <div
              className={`px-4 py-3 rounded-lg flex items-center gap-2 ${
                timeLeft <= 10
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-2xl font-bold">{timeLeft}s</span>
            </div>
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6"
        >
          <div className="p-8">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                {currentQuestionIndex + 1}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = getSelectedAnswer() === index;
                const optionLabels = ['A', 'B', 'C', 'D'];

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all transform hover:scale-[1.02] ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold flex-shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {optionLabels[index]}
                      </div>
                      <span className="text-gray-900 dark:text-white">
                        {option}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {getSelectedAnswer() === null && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Please select an answer before moving to the next question
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        <div className="flex gap-3">
          {currentQuestionIndex === totalQuestions - 1 ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Flag className="w-5 h-5" />
                  Submit Quiz
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizTake;
