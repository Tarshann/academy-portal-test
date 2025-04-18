FROM node:16-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache python3 make g++ curl sed

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

# Create a simple, direct build script that patches the webpack config
RUN echo '#!/bin/sh' > /app/build-script.sh && \
    echo 'echo "Patching webpack.config.js to fix ESLint formatter issue..."' >> /app/build-script.sh && \
    echo 'sed -i "s/formatter = require.resolve(\\"react-dev-utils\\\\/eslintFormatter\\");/formatter = null;/g" /app/node_modules/.pnpm/react-scripts@3.4.4*/node_modules/react-scripts/config/webpack.config.js' >> /app/build-script.sh && \
    echo 'echo "Starting web build with patched webpack config..."' >> /app/build-script.sh && \
    echo 'cd /app/packages/web' >> /app/build-script.sh && \
    echo 'cross-env CI=false SKIP_PREFLIGHT_CHECK=true DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false NODE_ENV=production react-scripts build' >> /app/build-script.sh && \
    chmod +x /app/build-script.sh

# Run the build script directly
RUN /app/build-script.sh

# Set up server
WORKDIR /app/packages/server

# Start server
CMD ["pnpm", "start"]
