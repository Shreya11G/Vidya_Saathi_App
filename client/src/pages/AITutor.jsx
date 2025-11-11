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

return ( <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
{/* Sidebar */} <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"> <div className="p-4 border-b border-gray-200 dark:border-gray-700"> <div className="flex items-center justify-between mb-4"> <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Tutor</h2> <Bot className="w-6 h-6 text-blue-500" /> </div> <button
         onClick={startNewChat}
         className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
       > <Plus className="w-4 h-4" /> <span>New Question</span> </button> </div>

```
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search history..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />
      </div>
    </div>

    <div className="flex-1 overflow-y-auto">
      {historyLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="medium" />
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          {searchTerm ? 'No matching conversations' : 'No chat history yet'}
        </div>
      ) : (
        <div className="p-2 space-y-2">
          {filteredHistory.map((session) => (
            <div
              key={session.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                activeSessionId === session.id
                  ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => loadChatFromHistory(session)}

            >
              <div className="flex items-start space-x-2">
                <MessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                    {session.lastMessage}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={clearChatHistory}
          className="w-full text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center space-x-2 text-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear History</span>
        </button>
      </div>
    )}
  </div>

  {/* Main Chat */}
  <div className="flex-1 flex flex-col">
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Study Tutor</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Ask me anything about your studies</p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Subject:</label>
          <input
            type="text"
            placeholder="e.g., Math, Physics"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm w-32"
          />
        </div>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Bot className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Welcome to AI Tutor!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Ask me any study-related question and I'll help you understand the concepts.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>💡 Try asking: "Explain photosynthesis"</p>
              <p>📚 Or: "Help me solve this math problem"</p>
              <p>🔬 Or: "What is quantum physics?"</p>
            </div>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex w-full px-2 sm:px-4 ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`rounded-2xl px-4 py-3 break-words shadow-sm transition-all duration-200
                ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white self-end max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%]'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white self-start max-w-[90%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%]'
                }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'assistant' && (
                  <Bot className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0 hidden sm:block" />
                )}
                {message.type === 'user' && (
                  <User className="w-5 h-5 text-white mt-1 flex-shrink-0 hidden sm:block" />
                )}
               <div
                className={`max-w-full overflow-x-auto prose prose-sm sm:prose-base dark:prose-invert leading-relaxed ${
                  message.type === "assistant"
                    ? "text-gray-900 dark:text-gray-100" // ✅ removed background color
                    : "text-white"
                }`}
              >
                <ReactMarkdown rehypePlugins={[rehypeSanitize, rehypeHighlight]}>
                  {message.content}
                </ReactMarkdown>
              </div>


                  <p
                    className={`text-[10px] sm:text-xs mt-2 ${
                      message.type === 'user'
                        ? 'text-blue-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          
        ))
      )}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 max-w-[80%]">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-blue-500" />
              <div className="flex items-center space-x-1">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">AI is thinking...</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>

    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            ref={messageInputRef}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask your study question here... (Press Enter to send, Shift+Enter for new line)"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            rows={3}
            disabled={isLoading}
          />
        </div>
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !currentMessage.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-3 rounded-lg transition-colors flex items-center justify-center"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        💡 Tip: Be specific with your questions for better answers. Include context when needed.
      </p>
    </div>
  </div>
</div>

);
};

export default AITutor;
