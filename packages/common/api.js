// API service placeholder
module.exports = {
  baseUrl: process.env.API_BASE_URL || 'https://api.example.com',
  
  // HTTP methods
  get: async (endpoint) => {
    console.log(`GET request to ${endpoint}`);
    return { success: true };
  },
  
  post: async (endpoint, data) => {
    console.log(`POST request to ${endpoint}`, data);
    return { success: true, data };
  },
  
  put: async (endpoint, data) => {
    console.log(`PUT request to ${endpoint}`, data);
    return { success: true, data };
  },
  
  delete: async (endpoint) => {
    console.log(`DELETE request to ${endpoint}`);
    return { success: true };
  }
}; 