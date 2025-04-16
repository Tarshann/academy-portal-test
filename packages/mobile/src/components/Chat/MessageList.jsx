import React, { forwardRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { format } from 'date-fns';
import { Avatar } from 'react-native-paper';

const MessageList = forwardRef(({ messages, typingUsers }, ref) => {
  const renderMessage = ({ item: message }) => {
    const isOwnMessage = message.sender._id === user._id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Avatar.Image
              size={32}
              source={
                message.sender.profileImage
                  ? { uri: message.sender.profileImage }
                  : require('../../assets/default-avatar.png')
              }
            />
            <Text style={styles.senderName}>
              {message.sender.firstName} {message.sender.lastName}
            </Text>
          </View>

          <Text style={styles.messageText}>{message.content}</Text>

          {message.attachments?.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {message.attachments.map((attachment) => (
                <TouchableOpacity
                  key={attachment._id}
                  style={styles.attachment}
                  onPress={() => Linking.openURL(attachment.url)}
                >
                  <Text style={styles.attachmentText}>{attachment.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.timestamp}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.size === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>
          {typingUsers.size === 1
            ? 'Someone is typing...'
            : `${typingUsers.size} people are typing...`}
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      ref={ref}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContainer}
      ListFooterComponent={renderTypingIndicator}
      onContentSizeChange={() => ref.current?.scrollToEnd()}
    />
  );
});

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageContent: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderName: {
    marginLeft: 8,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  attachmentsContainer: {
    marginTop: 8,
  },
  attachment: {
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  attachmentText: {
    color: '#2196F3',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingContainer: {
    padding: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default MessageList; 