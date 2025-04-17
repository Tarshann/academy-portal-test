# Base stage for Node.js Alpine
FROM node:20-alpine3.18 AS base
WORKDIR /app

# Install Python, Make, G++, and Curl needed for some native addons and health checks
RUN apk add --no-cache python3 make g++ curl

# --- Dependencies Stage --- 
FROM base AS dependencies
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy all package.json AND lock files first for cache efficiency
COPY package.json pnpm-lock.yaml* ./ 
COPY packages/common/package.json packages/common/pnpm-lock.yaml* ./packages/common/
COPY packages/components/package.json packages/components/pnpm-lock.yaml* ./packages/components/
COPY packages/server/package.json packages/server/pnpm-lock.yaml* ./packages/server/
COPY packages/web/package.json packages/web/pnpm-lock.yaml* ./packages/web/

# Install all deps using pnpm
RUN pnpm install --no-frozen-lockfile

# --- Builder Stage --- 
FROM dependencies AS builder
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV SKIP_PREFLIGHT_CHECK=true

COPY . .

RUN echo "Starting web build process..." && \
    pnpm --filter "@academy-portal/web" build && \
    echo "Web build completed."

# --- Production Stage ---
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV SKIP_PREFLIGHT_CHECK=true

RUN apk add --no-cache curl

COPY --from=builder /app/package.json ./ 
COPY --from=builder /app/packages/common /app/packages/common
COPY --from=builder /app/packages/server /app/packages/server
COPY --from=builder /app/packages/web/build /app/packages/web/build

# Install production dependencies
RUN npm install -g pnpm && \
    pnpm --filter "@academy-portal/server" install --prod && \
    pnpm --filter "@academy-portal/common" install --prod

# Create non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs && \
    chown -R nodejs:nodejs /app
USER nodejs

ENV PORT=8080
EXPOSE ${PORT}
CMD ["pnpm", "--filter", "@academy-portal/server", "start"]
