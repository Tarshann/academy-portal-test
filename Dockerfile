FROM node:16-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache python3 make g++ curl

# Install a specific pnpm version compatible with Node 16
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

# Set environment variables for compatibility
ENV SKIP_PREFLIGHT_CHECK=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV NODE_ENV=production

# Create a custom build script that will bypass ESLint
RUN echo '#!/bin/sh' > /app/packages/web/build-without-eslint.sh && \
    echo 'rm -rf node_modules/.cache' >> /app/packages/web/build-without-eslint.sh && \
    echo 'export NODE_ENV=production' >> /app/packages/web/build-without-eslint.sh && \
    echo 'export DISABLE_ESLINT_PLUGIN=true' >> /app/packages/web/build-without-eslint.sh && \
    echo 'export SKIP_PREFLIGHT_CHECK=true' >> /app/packages/web/build-without-eslint.sh && \
    echo 'export GENERATE_SOURCEMAP=false' >> /app/packages/web/build-without-eslint.sh && \
    echo 'node /app/node_modules/.pnpm/react-scripts@3.4.4*/node_modules/react-scripts/scripts/build.js' >> /app/packages/web/build-without-eslint.sh && \
    chmod +x /app/packages/web/build-without-eslint.sh

# Build web application by directly calling the build script
RUN echo "Starting web build process..." && \
    cd /app/packages/web && \
    ./build-without-eslint.sh && \
    echo "Web build completed."

# Set up server
WORKDIR /app/packages/server

# Start server
CMD ["pnpm", "start"]
