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
Loader2
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
    scrollToBottom(); // Optional: scroll down after loading
  };

return (
  <div className="flex h-[calc(100vh-8rem)] bg-[var(--bg-primary)] rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden">

    {/* Sidebar */}
    <div className="w-80 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col">

      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">AI Tutor</h2>
          <Bot className="w-6 h-6 text-blue-500" />
        </div>

        <button
          onClick={startNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Question</span>
        </button>
      </div>

      <div className="p-4 border-b border-[var(--border-color)]">
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

      <div className="flex-1 overflow-y-auto">
        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="medium" />
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-4 text-center text-[var(--text-secondary)]">
            {searchTerm ? 'No matching conversations' : 'No chat history yet'}
          </div>
        ) : (
          <div className="p-2 space-y-2">
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
                <div className="flex items-start space-x-2">
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
        <div className="p-4 border-t border-[var(--border-color)]">
          <button
            onClick={clearChatHistory}
            className="w-full text-red-600 hover:text-red-700 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        </div>
      )}
    </div>

    {/* Main Chat */}
    <div className="flex-1 flex flex-col">

      <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">AI Study Tutor</h1>
            <p className="text-sm text-[var(--text-secondary)]">Ask me anything about your studies</p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-[var(--text-secondary)]">Subject:</label>
            <input
              type="text"
              placeholder="e.g., Math, Physics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-3 py-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm w-32"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex w-full ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded-2xl px-4 py-3 shadow-sm max-w-[70%] ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'assistant' && (
                  <Bot className="w-5 h-5 text-blue-500 mt-1 hidden sm:block" />
                )}
                {message.type === 'user' && (
                  <User className="w-5 h-5 text-white mt-1 hidden sm:block" />
                )}

                <div className="prose prose-sm dark:prose-invert max-w-full">
                  <ReactMarkdown rehypePlugins={[rehypeSanitize, rehypeHighlight]}>
                    {message.content}
                  </ReactMarkdown>
                  <p className="text-xs mt-2 text-[var(--text-secondary)]">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-[var(--text-secondary)]">AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="flex items-end space-x-3">
          <textarea
            ref={messageInputRef}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={3}
            placeholder="Ask your study question here..."
            className="w-full px-4 py-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] resize-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !currentMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-3 rounded-lg"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-2">
          💡 Tip: Be specific with your questions for better answers.
        </p>
      </div>

    </div>
  </div>
);
}; 
export default AITutor;