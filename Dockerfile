# Multi-stage Dockerfile for FireBook (bookmarks-capstone-api)
# Build static site and serve with nginx

# ============================================
# Build Stage
# ============================================
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (BuildKit cache speeds up repeated builds)
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy build scripts and source files
COPY . .

# Build arguments for application configuration
ARG VITE_APP_URL
ARG VITE_ALGOLIA_APP_ID
ARG VITE_ALGOLIA_SEARCH_API_KEY
ARG VITE_ALGOLIA_INDEX_NAME

# Set environment variables from build args (Vite reads VITE_* at build time)
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_ALGOLIA_APP_ID=$VITE_ALGOLIA_APP_ID
ENV VITE_ALGOLIA_SEARCH_API_KEY=$VITE_ALGOLIA_SEARCH_API_KEY
ENV VITE_ALGOLIA_INDEX_NAME=$VITE_ALGOLIA_INDEX_NAME

# Remove .env files to prevent overriding build args (local dev uses .env.local, K8s uses build args)
RUN rm -f .env .env.local

# Build the application
RUN npm run build

# ============================================
# Production Stage
# ============================================
FROM nginx:1.27-alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built static files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/share/nginx/html && \
    chown -R nodejs:nodejs /var/cache/nginx && \
    chown -R nodejs:nodejs /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nodejs:nodejs /var/run/nginx.pid

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# ============================================
# Development Stage
# ============================================
FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (BuildKit cache speeds up repeated builds)
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy application code
COPY . .

# Expose Vite dev server port
EXPOSE 3000

# Start Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
