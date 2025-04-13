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
    const loadUser
