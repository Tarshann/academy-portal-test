import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.emit('connection:established');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.emit('connection:lost');
    });

    this.socket.on('error', (error) => {
      this.emit('error', error);
    });

    // Message events
    this.socket.on('message:received', (message) => {
      this.emit('message:received', message);
    });

    this.socket.on('message:sent', (message) => {
      this.emit('message:sent', message);
    });

    // Typing events
    this.socket.on('typing:started', (data) => {
      this.emit('typing:started', data);
    });

    this.socket.on('typing:stopped', (data) => {
      this.emit('typing:stopped', data);
    });

    // Group events
    this.socket.on('group:joined', (data) => {
      this.emit('group:joined', data);
    });

    this.socket.on('group:left', (data) => {
      this.emit('group:left', data);
    });

    this.socket.on('group:member-joined', (data) => {
      this.emit('group:member-joined', data);
    });

    this.socket.on('group:member-left', (data) => {
      this.emit('group:member-left', data);
    });

    // Notification events
    this.socket.on('notification:new', (notification) => {
      this.emit('notification:new', notification);
    });

    this.socket.on('notification:unread-count', (data) => {
      this.emit('notification:unread-count', data);
    });
  }

  // Event handling methods
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => handler(data));
    }
  }

  // Message methods
  sendMessage(groupId, content, attachments = [], tempId = null) {
    if (this.socket) {
      this.socket.emit('message:send', { 
        groupId, 
        content, 
        attachments,
        tempId
      });
    } else {
        console.error('Cannot send message: WebSocket is not connected.');
        // Optionally trigger message queue logic here if integrating
    }
  }

  markMessageAsRead(messageId) {
    this.socket.emit('message:read', { messageId });
  }

  // Typing methods
  startTyping(groupId) {
    this.socket.emit('typing:start', { groupId });
  }

  stopTyping(groupId) {
    this.socket.emit('typing:stop', { groupId });
  }

  // Group methods
  joinGroup(groupId) {
    this.socket.emit('group:join', { groupId });
  }

  leaveGroup(groupId) {
    this.socket.emit('group:leave', { groupId });
  }

  // Notification methods
  markNotificationAsRead(notificationId) {
    this.socket.emit('notification:read', { notificationId });
  }
}

export const websocketService = new WebSocketService();
export default websocketService; 