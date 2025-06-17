# Multi-stage build for optimized image size
FROM node:18-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Install all dependencies (needed for build)
COPY package*.json ./
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Production stage
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S shiroom -u 1001

WORKDIR /app

# Install security updates and required libraries
RUN apk update && apk upgrade && apk add openssl

# Copy built application and dependencies
COPY --from=builder --chown=shiroom:nodejs /app/dist ./dist
COPY --from=builder --chown=shiroom:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=shiroom:nodejs /app/package*.json ./
COPY --from=builder --chown=shiroom:nodejs /app/prisma ./prisma

# Create directories with proper permissions
RUN mkdir -p /app/uploads /app/sanitized
RUN chown -R shiroom:nodejs /app/uploads /app/sanitized
RUN chmod 755 /app/uploads /app/sanitized

# Switch to non-root user
USER shiroom

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 3000

CMD ["node", "dist/index.js"]