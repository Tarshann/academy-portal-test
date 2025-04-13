// client/src/components/messages/MessageList.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import MessageInput from './MessageInput';

const MessageList = ({ conversation, user }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  
  // Load messages when conversation changes
  useEffect(() => {
    if (!conversation) return;
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError('');
        setPage(1);
        setHasMore(true);
        
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Not authenticated');
          return;
        }
        
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        const res = await axios.get(
          `/api/conversations/${conversation._id}/messages?page=1&limit=20`,
          config
        );
        
        setMessages(res.data.messages);
        
        // Check if there are more messages to load
        if (res.data.pagination.totalPages <= 1) {
          setHasMore(false);
        }
      } catch (err) {
        setError('Failed to load messages');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [conversation]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Load more messages when scrolling to top
  const handleScroll = async () => {
    if (!containerRef.current || !hasMore || loading) return;
    
    const { scrollTop } = containerRef.current;
    
    // If scrolled to top, load more messages
    if (scrollTop === 0) {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Not authenticated');
          return;
        }
        
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        const nextPage = page + 1;
        
        const res = await axios.get(
          `/api/conversations/${conversation._id}/messages?page=${nextPage}&limit=20`,
          config
        );
        
        // Prepend new messages to existing ones
        setMessages([...res.data.messages.reverse(), ...messages]);
        
        // Update page number
        setPage(nextPage);
        
        // Check if there are more messages to load
        if (nextPage >= res.data.pagination.totalPages) {
          setHasMore(false);
        }
      } catch (err) {
        setError('Failed to load more messages');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Format message timestamp
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }
    
    // If within last week, show day and time
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    if (date > oneWeekAgo) {
      return format(date, 'EEE h:mm a');
    }
    
    // Otherwise show date and time
    return format(date, 'MM/dd/yyyy h:mm a');
  };
  
  // Handle sending a new message
  const handleSendMessage = async (content, type = 'text', file = null) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Not authenticated');
        return;
      }
      
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      };
      
      let res;
      
      if (type === 'text') {
        // Send text message
        res = await axios.post(
          `/api/conversations/${conversation._id}/messages`,
          { content },
          config
        );
      } else if (type === 'media' && file) {
        // Send media message
        const formData = new FormData();
        formData.append('media', file);
        formData.append('content', content); // Optional caption
        
        const mediaConfig = {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        };
        
        res = await axios.post(
          `/api/conversations/${conversation._id}/messages/media`,
          formData,
          mediaConfig
        );
      }
      
      // Add new message to list
      if (res && res.data) {
        setMessages([...messages, res.data]);
      }
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    }
  };
  
  // Handle message reactions
  const handleReaction = async (messageId, reaction) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Not authenticated');
        return;
      }
      
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      };
      
      const res = await axios.post(
        `/api/conversations/${conversation._id}/messages/${messageId}/reaction`,
        { reaction },
        config
      );
      
      // Update message in the list
      if (res && res.data) {
        setMessages(
          messages.map(msg => 
            msg._id === messageId ? res.data : msg
          )
        );
      }
    } catch (err) {
      setError('Failed to add reaction');
      console.error(err);
    }
  };
  
  // Get message style based on sender
  const getMessageStyle = (message) => {
    if (message.messageType === 'system') {
      return 'system-message';
    }
    
    return message.sender._id === user._id 
      ? 'sent-message' 
      : 'received-message';
  };
  
  // Render message content based on type
  const renderMessageContent = (message) => {
    switch (message.messageType) {
      case 'image':
        return (
          <>
            <div className="message-image">
              <img src={message.mediaUrl} alt="Shared image" />
            </div>
            {message.content && <p>{message.content}</p>}
          </>
        );
      case 'file':
        return (
          <div className="message-file">
            <i className="fas fa-file"></i>
            <a 
              href={message.mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {message.mediaName}
            </a>
            {message.content && <p>{message.content}</p>}
          </div>
        );
      case 'system':
        return <p className="system-text">{message.content}</p>;
      default:
        return <p>{message.content}</p>;
    }
  };
  
  // Render message reactions
  const renderReactions = (message) => {
    if (!message.reactions || message.reactions.length === 0) {
      return null;
    }
    
    // Group reactions by type
    const reactionGroups = message.reactions.reduce((groups, reaction) => {
      const emoji = reaction.reaction;
      
      if (!groups[emoji]) {
        groups[emoji] = {
          count: 0,
          users: []
        };
      }
      
      groups[emoji].count++;
      groups[emoji].users.push(reaction.user);
      
      return groups;
    }, {});
    
    return (
      <div className="message-reactions">
        {Object.entries(reactionGroups).map(([emoji, data]) => (
          <span 
            key={emoji} 
            className="reaction-badge"
            title={data.users.map(u => u.name).join(', ')}
          >
            {emoji} {data.count}
          </span>
        ))}
      </div>
    );
  };
  
  if (!conversation) {
    return (
      <div className="message-list empty-state">
        <div className="empty-state-content">
          <i className="fas fa-comments"></i>
          <h3>Select a conversation</h3>
          <p>Choose a conversation from the list or start a new one</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="message-container">
      <div className="message-header">
        <h2>{conversation.name}</h2>
        <div className="header-actions">
          <button 
            className="btn-icon" 
            aria-label="Conversation Info"
          >
            <i className="fas fa-info-circle"></i>
          </button>
        </div>
      </div>
      
      <div 
        className="message-list" 
        ref={containerRef}
        onScroll={handleScroll}
      >
        {loading && page === 1 && (
          <div className="loading-messages">Loading messages...</div>
        )}
        
        {hasMore && (
          <div className="load-more">
            {loading && page > 1 ? (
              <span>Loading more messages...</span>
            ) : (
              <span>Scroll to top to load more</span>
            )}
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        {messages.length === 0 && !loading ? (
          <div className="empty-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="message-items">
            {messages.map((message, index) => {
              const showAvatar = 
                message.messageType !== 'system' &&
                (index === 0 || 
                 messages[index - 1].sender._id !== message.sender._id);
              
              return (
                <div
                  key={message._id}
                  className={`message-item ${getMessageStyle(message)}`}
                >
                  {showAvatar && message.messageType !== 'system' && (
                    <div className="message-avatar">
                      <img 
                        src={message.sender.profileImage} 
                        alt={message.sender.name} 
                      />
                    </div>
                  )}
                  
                  <div className="message-bubble">
                    {showAvatar && message.messageType !== 'system' && (
                      <div className="message-sender">{message.sender.name}</div>
                    )}
                    
                    <div className="message-content">
                      {renderMessageContent(message)}
                    </div>
                    
                    {renderReactions(message)}
                    
                    <div className="message-meta">
                      <span className="message-time">
                        {formatMessageTime(message.createdAt)}
                      </span>
                      
                      {message.isEdited && (
                        <span className="message-edited">Edited</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="message-actions">
                    <button 
                      className="action-button reaction-button"
                      aria-label="Add Reaction"
                    >
                      <i className="far fa-smile"></i>
                    </button>
                    
                    {message.sender._id === user._id && message.messageType === 'text' && (
                      <button 
                        className="action-button edit-button"
                        aria-label="Edit Message"
                      >
                        <i className="far fa-edit"></i>
                      </button>
                    )}
                    
                    {(message.sender._id === user._id || user.role === 'admin') && (
                      <button 
                        className="action-button delete-button"
                        aria-label="Delete Message"
                      >
                        <i className="far fa-trash-alt"></i>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <MessageInput 
        onSendMessage={handleSendMessage} 
        conversationId={conversation._id}
      />
    </div>
  );
};

export default MessageList;
