#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variable to store which compose command to use
COMPOSE_CMD=""

# Function to display usage information
function show_usage {
  echo -e "${YELLOW}Usage:${NC}"
  echo -e "  $0 [command]"
  echo -e "\n${YELLOW}Commands:${NC}"
  echo -e "  ${GREEN}start${NC}     Start the Tic-Tac-Toe application and show logs"
  echo -e "  ${GREEN}start-silent${NC} Start the application without showing logs"
  echo -e "  ${GREEN}stop${NC}      Stop the Tic-Tac-Toe application"
  echo -e "  ${GREEN}restart${NC}   Restart the Tic-Tac-Toe application"
  echo -e "  ${GREEN}reset${NC}     Reset the database (removes all data)"
  echo -e "  ${GREEN}logs${NC}      Show logs from the containers"
  echo -e "  ${GREEN}status${NC}    Show the status of the containers"
  echo -e "  ${GREEN}db${NC}        Access the PostgreSQL database"
  echo -e "  ${GREEN}help${NC}      Show this help message"
}

# Function to check if Docker is running
function check_docker {
  # Try with sudo first as the user might be in the docker group but docker socket permissions are restricted
  if sudo docker info > /dev/null 2>&1; then
    echo -e "${GREEN}Docker is running!${NC}"
    # Use sudo for all docker commands if that's what works
    if ! docker info > /dev/null 2>&1; then
      echo -e "${YELLOW}Note: Docker requires sudo privileges on this system.${NC}"
      alias docker="sudo docker"
      # Make sure the alias is available in functions
      export -f docker
    fi
    return 0
  elif docker info > /dev/null 2>&1; then
    echo -e "${GREEN}Docker is running!${NC}"
    return 0
  else
    echo -e "${YELLOW}Docker is not running. Attempting to start Docker...${NC}"
    
    # Check the operating system
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
      # Linux: try to start Docker with systemctl first (preferred), then service
      echo -e "Detected Linux system, attempting to start Docker..."
      if command -v systemctl &> /dev/null; then
        echo -e "Using systemctl command to start Docker..."
        sudo systemctl start docker
      elif command -v service &> /dev/null; then
        echo -e "Using service command to start Docker..."
        sudo service docker start
      else
        echo -e "${RED}Could not find service or systemctl commands.${NC}"
        echo -e "Please start Docker manually and try again."
        exit 1
      fi
      
      # Wait for Docker to start
      echo -e "Waiting for Docker to start..."
      for i in {1..15}; do
        if sudo docker info > /dev/null 2>&1; then
          echo -e "${GREEN}Docker started successfully!${NC}"
          echo -e "${YELLOW}Note: Docker requires sudo privileges on this system.${NC}"
          alias docker="sudo docker"
          # Make sure the alias is available in functions
          export -f docker
          break
        elif docker info > /dev/null 2>&1; then
          echo -e "${GREEN}Docker started successfully!${NC}"
          break
        fi
        
        if [ $i -eq 15 ]; then
          echo -e "${RED}Timeout waiting for Docker to start.${NC}"
          echo -e "Please start Docker manually and try again."
          exit 1
        fi
        
        echo -n "."
        sleep 1
      done
      echo ""
    elif [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS: try to start Docker Desktop
      echo -e "Detected macOS system, starting Docker Desktop..."
      open -a Docker
      
      # Wait for Docker to start (Docker Desktop takes longer)
      echo -e "Waiting for Docker Desktop to start (this may take a moment)..."
      for i in {1..30}; do
        if docker info > /dev/null 2>&1; then
          echo -e "${GREEN}Docker started successfully!${NC}"
          break
        fi
        
        if [ $i -eq 30 ]; then
          echo -e "${RED}Timeout waiting for Docker to start.${NC}"
          echo -e "Please start Docker Desktop manually and try again."
          exit 1
        fi
        
        echo -n "."
        sleep 2
      done
      echo ""
    else
      # Other OS: cannot start automatically
      echo -e "${RED}Cannot start Docker automatically on this operating system.${NC}"
      echo -e "Please start Docker manually and try again."
      exit 1
    fi
  fi
}

# Function to check for docker-compose availability
function check_compose {
  if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
    echo -e "Using ${GREEN}docker compose${NC} plugin"
  elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    echo -e "Using ${GREEN}docker-compose${NC} command"
  else
    echo -e "${RED}Error: Neither docker-compose nor docker compose plugin is available.${NC}"
    echo -e "Please install Docker Compose:"
    echo -e "  - For docker-compose: https://docs.docker.com/compose/install/"
    echo -e "  - For Docker CLI plugin: Make sure you have Docker >= 20.10.0"
    exit 1
  fi
}

# Function to remove existing containers with the same names
function remove_existing_containers {
  echo -e "${YELLOW}Checking for existing containers...${NC}"
  
  # Get all containers related to our application
  local containers=$(docker ps -a --format '{{.Names}}' | grep 'tris-docker')
  
  if [ -n "$containers" ]; then
    echo -e "Found existing containers, removing them..."
    
    # Stop all running containers first
    echo -e "Stopping running containers..."
    $COMPOSE_CMD down --remove-orphans
    
    # Force remove any remaining containers
    for container in $containers; do
      echo -e "Removing container ${YELLOW}$container${NC}"
      docker rm -f $container > /dev/null 2>&1
    done
  else
    echo -e "No existing containers found."
  fi
  
  echo -e "${GREEN}Container cleanup complete.${NC}"
}

# Function to start the application
function start_app {
  echo -e "${YELLOW}Starting Tic-Tac-Toe application...${NC}"
  
  # Remove existing containers first
  remove_existing_containers
  
  # Pull latest images
  echo -e "${YELLOW}Pulling latest Docker images...${NC}"
  $COMPOSE_CMD pull
  
  # Start the database and redis first
  echo -e "${YELLOW}Starting database and redis...${NC}"
  $COMPOSE_CMD up -d db redis
  
  # Wait for database to be healthy
  echo -e "${YELLOW}Waiting for database to be ready...${NC}"
  local max_attempts=30
  local attempt=1
  local db_ready=false
  
  while [ $attempt -le $max_attempts ]; do
    if $COMPOSE_CMD ps db | grep -q "healthy"; then
      db_ready=true
      echo -e "${GREEN}Database is ready!${NC}"
      break
    fi
    
    echo -n "."
    sleep 2
    ((attempt++))
  done
  
  if [ "$db_ready" = false ]; then
    echo -e "\n${RED}Database failed to start properly. Checking logs:${NC}"
    $COMPOSE_CMD logs db
    echo -e "\n${YELLOW}Attempting to fix common database issues...${NC}"
    
    # Try to fix common issues
    echo -e "Removing database volume and recreating..."
    $COMPOSE_CMD down
    docker volume rm tris-docker_postgres_data || true
    
    # Start again
    echo -e "${YELLOW}Restarting containers...${NC}"
    $COMPOSE_CMD up -d db redis
    
    # Wait again for database
    echo -e "${YELLOW}Waiting for database to be ready (second attempt)...${NC}"
    attempt=1
    while [ $attempt -le $max_attempts ]; do
      if $COMPOSE_CMD ps db | grep -q "healthy"; then
        db_ready=true
        echo -e "${GREEN}Database is ready!${NC}"
        break
      fi
      
      echo -n "."
      sleep 2
      ((attempt++))
    done
    
    if [ "$db_ready" = false ]; then
      echo -e "\n${RED}Database failed to start after multiple attempts.${NC}"
      echo -e "Please check your Docker installation and PostgreSQL configuration."
      exit 1
    fi
  fi
  
  # Start the backend and frontend
  echo -e "${YELLOW}Starting backend and frontend...${NC}"
  $COMPOSE_CMD up -d backend frontend
  
  # Check if all services are running
  if $COMPOSE_CMD ps | grep -q "Exit"; then
    echo -e "${RED}Some containers failed to start. Checking logs:${NC}"
    $COMPOSE_CMD logs
    echo -e "${RED}Failed to start Tic-Tac-Toe application.${NC}"
    exit 1
  else
    echo -e "${GREEN}Tic-Tac-Toe application started successfully!${NC}"
    echo -e "Access the frontend at ${GREEN}http://localhost:3000${NC}"
    echo -e "Access the backend API at ${GREEN}http://localhost:4000${NC}"
    
    # If show_logs is true, display logs
    if [ "$1" = "true" ]; then
      echo -e "\n${YELLOW}Showing application logs:${NC}"
      echo -e "Press ${YELLOW}Ctrl+C${NC} to exit logs (application will continue running)\n"
      $COMPOSE_CMD logs -f
    fi
  fi
}

# Function to stop the application
function stop_app {
  echo -e "${YELLOW}Stopping Tic-Tac-Toe application...${NC}"
  $COMPOSE_CMD down
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Tic-Tac-Toe application stopped successfully!${NC}"
  else
    echo -e "${RED}Failed to stop Tic-Tac-Toe application.${NC}"
    exit 1
  fi
}

# Function to restart the application
function restart_app {
  echo -e "${YELLOW}Restarting Tic-Tac-Toe application...${NC}"
  $COMPOSE_CMD restart
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Tic-Tac-Toe application restarted successfully!${NC}"
    echo -e "Access the frontend at ${GREEN}http://localhost:3000${NC}"
    echo -e "Access the backend API at ${GREEN}http://localhost:4000${NC}"
    
    # Show logs after restart
    echo -e "\n${YELLOW}Showing application logs:${NC}"
    echo -e "Press ${YELLOW}Ctrl+C${NC} to exit logs (application will continue running)\n"
    $COMPOSE_CMD logs -f
  else
    echo -e "${RED}Failed to restart Tic-Tac-Toe application.${NC}"
    exit 1
  fi
}

# Function to show logs
function show_logs {
  echo -e "${YELLOW}Showing logs from Tic-Tac-Toe application...${NC}"
  echo -e "Press ${YELLOW}Ctrl+C${NC} to exit logs\n"
  $COMPOSE_CMD logs -f
}

# Function to show status
function show_status {
  echo -e "${YELLOW}Status of Tic-Tac-Toe application containers:${NC}"
  $COMPOSE_CMD ps
  
  # Show additional information about the running containers
  echo -e "\n${YELLOW}Container resource usage:${NC}"
  docker stats --no-stream $(docker ps --format '{{.Names}}' | grep 'tris-docker')
}

# Function to access the database
function access_db {
  echo -e "${YELLOW}Accessing PostgreSQL database...${NC}"
  
  # Check if the database container is running
  if ! $COMPOSE_CMD ps db | grep -q "Up"; then
    echo -e "${YELLOW}Database container is not running. Starting it now...${NC}"
    $COMPOSE_CMD up -d db
    sleep 5  # Wait for the database to be ready
  fi
  
  echo -e "${GREEN}Connecting to PostgreSQL...${NC}"
  echo -e "Type ${BLUE}\\q${NC} to exit the database console.\n"
  $COMPOSE_CMD exec db psql -U postgres -d tris_game
}

# Function to reset the application database
function reset_app {
  echo -e "${RED}Warning: This will delete all data in the database.${NC}"
  echo -e "Are you sure you want to continue? (y/n): "
  read -r confirmation
  
  if [[ $confirmation != "y" && $confirmation != "Y" ]]; then
    echo -e "${YELLOW}Database reset cancelled.${NC}"
    return
  fi
  
  echo -e "${YELLOW}Resetting Tic-Tac-Toe application database...${NC}"
  
  # Stop the application first
  echo -e "Stopping application containers..."
  $COMPOSE_CMD down --volumes --remove-orphans
  
  # Make sure the volume is removed
  echo -e "Removing database volume..."
  docker volume rm tris-docker_postgres_data 2>/dev/null || true
  docker volume rm tris-docker_redis_data 2>/dev/null || true
  
  # Start the application again using our start function
  echo -e "Starting application with fresh database..."
  start_app "false"
  
  echo -e "${GREEN}Tic-Tac-Toe application database reset successfully!${NC}"
  echo -e "Access the frontend at ${GREEN}http://localhost:3000${NC}"
  echo -e "Access the backend API at ${GREEN}http://localhost:4000${NC}"
}

# Check if Docker is running
check_docker

# Check for docker-compose availability
check_compose

# Process command line arguments
if [ $# -eq 0 ]; then
  show_usage
  exit 0
fi

case "$1" in
  start)
    start_app "true"  # Start with logs
    ;;
  start-silent)
    start_app "false"  # Start without logs
    ;;
  stop)
    stop_app
    ;;
  restart)
    restart_app
    ;;
  reset)
    reset_app
    ;;
  logs)
    show_logs
    ;;
  status)
    show_status
    ;;
  db)
    access_db
    ;;
  help)
    show_usage
    ;;
  *)
    echo -e "${RED}Error: Unknown command '$1'${NC}"
    show_usage
    exit 1
    ;;
esac

exit 0
