# Base image
FROM node:16-alpine3.18 AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++ curl

# --- Dependencies Stage ---
FROM base AS dependencies
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@7.33.6

# Copy package definitions
COPY package.json pnpm-lock.yaml* ./
COPY packages/common/package.json packages/common/pnpm-lock.yaml* ./packages/common/
COPY packages/components/package.json packages/components/pnpm-lock.yaml* ./packages/components/
COPY packages/server/package.json packages/server/pnpm-lock.yaml* ./packages/server/
COPY packages/web/package.json packages/web/pnpm-lock.yaml* ./packages/web/

# Install all dependencies
RUN pnpm install --no-frozen-lockfile

# --- Builder Stage ---
FROM dependencies AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY . .

# Build the web app
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN pnpm --filter "@academy-portal/web" build

# --- Production Stage ---
FROM node:16-alpine3.18 AS production
WORKDIR /app
ENV NODE_ENV=production

# Reinstall pnpm
RUN npm install -g pnpm

# Copy production files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/common /app/packages/common
COPY --from=builder /app/packages/server /app/packages/server
COPY --from=builder /app/packages/web/build /app/packages/web/build

# Install production-only deps
RUN pnpm --filter "@academy-portal/common" install --prod && \
    pnpm --filter "@academy-portal/server" install --prod

# Set up non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 8080
CMD ["pnpm", "--filter", "@academy-portal/server", "start"]
