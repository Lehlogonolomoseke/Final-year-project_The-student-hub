# Development Dockerfile for React
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S reactjs -u 1001

# Change ownership of the app directory
RUN chown -R reactjs:nodejs /app
USER reactjs

# Expose port 3000 for development server
EXPOSE 3000

# Set environment variables for React dev server
ENV HOST=0.0.0.0
ENV PORT=3000
ENV CHOKIDAR_USEPOLLING=true
ENV FAST_REFRESH=true

# Start the React development server
CMD ["npm", "start"]