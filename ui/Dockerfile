# Stage 1: Dependencies
# Use Debian-based image instead of Alpine for DuckDB compatibility
# DuckDB requires glibc which is not available in Alpine (musl)
FROM node:24-slim
WORKDIR /app

# Install required system libraries for DuckDB native bindings
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set Node.js options for increased memory during build
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for tsx)
RUN npm ci

# Copy source code (excluding files in .dockerignore)
COPY . .

ENV NODE_ENV=production

# Build the application
RUN npm run build

EXPOSE 3333

ENV HOSTNAME="0.0.0.0"

# Start server (database should be downloaded separately or mounted)
CMD ["npm", "start"]

