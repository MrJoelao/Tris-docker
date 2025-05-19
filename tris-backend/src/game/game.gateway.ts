import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage('joinGame')
  async handleJoinGame(
    @MessageBody() data: { gameId: string; playerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { gameId, playerId } = data;
      
      // Join the socket room for this game
      client.join(gameId);
      
      // Add player to the game
      const game = await this.gameService.joinGame(gameId, playerId);
      
      // Emit updated game state to all clients in the room
      this.server.to(gameId).emit('gameUpdated', game);
      
      return { success: true, game };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('makeMove')
  async handleMakeMove(
    @MessageBody() data: { gameId: string; playerId: string; position: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { gameId, playerId, position } = data;
      
      // Make the move
      const game = await this.gameService.makeMove(gameId, playerId, position);
      
      // Emit updated game state to all clients in the room
      this.server.to(gameId).emit('gameUpdated', game);
      
      return { success: true, game };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('checkTimeout')
  async handleCheckTimeout(
    @MessageBody() data: { gameId: string },
  ) {
    try {
      const { gameId } = data;
      
      // Check for timeout
      const game = await this.gameService.checkTimeout(gameId);
      
      // If game status changed due to timeout, notify clients
      if (game.status !== 'in_progress') {
        this.server.to(gameId).emit('gameUpdated', game);
      }
      
      return { success: true, game };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
