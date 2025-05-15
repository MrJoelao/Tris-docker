FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install NestJS CLI globally
RUN npm install -g @nestjs/cli

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 4000

# Command to run the application in development mode
CMD ["npm", "run", "start:prod"]
