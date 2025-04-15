# Base stage for both development and production
FROM node:20-alpine AS base
WORKDIR /app

# Install build dependencies and curl
RUN apk add --no-cache python3 make g++ curl

# Copy package files for all workspaces
COPY package*.json ./
COPY packages/common/package*.json ./packages/common/
COPY packages/components/package*.json ./packages/components/
COPY packages/server/package*.json ./packages/server/
COPY packages/web/package*.json ./packages/web/
COPY packages/mobile/package*.json ./packages/mobile/

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Install dependencies for all packages
RUN npm install && \
    cd packages/common && npm install && \
    cd ../components && npm install && \
    cd ../server && npm install && \
    cd ../web && npm install && \
    cd ../mobile && npm install

# Copy source code
COPY . .

# Set up non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 5000
CMD ["npm", "run", "start:server"]

# Production build stage
FROM base AS builder
ENV NODE_ENV=production

# Install all dependencies (including dev dependencies for building)
RUN npm install && \
    cd packages/common && npm install && \
    cd ../components && npm install && \
    cd ../server && npm install && \
    cd ../web && npm install

# Copy source code
COPY . .

# Build web app with verbose logging
RUN echo "Starting web build process..." && \
    mkdir -p packages/web/build && \
    cd packages/web && npm run build && \
    echo "Web build completed" && \
    ls -la build && \
    if [ -f "build/index.html" ]; then \
      echo "index.html exists and has size:" && \
      ls -la build/index.html; \
    else \
      echo "ERROR: index.html missing!" && \
      exit 1; \
    fi

# Production stage
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy production dependencies and built assets
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/common/package*.json ./packages/common/
COPY --from=builder /app/packages/components/package*.json ./packages/components/
COPY --from=builder /app/packages/server/package*.json ./packages/server/
COPY --from=builder /app/packages/common/node_modules ./packages/common/node_modules
COPY --from=builder /app/packages/components/node_modules ./packages/components/node_modules
COPY --from=builder /app/packages/server/node_modules ./packages/server/node_modules
COPY --from=builder /app/packages/server/server.js ./packages/server/server.js

# Copy the web build, ensuring we actually copy the directory
RUN mkdir -p /app/packages/web
COPY --from=builder /app/packages/web/build /app/packages/web/build
RUN ls -la /app/packages/web/build

# Create necessary directories with proper permissions
RUN mkdir -p logs uploads && \
    addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs && \
    chown -R nodejs:nodejs /app

# Set secure file permissions
RUN chmod 755 /app && \
    chmod 755 /app/packages/server/server.js && \
    find /app/packages/web/build -type d -exec chmod 755 {} \; && \
    find /app/packages/web/build -type f -exec chmod 644 {} \; && \
    chmod -R 755 /app/logs && \
    chmod -R 755 /app/uploads

USER nodejs
EXPOSE 5000
CMD ["npm", "run", "start:server"] 