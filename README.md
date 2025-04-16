# Academy Portal Chat Functionality

This repository contains the chat functionality implementation for the Academy Portal, including both web and mobile platforms.

## Features

- Real-time messaging with WebSocket
- Group chat support
- File uploads (images and documents)
- User search and discovery
- Push notifications for mobile
- Offline support with message queuing
- Typing indicators
- Read receipts

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- MongoDB
- AWS S3 account (for file uploads)
- Firebase account (for push notifications)

### Environment Variables

Create a `.env` file in the `packages/server` directory with the following variables:

```
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# WebSocket Configuration
WS_URL=http://localhost:3001

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_bucket_name

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/chat_app

# Push Notifications (Firebase)
FIREBASE_SERVER_KEY=your_firebase_server_key
```

### Installation

1. Install dependencies for all packages:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd packages/server
npm install

# Install web dependencies
cd ../web
npm install

# Install mobile dependencies
cd ../mobile
npm install

# Install common dependencies
cd ../common
npm install
```

2. Start the server:

```bash
cd packages/server
npm start
```

3. Start the web application:

```bash
cd packages/web
npm start
```

4. Start the mobile application:

```bash
cd packages/mobile
npm start
```

## Architecture

The chat functionality is implemented using the following components:

### Server

- Express.js for REST API
- Socket.IO for real-time communication
- MongoDB for data storage
- AWS S3 for file storage
- Firebase for push notifications

### Web Client

- React for UI components
- Material-UI for styling
- Socket.IO client for WebSocket communication
- React Dropzone for file uploads

### Mobile Client

- React Native for UI components
- React Native Paper for styling
- Socket.IO client for WebSocket communication
- Expo Document Picker and Image Picker for file uploads
- Expo Notifications for push notifications

### Common

- Shared WebSocket service
- Message queue for offline support
- Shared utilities and components

## API Endpoints

### Users

- `GET /api/users/search` - Search for users
- `POST /api/users/push-token` - Store user push token

### Groups

- `POST /api/groups` - Create a new group
- `GET /api/groups` - Get user's groups

### Uploads

- `POST /api/uploads` - Upload a file

## WebSocket Events

### Connection

- `connection:established` - Connection established
- `connection:lost` - Connection lost

### Messages

- `message:send` - Send a message
- `message:received` - Message received
- `message:sent` - Message sent
- `message:read` - Message read

### Typing

- `typing:start` - Start typing
- `typing:stop` - Stop typing
- `typing:started` - User started typing
- `typing:stopped` - User stopped typing

### Groups

- `group:join` - Join a group
- `group:leave` - Leave a group
- `group:joined` - Group joined
- `group:left` - Group left
- `group:member-joined` - Member joined group
- `group:member-left` - Member left group

### Notifications

- `notification:new` - New notification
- `notification:unread-count` - Unread notification count
- `notification:read` - Mark notification as read 