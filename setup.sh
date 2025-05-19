#!/bin/bash

# Tris Game Setup Script
echo "Tris Game - Multiplayer Tic-Tac-Toe"
echo "===================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null
then
    echo "Error: Docker and/or Docker Compose not found. Please install them first."
    exit 1
fi

# Function to show usage information
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo "Options:"
    echo "  dev       Start in development mode (default)"
    echo "  prod      Start in production mode"
    echo "  down      Stop all containers"
    echo "  clean     Stop and remove all containers, volumes, and images"
    echo "  help      Show this help message"
    exit 0
}

# Copy environment files if they don't exist
setup_env_files() {
    if [ ! -f "./tris-backend/.env" ]; then
        echo "Creating backend .env file..."
        cp ./tris-backend/.env.example ./tris-backend/.env
    fi

    if [ ! -f "./tris-frontend/.env" ]; then
        echo "Creating frontend .env file..."
        cp ./tris-frontend/.env.example ./tris-frontend/.env
    fi
}

# Start development environment
start_dev() {
    echo "Setting up Tris Game development environment..."
    setup_env_files
    echo "Starting Docker containers in development mode..."
    docker-compose -f docker-compose.dev.yml up -d
    echo "Development setup complete! The application should be running at:"
    echo "- Frontend: http://localhost:8080"
    echo "- Backend API: http://localhost:3000"
    echo ""
    echo "You can stop the containers with: ./setup.sh down"
}

# Start production environment
start_prod() {
    echo "Setting up Tris Game production environment..."
    setup_env_files
    echo "Starting Docker containers in production mode..."
    docker-compose -f docker-compose.prod.yml up -d
    echo "Production setup complete! The application should be running at:"
    echo "- Frontend: http://localhost:80"
    echo "- Backend API: http://localhost:3000"
    echo ""
    echo "You can stop the containers with: ./setup.sh down"
}

# Stop all containers
stop_containers() {
    echo "Stopping all containers..."
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.prod.yml down
    echo "All containers stopped."
}

# Clean up everything
clean_all() {
    echo "Cleaning up all Docker resources..."
    docker-compose -f docker-compose.dev.yml down -v
    docker-compose -f docker-compose.prod.yml down -v
    echo "Removing Docker images..."
    docker rmi $(docker images -q tris-app_frontend tris-app_backend 2>/dev/null) 2>/dev/null
    echo "Cleanup complete."
}

# Parse command line arguments
case "$1" in
    dev)
        start_dev
        ;;
    prod)
        start_prod
        ;;
    down)
        stop_containers
        ;;
    clean)
        clean_all
        ;;
    help)
        show_usage
        ;;
    "")
        # Default to development mode if no argument is provided
        start_dev
        ;;
    *)
        echo "Error: Unknown option '$1'"
        show_usage
        ;;
esac
