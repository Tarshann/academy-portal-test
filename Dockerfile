FROM node:16-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache python3 make g++ curl

# Install pnpm
RUN npm install -g pnpm

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

# Skip ESLint preflight check for compatibility
ENV SKIP_PREFLIGHT_CHECK=true

# Build web application
RUN echo "Starting web build process..." && \
    pnpm --filter "@academy-portal/web" build && \
    echo "Web build completed."

# Set up server
WORKDIR /app/packages/server

# Start server
CMD ["pnpm", "start"]
