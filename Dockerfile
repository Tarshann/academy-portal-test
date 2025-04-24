# Base image
FROM node:20-alpine AS base
LABEL maintainer="Tarshann"
LABEL description="Academy Portal Application"

WORKDIR /app

# Install necessary tools
RUN apk add --no-cache python3 make g++ curl && \
    addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

# Dependencies Stage
FROM base AS dependencies
WORKDIR /app
# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/common/package.json ./packages/common/
COPY packages/components/package.json ./packages/components/
COPY packages/server/package.json ./packages/server/
COPY packages/web/package.json ./packages/web/

# Install dependencies
RUN npm install -g pnpm@10.9.0 \
  && pnpm install \
  && pnpm --filter @academy-portal/web install

# Builder Stage
FROM dependencies AS builder
ENV NODE_ENV=production

COPY . .
RUN cd packages/web && npm run build

# Production Stage
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/common /app/packages/common
COPY --from=builder /app/packages/components /app/packages/components
COPY --from=builder /app/packages/server /app/packages/server
COPY --from=builder /app/packages/web/build /app/packages/web/build

RUN npm install -g pnpm@10.9.0 \
  && pnpm install --prod
  
# ✅ Re-add user creation step here
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nodejs

EXPOSE 8080
RUN ls -la /app/packages/server
CMD ["node", "packages/server/server-entry.js"]

# Optional Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1
