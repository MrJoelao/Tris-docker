import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    // Add any auth headers if needed in the future
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with non-2xx status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response received
      console.error('API Error: No response received');
    } else {
      // Error in setting up the request
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
