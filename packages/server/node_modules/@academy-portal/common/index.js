// Common package entry point
module.exports = {
  version: '1.0.0',
  apiService: require('./api'),
  firebaseService: require('./firebase')
};

// Placeholder for API service that will be implemented later
module.exports.api = {
  get: async (url) => console.log(`GET request to ${url}`),
  post: async (url, data) => console.log(`POST request to ${url}`, data),
  put: async (url, data) => console.log(`PUT request to ${url}`, data),
  delete: async (url) => console.log(`DELETE request to ${url}`)
}; 