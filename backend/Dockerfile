# Base image - Node 20 required for Prisma 7
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
COPY prisma ./prisma/

# Install system dependencies (OpenSSL 3 for Prisma)
RUN apk add --no-cache openssl

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# DEBUG: List all files in dist to ensure build worked
RUN ls -R dist/

# Copy and make executable the startup script
COPY start.sh ./
RUN chmod +x start.sh

# Expose port (will use PORT env var at runtime)
EXPOSE ${PORT:-10000}

# Start the app with migrations
CMD ["./start.sh"]
