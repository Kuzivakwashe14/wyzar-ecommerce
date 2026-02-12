# ============================================
# Multi-Stage Dockerfile for WyZar E-commerce
# ============================================
# This Dockerfile creates a single container with:
# - Express.js backend (port 5000)
# - Next.js frontend (port 3000)
# - Nginx reverse proxy (port 8000)

# ============================================
# Stage 1: Backend Dependencies
# ============================================
FROM node:20-alpine AS backend-deps
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies (production + dev for Prisma)
RUN npm ci

# ============================================
# Stage 2: Frontend Dependencies
# ============================================
FROM node:20-alpine AS frontend-deps
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# ============================================
# Stage 3: Backend Build (Prisma Generation)
# ============================================
FROM node:20-alpine AS backend-build
WORKDIR /app/backend

# Copy dependencies from backend-deps stage
COPY --from=backend-deps /app/backend/node_modules ./node_modules

# Copy backend source code
COPY backend ./

# Generate Prisma Client
RUN npx prisma generate

# ============================================
# Stage 4: Frontend Build
# ============================================
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

# Copy dependencies from frontend-deps stage
COPY --from=frontend-deps /app/frontend/node_modules ./node_modules

# Copy frontend source code
COPY frontend ./

# Accept build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Set build-time environment variables for Next.js
# These are needed for the build process but won't be in the final image
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NODE_ENV=production

# Build Next.js application
RUN npm run build

# ============================================
# Stage 5: Production Image
# ============================================
FROM node:20-alpine AS production

# Install nginx and other required packages
# ca-certificates is required for outbound HTTPS (Clerk API handshake)
RUN apk add --no-cache nginx bash curl ca-certificates \
    && update-ca-certificates

# Create app directory
WORKDIR /app

# ============================================
# Backend Setup
# ============================================
WORKDIR /app/backend

# Copy backend dependencies and built files
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend ./

# ============================================
# Frontend Setup
# ============================================
WORKDIR /app/frontend

# Copy standalone build output
COPY --from=frontend-build /app/frontend/.next/standalone ./
COPY --from=frontend-build /app/frontend/.next/static ./.next/static
COPY --from=frontend-build /app/frontend/public ./public

# ============================================
# Nginx Configuration
# ============================================
WORKDIR /app

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create nginx directories
RUN mkdir -p /run/nginx /var/log/nginx

# ============================================
# Startup Script
# ============================================
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Create uploads directory for backend
RUN mkdir -p /app/backend/uploads

# Expose port 8000 (nginx reverse proxy)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Set working directory
WORKDIR /app

# Start the application
CMD ["/app/start.sh"]
