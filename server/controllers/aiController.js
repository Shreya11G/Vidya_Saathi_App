import { validationResult } from 'express-validator';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

/**
 * AI Controller
 * Handles AI-powered features including study tutoring and career guidance
 * Uses Google Gemini for generating responses
 */

// ✅ Initialize Gemini client once
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
});


// In-memory chat history storage (in production, use database)
const chatHistory = new Map();

/**
 * Debug: List Models
 */
async function listModels() {
  try {
    const models = await genAI.listModels();
    console.log("Available Gemini Models:");
    models.forEach(m => console.log(m.name));
  } catch (err) {
    console.error("Error listing models:", err.message);
  }
}
// Uncomment if you need to check available models
// listModels();

/**
 * Ask AI Study Tutor
 */
export const askTutor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key not configured'
      });
    }

    const { question, subject, context } = req.body;
    const userId = req.user._id.toString();

    // Get user's chat history for context
    const userHistory = chatHistory.get(userId) || [];

    // System prompt
    const systemPrompt = `You are VidyaSathi, an AI-powered study tutor and learning companion. 
Your role is to:
1. Provide clear, educational explanations
2. Help students understand concepts rather than just giving answers
3. Encourage critical thinking
4. Break down complex topics into manageable parts
5. Provide study tips and strategies
6. Be encouraging and supportive

Student's academic level: ${req.user.profile?.academicLevel || 'undergraduate'}
Student's subjects of interest: ${req.user.profile?.subjects?.join(', ') || 'General studies'}`;

    // Build user message
    let userMessage = `Subject: ${subject || 'General'}\n`;
    if (context) userMessage += `Context: ${context}\n`;
    userMessage += `Question: ${question}`;

    // Prepare conversation
    const messages = [
      { role: 'user', content: systemPrompt },
      ...userHistory.slice(-10),
      { role: 'user', content: userMessage }
    ];

    // Request to Gemini
    const result = await model.generateContent({
      contents: messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }))
    });

    const aiResponse = result.response.text();
    if (!aiResponse) throw new Error('No response generated from AI');

    // Update chat history
    if (!chatHistory.has(userId)) chatHistory.set(userId, []);
    const userChatHistory = chatHistory.get(userId);

    userChatHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: aiResponse }
    );

    if (userChatHistory.length > 20) {
      userChatHistory.splice(0, userChatHistory.length - 20);
    }

    res.status(200).json({
      success: true,
      data: {
        question,
        response: aiResponse,
        subject: subject || 'General',
        context,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Tutor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI tutoring response'
    });
  }
};

/**
 * Get AI Career Advice
 */
export const getCareerAdvice = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key not configured'
      });
    }

    const { question, careerField } = req.body;
    const user = req.user;

    const systemPrompt = `You are VidyaSathi's AI Career Consultant. 
Your role is to provide personalized career advice and guidance.

Guidelines:
- Tailor advice to the student's profile and interests
- Provide actionable recommendations
- Consider both traditional and emerging career paths
- Encourage continuous learning and skill development
- Be encouraging but realistic

Student Profile:
- Academic Level: ${user.profile?.academicLevel || 'undergraduate'}
- Subjects/Interests: ${user.profile?.subjects?.join(', ') || 'Not specified'}
- Personal Interests: ${user.profile?.interests?.join(', ') || 'Not specified'}
- Career Goals: ${user.profile?.careerGoals || 'Not specified'}`;

    const userMessage = `Career Field: ${careerField || 'General'}\nCareer Question: ${question}`;

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: userMessage }] }
      ]
    });

    const aiResponse = result.response.text();
    if (!aiResponse) throw new Error('No response generated from AI');

    const userId = req.user._id.toString();
    const careerHistoryKey = `${userId}_career`;

    if (!chatHistory.has(careerHistoryKey)) chatHistory.set(careerHistoryKey, []);
    const userCareerHistory = chatHistory.get(careerHistoryKey);

    userCareerHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: aiResponse }
    );

    if (userCareerHistory.length > 10) {
      userCareerHistory.splice(0, userCareerHistory.length - 10);
    }

    res.status(200).json({
      success: true,
      data: {
        question,
        response: aiResponse,
        careerField: careerField || 'General',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Career Advisor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get career advice'
    });
  }
};

/**
 * Get Chat History
 */
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { type = 'all', limit = 20 } = req.query;

    let history = [];

    if (type === 'tutor' || type === 'all') {
      const tutorHistory = chatHistory.get(userId) || [];
      for (let i = 0; i < tutorHistory.length; i += 2) {
        if (i + 1 < tutorHistory.length) {
          history.push({
            type: 'tutor',
            question: tutorHistory[i].content,
            response: tutorHistory[i + 1].content,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    if (type === 'career' || type === 'all') {
      const careerHistoryKey = `${userId}_career`;
      const careerHistory = chatHistory.get(careerHistoryKey) || [];
      for (let i = 0; i < careerHistory.length; i += 2) {
        if (i + 1 < careerHistory.length) {
          history.push({
            type: 'career',
            question: careerHistory[i].content,
            response: careerHistory[i + 1].content,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    history = history.slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        history,
        totalCount: history.length
      }
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat history'
    });
  }
};

/**
 * Delete Chat History
 */
export const deleteChatHistory = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { type = 'all' } = req.query;

    if (type === 'tutor' || type === 'all') chatHistory.delete(userId);
    if (type === 'career' || type === 'all') chatHistory.delete(`${userId}_career`);

    res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully'
    });

  } catch (error) {
    console.error('Delete chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history'
    });
  }
};
