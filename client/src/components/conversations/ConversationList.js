// client/src/components/conversations/ConversationList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const ConversationList = ({ setActiveConversation, activeConversation }) => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // Filter options: all, team, topic, direct
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  
  // Load conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/');
          return;
        }
        
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        const res = await axios.get('/api/conversations', config);
        setConversations(res.data);
      } catch (err) {
        setError('Failed to load conversations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
  }, [navigate]);
  
  // Apply filters to conversations
  const filteredConversations = conversations.filter(conversation => {
    // Apply type filter
    if (filter !== 'all' && conversation.conversationType !== filter) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      
      return (
        conversation.name.toLowerCase().includes(query) ||
        (conversation.description && 
         conversation.description.toLowerCase().includes(query)) ||
        conversation.participants.some(
          p => p.user.name.toLowerCase().includes(query)
        )
      );
    }
    
    return true;
  });
  
  // Handle conversation click
  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
  };
  
  // Handle new conversation button click
  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };
  
  // Format last message timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }
    
    // If within last week, show day name
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    if (date > oneWeekAgo) {
      return format(date, 'EEE');
    }
    
    // Otherwise show date
    return format(date, 'MM/dd/yyyy');
  };
  
  // Get last message text preview
  const getMessagePreview = (conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const { messageType, content, sender } = conversation.lastMessage;
    
    if (messageType === 'system') {
      return content;
    }
    
    if (messageType === 'image') {
      return `${sender.name}: [Image] ${content || ''}`;
    }
    
    if (messageType === 'file') {
      return `${sender.name}: [File] ${content || ''}`;
    }
    
    return `${sender.name}: ${content}`;
  };
  
  // Get conversation icon based on type
  const getConversationIcon = (conversation) => {
    switch (conversation.conversationType) {
      case 'team':
        return <i className="fas fa-users"></i>;
      case 'topic':
        return <i className="fas fa-hashtag"></i>;
      case 'direct':
        return <i className="fas fa-user"></i>;
      default:
        return <i className="fas fa-comment"></i>;
    }
  };
  
  if (loading) {
    return <div className="loading">Loading conversations...</div>;
  }
  
  return (
    <div className="conversation-list">
      <div className="list-header">
        <h2>Messages</h2>
        <button 
          className="btn btn-circle" 
          onClick={handleNewConversation}
          aria-label="New Conversation"
        >
          <i className="fas fa-plus"></i>
        </button>
      </div>
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <i className="fas fa-search"></i>
      </div>
      
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`filter-tab ${filter === 'team' ? 'active' : ''}`}
          onClick={() => setFilter('team')}
        >
          Teams
        </button>
        <button 
          className={`filter-tab ${filter === 'topic' ? 'active' : ''}`}
          onClick={() => setFilter('topic')}
        >
          Topics
        </button>
        <button 
          className={`filter-tab ${filter === 'direct' ? 'active' : ''}`}
          onClick={() => setFilter('direct')}
        >
          Direct
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {filteredConversations.length === 0 ? (
        <div className="empty-list">
          {searchQuery || filter !== 'all' 
            ? 'No conversations match your filters'
            : 'No conversations yet'}
        </div>
      ) : (
        <ul className="conversation-items">
          {filteredConversations.map(conversation => (
            <li
              key={conversation._id}
              className={`conversation-item ${
                activeConversation?._id === conversation._id ? 'active' : ''
              }`}
              onClick={() => handleConversationClick(conversation)}
            >
              <div className="conversation-icon">
                {getConversationIcon(conversation)}
              </div>
              <div className="conversation-content">
                <div className="conversation-header">
                  <h3 className="conversation-name">{conversation.name}</h3>
                  <span className="conversation-time">
                    {formatTimestamp(conversation.lastMessageAt)}
                  </span>
                </div>
                <div className="conversation-preview">
                  {getMessagePreview(conversation)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {/* New Conversation Modal would go here */}
      {showNewConversationModal && (
        <div className="modal">
          {/* Modal content would go here */}
          <button onClick={() => setShowNewConversationModal(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default ConversationList;
