import React from 'react';

/**
 * Loading Spinner Component
 * Reusable loading indicator with different size variants
 * Supports theme-aware styling
 */

const LoadingSpinner = ({
  size = 'medium',
  color = 'primary',
  className = ''
}) => {
  // Size classes
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  // Color classes
  const colorClasses = {
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-purple-600 dark:text-purple-400',
    white: 'text-white'
  };

  const loadChatFromHistory = (session) => {
  setActiveSessionId(session.id);

  // Build a message pair: user question + AI response
  const loadedMessages = [
    {
      id: `user-${Date.now()}-history`,
      type: 'user',
      content: session.question || session.title || 'Previous question',
      timestamp: new Date(session.timestamp),
    },
    {
      id: `ai-${Date.now()}-history`,
      type: 'assistant',
      content: session.response || session.lastMessage || 'No previous answer available.',
      timestamp: new Date(session.timestamp),
    },
  ];

  setMessages(loadedMessages);
  scrollToBottom();

};


  return (
    <div className={`inline-block ${className}`}>
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );
};

export default LoadingSpinner;
