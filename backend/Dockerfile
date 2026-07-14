FROM node:22-alpine

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install dependencies (production-only to keep container small)
RUN npm install

# Copy source code
COPY . .

# Expose backend port
EXPOSE 5000

# Set environment
ENV PORT=5000

# Start server
CMD ["npm", "start"]
