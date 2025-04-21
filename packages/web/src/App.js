import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Redirect,
} from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import websocket from './shared/websocket';

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
      <Switch>
        <Route path="/login">
          {isAuthenticated ? <Redirect to="/" /> : <Login />}
        </Route>
        <Route path="/signup">
          {isAuthenticated ? <Redirect to="/" /> : <SignUp />}
        </Route>
        <Route path="/forgot-password">
          {isAuthenticated ? <Redirect to="/" /> : <ForgotPassword />}
        </Route>
        <Route path="/reset-password/:resetToken">
          {isAuthenticated ? <Redirect to="/" /> : <ResetPassword />}
        </Route>
        <PrivateRoute exact path="/" isAuthenticated={isAuthenticated}>
          <Home />
        </PrivateRoute>
        {/* Add other private/public routes here */}
        
        <Redirect from="*" to={isAuthenticated ? "/" : "/login"} />
      </Switch>
    </Box>
  );
}

// Wrapper for private routes
function PrivateRoute({ children, isAuthenticated, ...rest }) {
  return (
    <Route
      {...rest}
      render={({ location }) =>
        isAuthenticated ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location }
            }}
          />
        )
      }
    />
  );
}

export default App; 
