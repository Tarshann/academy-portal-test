import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
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
  const messageListRef = useRef(null);

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
    messageListRef.current?.scrollToEnd({ animated: true });
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
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Platform.OS === 'android' ? '#fff' : 'transparent'}
      />
      <View style={styles.content}>
        {selectedGroup ? (
          <>
            <MessageList
              ref={messageListRef}
              messages={messages}
              typingUsers={typingUsers}
            />
            <MessageInput
              onSendMessage={handleSendMessage}
              onStartTyping={handleStartTyping}
              onStopTyping={handleStopTyping}
            />
          </>
        ) : (
          <>
            <UserSearch />
            <GroupList
              groups={groups}
              selectedGroup={selectedGroup}
              onSelectGroup={setSelectedGroup}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
});

export default Chat; 