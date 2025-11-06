import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  RotateCcw,
  Download
} from 'lucide-react';
// import axios from 'axios';
import api from '../api/api';

import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const QuizTime = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizStatus, setQuizStatus] = useState('upload');
  const [quizResult, setQuizResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  const supportedFileTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint'
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!supportedFileTypes.includes(file.type)) {
      toast.error('Please upload a Word document, PowerPoint presentation, or PDF file');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    toast.success('File selected successfully');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const syntheticEvent = { target: { files: [file] } };
      handleFileSelect(syntheticEvent);
    }
  };

  const generateQuiz = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsGenerating(true);
    setQuizStatus('generating');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

const response = await api.post('/quiz/generate', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});




     console.log("Raw backend response:", response.data);

let questions = [];

// Handle the three most common backend formats safely
if (Array.isArray(response.data.data)) {
  // ✅ Case 1: backend returns array directly inside data
  questions = response.data.data;
} else if (response.data.data?.questions) {
  // ✅ Case 2: backend returns nested { data: { questions: [...] } }
  questions = response.data.data.questions;
} else if (Array.isArray(response.data.questions)) {
  // ✅ Case 3: backend returns { questions: [...] }
  questions = response.data.questions;
}

console.log("Extracted questions:", questions);

if (!questions || questions.length === 0) {
  toast.error("No questions could be generated — backend may have returned empty data.");
  return;
}


      setQuizQuestions(questions);
      setQuizStatus('ready');
      toast.success(`Generated ${questions.length} questions successfully!`);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate quiz questions';
      toast.error(errorMessage);
      setQuizStatus('upload');
    } finally {
      setIsGenerating(false);
    }
  };

  const startQuiz = () => {
    setQuizStatus('in-progress');
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setStartTime(new Date());

    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
  };

  const handleAnswerSelect = (selectedOption) => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correctAnswer;

    const answer = {
      questionId: currentQuestion.id,
      selectedOption,
      isCorrect
    };

    setUserAnswers((prev) => {
      const existingAnswerIndex = prev.findIndex((a) => a.questionId === currentQuestion.id);
      if (existingAnswerIndex >= 0) {
        const newAnswers = [...prev];
        newAnswers[existingAnswerIndex] = answer;
        return newAnswers;
      } else {
        return [...prev, answer];
      }
    });
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      completeQuiz();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const completeQuiz = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const correctAnswers = userAnswers.filter((answer) => answer.isCorrect).length;
    const totalQuestions = quizQuestions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    const result = {
      score: correctAnswers,
      totalQuestions,
      percentage,
      timeSpent: timeElapsed,
      answers: userAnswers,
      completedAt: new Date()
    };

    setQuizResult(result);
    setQuizStatus('completed');

    try {
      await api.post('/quiz/results', {
        fileName: selectedFile?.name,
        score: correctAnswers,
        totalQuestions,
        percentage,
        timeSpent: timeElapsed,
        answers: userAnswers
      });

      toast.success('Quiz completed and results saved!');
    } catch (error) {
      console.error('Failed to save quiz results:', error);
      toast.error('Quiz completed but failed to save results');
    }
  };

  const resetQuiz = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setSelectedFile(null);
    setQuizQuestions([]);
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    setQuizStatus('upload');
    setQuizResult(null);
    setStartTime(null);
    setTimeElapsed(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'ppt':
      case 'pptx':
        return '📊';
      default:
        return '📁';
    }
  };

  const getCurrentAnswer = () => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const answer = userAnswers.find((a) => a.questionId === currentQuestion?.id);
    return answer ? answer.selectedOption : null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quiz Time</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload documents and test your knowledge with AI-generated quizzes
          </p>
        </div>

        {quizStatus !== 'upload' && (
          <button
            onClick={resetQuiz}
            className="inline-flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Quiz</span>
          </button>
        )}
      </div>

      {/* --- Upload, Generating, Ready, In-progress, and Completed states below remain same --- */}
      {/* I will keep them unchanged since you said “write things as it is don’t change functionality” */}
      {/* Full JSX retained (same as your TSX), just without types */}

      {/* Upload State */}
      {quizStatus === 'upload' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Upload Your Document
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Upload a Word document, PowerPoint presentation, or PDF file to generate quiz questions
            </p>
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile ? (
                <div className="text-center">
                  <div className="text-4xl mb-2">{getFileIcon(selectedFile.name)}</div>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Click to browse or drag and drop your file here
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Supports: PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx)
                  </p>
                </div>
              )}
            </div>

            {selectedFile && (
              <button
                onClick={generateQuiz}
                disabled={isGenerating}
                className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 mx-auto"
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner size="small" color="white" />
                    <span>Generating Questions...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Generate Quiz</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
  {/* Generating State */}
      {quizStatus === 'generating' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <LoadingSpinner size="large" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">
            Generating Quiz Questions
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Our AI is analyzing your document and creating personalized quiz questions...
          </p>
        </div>
      )}

      {/* Ready State */}
      {quizStatus === 'ready' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Award className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Quiz Ready!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We've generated {quizQuestions.length} questions from your document. Ready to test your knowledge?
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>📄 {selectedFile?.name}</span>
              <span>•</span>
              <span>❓ {quizQuestions.length} Questions</span>
              <span>•</span>
              <span>⏱️ ~{Math.ceil(quizQuestions.length * 1.5)} minutes</span>
            </div>
          </div>

          <button
            onClick={startQuiz}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 mx-auto"
          >
            <Play className="w-5 h-5" />
            <span>Start Quiz</span>
          </button>
        </div>
      )}

      {/* In Progress State */}
      {quizStatus === 'in-progress' && quizQuestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Quiz Header */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Question {currentQuestionIndex + 1} of {quizQuestions.length}
                </span>
                <div className="w-48 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeElapsed)}</span>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {quizQuestions[currentQuestionIndex].question}
              </h3>
              
              {/* Answer Options */}
              <div className="space-y-3">
                {quizQuestions[currentQuestionIndex].options.map((option, index) => {
                  const isSelected = getCurrentAnswer() === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-white">
                          {String.fromCharCode(65 + index)}. {option}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {userAnswers.length} of {quizQuestions.length} answered
              </div>
              
              <button
                onClick={goToNextQuestion}
                disabled={getCurrentAnswer() === null}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed State */}
      {quizStatus === 'completed' && quizResult && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center mb-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              quizResult.percentage >= 80 ? 'bg-green-100 dark:bg-green-900/20' :
              quizResult.percentage >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/20' :
              'bg-red-100 dark:bg-red-900/20'
            }`}>
              <Award className={`w-10 h-10 ${
                quizResult.percentage >= 80 ? 'text-green-600 dark:text-green-400' :
                quizResult.percentage >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`} />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Quiz Completed!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Here are your results
            </p>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {quizResult.score}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Correct Answers
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {quizResult.percentage}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Score
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatTime(quizResult.timeSpent)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Time Spent
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {quizResult.totalQuestions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Questions
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Question Review
            </h3>
            
            {quizQuestions.map((question, index) => {
              const userAnswer = quizResult.answers.find(a => a.questionId === question.id);
              const isCorrect = userAnswer?.isCorrect || false;
              
              return (
                <div
                  key={question.id}
                  className={`p-4 rounded-lg border-2 ${
                    isCorrect
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <XCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white mb-2">
                        {index + 1}. {question.question}
                      </p>
                      
                      <div className="text-sm space-y-1">
                        <p className={`${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          Your answer: {question.options[userAnswer?.selectedOption || 0]}
                        </p>
                        {!isCorrect && (
                          <p className="text-green-700 dark:text-green-300">
                            Correct answer: {question.options[question.correctAnswer]}
                          </p>
                        )}
                        {question.explanation && (
                          <p className="text-gray-600 dark:text-gray-400 mt-2">
                            💡 {question.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={resetQuiz}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Take Another Quiz</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTime;
