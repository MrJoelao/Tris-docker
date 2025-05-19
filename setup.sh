#!/bin/bash

# Tris Game Setup Script
echo "Setting up Tris Game development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null
then
    echo "Docker and/or Docker Compose not found. Please install them first."
    exit 1
fi

# Copy environment files if they don't exist
if [ ! -f "./tris-backend/.env" ]; then
    echo "Creating backend .env file..."
    cp ./tris-backend/.env.example ./tris-backend/.env
fi

if [ ! -f "./tris-frontend/.env" ]; then
    echo "Creating frontend .env file..."
    cp ./tris-frontend/.env.example ./tris-frontend/.env
fi

# Start Docker containers
echo "Starting Docker containers..."
docker-compose up -d

echo "Setup complete! The application should be running at:"
echo "- Frontend: http://localhost:8080"
echo "- Backend API: http://localhost:3000"
echo ""
echo "You can stop the containers with: docker-compose down"
