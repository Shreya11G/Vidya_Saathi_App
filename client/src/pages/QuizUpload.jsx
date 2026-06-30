import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';

const QuizUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const acceptedFileTypes = ['.pdf', '.docx', '.doc', '.pptx', '.ppt'];
  const maxFileSize = 10 * 1024 * 1024;

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
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
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

      const response = await api.post('/quiz/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

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
      toast.error(error.response?.data?.message || 'Failed to generate quiz. Please try again.');
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

  const steps = [
    {
      icon: Upload,
      iconClass: 'text-[var(--primary-color)]',
      bgClass: 'bg-[var(--bg-primary)]',
      title: '1. Upload Document',
      desc: 'Upload your PDF, Word, or PowerPoint file',
    },
    {
      icon: FileText,
      iconClass: 'text-green-500',
      bgClass: 'bg-[var(--bg-primary)]',
      title: '2. AI Processing',
      desc: 'AI analyzes content and generates questions',
    },
    {
      icon: CheckCircle2,
      iconClass: 'text-orange-500',
      bgClass: 'bg-[var(--bg-primary)]',
      title: '3. Start Quiz',
      desc: 'Select question count and begin testing',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
          Generate AI Quiz
        </h1>
        <p className="text-[var(--text-secondary)]">
          Upload your study material and let AI create a custom quiz for you
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
            className="bg-[var(--bg-secondary)] rounded-xl p-6 shadow-sm border border-[var(--border-color)]"
          >
            <div
              className={`w-12 h-12 ${step.bgClass} rounded-lg flex items-center justify-center mb-4`}
            >
              <step.icon className={`w-6 h-6 ${step.iconClass}`} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">{step.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[var(--bg-secondary)] rounded-xl shadow-lg border border-[var(--border-color)]"
      >
        <div className="p-6 sm:p-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all ${
              isDragging
                ? 'border-[var(--primary-color)] bg-[var(--bg-primary)]'
                : 'border-[var(--border-color)] hover:border-[var(--primary-color)]'
            }`}
          >
            <input
              type="file"
              id="quiz-file-upload"
              className="sr-only"
              accept={acceptedFileTypes.join(',')}
              onChange={handleFileInputChange}
              disabled={isUploading}
            />

            <label
              htmlFor="quiz-file-upload"
              className="cursor-pointer flex flex-col items-center outline-none"
            >
              <div className="w-16 h-16 bg-[var(--bg-primary)] rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-[var(--text-secondary)]" />
              </div>

              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                {file ? file.name : 'Drop your file here or click to browse'}
              </h3>

              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Supported formats: PDF, DOCX, PPTX (Max 10MB)
              </p>

              {file && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{formatFileSize(file.size)}</span>
                </div>
              )}
            </label>

            {isUploading && (
              <div className="mt-6">
                <div className="w-full bg-[var(--bg-primary)] rounded-full h-2 mb-2">
                  <div
                    className="bg-[var(--primary-color)] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Generating quiz... {uploadProgress}%
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--primary-color)] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[var(--text-secondary)]">
                <p className="font-semibold text-[var(--text-primary)] mb-1">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>The AI will generate up to 30 questions from your document</li>
                  <li>Ensure your document contains readable text content</li>
                  <li>Questions will be based strictly on the document content</li>
                  <li>Processing may take 30–60 seconds depending on file size</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={!file || isUploading}
              className="px-6 py-3 text-[var(--text-secondary)] font-medium rounded-lg hover:bg-[var(--bg-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleGenerateQuiz}
              disabled={!file || isUploading}
              className="px-8 py-3 bg-[var(--primary-color)] hover:opacity-90 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
