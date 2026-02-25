# ============================================
# Trinity Management System - Single Container
# ============================================

# Stage 1: Install backend dependencies and build
FROM node:20-alpine AS backend-build

WORKDIR /app/backend

# Copy package files
COPY backend/package.json backend/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy prisma schema and generate client
COPY backend/prisma ./prisma
RUN npx prisma generate

# Copy source and build
COPY backend/ .
RUN npm run build


# Stage 2: Install frontend dependencies and build
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Copy package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source files
COPY frontend/ .

# Set build-time env vars
ENV NEXT_PUBLIC_API_URL=/api/v1
ENV BACKEND_INTERNAL_URL=http://localhost:3001

# Build Next.js (standalone output)
RUN npm run build


# Stage 3: Production runtime
FROM node:20-alpine AS production

RUN apk add --no-cache tini

WORKDIR /app

# Copy backend production files
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/package.json
COPY --from=backend-build /app/backend/prisma ./backend/prisma

# Copy frontend standalone output
COPY --from=frontend-build /app/frontend/.next/standalone ./frontend
COPY --from=frontend-build /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-build /app/frontend/public ./frontend/public

# Create startup script
COPY <<'EOF' /app/start.sh
#!/bin/sh
set -e

echo "🚀 Starting Trinity Management System..."

# Run database migrations if needed
cd /app/backend
echo "📦 Syncing database schema..."
npx prisma db push --accept-data-loss 2>&1 || echo "⚠️  Schema push skipped (check DB connection)"

# Start backend
echo "🔧 Starting backend on port ${PORT:-3001}..."
node dist/main.js &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend..."
for i in $(seq 1 30); do
  if wget -q --spider "http://localhost:${PORT:-3001}/api/v1/auth/login" 2>/dev/null; then
    echo "✅ Backend ready!"
    break
  fi
  sleep 1
done

# Start frontend
cd /app/frontend
echo "🌐 Starting frontend on port 3000..."
HOSTNAME=0.0.0.0 PORT=3000 BACKEND_INTERNAL_URL="http://localhost:${BACKEND_PORT:-3001}" node server.js &
FRONTEND_PID=$!

echo ""
echo "==========================================="
echo "  Trinity Management System is running!"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:${BACKEND_PORT:-3001}"
echo "  API Docs: http://localhost:${BACKEND_PORT:-3001}/api/docs"
echo "==========================================="
echo ""

# Wait for any process to exit
wait -n $BACKEND_PID $FRONTEND_PID

# If one exits, kill the other
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
exit 1
EOF

RUN chmod +x /app/start.sh

# Environment variables with defaults
ENV NODE_ENV=production
ENV PORT=3001
ENV BACKEND_PORT=3001
ENV HOST=0.0.0.0
ENV CORS_ORIGIN=http://localhost:3000
ENV JWT_SECRET=change-me-in-production
ENV JWT_ACCESS_EXPIRATION=15m
ENV JWT_REFRESH_EXPIRATION=7d
ENV THROTTLE_TTL=60
ENV THROTTLE_LIMIT=100

# Expose ports
EXPOSE 3000 3001

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/start.sh"]
