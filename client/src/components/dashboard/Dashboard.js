// client/src/components/dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import ConversationList from '../conversations/ConversationList';
import MessageList from '../messages/MessageList';
import io from 'socket.io-client';

const Dashboard = ({ auth, setAuth }) => {
  const navigate = useNavigate();
  const [activeConversation, setActiveConversation] = useState(null);
  const [socket, setSocket] = useState(null);
  
  // Initialize socket connection
  useEffect(() => {
    if (!auth.isAuthenticated) return;
    
    // Connect to socket
    const newSocket = io();
    setSocket(newSocket);
    
    // Authenticate socket connection
    newSocket.emit('authenticate', localStorage.getItem('token'));
    
    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [auth.isAuthenticated]);
  
  // Join conversation room when active conversation changes
  useEffect(() => {
    if (!socket || !activeConversation) return;
    
    // Join conversation room
    socket.emit('join_conversation', activeConversation._id);
    
    // Leave conversation room when component unmounts or active conversation changes
    return () => {
      if (socket && activeConversation) {
        socket.emit('leave_conversation', activeConversation._id);
      }
    };
  }, [socket, activeConversation]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!auth.isAuthenticated && !auth.loading) {
      navigate('/');
    }
  }, [auth, navigate]);
  
  // Handle logout
  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Reset auth state
    setAuth({
      isAuthenticated: false,
      user: null,
      loading: false
    });
    
    // Disconnect socket
    if (socket) {
      socket.disconnect();
    }
    
    // Redirect to login
    navigate('/');
  };
  
  if (auth.loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="dashboard">
      <Sidebar user={auth.user} onLogout={handleLogout} />
      
      <div className="main-content">
        <div className="conversation-panel">
          <ConversationList
            setActiveConversation={setActiveConversation}
            activeConversation={activeConversation}
          />
        </div>
        
        <div className="message-panel">
          <MessageList
            conversation={activeConversation}
            user={auth.user}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
