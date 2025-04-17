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

# Install dependencies with compatible ESLint
RUN pnpm install --no-frozen-lockfile
RUN npm install --save-dev eslint@6.8.0

# Copy all source files
COPY . .

# Set environment variables for compatibility
ENV SKIP_PREFLIGHT_CHECK=true
ENV DISABLE_ESLINT_PLUGIN=true

# Build web application
RUN echo "Starting web build process..." && \
    pnpm --filter "@academy-portal/web" build && \
    echo "Web build completed."

# Set up server
WORKDIR /app/packages/server

# Start server
CMD ["pnpm", "start"]
