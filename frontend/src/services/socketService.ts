import { io, Socket } from 'socket.io-client';
import { Game } from './gameService';

// Event types
export interface PlayerJoinedEvent {
  gameId: string;
  userId: string;
}

export interface PlayerLeftEvent {
  gameId: string;
  userId: string;
}

export interface PlayerDisconnectedEvent {
  gameId: string;
  userId: string;
}

export interface GameOverEvent {
  gameId: string;
  isDraw: boolean;
  winnerId: string | null;
}

export interface MoveUndoneEvent {
  gameId: string;
  playerId: string;
}

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  /**
   * Initialize socket connection
   */
  connect(userId: string): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.userId = userId;
    
    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:4000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    // Identify user to the server when connected
    this.socket.on('connect', () => {
      console.log('Socket connected');
      if (this.socket && this.userId) {
        this.socket.emit('identify', { userId: this.userId });
      }
    });

    return this.socket;
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  /**
   * Join a game room
   */
  joinGame(gameId: string): void {
    if (this.socket && this.userId) {
      this.socket.emit('join_game', { gameId, userId: this.userId });
    }
  }

  /**
   * Leave a game room
   */
  leaveGame(gameId: string): void {
    if (this.socket && this.userId) {
      this.socket.emit('leave_game', { gameId, userId: this.userId });
    }
  }

  /**
   * Make a move in a game
   */
  makeMove(gameId: string, row: number, col: number): void {
    if (this.socket && this.userId) {
      this.socket.emit('make_move', {
        gameId,
        move: {
          playerId: this.userId,
          row,
          col,
        },
      });
    }
  }

  /**
   * Undo the last move in a game
   */
  undoMove(gameId: string): void {
    if (this.socket && this.userId) {
      this.socket.emit('undo_move', {
        gameId,
        playerId: this.userId,
      });
    }
  }

  /**
   * Listen for game updates
   */
  onGameUpdated(callback: (game: Game) => void): void {
    if (this.socket) {
      this.socket.on('game_updated', callback);
    }
  }

  /**
   * Listen for player joined events
   */
  onPlayerJoined(callback: (data: PlayerJoinedEvent) => void): void {
    if (this.socket) {
      this.socket.on('player_joined', callback);
    }
  }

  /**
   * Listen for player left events
   */
  onPlayerLeft(callback: (data: PlayerLeftEvent) => void): void {
    if (this.socket) {
      this.socket.on('player_left', callback);
    }
  }

  /**
   * Listen for player disconnected events
   */
  onPlayerDisconnected(callback: (data: PlayerDisconnectedEvent) => void): void {
    if (this.socket) {
      this.socket.on('player_disconnected', callback);
    }
  }

  /**
   * Listen for game over events
   */
  onGameOver(callback: (data: GameOverEvent) => void): void {
    if (this.socket) {
      this.socket.on('game_over', callback);
    }
  }

  /**
   * Listen for move undone events
   */
  onMoveUndone(callback: (data: MoveUndoneEvent) => void): void {
    if (this.socket) {
      this.socket.on('move_undone', callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export default socketService;
