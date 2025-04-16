import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { debounce } from 'lodash';

const MessageInput = ({ onSendMessage, onStartTyping, onStopTyping }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const typingTimeoutRef = useRef(null);

  const handleMessageChange = (text) => {
    setMessage(text);

    // Handle typing indicators
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    onStartTyping();

    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 1000);
  };

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setAttachments(prev => [...prev, result]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setAttachments(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        {attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            <Text style={styles.attachmentsTitle}>Attachments:</Text>
            <View style={styles.attachmentsList}>
              {attachments.map((file, index) => (
                <View key={index} style={styles.attachmentItem}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {file.name || 'Image'}
                  </Text>
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => removeAttachment(index)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <IconButton
            icon="file"
            size={24}
            onPress={pickDocument}
          />
          <IconButton
            icon="image"
            size={24}
            onPress={pickImage}
          />
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={handleMessageChange}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
          />
          <IconButton
            icon="send"
            size={24}
            onPress={handleSend}
            disabled={!message.trim() && attachments.length === 0}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 8,
  },
  attachmentsContainer: {
    marginBottom: 8,
  },
  attachmentsTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  attachmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  attachmentName: {
    maxWidth: 150,
    marginRight: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    maxHeight: 100,
  },
});

export default MessageInput; 