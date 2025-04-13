// client/src/components/messages/MessageInput.js
import React, { useState, useRef } from 'react';

const MessageInput = ({ onSendMessage, conversationId }) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const fileInputRef = useRef(null);
  
  // Handle text input change
  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim() === '' && !uploadFile) return;
    
    if (uploadFile) {
      // Send message with media
      onSendMessage(message.trim(), 'media', uploadFile);
    } else {
      // Send text message
      onSendMessage(message.trim());
    }
    
    // Reset form
    setMessage('');
    setUploadPreview(null);
    setUploadFile(null);
  };
  
  // Handle key press events
  const handleKeyPress = (e) => {
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File is too large. Maximum size is 10MB.');
      return;
    }
    
    setUploadFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      // For non-image files, just show the filename
      setUploadPreview(file.name);
    }
  };
  
  // Trigger file input click
  const openFileSelector = () => {
    fileInputRef.current.click();
  };
  
  // Cancel upload
  const cancelUpload = () => {
    setUploadPreview(null);
    setUploadFile(null);
    // Reset the file input
    fileInputRef.current.value = null;
  };
  
  return (
    <div className="message-input-container">
      {uploadPreview && (
        <div className="upload-preview">
          {typeof uploadPreview === 'string' && uploadPreview.startsWith('data:image') ? (
            <div className="image-preview">
              <img src={uploadPreview} alt="Upload preview" />
            </div>
          ) : (
            <div className="file-preview">
              <i className="fas fa-file"></i>
              <span>{uploadPreview}</span>
            </div>
          )}
          <button 
            className="cancel-upload"
            onClick={cancelUpload}
            aria-label="Cancel upload"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      <form className="message-form" onSubmit={handleSubmit}>
        <button
          type="button"
          className="attachment-button"
          onClick={openFileSelector}
          aria-label="Attach file"
        >
          <i className="fas fa-paperclip"></i>
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
        />
        
        <textarea
          className="message-input"
          placeholder="Type a message..."
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={isUploading}
        />
        
        <button
          type="submit"
          className="send-button"
          disabled={message.trim() === '' && !uploadFile}
          aria-label="Send message"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
