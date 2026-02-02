# Base image - Node 20 required for Prisma 7
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Bundle source
COPY . .

# Build for production
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "run", "start"]
