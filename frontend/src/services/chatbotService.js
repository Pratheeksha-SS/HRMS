import axios from 'axios';

// Connects directly to the new FastAPI service
const CHATBOT_API_URL = 'http://127.0.0.1:3000';

const chatbotApi = axios.create({
  baseURL: CHATBOT_API_URL,
  timeout: 30000, // Chatbots might take a bit to respond
});

chatbotApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const sendChatMessage = async (query, sessionId = 'default') => {
  try {
    const response = await chatbotApi.post('/chat', {
      query,
      session_id: sessionId
    });
    return response.data;
  } catch (error) {
    console.error('Chatbot API Error:', error);
    throw error;
  }
};
