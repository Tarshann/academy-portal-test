# Base stage for Node.js Alpine
FROM node:20-alpine3.18 AS base
WORKDIR /app

# Install Python, Make, G++, and Curl needed for some native addons and health checks
RUN apk add --no-cache python3 make g++ curl

# --- Dependencies Stage --- 
# Install ALL dependencies needed for building and running
FROM base AS dependencies
WORKDIR /app

# Copy all package.json AND lock files first for cache efficiency
COPY package.json package-lock.json* ./
COPY packages/common/package.json packages/common/package-lock.json* ./packages/common/
COPY packages/components/package.json packages/components/package-lock.json* ./packages/components/
COPY packages/server/package.json packages/server/package-lock.json* ./packages/server/
COPY packages/web/package.json packages/web/package-lock.json* ./packages/web/

# Install all dependencies using ci for faster, reliable installs
# Fallback to install if no lock file is present
RUN npm ci || npm install
RUN cd packages/common && (npm ci || npm install)
RUN cd packages/components && (npm ci || npm install)
RUN cd packages/server && (npm ci || npm install)
RUN cd packages/web && (npm ci || npm install)

# --- Builder Stage --- 
# Build the frontend application
FROM dependencies AS builder
WORKDIR /app
ENV NODE_ENV=production

# Copy the entire source code 
COPY . .

# Run the web build command
RUN chmod +x ./packages/web/node_modules/.bin/react-scripts && \
    echo "Starting web build process..." && \
    npm run build --prefix packages/web && \
    echo "Web build completed." && \
    ls -l /app/packages/web/
# Verify build directory creation

# --- Production Stage --- 
# Create the final lean image
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy necessary package.json files from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/common/package*.json ./packages/common/
COPY --from=builder /app/packages/server/package*.json ./packages/server/

# Install ONLY production dependencies for server and common
# Using ci if lock file exists, otherwise install
RUN cd packages/server && (npm ci --only=production || npm install --only=production)
RUN cd packages/common && (npm ci --only=production || npm install --only=production)

# Copy server and common source code (excluding node_modules)
COPY --from=builder /app/packages/server /app/packages/server
COPY --from=builder /app/packages/common /app/packages/common

# Copy the BUILT web application from the builder stage
COPY --from=builder /app/packages/web/build /app/packages/web/build

# *** ADDED DEBUGGING: List contents of copied build directory ***
RUN echo "Listing final contents of /app/packages/web/build:" && ls -la /app/packages/web/build

# Create and set ownership for a non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

# Use the PORT environment variable provided by Heroku
ENV PORT $PORT
EXPOSE $PORT

# Start the server
CMD ["npm", "run", "start"] 