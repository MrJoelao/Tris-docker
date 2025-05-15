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
      # Use a wrapper function instead of an alias
      docker() {
        sudo docker "$@"
      }
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

# Function to check if a command exists
function command_exists {
  command -v "$1" >/dev/null 2>&1
}

# Function to check if ports are available
function check_ports {
  local port=$1
  local service=$2
  
  # Check if lsof is available
  if ! command_exists lsof; then
    echo -e "${YELLOW}Warning: 'lsof' command not found. Cannot check if ports are in use.${NC}"
    echo -e "${YELLOW}Assuming port $port is available for $service.${NC}"
    return 0
  fi
  
  # Check if the port is in use
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}Error: Port $port is already in use by another service.${NC}"
    echo -e "This port is needed for the $service service."
    
    # Try to identify what's using the port
    echo -e "${YELLOW}Checking what's using port $port:${NC}"
    lsof -i :$port
    
    echo -e "\n${YELLOW}Options:${NC}"
    echo -e "1. Stop the conflicting service and try again"
    echo -e "2. Modify docker-compose.yml to use a different port"
    
    return 1
  fi
  
  return 0
}

# Function to start the application
function start_app {
  echo -e "${YELLOW}Starting Tic-Tac-Toe application...${NC}"
  
  # Remove existing containers first
  remove_existing_containers
  
  # Check if required ports are available
  echo -e "${YELLOW}Checking if required ports are available...${NC}"
  check_ports 5432 "PostgreSQL database" || { echo -e "${RED}Please fix the port conflict for PostgreSQL (5432) before continuing.${NC}"; exit 1; }
  check_ports 6379 "Redis" || { echo -e "${RED}Please fix the port conflict for Redis (6379) before continuing.${NC}"; exit 1; }
  check_ports 3000 "Frontend" || { echo -e "${RED}Please fix the port conflict for Frontend (3000) before continuing.${NC}"; exit 1; }
  check_ports 4000 "Backend API" || { echo -e "${RED}Please fix the port conflict for Backend API (4000) before continuing.${NC}"; exit 1; }
  
  echo -e "${GREEN}All required ports are available.${NC}"
  
  # Pull latest images
  echo -e "${YELLOW}Pulling latest Docker images...${NC}"
  $COMPOSE_CMD pull
  
  # Function to handle port conflicts by modifying docker-compose.yml
  function handle_port_conflict {
    local error_message=$1
    local service_name=$2
    local default_port=$3
    
    # Extract the port that's in conflict from the error message
    if [[ $error_message =~ "exposing port TCP 0.0.0.0:$default_port" ]]; then
      echo -e "${YELLOW}Port $default_port is already in use.${NC}"
      
      # Find an available port
      local new_port=$((default_port + 1))
      while netstat -tuln | grep -q ":$new_port "; do
        ((new_port++))
      done
      
      echo -e "${YELLOW}Changing $service_name port from $default_port to $new_port in docker-compose.yml${NC}"
      
      # Update docker-compose.yml
      sed -i "s/- \"$default_port:$default_port\"/- \"$new_port:$default_port\"/g" docker-compose.yml
      
      # Export the new port for later use
      case "$service_name" in
        "db")
          export TRIS_PG_PORT=$new_port
          ;;
        "redis")
          export TRIS_REDIS_PORT=$new_port
          ;;
        "frontend")
          export TRIS_FRONTEND_PORT=$new_port
          ;;
        "backend")
          export TRIS_BACKEND_PORT=$new_port
          ;;
      esac
      
      return 0
    fi
    
    return 1
  }
  
  # Start the database and redis first
  echo -e "${YELLOW}Starting database and redis...${NC}"
  
  # Try to start the services, handling port conflicts if they occur
  db_started=false
  redis_started=false
  retry_attempts=0
  max_retries=5
  
  while ([ "$db_started" = false ] || [ "$redis_started" = false ]) && [ $retry_attempts -lt $max_retries ]; do
    # Start the services
    error_output=$($COMPOSE_CMD up -d db redis 2>&1)
    
    # Check for port conflicts
    if echo "$error_output" | grep -q "Ports are not available"; then
      echo -e "${YELLOW}Port conflict detected. Attempting to resolve...${NC}"
      
      # Try to handle port conflicts for each service
      if echo "$error_output" | grep -q "exposing port TCP 0.0.0.0:5432"; then
        handle_port_conflict "$error_output" "db" 5432
      fi
      
      if echo "$error_output" | grep -q "exposing port TCP 0.0.0.0:6379"; then
        handle_port_conflict "$error_output" "redis" 6379
      fi
      
      # Increment retry counter
      ((retry_attempts++))
      
      # If we've tried too many times, exit
      if [ $retry_attempts -ge $max_retries ]; then
        echo -e "${RED}Failed to start services after $max_retries attempts. Please check your system for conflicting services.${NC}"
        exit 1
      fi
      
      echo -e "${YELLOW}Retrying with new ports...${NC}"
      sleep 2
    else
      # No port conflicts, services started successfully
      db_started=true
      redis_started=true
    fi
  done
  
  # Wait for the database to be ready
  echo -e "${YELLOW}Waiting for database to be ready...${NC}"
  db_ready=false
  retry_count=0
  max_retries=30
  
  while [ "$db_ready" = false ] && [ $retry_count -lt $max_retries ]; do
    sleep 1
    echo -n "."
    
    # Check if the database container is running and healthy
    if $COMPOSE_CMD ps db | grep -q "(healthy)"; then
      db_ready=true
      echo -e "\n${GREEN}Database is ready!${NC}"
    elif $COMPOSE_CMD ps db | grep -q "(unhealthy)"; then
      echo -e "\n${RED}Database is unhealthy. Checking logs...${NC}"
      $COMPOSE_CMD logs db
      
      echo -e "${YELLOW}Attempting to fix database issues...${NC}"
      $COMPOSE_CMD down
      docker volume rm tris-docker_postgres_data 2>/dev/null || true
      $COMPOSE_CMD up -d db
      sleep 5
    fi
    
    ((retry_count++))
  done
  
  # Start the backend and frontend
  echo -e "${YELLOW}Starting backend and frontend...${NC}"
  
  # Try to start the services, handling port conflicts if they occur
  backend_started=false
  frontend_started=false
  retry_attempts=0
  max_retries=5
  
  while ([ "$backend_started" = false ] || [ "$frontend_started" = false ]) && [ $retry_attempts -lt $max_retries ]; do
    # Start the services
    error_output=$($COMPOSE_CMD up -d backend frontend 2>&1)
    
    # Check for port conflicts
    if echo "$error_output" | grep -q "Ports are not available"; then
      echo -e "${YELLOW}Port conflict detected. Attempting to resolve...${NC}"
      
      # Try to handle port conflicts for each service
      if echo "$error_output" | grep -q "exposing port TCP 0.0.0.0:4000"; then
        handle_port_conflict "$error_output" "backend" 4000
      fi
      
      if echo "$error_output" | grep -q "exposing port TCP 0.0.0.0:3000"; then
        handle_port_conflict "$error_output" "frontend" 3000
      fi
      
      # Increment retry counter
      ((retry_attempts++))
      
      # If we've tried too many times, exit
      if [ $retry_attempts -ge $max_retries ]; then
        echo -e "${RED}Failed to start services after $max_retries attempts. Please check your system for conflicting services.${NC}"
        exit 1
      fi
      
      echo -e "${YELLOW}Retrying with new ports...${NC}"
      sleep 2
    else
      # No port conflicts, services started successfully
      backend_started=true
      frontend_started=true
    fi
  done
  
  # Final check to ensure all services are running
  echo -e "${YELLOW}Checking if all services are running...${NC}"
  if $COMPOSE_CMD ps | grep -q "Exit"; then
    echo -e "${RED}Some services failed to start. Checking logs...${NC}"
    $COMPOSE_CMD logs
    exit 1
  fi
  
  echo -e "${GREEN}Tic-Tac-Toe application started successfully!${NC}"
  echo -e "Access the frontend at ${GREEN}http://localhost:${TRIS_FRONTEND_PORT:-3000}${NC}"
  echo -e "Access the backend API at ${GREEN}http://localhost:${TRIS_BACKEND_PORT:-4000}${NC}"
  
  # If show_logs is true, display logs
  if [ "$1" = "true" ]; then
    echo -e "\n${YELLOW}Showing application logs:${NC}"
    echo -e "Press ${YELLOW}Ctrl+C${NC} to exit logs (application will continue running)\n"
    $COMPOSE_CMD logs -f
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

# Function to modify docker-compose ports
function modify_compose_ports {
  echo -e "${YELLOW}Checking for port conflicts and modifying docker-compose.yml if needed...${NC}"
  
  # Get available ports
  local pg_port=5432
  local redis_port=6379
  local frontend_port=3000
  local backend_port=4000
  
  # Check if lsof is available
  if ! command_exists lsof; then
    echo -e "${YELLOW}Warning: 'lsof' command not found. Cannot check if ports are in use.${NC}"
    echo -e "${YELLOW}Using default ports: PostgreSQL ($pg_port), Redis ($redis_port), Frontend ($frontend_port), Backend ($backend_port)${NC}"
    
    # Save the ports for later use
    export TRIS_PG_PORT=$pg_port
    export TRIS_REDIS_PORT=$redis_port
    export TRIS_FRONTEND_PORT=$frontend_port
    export TRIS_BACKEND_PORT=$backend_port
    
    return 0
  fi
  
  # Check if ports are in use and find alternatives
  if lsof -Pi :$pg_port -sTCP:LISTEN -t >/dev/null ; then
    local new_pg_port=5433
    while lsof -Pi :$new_pg_port -sTCP:LISTEN -t >/dev/null ; do
      ((new_pg_port++))
    done
    echo -e "${YELLOW}PostgreSQL port $pg_port is in use. Using port $new_pg_port instead.${NC}"
    sed -i "s/- \"$pg_port:$pg_port\"/- \"$new_pg_port:$pg_port\"/g" docker-compose.yml
    pg_port=$new_pg_port
  fi
  
  if lsof -Pi :$redis_port -sTCP:LISTEN -t >/dev/null ; then
    local new_redis_port=6380
    while lsof -Pi :$new_redis_port -sTCP:LISTEN -t >/dev/null ; do
      ((new_redis_port++))
    done
    echo -e "${YELLOW}Redis port $redis_port is in use. Using port $new_redis_port instead.${NC}"
    sed -i "s/- \"$redis_port:$redis_port\"/- \"$new_redis_port:$redis_port\"/g" docker-compose.yml
    redis_port=$new_redis_port
  fi
  
  if lsof -Pi :$frontend_port -sTCP:LISTEN -t >/dev/null ; then
    local new_frontend_port=3001
    while lsof -Pi :$new_frontend_port -sTCP:LISTEN -t >/dev/null ; do
      ((new_frontend_port++))
    done
    echo -e "${YELLOW}Frontend port $frontend_port is in use. Using port $new_frontend_port instead.${NC}"
    sed -i "s/- \"$frontend_port:$frontend_port\"/- \"$new_frontend_port:$frontend_port\"/g" docker-compose.yml
    frontend_port=$new_frontend_port
  fi
  
  if lsof -Pi :$backend_port -sTCP:LISTEN -t >/dev/null ; then
    local new_backend_port=4001
    while lsof -Pi :$new_backend_port -sTCP:LISTEN -t >/dev/null ; do
      ((new_backend_port++))
    done
    echo -e "${YELLOW}Backend port $backend_port is in use. Using port $new_backend_port instead.${NC}"
    sed -i "s/- \"$backend_port:$backend_port\"/- \"$new_backend_port:$backend_port\"/g" docker-compose.yml
    backend_port=$new_backend_port
  fi
  
  echo -e "${GREEN}Docker Compose configuration updated with available ports:${NC}"
  echo -e "  - PostgreSQL: ${GREEN}$pg_port${NC}"
  echo -e "  - Redis: ${GREEN}$redis_port${NC}"
  echo -e "  - Frontend: ${GREEN}$frontend_port${NC}"
  echo -e "  - Backend API: ${GREEN}$backend_port${NC}"
  
  # Save the ports for later use
  export TRIS_PG_PORT=$pg_port
  export TRIS_REDIS_PORT=$redis_port
  export TRIS_FRONTEND_PORT=$frontend_port
  export TRIS_BACKEND_PORT=$backend_port
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
  
  # Check for port conflicts and modify docker-compose if needed
  modify_compose_ports
  
  # Start the application again using our start function
  echo -e "Starting application with fresh database..."
  start_app "false"
  
  echo -e "${GREEN}Tic-Tac-Toe application database reset successfully!${NC}"
  echo -e "Access the frontend at ${GREEN}http://localhost:${TRIS_FRONTEND_PORT:-3000}${NC}"
  echo -e "Access the backend API at ${GREEN}http://localhost:${TRIS_BACKEND_PORT:-4000}${NC}"
}

# Check if Docker is running
check_docker

# Check for docker-compose availability
check_compose

# Check if we need to install lsof
if ! command_exists lsof; then
  echo -e "${YELLOW}The 'lsof' command is not installed. This is used to check for port conflicts.${NC}"
  echo -e "${YELLOW}Would you like to install it? (y/n): ${NC}"
  read -r install_lsof
  
  if [[ $install_lsof == "y" || $install_lsof == "Y" ]]; then
    echo -e "${YELLOW}Installing lsof...${NC}"
    if command_exists apt-get; then
      sudo apt-get update && sudo apt-get install -y lsof
    elif command_exists yum; then
      sudo yum install -y lsof
    elif command_exists dnf; then
      sudo dnf install -y lsof
    elif command_exists pacman; then
      sudo pacman -S --noconfirm lsof
    elif command_exists brew; then
      brew install lsof
    else
      echo -e "${RED}Could not determine package manager. Please install lsof manually.${NC}"
    fi
  else
    echo -e "${YELLOW}Continuing without lsof. Port conflict detection will be disabled.${NC}"
  fi
fi

# Add the function to modify docker-compose ports before processing commands
modify_compose_ports

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
