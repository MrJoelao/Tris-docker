# Tris Game (Tic-Tac-Toe)

A multiplayer real-time Tic-Tac-Toe game with a modern UI built using Vue.js, NestJS, and WebSockets.

## Tech Stack

### Frontend
- Vue.js 3
- Tailwind CSS
- Socket.io Client

### Backend
- NestJS
- WebSockets (Socket.io)
- TypeORM
- PostgreSQL
- Redis

### DevOps
- Docker & Docker Compose

## Features

- Real-time multiplayer gameplay
- Game lobby to create or join games
- Turn-based gameplay with validation
- Timeout detection for inactive players
- Responsive design for mobile and desktop
- Game state persistence in database

## Project Structure

```
tris-app/
├── tris-frontend/     # Vue.js frontend
├── tris-backend/      # NestJS backend
├── docker-compose.yml # Docker configuration
└── README.md          # Project documentation
```

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Docker and Docker Compose (optional)

### Development Setup

#### Without Docker

1. **Backend Setup**:
   ```bash
   cd tris-backend
   npm install
   npm run start:dev
   ```

2. **Frontend Setup**:
   ```bash
   cd tris-frontend
   npm install
   npm run dev
   ```

#### With Docker

Run the entire application stack with:
```bash
docker-compose up
```

## Accessing the Application

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000

## Game Rules

1. Players take turns placing their symbol (X or O) on the board
2. First player to get 3 in a row (horizontally, vertically, or diagonally) wins
3. If all cells are filled without a winner, the game ends in a draw
4. If a player doesn't make a move within 30 seconds, they forfeit the game

## API Endpoints

- `GET /games` - List available games
- `POST /games` - Create a new game
- `GET /games/:id` - Get game details
- `POST /games/:id/join` - Join an existing game

## WebSocket Events

- `joinGame` - Join a game room
- `makeMove` - Make a move on the board
- `gameUpdated` - Receive game state updates
- `checkTimeout` - Check for player timeout

## License

This project is created for educational purposes.
