import AsyncStorage from '@react-native-async-storage/async-storage';

class MessageQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.QUEUE_STORAGE_KEY = '@message_queue';
  }

  async init() {
    try {
      const storedQueue = await AsyncStorage.getItem(this.QUEUE_STORAGE_KEY);
      if (storedQueue) {
        this.queue = JSON.parse(storedQueue);
      }
    } catch (error) {
      console.error('Error loading message queue:', error);
    }
  }

  async add(message) {
    this.queue.push({
      ...message,
      id: Date.now().toString(),
      timestamp: Date.now(),
      status: 'pending'
    });
    
    await this.saveQueue();
    this.processQueue();
  }

  async saveQueue() {
    try {
      await AsyncStorage.setItem(this.QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving message queue:', error);
    }
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const message = this.queue[0];
      const success = await this.sendMessage(message);

      if (success) {
        this.queue.shift();
        await this.saveQueue();
      }
    } catch (error) {
      console.error('Error processing message queue:', error);
    } finally {
      this.isProcessing = false;
      
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  async sendMessage(message) {
    try {
      // Import the websocket service
      const { websocketService } = require('./websocket');
      
      // Check if the websocket is connected
      if (!websocketService.isConnected) {
        console.log('WebSocket not connected, message will be retried later');
        return false;
      }
      
      // Send the message using the websocket service
      websocketService.sendMessage(
        message.groupId,
        message.content,
        message.attachments || []
      );
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  getQueuedMessages() {
    return this.queue;
  }

  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
  }
}

export const messageQueue = new MessageQueue();
export default messageQueue; 