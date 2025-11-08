FROM node:18-alpine AS backend

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

FROM node:18-alpine AS frontend

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Final stage
FROM node:18-alpine

WORKDIR /app

# Copy backend
COPY --from=backend /app/backend ./backend

# Copy frontend dist to backend public directory
COPY --from=frontend /app/frontend/dist ./backend/public

# Copy production server file
COPY backend/src/server.prod.js ./backend/

WORKDIR /app/backend

EXPOSE 5000

CMD ["node", "server.prod.js"]