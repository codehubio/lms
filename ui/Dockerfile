# Stage 1: Dependencies
FROM node:24-alpine
WORKDIR /app

# Set Node.js options for increased memory during build
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for tsx)
RUN npm ci

# Copy source code
COPY . .

ENV NODE_ENV=production

# Build the application
RUN npm run build

EXPOSE 3333

ENV HOSTNAME="0.0.0.0"

# Start server (database should be downloaded separately or mounted)
CMD ["npm", "start"]

