import React, { useState, useEffect, useRef } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { websocketService } from '@academy-portal/common';
import GroupList from './GroupList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserSearch from './UserSearch';

const Chat = ({ user }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const messageEndRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket when component mounts
    websocketService.connect(user.token);

    // Set up event listeners
    websocketService.on('message:received', handleMessageReceived);
    websocketService.on('message:sent', handleMessageSent);
    websocketService.on('typing:started', handleTypingStarted);
    websocketService.on('typing:stopped', handleTypingStopped);
    websocketService.on('group:joined', handleGroupJoined);
    websocketService.on('group:left', handleGroupLeft);
    websocketService.on('notification:new', handleNewNotification);
    websocketService.on('notification:unread-count', handleUnreadCount);

    return () => {
      // Clean up event listeners
      websocketService.off('message:received', handleMessageReceived);
      websocketService.off('message:sent', handleMessageSent);
      websocketService.off('typing:started', handleTypingStarted);
      websocketService.off('typing:stopped', handleTypingStopped);
      websocketService.off('group:joined', handleGroupJoined);
      websocketService.off('group:left', handleGroupLeft);
      websocketService.off('notification:new', handleNewNotification);
      websocketService.off('notification:unread-count', handleUnreadCount);
      websocketService.disconnect();
    };
  }, [user]);

  const handleMessageReceived = (message) => {
    if (message.group === selectedGroup?._id) {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    }
  };

  const handleMessageSent = (message) => {
    setMessages(prev => [...prev, message]);
    scrollToBottom();
  };

  const handleTypingStarted = ({ user, groupId }) => {
    if (groupId === selectedGroup?._id) {
      setTypingUsers(prev => new Set([...prev, user.id]));
    }
  };

  const handleTypingStopped = ({ user, groupId }) => {
    if (groupId === selectedGroup?._id) {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  };

  const handleGroupJoined = (group) => {
    setGroups(prev => [...prev, group]);
  };

  const handleGroupLeft = (groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    if (selectedGroup?._id === groupId) {
      setSelectedGroup(null);
    }
  };

  const handleNewNotification = (notification) => {
    setUnreadNotifications(prev => prev + 1);
  };

  const handleUnreadCount = ({ count }) => {
    setUnreadNotifications(count);
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (content, attachments) => {
    if (selectedGroup) {
      websocketService.sendMessage(selectedGroup._id, content, attachments);
    }
  };

  const handleStartTyping = () => {
    if (selectedGroup) {
      websocketService.startTyping(selectedGroup._id);
    }
  };

  const handleStopTyping = () => {
    if (selectedGroup) {
      websocketService.stopTyping(selectedGroup._id);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      <Grid container spacing={2} sx={{ height: '100%', p: 2 }}>
        <Grid item xs={3}>
          <Paper sx={{ height: '100%', p: 2 }}>
            <UserSearch />
            <GroupList
              groups={groups}
              selectedGroup={selectedGroup}
              onSelectGroup={setSelectedGroup}
            />
          </Paper>
        </Grid>
        <Grid item xs={9}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {selectedGroup ? (
              <>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6">{selectedGroup.name}</Typography>
                </Box>
                <MessageList
                  messages={messages}
                  typingUsers={typingUsers}
                  messageEndRef={messageEndRef}
                />
                <MessageInput
                  onSendMessage={handleSendMessage}
                  onStartTyping={handleStartTyping}
                  onStopTyping={handleStopTyping}
                />
              </>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6">
                  Select a group to start chatting
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Chat; 