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

    // Guard: if config is missing, we can't retry
    if (!config) return Promise.reject(error);

    // Initialize retry count using a namespaced key to avoid mutating sealed config objects
    if (typeof config._retryCount === 'undefined') {
      config._retryCount = 0;
    }

    // Check if the error is a timeout or network error (symptoms of a cold start)
    const isRetryable = message?.includes('timeout') ||
                        message?.includes('Network Error') ||
                        error.response?.status === 502;

    if (isRetryable && config._retryCount < 3) {
      config._retryCount += 1;

      // Exponential backoff delay: 2s, 4s, 8s
      const delay = Math.pow(2, config._retryCount) * 1000;

      console.warn(`API request failed (Cold start suspected). Retrying in ${delay}ms... (Attempt ${config._retryCount} of 3)`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
