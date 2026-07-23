# ============================================
# STAGE 1: Build Backend
# ============================================
FROM maven:3.8.4-openjdk-17-slim AS backend-build
WORKDIR /app
COPY backend/schedulepro-backend/pom.xml .
RUN mvn dependency:go-offline
COPY backend/schedulepro-backend/src ./src
RUN mvn package -DskipTests

# ============================================
# STAGE 2: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ============================================
# STAGE 3: Final Image (UPDATED)
# ============================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Install nginx
RUN apk add --no-cache nginx

# Copy backend JAR
COPY --from=backend-build /app/target/*.jar /app/app.jar

# Copy frontend build to nginx
COPY --from=frontend-build /app/build /usr/share/nginx/html

# Configure nginx to serve frontend and proxy backend
RUN echo 'server { \
    listen 80; \
    server_name _; \
    location /api/ { \
        proxy_pass http://localhost:8080; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri /index.html; \
    } \
}' > /etc/nginx/http.d/default.conf

# Expose ports
EXPOSE 80
EXPOSE 8080

# Start both nginx and backend
CMD ["sh", "-c", "nohup java -jar /app/app.jar & nginx -g 'daemon off;'"]