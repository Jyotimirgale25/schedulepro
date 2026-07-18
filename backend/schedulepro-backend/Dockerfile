# =================================================
# STAGE 1: Build the application with Maven
# =================================================
FROM maven:3.9.4-eclipse-temurin-17 AS build

# Set working directory
WORKDIR /app

# Copy pom.xml first (for dependency caching)
COPY pom.xml .

# Download all dependencies (this layer will be cached)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application (skip tests for faster build)
RUN mvn clean package -DskipTests

# =================================================
# STAGE 2: Runtime - Small image for production
# =================================================
FROM eclipse-temurin:17-jre-alpine

# Install bash and curl (for health checks)
RUN apk add --no-cache bash curl

# Create a non-root user for security
RUN addgroup -S schedulepro && \
    adduser -S schedulepro -G schedulepro

# Set working directory
WORKDIR /app

# Copy JAR file from build stage
COPY --from=build /app/target/*.jar app.jar

# Create uploads directory
RUN mkdir -p /app/uploads && \
    chown -R schedulepro:schedulepro /app

# Switch to non-root user
USER schedulepro

# Expose application port
EXPOSE 8080

# Health check (Spring Boot Actuator)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]

# Optional: Pass JVM options via environment
# ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar"]