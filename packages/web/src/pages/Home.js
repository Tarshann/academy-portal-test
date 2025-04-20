import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Button,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import ConversationList from '../components/Chat/ConversationList';
import ChatWindow from '../components/Chat/ChatWindow';
import { websocketService } from './shared/websocket';
import api from '../services/api';

// Basic theme for the home page
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      // Slightly grey background for the page
      default: '#f4f6f8',
      // White background for Paper elements like sidebar/chat
      paper: '#ffffff', 
    },
  },
});

const Home = () => {
  const { user, logout } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    const fetchConversations = async () => {
      setConversationsLoading(true);
      setConversationsError('');
      try {
        const response = await api.get('/groups');
        const formattedConversations = response.data.map(group => ({
            id: group._id,
            name: group.name,
            lastMessage: '...',
            timestamp: '...',
            avatar: group.avatar || null,
            type: 'group',
            raw: group
        }));
        setConversations(formattedConversations);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        setConversationsError('Could not load conversations. Please try again later.');
      }
      setConversationsLoading(false);
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setMessagesLoading(true);
      setMessagesError('');
      setMessages([]);
      try {
        console.log(`Fetching messages for ${selectedConversation.name} (${selectedConversation.id})`);
        const response = await api.get(`/messages/${selectedConversation.id}`);
        setMessages(response.data || []);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        setMessagesError('Could not load messages for this conversation.');
      }
      setMessagesLoading(false);
    };

    fetchMessages();
  }, [selectedConversation]);

  // --- WebSocket Listeners ---
  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      console.log('WebSocket message received:', newMessage);

      // 1. Update message list if it belongs to the selected conversation
      if (newMessage.group === selectedConversation?.id) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }

      // 2. Update conversation list (last message, timestamp, unread count, order)
      setConversations(prevConversations => {
        const conversationIndex = prevConversations.findIndex(conv => conv.id === newMessage.group);
        
        if (conversationIndex === -1) {
          // Conversation not found? Maybe fetch it or ignore.
          console.warn('Received message for unknown conversation:', newMessage.group);
          return prevConversations;
        }
        
        const updatedConversation = {
          ...prevConversations[conversationIndex],
          lastMessage: newMessage.content, // Update last message content
          timestamp: newMessage.createdAt, // Update timestamp
          // Increment unread count if the message is not for the currently selected chat
          unreadCount: (newMessage.group !== selectedConversation?.id) 
            ? (prevConversations[conversationIndex].unreadCount || 0) + 1 
            : prevConversations[conversationIndex].unreadCount, // Keep existing count if selected
        };

        // Remove the old conversation and add the updated one to the top
        const remainingConversations = prevConversations.filter(conv => conv.id !== newMessage.group);
        return [updatedConversation, ...remainingConversations];
      });
    };

    // Listener for message sending confirmation 
    const handleMessageSent = (confirmedMessage) => {
      console.log('WebSocket message confirmed:', confirmedMessage);
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === confirmedMessage.tempId 
            ? { ...confirmedMessage, status: 'sent' } 
            : msg
        )
      );
      // ALSO update conversation list on sent confirmation
      setConversations(prevConversations => {
          const conversationIndex = prevConversations.findIndex(conv => conv.id === confirmedMessage.group);
          if (conversationIndex === -1) return prevConversations;
          const updatedConversation = {
            ...prevConversations[conversationIndex],
            lastMessage: confirmedMessage.content,
            timestamp: confirmedMessage.createdAt,
          };
          const remainingConversations = prevConversations.filter(conv => conv.id !== confirmedMessage.group);
          return [updatedConversation, ...remainingConversations];
        });
    };

    // Listener for someone starting to type
    const handleTypingStarted = ({ groupId, user: typingUser }) => {
      console.log(`Typing started in ${groupId} by ${typingUser.firstName}`);
      setTypingUsers(prev => ({
        ...prev,
        [groupId]: [...(prev[groupId] || []).filter(u => u.id !== typingUser.id), typingUser]
      }));
    };

    // Listener for someone stopping typing
    const handleTypingStopped = ({ groupId, user: stoppedUser }) => {
      console.log(`Typing stopped in ${groupId} by ${stoppedUser.firstName}`);
      setTypingUsers(prev => {
        const groupTypers = (prev[groupId] || []).filter(u => u.id !== stoppedUser.id);
        // Create new object to ensure state update
        const newState = { ...prev }; 
        if (groupTypers.length > 0) {
          newState[groupId] = groupTypers;
        } else {
          delete newState[groupId]; // Remove group entry if no one is typing
        }
        return newState;
      });
    };

    websocketService.on('message:received', handleNewMessage);
    websocketService.on('message:sent_confirmation', handleMessageSent);
    websocketService.on('typing:started', handleTypingStarted);
    websocketService.on('typing:stopped', handleTypingStopped);

    // Cleanup listeners on component unmount or when selectedConversation changes
    return () => {
      websocketService.off('message:received', handleNewMessage);
      websocketService.off('message:sent_confirmation', handleMessageSent);
      websocketService.off('typing:started', handleTypingStarted);
      websocketService.off('typing:stopped', handleTypingStopped);
    };
    
  }, [selectedConversation, user]); // Re-run if selected conversation changes
  // --- End WebSocket Listeners ---

  const handleLogout = () => {
    logout();
  };

  const handleSelectConversation = (conversation) => {
    if (selectedConversation?.id !== conversation.id) {
      setSelectedConversation(conversation);
      
      // Reset unread count for the selected conversation
      setConversations(prev => prev.map(conv => 
          conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
      ));
      // TODO: Optionally, inform backend that messages are read for this conversation
      // websocketService.markMessagesAsRead(conversation.id); 
    }
  };
  
  const handleSendMessage = (messageContent) => {
    if (!selectedConversation || !user) return;

    // Unique temporary ID for optimistic message
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const optimisticMessage = {
      _id: tempId, // Use temporary ID for _id
      // id: tempId, // Optional: Keep id field if needed elsewhere
      sender: { 
          _id: user._id, 
          firstName: user.firstName, 
      },
      group: selectedConversation.id,
      content: messageContent,
      attachments: [],
      createdAt: new Date().toISOString(),
      status: 'sending', // Explicitly set status
    };
    
    // Add optimistic message to state
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);

    // Send message via WebSocket, including the tempId
    websocketService.sendMessage(
        selectedConversation.id, 
        messageContent,
        [], // Attachments placeholder
        tempId // Pass tempId for server to reference
    );
  }

  // Calculate typing users for the current conversation
  const currentTypingUsers = typingUsers[selectedConversation?.id] || [];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Academy Portal Chat
            </Typography>
            <Typography sx={{ mr: 2 }}>
              Welcome, {user?.firstName || 'User'}!
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>
        <Grid container component={Paper} sx={{ flexGrow: 1, height: 'calc(100vh - 64px)', m: 0 }}>
          <Grid
            item
            xs={12} sm={4} md={3}
            sx={{ 
              borderRight: '1px solid #e0e0e0', 
              height: '100%', 
              display: 'flex',
              flexDirection: 'column' 
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0'}}>
              <Typography variant="h6">Conversations</Typography>
            </Box>
            {conversationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                <CircularProgress />
              </Box>
            ) : conversationsError ? (
              <Box sx={{ p: 2 }}>
                <Alert severity="error">{conversationsError}</Alert>
              </Box>
            ) : (
              <ConversationList 
                conversations={conversations}
                onSelectConversation={handleSelectConversation} 
                selectedConversationId={selectedConversation?.id}
              />
            )}
          </Grid>

          <Grid 
            item 
            xs={12} sm={8} md={9}
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <ChatWindow 
              conversation={selectedConversation} 
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={messagesLoading}
              error={messagesError}
              typingUsers={currentTypingUsers}
            />
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
};

export default Home; 
