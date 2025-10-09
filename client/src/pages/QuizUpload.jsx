import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const QuizUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const acceptedFileTypes = ['.pdf', '.docx', '.doc', '.pptx', '.ppt'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (selectedFile) => {
    const fileExtension = selectedFile.name.toLowerCase().match(/\.\w+$/)?.[0];

    if (!fileExtension || !acceptedFileTypes.includes(fileExtension)) {
      return 'Invalid file type. Please upload PDF, Word, or PowerPoint files only.';
    }

    if (selectedFile.size > maxFileSize) {
      return 'File size exceeds 10MB limit. Please choose a smaller file.';
    }

    return null;
  };

  const handleFileSelect = (selectedFile) => {
    const error = validateFile(selectedFile);

    if (error) {
      toast.error(error);
      return;
    }

    setFile(selectedFile);
    toast.success('File selected successfully!');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      const response = await axios.post(
        'http://localhost:5000/api/quiz/generate',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data.success) {
        toast.success('Quiz generated successfully!');

        setTimeout(() => {
          navigate('/quiz/setup', {
            state: {
              sessionId: response.data.data.sessionId,
              fileName: response.data.data.fileName,
              fileSize: response.data.data.fileSize,
              totalQuestions: response.data.data.totalQuestions,
            },
          });
        }, 500);
      }
    } catch (error) {
      console.error('Quiz generation error:', error);

      const errorMessage =
        error.response?.data?.message || 'Failed to generate quiz. Please try again.';
      toast.error(errorMessage);

      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Generate AI Quiz
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your study material and let AI create a custom quiz for you
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            1. Upload Document
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload your PDF, Word, or PowerPoint file
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            2. AI Processing
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI analyzes content and generates questions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            3. Start Quiz
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select question count and begin testing
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="p-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center transition-all
              ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
              }
            `}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept={acceptedFileTypes.join(',')}
              onChange={handleFileInputChange}
              disabled={isUploading}
            />

            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {file ? file.name : 'Drop your file here or click to browse'}
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Supported formats: PDF, DOCX, PPTX (Max 10MB)
              </p>

              {file && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{formatFileSize(file.size)}</span>
                </div>
              )}
            </label>

            {isUploading && (
              <div className="mt-6">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generating quiz... {uploadProgress}%
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-semibold mb-1">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>The AI will generate 100 questions from your document</li>
                  <li>Ensure your document contains readable text content</li>
                  <li>Questions will be based strictly on the document content</li>
                  <li>Processing may take 30-60 seconds depending on file size</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={() => setFile(null)}
              disabled={!file || isUploading}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>

            <button
              onClick={handleGenerateQuiz}
              disabled={!file || isUploading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generate Quiz
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QuizUpload;
