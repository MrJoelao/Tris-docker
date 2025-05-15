import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { MakeMoveDto } from './dto/make-move.dto';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://your-production-domain.com' 
      : 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket'],
  compression: true, // Enable WebSocket compression for better performance
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);
  private readonly connectedUsers = new Map<string, string>(); // userId -> socketId
  private readonly activeGames = new Map<string, Set<string>>(); // gameId -> Set of userIds

  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Find the userId associated with this socket
    let disconnectedUserId: string | null = null;
    
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        disconnectedUserId = userId;
        break;
      }
    }
    
    if (disconnectedUserId) {
      this.connectedUsers.delete(disconnectedUserId);
      
      // Notify all active games that this user was part of
      for (const [gameId, userIds] of this.activeGames.entries()) {
        if (userIds.has(disconnectedUserId)) {
          userIds.delete(disconnectedUserId);
          
          if (userIds.size > 0) {
            // Notify remaining players
            this.server.to(`game:${gameId}`).emit('player_disconnected', {
              gameId,
              userId: disconnectedUserId,
            });
          } else {
            // No players left, clean up
            this.activeGames.delete(gameId);
          }
        }
      }
    }
  }

  @SubscribeMessage('identify')
  handleIdentify(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    
    // Store the mapping of userId to socketId
    this.connectedUsers.set(userId, client.id);
    
    return { status: 'identified' };
  }

  @SubscribeMessage('join_game')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string, userId: string },
  ) {
    const { gameId, userId } = data;
    
    // Join the socket room for this game
    client.join(`game:${gameId}`);
    
    // Add user to active game participants
    if (!this.activeGames.has(gameId)) {
      this.activeGames.set(gameId, new Set());
    }
    
    this.activeGames.get(gameId).add(userId);
    
    // Notify all clients in the room that a new player joined
    this.server.to(`game:${gameId}`).emit('player_joined', {
      gameId,
      userId,
    });
    
    return { status: 'joined' };
  }

  @SubscribeMessage('leave_game')
  handleLeaveGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string, userId: string },
  ) {
    const { gameId, userId } = data;
    
    // Leave the socket room
    client.leave(`game:${gameId}`);
    
    // Remove user from active game participants
    if (this.activeGames.has(gameId)) {
      const participants = this.activeGames.get(gameId);
      participants.delete(userId);
      
      if (participants.size === 0) {
        this.activeGames.delete(gameId);
      }
    }
    
    // Notify remaining players
    this.server.to(`game:${gameId}`).emit('player_left', {
      gameId,
      userId,
    });
    
    return { status: 'left' };
  }

  @SubscribeMessage('make_move')
  async handleMakeMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string, move: MakeMoveDto },
  ) {
    const { gameId, move } = data;
    
    try {
      const updatedGame = await this.gameService.makeMove(gameId, move);
      
      // Broadcast the updated game state to all players
      this.server.to(`game:${gameId}`).emit('game_updated', updatedGame);
      
      // If game is completed, send additional event
      if (updatedGame.status === 'completed') {
        this.server.to(`game:${gameId}`).emit('game_over', {
          gameId,
          isDraw: updatedGame.isDraw,
          winnerId: updatedGame.winnerId,
        });
      }
      
      return { status: 'success', game: updatedGame };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  @SubscribeMessage('undo_move')
  async handleUndoMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: string, playerId: string },
  ) {
    const { gameId, playerId } = data;
    
    try {
      const updatedGame = await this.gameService.undoLastMove(gameId, playerId);
      
      // Broadcast the updated game state to all players
      this.server.to(`game:${gameId}`).emit('game_updated', updatedGame);
      this.server.to(`game:${gameId}`).emit('move_undone', {
        gameId,
        playerId,
      });
      
      return { status: 'success', game: updatedGame };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // Method to notify clients about game updates (called from other services)
  notifyGameUpdate(gameId: string, game: any) {
    this.server.to(`game:${gameId}`).emit('game_updated', game);
  }
}
