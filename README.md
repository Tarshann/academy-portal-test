# Academy Portal

A cross-platform application for managing an academy portal, built with React (Web), React Native (Mobile), and Node.js (Server).

## Project Structure

```
.
├── packages/
│   ├── common/                 # Shared code between platforms
│   │   ├── api.js              # Platform-agnostic API service
│   │   ├── firebase.js         # Cross-platform Firebase implementation
│   │   ├── models/             # Shared data models
│   │   ├── utils/              # Shared utility functions
│   │   └── validation/         # Shared validation logic
│   │
│   ├── components/             # Cross-platform UI components
│   │   ├── Button/
│   │   │   ├── index.js        # Platform-agnostic interface
│   │   │   ├── Button.web.js   # Web implementation
│   │   │   ├── Button.web.css  # Web styles
│   │   │   └── Button.native.js # React Native implementation
│   │   ├── NotificationHandler/
│   │   └── [other components]...
│   │
│   ├── web/                    # Web-specific code
│   │   ├── platform.js         # Web platform implementations
│   │   ├── index.html          # Web entry point
│   │   ├── App.js              # Web app root component
│   │   └── public/             # Static assets
│   │
│   ├── mobile/                 # Mobile-specific code
│   │   ├── platform.js         # React Native platform implementations
│   │   ├── App.js              # React Native app root component
│   │   ├── ios/                # iOS-specific code
│   │   └── android/            # Android-specific code
│   │
│   └── server/                 # Backend code
│       ├── controllers/        # API controllers
│       ├── models/             # Database models
│       ├── routes/             # API routes
│       ├── middleware/         # Express middleware
│       ├── services/           # Business logic services
│       └── utils/              # Server utilities
```

## Setup Instructions

### Option 1: Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   # Start the backend server
   npm run start:server

   # Start the web application
   npm run start:web

   # Start the mobile application
   npm run start:mobile
   ```

### Option 2: Docker Development

1. Make sure you have Docker and Docker Compose installed on your system.

2. Build and start all services:
   ```bash
   docker-compose up -d
   ```

3. Access the services:
   - Web application: http://localhost
   - Server API: http://localhost:5000
   - MongoDB: localhost:27017
   - Mobile Expo: http://localhost:19000

4. To stop all services:
   ```bash
   docker-compose down
   ```

5. To view logs:
   ```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f server
   ```

## Development

This project uses a monorepo structure managed by Lerna. Each package can be developed independently while sharing common code.

### Web Development
- Located in `packages/web`
- Built with React
- Uses Material-UI for components
- Shares common code with mobile app

### Mobile Development
- Located in `packages/mobile`
- Built with React Native & Expo
- Uses React Native Paper for components
- Shares common code with web app

### Server Development
- Located in `packages/server`
- Built with Node.js & Express
- MongoDB for database
- RESTful API design

## Testing

Run tests for all packages:
```bash
npm test
```

Or test individual packages:
```bash
npm test --scope=@academy-portal/web
npm test --scope=@academy-portal/mobile
npm test --scope=@academy-portal/server
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

MIT
