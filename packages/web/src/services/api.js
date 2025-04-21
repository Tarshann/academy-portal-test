import axios from 'axios';

// Determine the base URL based on the environment
const baseURL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || '/api' // Use relative path for production or specific URL
  : 'http://localhost:3001/api'; // Use localhost for development

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Interceptor to handle 401 errors (e.g., Navigate to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access - e.g., logout user, Navigate to login
      console.error('Unauthorized access - 401');
      // Example: Trigger logout (needs access to AuthContext or a callback)
      // logout(); 
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


export default api; 
