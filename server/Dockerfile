# Use Node.js LTS (slim)
FROM node:20-slim

# Install system dependencies
# openssl is required for Prisma
# build-essential, python3 etc are sometimes needed for native builds like bcrypt
RUN apt-get update -y && \
    apt-get install -y openssl build-essential python3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev deps for prisma cli)
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
