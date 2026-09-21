# Stage 1: Build stage using Maven Wrapper and OpenJDK 21
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

# Copy Maven wrapper files and pom.xml first for Docker layer caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Ensure the Maven wrapper script has executable permissions
RUN chmod +x ./mvnw

# Pre-download dependencies for caching
RUN ./mvnw dependency:go-offline -B || true

# Copy source code only (credentials and secrets are excluded)
COPY src ./src

# Build the executable Spring Boot JAR (skipping tests during image build)
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Runtime stage using OpenJDK 21 JRE
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy the generated JAR from the build stage
COPY --from=build /app/target/rudra-store-backend-*.jar app.jar

# Render assigns dynamic port via PORT environment variable (default: 8080)
ENV PORT=8080
EXPOSE 8080

# Execute Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
