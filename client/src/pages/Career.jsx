
import React, { useState, useEffect } from 'react';

import {
  Briefcase,
  GraduationCap,
  TrendingUp,
  Target,
  Save,
  User,
  Bot,
  Loader2,
  Send
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import "highlight.js/styles/github-dark.css";

const Career = () => {
  const [profile, setProfile] = useState({
    qualification: '',
    results: '',
    interests: [],
    skills: [],
    experience: '',
    preferredIndustries: [],
    careerGoals: ''
  });

  const [suggestions, setSuggestions] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeView, setActiveView] = useState('profile');
  const [dataLoading, setDataLoading] = useState(true);

  const qualificationOptions = [
    'High School',
    "Bachelor's Degree",
    "Master's Degree",
    'PhD',
    'Diploma',
    'Certificate Course',
    'Other'
  ];

  const interestOptions = [
    'Technology', 'Healthcare', 'Education', 'Finance', 'Arts & Design',
    'Business', 'Science', 'Engineering', 'Marketing', 'Law',
    'Media', 'Sports', 'Environment', 'Social Work', 'Research'
  ];

  const skillOptions = [
    'Programming', 'Communication', 'Leadership', 'Problem Solving',
    'Data Analysis', 'Project Management', 'Creative Writing',
    'Public Speaking', 'Team Work', 'Critical Thinking',
    'Digital Marketing', 'Financial Analysis', 'Research'
  ];

  const industryOptions = [
    'Information Technology', 'Healthcare', 'Finance', 'Education',
    'Manufacturing', 'Retail', 'Consulting', 'Government',
    'Non-Profit', 'Entertainment', 'Real Estate', 'Agriculture'
  ];

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      setDataLoading(true);
      const profileResponse = await axios.get('/auth/profile');
      const userData = profileResponse.data.user;

      if (userData.profile) {
        setProfile(prev => ({
          ...prev,
          interests: userData.profile.interests || [],
          careerGoals: userData.profile.careerGoals || ''
        }));
      }

      const historyResponse = await axios.get('/ai/history?type=career');
      const careerHistory = historyResponse.data.data.history;

      const messages = [];
      careerHistory.forEach((item, index) => {
        messages.push({
          id: `user-${index}`,
          type: 'user',
          content: item.question,
          timestamp: new Date(item.timestamp)
        });
        messages.push({
          id: `ai-${index}`,
          type: 'assistant',
          content: item.response,
          timestamp: new Date(item.timestamp)
        });
      });

      setChatMessages(messages);
    } catch (error) {
      console.error('Failed to load career data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (field, value) => {
    setProfile(prev => {
      const currentArray = prev[field];
      const updatedArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: updatedArray };
    });
  };

  const saveProfile = async () => {
    try {
      setIsSaving(true);
      const profileData = {
        profile: {
          interests: profile.interests,
          careerGoals: profile.careerGoals,
          qualification: profile.qualification,
          experience: profile.experience
        }
      };
      await axios.put('/auth/profile', profileData);
      toast.success('Career profile saved successfully');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getCareerAdvice = async () => {
    if (!currentMessage.trim()) {
      toast.error('Please enter your career question');
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

    setChatMessages(prev => [...prev, userChatMessage]);
    setIsLoading(true);

    try {
      const profileContext = `
        Qualification: ${profile.qualification}
        Academic Results: ${profile.results}
        Interests: ${profile.interests.join(', ')}
        Skills: ${profile.skills.join(', ')}
        Experience: ${profile.experience}
        Preferred Industries: ${profile.preferredIndustries.join(', ')}
        Career Goals: ${profile.careerGoals}
      `;

      const response = await axios.post('/ai/career', {
        question: userMessage,
        careerField: profile.preferredIndustries[0] || 'General',
        context: profileContext
      });

      const aiMessage = {
        id: `ai-${Date.now()}`,
        type: 'assistant',
        content: response.data.data.response,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Career advice error:', error);
      toast.error(error.response?.data?.message || 'Failed to get career advice');

      const errorMessage_chat = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: 'Sorry, I encountered an error while providing career advice. Please try again.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage_chat]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      getCareerAdvice();
    }
  };

  const generateCareerAnalysis = async () => {
    if (!profile.qualification || !profile.interests.length) {
      toast.error('Please fill in your qualification and interests first');
      return;
    }

    setIsLoading(true);
    try {
      const analysisQuestion = `Based on my profile, please provide a comprehensive career analysis with specific career recommendations, required skills, salary expectations, and growth prospects. Here's my information:
      
      Qualification: ${profile.qualification}
      Academic Results: ${profile.results}
      Interests: ${profile.interests.join(', ')}
      Skills: ${profile.skills.join(', ')}
      Experience: ${profile.experience}
      Preferred Industries: ${profile.preferredIndustries.join(', ')}
      Career Goals: ${profile.careerGoals}`;

      const response = await axios.post('/ai/career', {
        question: analysisQuestion,
        careerField: 'Comprehensive Analysis'
      });

      const analysisMessage = {
        id: `analysis-${Date.now()}`,
        type: 'assistant',
        content: response.data.data.response,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, analysisMessage]);
      setActiveView('chat');
      toast.success('Career analysis generated successfully');
    } catch (error) {
      console.error('Career analysis error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate career analysis');
    } finally {
      setIsLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const formatTime = (timestamp) => {
  if (!(timestamp instanceof Date)) {
    timestamp = new Date(timestamp);
  }

  return timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};


  return (
  <div className="space-y-6">

    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Career Counselor
        </h1>
        <p className="text-[var(--text-secondary)]">
          Get personalized AI-powered career guidance
        </p>
      </div>

      <div className="flex bg-[var(--bg-secondary)] rounded-lg p-1">
        <button
          onClick={() => setActiveView('profile')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'profile'
              ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" /> Profile
        </button>

        <button
          onClick={() => setActiveView('chat')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'chat'
              ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Bot className="w-4 h-4 inline mr-2" /> Consultation
        </button>
      </div>
    </div>

    {/* Profile View */}
    {activeView === 'profile' && (
      <div className="bg-[var(--bg-primary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Column */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <GraduationCap className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Academic Background
              </h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Highest Qualification *
              </label>
              <select
                name="qualification"
                value={profile.qualification}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)]"
              >
                <option value="">Select qualification</option>
                {qualificationOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Academic Results/Grades
              </label>
              <input
                type="text"
                name="results"
                value={profile.results}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Work Experience
              </label>
              <textarea
                name="experience"
                value={profile.experience}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Career Goals
              </label>
              <textarea
                name="careerGoals"
                value={profile.careerGoals}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Interests & Skills
              </h2>
            </div>

            {[interestOptions, skillOptions, industryOptions].map((list, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-[var(--border-color)] rounded-lg p-3">
                {list.map(item => (
                  <label key={item} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-[var(--text-secondary)]">
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-[var(--border-color)]">
          <button
            onClick={saveProfile}
            disabled={isSaving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
          </button>

          <button
            onClick={generateCareerAnalysis}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <TrendingUp />}
            <span>{isLoading ? 'Analyzing...' : 'Get Career Analysis'}</span>
          </button>
        </div>
      </div>
    )}

    {/* Chat View */}
    {activeView === 'chat' && (
      <div className="bg-[var(--bg-primary)] rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <h3 className="font-semibold text-[var(--text-primary)]">
            AI Career Counselor
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Ask me about career paths, skills, and opportunities
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map(message => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`px-4 py-3 rounded-2xl max-w-[70%] ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                }`}
              >
                <ReactMarkdown rehypePlugins={[rehypeSanitize, rehypeHighlight]}>
                  {message.content}
                </ReactMarkdown>
                <p className="text-xs mt-2 text-[var(--text-secondary)]">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[var(--border-color)]">
          <div className="flex gap-3">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)]"
            />
            <button
              onClick={getCareerAdvice}
              className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg"
            >
              <Send />
            </button>
          </div>
        </div>
      </div>
    )}

  </div>
);
}; 
export default Career; 