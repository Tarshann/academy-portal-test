// client/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import AuthForm from './components/auth/AuthForm';
import Dashboard from './components/dashboard/Dashboard';
import Profile from './components/profile/Profile';
import AdminDashboard from './components/admin/AdminDashboard';
import NotFound from './components/layout/NotFound';
import './App.css';

// Set default headers for axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';

const App = () => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
    loading: true
  });
  
  // Load user on initial render
  useEffect(() => {
    const loadUser = async () => {
      // Check for token in localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setAuth({
          isAuthenticated: false,
          user: null,
          loading: false
        });
        return;
      }
      
      try {
        // Set token in axios default headers
        axios.defaults.headers.common['x-auth-token'] = token;
        
        // Get user data
        const res = await axios.get('/api/auth/user');
        
        setAuth({
          isAuthenticated: true,
          user: res.data,
          loading: false
        });
      } catch (err) {
        // Clear token on error
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['x-auth-token'];
        
        setAuth({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    };
    
    loadUser();
  }, []);
  
  // Route guard for authenticated routes
  const PrivateRoute = ({ children }) => {
    if (auth.loading) {
      return <div className="loading">Loading...</div>;
    }
    
    return auth.isAuthenticated ? children : <Navigate to="/" />;
  };
  
  // Route guard for admin routes
  const AdminRoute = ({ children }) => {
    if (auth.loading) {
      return <div className="loading">Loading...</div>;
    }
    
    return auth.isAuthenticated && auth.user.role === 'admin' 
      ? children 
      : <Navigate to="/" />;
  };
  
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={
              auth.isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <AuthForm setAuth={setAuth} />
              )
            } 
          />
          
          {/* Private Routes */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard auth={auth} setAuth={setAuth} />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/messages" 
            element={
              <PrivateRoute>
                <Dashboard auth={auth} setAuth={setAuth} />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <Profile auth={auth} setAuth={setAuth} />
              </PrivateRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard auth={auth} />
              </AdminRoute>
            } 
          />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
