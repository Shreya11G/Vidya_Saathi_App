
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Career Counselor</h1>
          <p className="text-gray-600 dark:text-gray-400">Get personalized AI-powered career guidance</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveView('profile')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'profile'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" /> Profile
          </button>
          <button
            onClick={() => setActiveView('chat')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'chat'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4 inline mr-2" /> Consultation
          </button>
        </div>
      </div>

      {/* Profile View */}
      {activeView === 'profile' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Academic Background
                </h2>
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Highest Qualification *
                </label>
                <select
                  name="qualification"
                  value={profile.qualification}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select qualification</option>
                  {qualificationOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Academic Results */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Academic Results/Grades
                </label>
                <input
                  type="text"
                  name="results"
                  value={profile.results}
                  onChange={handleInputChange}
                  placeholder="e.g., 85%, 3.8 GPA, First Class"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Work Experience
                </label>
                <textarea
                  name="experience"
                  value={profile.experience}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe your work experience, internships, projects..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Career Goals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Career Goals
                </label>
                <textarea
                  name="careerGoals"
                  value={profile.careerGoals}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="What are your long-term career aspirations?"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Right Column - Interests and Skills */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Interests & Skills
                </h2>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Areas of Interest *
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                  {interestOptions.map(interest => (
                    <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.interests.includes(interest)}
                        onChange={() => handleMultiSelectChange('interests', interest)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {interest}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills & Competencies
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                  {skillOptions.map(skill => (
                    <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.skills.includes(skill)}
                        onChange={() => handleMultiSelectChange('skills', skill)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {skill}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preferred Industries */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preferred Industries
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                  {industryOptions.map(industry => (
                    <label key={industry} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.preferredIndustries.includes(industry)}
                        onChange={() => handleMultiSelectChange('preferredIndustries', industry)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {industry}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={saveProfile}
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>

            <button
              onClick={generateCareerAnalysis}
              disabled={isLoading || !profile.qualification || !profile.interests.length}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
              <span>{isLoading ? 'Analyzing...' : 'Get Career Analysis'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Chat View */}
      {activeView === 'chat' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: '600px' }}>
           <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  AI Career Counselor
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ask me about career paths, skills, and opportunities
                </p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: '450px' }}>
            {chatMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Briefcase className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Welcome to Career Counseling!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Ask me about career opportunities, skill development, or industry insights.
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p>💼 Try: "What career options do I have with my profile?"</p>
                    <p>📈 Or: "How can I improve my skills for tech industry?"</p>
                    <p>🎯 Or: "What's the job market like for my field?"</p>
                  </div>
                </div>
              </div>
            ) : (
              chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'assistant' && (
                        <Briefcase className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      )}
                      {message.type === 'user' && (
                        <User className="w-5 h-5 text-white mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-green-500" />
                    <div className="flex items-center space-x-1">
                      <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                      <span className="text-gray-600 dark:text-gray-400">Analyzing your career question...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about career opportunities, skills, salary expectations..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={2}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={getCareerAdvice}
                disabled={isLoading || !currentMessage.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white p-3 rounded-lg transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Career;