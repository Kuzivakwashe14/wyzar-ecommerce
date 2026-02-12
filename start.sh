#!/bin/bash
# ============================================
# Startup Script for WyZar E-commerce
# ============================================
# Runs migrations and starts all services

set -e  # Exit on error

echo "============================================"
echo "Starting WyZar E-commerce Application"
echo "============================================"

# ============================================
# 1. Run Database Migrations
# ============================================
echo ""
echo "📦 Running Prisma migrations..."
cd /app/backend
npx prisma migrate deploy || {
    echo "⚠️  Warning: Migrations failed. Continuing anyway..."
    echo "   This might be expected if migrations are already applied."
}

# ============================================
# 2. Start Backend Server
# ============================================
echo ""
echo "🚀 Starting backend server on port 5000..."
cd /app/backend
NODE_ENV=production node index.js &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo "   Waiting for backend to start..."
for i in {1..30}; do
    if curl -f http://localhost:5000/ > /dev/null 2>&1; then
        echo "   ✅ Backend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ⚠️  Backend took longer than expected to start"
    fi
    sleep 1
done

# ============================================
# 3. Start Frontend Server
# ============================================
echo ""
echo "🎨 Starting frontend server on port 3000..."
cd /app/frontend
HOSTNAME=0.0.0.0 PORT=3000 NODE_ENV=production node server.js &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Wait for frontend to be ready
echo "   Waiting for frontend to start..."
for i in {1..30}; do
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        echo "   ✅ Frontend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ⚠️  Frontend took longer than expected to start"
    fi
    sleep 1
done

# ============================================
# 4. Start Nginx Reverse Proxy
# ============================================
echo ""
echo "🌐 Starting nginx reverse proxy on port 8000..."
nginx -g 'daemon off;' &
NGINX_PID=$!
echo "   Nginx PID: $NGINX_PID"

echo ""
echo "============================================"
echo "✅ All services started successfully!"
echo "============================================"
echo "   Backend:  http://localhost:5000"
echo "   Frontend: http://localhost:3000"
echo "   Proxy:    http://localhost:8000"
echo "============================================"

# ============================================
# 5. Graceful Shutdown Handler
# ============================================
cleanup() {
    echo ""
    echo "============================================"
    echo "🛑 Shutting down services..."
    echo "============================================"
    
    echo "   Stopping nginx..."
    kill -TERM $NGINX_PID 2>/dev/null || true
    
    echo "   Stopping frontend..."
    kill -TERM $FRONTEND_PID 2>/dev/null || true
    
    echo "   Stopping backend..."
    kill -TERM $BACKEND_PID 2>/dev/null || true
    
    echo "   ✅ Shutdown complete"
    exit 0
}

trap cleanup SIGTERM SIGINT

# Keep script running and wait for any process to exit
wait -n

# If any process exits, trigger cleanup
cleanup
