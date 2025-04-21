import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api'; // We will create this service next
import { websocketService } from '../shared/websocket'; // ✅ // Adjust path as needed

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [loading, setLoading] = useState(true); // Check initial auth status

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          // Optional: Verify token with backend on load
          // const response = await api.get('/auth/me'); // Assuming an endpoint to get user data
          // setUser(response.data.user);
          setIsAuthenticated(true);
          websocketService.connect(token); // Connect WebSocket on initial load if token exists
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          websocketService.disconnect();
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: loggedInUser } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(loggedInUser);
      setIsAuthenticated(true);
      websocketService.connect(newToken); // Connect WebSocket after login
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
      // Extract error message if available
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    websocketService.disconnect(); // Disconnect WebSocket on logout
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, logout }}>
      {!loading && children} {/* Render children only after initial loading check */} 
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
}; 