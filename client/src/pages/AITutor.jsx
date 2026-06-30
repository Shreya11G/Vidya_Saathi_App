import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import "highlight.js/styles/github-dark.css"; // we can use "github.css" for light mode



import {
Plus,
Send,
Search,
Bot,
User,
Trash2,
MessageSquare,
Loader2,
History,
X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const AITutor = () => {
const [messages, setMessages] = useState([]);
const [chatHistory, setChatHistory] = useState([]);
const [currentMessage, setCurrentMessage] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [historyLoading, setHistoryLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
const [activeSessionId, setActiveSessionId] = useState(null);
const [subject, setSubject] = useState('');
const [showHistory, setShowHistory] = useState(false);

const messagesEndRef = useRef(null);
const messageInputRef = useRef(null);

const scrollToBottom = () => {
  setTimeout(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
};


useEffect(() => {
scrollToBottom();
}, [messages]);

useEffect(() => {
fetchChatHistory();
}, []);

const fetchChatHistory = async () => {
try {
setHistoryLoading(true);
const response = await axios.get('/ai/history?type=tutor');
const sessions = response.data.data.history.map((item, index) => ({
  id: `session-${index}`,
  title: item.question.substring(0, 50) + '...',
  lastMessage: item.response.substring(0, 100) + '...',
  question: item.question,
  response: item.response,
  timestamp: new Date(item.timestamp),
  messageCount: 2
}));

setChatHistory(sessions);
} catch (error) {
console.error('Failed to fetch chat history:', error);
toast.error('Failed to load chat history');
} finally {
setHistoryLoading(false);
}
};

const startNewChat = () => {
setMessages([]);
setActiveSessionId(null);
setCurrentMessage('');
setSubject('');
setTimeout(() => {
messageInputRef.current?.focus();
}, 100);
};

const handleSendMessage = async () => {
if (!currentMessage.trim()) {
toast.error('Please enter a question');
return;
}
if (isLoading) return;

const userMessage = currentMessage.trim();
setCurrentMessage('');

const userChatMessage = {
  id: `user-${Date.now()}`,
  type: 'user',
  content: userMessage,
  timestamp: new Date()
};
setMessages(prev => [...prev, userChatMessage]);
setIsLoading(true);

try {
  const response = await axios.post('/ai/tutor', {
    question: userMessage,
    subject: subject || undefined,
    context: messages.length > 0 ? 'Continuing conversation' : undefined
  });

  const aiMessage = {
    id: `ai-${Date.now()}`,
    type: 'assistant',
    content: response.data.data.response,
    timestamp: new Date()
  };
  setMessages(prev => [...prev, aiMessage]);
  fetchChatHistory();
} catch (error) {
  console.error('AI Tutor error:', error);
  const errorMessage = error.response?.data?.message || 'Failed to get AI response';
  toast.error(errorMessage);
  const errorChatMessage = {
    id: `error-${Date.now()}`,
    type: 'assistant',
    content: 'Sorry, I encountered an error. Please try again.',
    timestamp: new Date()
  };
  setMessages(prev => [...prev, errorChatMessage]);
} finally {
  setIsLoading(false);
}


};

const handleKeyPress = (e) => {
if (e.key === 'Enter' && !e.shiftKey) {
e.preventDefault();
handleSendMessage();
}
};

const clearChatHistory = async () => {
if (!window.confirm('Are you sure you want to clear all chat history?')) {
return;
}
try {
await axios.delete('/ai/history?type=tutor');
setChatHistory([]);
setMessages([]);
setActiveSessionId(null);
toast.success('Chat history cleared');
} catch (error) {
console.error('Failed to clear chat history:', error);
toast.error('Failed to clear chat history');
}
};

const filteredHistory = chatHistory.filter(session =>
session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
session.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
);

const formatTime = (timestamp) => {
return timestamp.toLocaleTimeString('en-US', {
hour: '2-digit',
minute: '2-digit'
});
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
    setShowHistory(false);
    scrollToBottom(); 
  };

return (
  <div className="flex flex-col md:flex-row min-h-[calc(100dvh-10rem)] md:h-[calc(100dvh-8rem)] bg-[var(--bg-primary)] rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden relative">

    {/* Mobile history overlay */}
    {showHistory && (
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={() => setShowHistory(false)}
        aria-hidden="true"
      />
    )}

    {/* History Sidebar */}
    <div className={`
      fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw]
      md:relative md:inset-auto md:z-auto md:w-80 md:max-w-none
      bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col
      transform transition-transform duration-300 ease-in-out
      ${showHistory ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>

      <div className="p-4 border-b border-[var(--border-color)] flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">AI Tutor</h2>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-500" />
            <button
              onClick={() => setShowHistory(false)}
              className="md:hidden p-1 rounded-md hover:bg-[var(--bg-primary)]"
              aria-label="Close history"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button
          onClick={() => { startNewChat(); setShowHistory(false); }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Question</span>
        </button>
      </div>

      <div className="p-4 border-b border-[var(--border-color)] flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="medium" />
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-4 text-center text-[var(--text-secondary)] text-sm">
            {searchTerm ? 'No matching conversations' : 'No chat history yet'}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredHistory.map((session) => (
              <div
                key={session.id}
                onClick={() => loadChatFromHistory(session)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  activeSessionId === session.id
                    ? 'bg-blue-500/10 border border-blue-500/30'
                    : 'hover:bg-[var(--bg-primary)]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate mt-1">
                      {session.lastMessage}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {session.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {chatHistory.length > 0 && (
        <div className="p-4 border-t border-[var(--border-color)] flex-shrink-0">
          <button
            onClick={clearChatHistory}
            className="w-full text-red-600 hover:text-red-700 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        </div>
      )}
    </div>

    {/* Main Chat */}
    <div className="flex-1 flex flex-col min-w-0 min-h-0">

      <div className="p-3 sm:p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setShowHistory(true)}
              className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-primary)] transition-colors flex-shrink-0"
              aria-label="Open chat history"
            >
              <History className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] truncate">AI Study Tutor</h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Ask me anything about your studies</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <label className="text-sm text-[var(--text-secondary)] whitespace-nowrap">Subject:</label>
            <input
              type="text"
              placeholder="e.g., Math"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-3 py-1.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm w-full sm:w-32"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 min-h-0">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <Bot className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">How can I help you study?</h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-sm">
              Ask questions about any subject. Be specific for the best answers.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex w-full ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded-2xl px-3 sm:px-4 py-3 shadow-sm max-w-[90%] sm:max-w-[75%] md:max-w-[70%] ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.type === 'assistant' && (
                  <Bot className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0 hidden sm:block" />
                )}
                {message.type === 'user' && (
                  <User className="w-5 h-5 text-white mt-0.5 flex-shrink-0 hidden sm:block" />
                )}

                <div className="prose prose-sm dark:prose-invert max-w-full min-w-0">
                  <ReactMarkdown rehypePlugins={[rehypeSanitize, rehypeHighlight]}>
                    {message.content}
                  </ReactMarkdown>
                  <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-200' : 'text-[var(--text-secondary)]'}`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-[var(--text-secondary)]">AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 sm:p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex-shrink-0">
        <div className="flex items-end gap-2 sm:gap-3">
          <textarea
            ref={messageInputRef}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={2}
            placeholder="Ask your study question here..."
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] resize-none text-sm sm:text-base min-h-[44px]"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !currentMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-2.5 sm:p-3 rounded-lg flex-shrink-0 transition-colors"
            aria-label="Send message"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-2 hidden sm:block">
          Tip: Be specific with your questions for better answers. Press Enter to send.
        </p>
      </div>

    </div>
  </div>
);
}; 
export default AITutor;