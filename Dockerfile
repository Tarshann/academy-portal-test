FROM node:16-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache python3 make g++ curl

# Install pnpm
RUN npm install -g pnpm@7.33.6

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY packages/common/package.json ./packages/common/
COPY packages/components/package.json ./packages/components/
COPY packages/server/package.json ./packages/server/
COPY packages/web/package.json ./packages/web/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy all source files
COPY . .

<<<<<<< HEAD
# Skip the web build completely
RUN echo "Skipping web build process..."
RUN mkdir -p /app/packages/web/build
RUN echo '<html><body>Placeholder build</body></html>' > /app/packages/web/build/index.html
=======
# Run the web build command
# Ensure cross-env and react-scripts have executable permission
RUN chmod +x ./packages/web/node_modules/.bin/cross-env && \
    chmod +x ./packages/web/node_modules/.bin/react-scripts && \
    echo "Starting web build process..." && \
    npm run build --prefix packages/web && \
    echo "Web build completed."
>>>>>>> 8f8d6c43fdd2d27e270d7877b2fd2cb83ab2b1c7

# Set up server
WORKDIR /app/packages/server

# Start server
CMD ["pnpm", "start"]
