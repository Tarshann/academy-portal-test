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

# Install dependencies and build
RUN npm install --production && \
    cd packages/common && npm install --production && \
    cd ../components && npm install --production && \
    cd ../server && npm install --production && \
    cd ../web && npm install --production

COPY . .
RUN npm run build:web && npm run build:server

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
COPY --from=builder /app/packages/web/build ./packages/web/build

# Create necessary directories with proper permissions
RUN mkdir -p logs uploads && \
    addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs && \
    chown -R nodejs:nodejs /app

# Set secure file permissions
RUN chmod 755 /app && \
    chmod 755 /app/packages/server/server.js && \
    chmod -R 644 /app/packages/web/build/* && \
    chmod -R 755 /app/logs && \
    chmod -R 755 /app/uploads

USER nodejs
EXPOSE 5000
CMD ["npm", "run", "start:server"] 