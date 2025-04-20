# Base image
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++ curl
RUN npm install -g pnpm

# --- Dependencies Stage ---
FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./  # Include lock file!
COPY packages/common/package.json ./packages/common/
COPY packages/components/package.json ./packages/components/
COPY packages/server/package.json ./packages/server/
COPY packages/web/package.json ./packages/web/
RUN pnpm install

# --- Builder Stage ---
FROM dependencies AS builder
WORKDIR /app
COPY . .
ENV NODE_ENV=production
RUN pnpm --filter @academy-portal/web build

# --- Production Stage ---
FROM node:20-alpine AS production
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/packages/web/build ./packages/web/build
RUN pnpm install --prod
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nodejs && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 10000
CMD ["node", "packages/server/server.js"]
