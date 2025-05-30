import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import websocket from './shared/websocket';
import './index.css'; // or 'tailwindcss/tailwind.css'

// // Simple Authentication check (replace with real auth context later)
// const useAuth = () => {
//   // Placeholder: check local storage or context
//   // For now, let's assume the user is not logged in initially
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
  
//   // Example function to simulate login
//   const login = () => setIsAuthenticated(true);
//   // Example function to simulate logout
//   const logout = () => setIsAuthenticated(false);

//   // If you need to check a token on load:
//   // useEffect(() => {
//   //   const token = localStorage.getItem('token');
//   //   if (token) {
//   //     setIsAuthenticated(true);
//   //   }
//   // }, []);

//   return { isAuthenticated, login, logout }; // Provide login/logout for components if needed
// };

// Main App component that sets up routing
function App() {
  return (
    <AuthProvider>
      <Router>
        <CssBaseline />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

// Component to handle routing logic based on auth state
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    document.title = 'Academy Portal';
  }, []);

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Routes>
  <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
  <Route path="/signup" element={isAuthenticated ? <Navigate to="/" /> : <SignUp />} />
  <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" /> : <ForgotPassword />} />
  <Route path="/reset-password/:resetToken" element={isAuthenticated ? <Navigate to="/" /> : <ResetPassword />} />
  <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
  <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
</Routes>
    </Box>
  );
}


export default App; 
