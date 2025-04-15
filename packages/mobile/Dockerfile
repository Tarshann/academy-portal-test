FROM node:18-alpine

WORKDIR /app

# Install Expo CLI globally
RUN npm install -g expo-cli

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy mobile code
COPY . .

# Expose the Expo development server port
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Start the Expo development server
CMD ["npm", "start"] 