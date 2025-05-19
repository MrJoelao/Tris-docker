import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game, GameStatus } from '../entities/game.entity';
import { Move } from '../entities/move.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(Move)
    private moveRepository: Repository<Move>,
  ) {}

  async createGame(): Promise<Game> {
    const game = this.gameRepository.create();
    return this.gameRepository.save(game);
  }

  async findGame(gameId: string): Promise<Game> {
    return this.gameRepository.findOne({ 
      where: { id: gameId },
      relations: ['moves'] 
    });
  }

  async findAllGames(): Promise<Game[]> {
    return this.gameRepository.find({
      where: { status: GameStatus.WAITING },
      order: { createdAt: 'DESC' }
    });
  }
  
  async getPlayerGameHistory(playerId: string): Promise<Game[]> {
    return this.gameRepository.find({
      where: [
        { player1Id: playerId, status: GameStatus.COMPLETED },
        { player2Id: playerId, status: GameStatus.COMPLETED },
        { player1Id: playerId, status: GameStatus.DRAW },
        { player2Id: playerId, status: GameStatus.DRAW }
      ],
      order: { updatedAt: 'DESC' },
      take: 10 // Limit to last 10 games
    });
  }

  async joinGame(gameId: string, playerId: string): Promise<Game> {
    const game = await this.findGame(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }

    if (!game.player1Id) {
      game.player1Id = playerId;
    } else if (!game.player2Id && game.player1Id !== playerId) {
      game.player2Id = playerId;
      game.status = GameStatus.IN_PROGRESS;
      game.lastMoveTime = Date.now();
    }

    return this.gameRepository.save(game);
  }

  async makeMove(gameId: string, playerId: string, position: number): Promise<Game> {
    const game = await this.findGame(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new Error('Game is not in progress');
    }

    // Check if it's the player's turn
    const isPlayerX = game.player1Id === playerId;
    const isPlayerO = game.player2Id === playerId;
    
    if ((!isPlayerX && !isPlayerO) || 
        (isPlayerX && game.currentTurn !== 'X') || 
        (isPlayerO && game.currentTurn !== 'O')) {
      throw new Error('Not your turn');
    }

    // Parse the board
    const board = JSON.parse(game.board);
    
    // Check if the position is valid and empty
    if (position < 0 || position > 8 || board[position] !== '') {
      throw new Error('Invalid move');
    }

    // Make the move
    board[position] = game.currentTurn;
    game.board = JSON.stringify(board);
    
    // Create move record
    const move = this.moveRepository.create({
      playerId,
      position,
      symbol: game.currentTurn,
      game,
    });
    await this.moveRepository.save(move);
    
    // Switch turns
    game.currentTurn = game.currentTurn === 'X' ? 'O' : 'X';
    game.lastMoveTime = Date.now();
    
    // Check for win or draw
    const result = this.checkGameResult(board);
    if (result === 'X') {
      game.status = GameStatus.COMPLETED;
      game.winnerId = game.player1Id;
    } else if (result === 'O') {
      game.status = GameStatus.COMPLETED;
      game.winnerId = game.player2Id;
    } else if (result === 'draw') {
      game.status = GameStatus.DRAW;
    }
    
    return this.gameRepository.save(game);
  }

  private checkGameResult(board: string[]): string | null {
    // Check rows
    for (let i = 0; i < 9; i += 3) {
      if (board[i] && board[i] === board[i + 1] && board[i] === board[i + 2]) {
        return board[i];
      }
    }
    
    // Check columns
    for (let i = 0; i < 3; i++) {
      if (board[i] && board[i] === board[i + 3] && board[i] === board[i + 6]) {
        return board[i];
      }
    }
    
    // Check diagonals
    if (board[0] && board[0] === board[4] && board[0] === board[8]) {
      return board[0];
    }
    if (board[2] && board[2] === board[4] && board[2] === board[6]) {
      return board[2];
    }
    
    // Check for draw
    if (!board.includes('')) {
      return 'draw';
    }
    
    return null;
  }

  async checkTimeout(gameId: string): Promise<Game> {
    const game = await this.findGame(gameId);
    
    if (!game || game.status !== GameStatus.IN_PROGRESS) {
      return game;
    }
    
    const currentTime = Date.now();
    const timeoutDuration = 30000; // 30 seconds timeout
    
    if (currentTime - game.lastMoveTime > timeoutDuration) {
      // Current player timed out, other player wins
      if (game.currentTurn === 'X') {
        game.status = GameStatus.COMPLETED;
        game.winnerId = game.player2Id;
      } else {
        game.status = GameStatus.COMPLETED;
        game.winnerId = game.player1Id;
      }
      
      await this.gameRepository.save(game);
    }
    
    return game;
  }
}
