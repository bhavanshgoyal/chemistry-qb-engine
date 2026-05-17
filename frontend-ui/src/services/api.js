import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000, // 15 second timeout to help accommodate initial cold start delays
});

// Interceptor to handle slow cold starts on free-tier hosting (like Render)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, message } = error;
    
    // Initialize retry count if it doesn't exist
    if (!config || typeof config.retry === 'undefined') {
      config.retry = 0;
    }

    // Check if the error is a timeout or network error (symptoms of a cold start)
    if (message.includes('timeout') || message.includes('Network Error') || error.response?.status === 502) {
      config.retry += 1;
      
      // Retry up to 3 times
      if (config.retry <= 3) {
        // Exponential backoff delay: 2s, 4s, 8s
        const delay = Math.pow(2, config.retry) * 1000;
        
        console.warn(`API request failed (Cold start suspected). Retrying in ${delay}ms... (Attempt ${config.retry} of 3)`);
        
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
