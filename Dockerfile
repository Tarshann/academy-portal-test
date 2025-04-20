# Base image
FROM node:16-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++ curl

# --- Dependencies Stage ---
FROM base AS dependencies
WORKDIR /app
# Install npm instead of pnpm
# Copy package definitions
COPY package.json ./
COPY packages/common/package.json ./packages/common/
COPY packages/components/package.json ./packages/components/
COPY packages/server/package.json ./packages/server/
COPY packages/web/package.json ./packages/web/
# Install all dependencies with npm
RUN npm install

# --- Builder Stage ---
FROM dependencies AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY . .
# Build the web app with ESLint completely disabled
RUN cd packages/web && DISABLE_ESLINT_PLUGIN=true npm run build

# --- Production Stage ---
FROM node:16-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
# Copy production files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/common /app/packages/common
COPY --from=builder /app/packages/server /app/packages/server
COPY --from=builder /app/packages/web/build /app/packages/web/build
# Install production-only deps with npm
RUN npm install --production
# Set up non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs && \
    chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 8080
CMD ["node", "packages/server/server.js"]
