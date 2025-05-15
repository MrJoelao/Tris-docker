# Tic-Tac-Toe Multiplayer Game

A premium real-time Tic-Tac-Toe game with containerized architecture using Docker, PostgreSQL, and Redis.

## Features

- **Real-time Gameplay**: Instant updates using Socket.IO
- **Premium UI/UX**: Responsive design with Tailwind CSS and Framer Motion animations
- **Accessibility**: WCAG 2.1 AA compliant with reduced motion and high contrast options
- **Containerized Architecture**: Docker-based deployment with PostgreSQL and Redis
- **Performance Optimizations**: WebSocket compression, Redis caching, and connection pooling

## Tech Stack

### Frontend
- React 19 with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- React Hook Form for form handling

### Backend
- NestJS framework
- Socket.IO for real-time communication
- TypeORM for database interactions
- PostgreSQL for data persistence
- Redis for session management and caching

### DevOps
- Docker and Docker Compose for containerization
- Network isolation with dedicated game-network
- Resource limits for containers
- Automatic log rotation

## Getting Started

### Prerequisites
- Docker and Docker Compose installed on your system

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd tris-docker
```

2. Start the application with Docker Compose
```bash
docker-compose up -d
```

3. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Game Rules

1. Players take turns placing their symbol (X or O) on the 3x3 grid
2. The first player to get three of their symbols in a row (horizontally, vertically, or diagonally) wins
3. If all cells are filled and no player has won, the game ends in a draw
4. Players can undo their last 3 moves
5. A move timeout system prevents inactive games

## Development

### Running in Development Mode

```bash
# Start all services
docker-compose up -d

# Frontend only
docker-compose up -d frontend

# Backend only
docker-compose up -d backend db redis
```

### Accessing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

## Project Structure

```
tris-docker/
├── docker-compose.yml       # Docker Compose configuration
├── frontend/                # React frontend application
│   ├── Dockerfile           # Frontend container configuration
│   ├── public/              # Static assets
│   └── src/                 # React source code
│       ├── components/      # Reusable UI components
│       ├── context/         # React context providers
│       ├── pages/           # Application pages
│       └── services/        # API and WebSocket services
└── backend/                 # NestJS backend application
    ├── Dockerfile           # Backend container configuration
    └── src/                 # NestJS source code
        ├── game/            # Game module
        ├── users/           # Users module
        └── main.ts          # Application entry point
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
