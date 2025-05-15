import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game, GameStatus } from './entities/game.entity';
import { Move } from './entities/move.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { MakeMoveDto } from './dto/make-move.dto';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @InjectRepository(Move)
    private movesRepository: Repository<Move>,
  ) {}

  async create(createGameDto: CreateGameDto): Promise<Game> {
    const game = this.gamesRepository.create({
      playerXId: createGameDto.creatorId,
      status: GameStatus.WAITING,
    });
    
    return this.gamesRepository.save(game);
  }

  async findAll(): Promise<Game[]> {
    return this.gamesRepository.find({
      where: { status: GameStatus.WAITING },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Game> {
    return this.gamesRepository.findOne({
      where: { id },
      relations: ['playerX', 'playerO', 'moves'],
    });
  }

  async join(id: string, userId: string): Promise<Game> {
    const game = await this.gamesRepository.findOne({
      where: { id, status: GameStatus.WAITING },
    });
    
    if (!game) {
      throw new Error('Game not found or already started');
    }
    
    game.playerOId = userId;
    game.status = GameStatus.IN_PROGRESS;
    
    return this.gamesRepository.save(game);
  }

  async makeMove(id: string, makeMoveDto: MakeMoveDto): Promise<Game> {
    const { playerId, row, col } = makeMoveDto;
    const game = await this.gamesRepository.findOne({
      where: { id, status: GameStatus.IN_PROGRESS },
      relations: ['moves'],
    });
    
    if (!game) {
      throw new Error('Game not found or not in progress');
    }
    
    // Validate player's turn
    const isPlayerX = game.playerXId === playerId;
    const isPlayerO = game.playerOId === playerId;
    
    if (!isPlayerX && !isPlayerO) {
      throw new Error('Player not in this game');
    }
    
    const playerSymbol = isPlayerX ? 'X' : 'O';
    if (game.currentTurn !== playerSymbol) {
      throw new Error('Not your turn');
    }
    
    // Validate move
    if (row < 0 || row > 2 || col < 0 || col > 2) {
      throw new Error('Invalid position');
    }
    
    if (game.board[row][col] !== null) {
      throw new Error('Position already taken');
    }
    
    // Update board
    const updatedBoard = [...game.board];
    updatedBoard[row][col] = playerSymbol;
    
    // Create move record
    const move = this.movesRepository.create({
      gameId: game.id,
      playerId,
      row,
      col,
      symbol: playerSymbol,
      moveNumber: game.moveCount + 1,
    });
    
    await this.movesRepository.save(move);
    
    // Update game
    game.board = updatedBoard;
    game.currentTurn = game.currentTurn === 'X' ? 'O' : 'X';
    game.moveCount += 1;
    
    // Check for win or draw
    const winner = this.checkWinner(game.board);
    if (winner) {
      game.status = GameStatus.COMPLETED;
      game.winnerId = winner === 'X' ? game.playerXId : game.playerOId;
    } else if (game.moveCount === 9) {
      game.status = GameStatus.COMPLETED;
      game.isDraw = true;
    }
    
    return this.gamesRepository.save(game);
  }

  async undoLastMove(gameId: string, playerId: string): Promise<Game> {
    const game = await this.gamesRepository.findOne({
      where: { id: gameId, status: GameStatus.IN_PROGRESS },
      relations: ['moves'],
    });
    
    if (!game) {
      throw new Error('Game not found or not in progress');
    }
    
    // Get the last 3 moves
    const lastMoves = await this.movesRepository.find({
      where: { gameId, isUndone: false },
      order: { moveNumber: 'DESC' },
      take: 3,
    });
    
    if (lastMoves.length === 0) {
      throw new Error('No moves to undo');
    }
    
    const lastMove = lastMoves[0];
    
    // Only the player who made the move can undo it
    if (lastMove.playerId !== playerId) {
      throw new Error('You can only undo your own moves');
    }
    
    // Mark the move as undone
    lastMove.isUndone = true;
    await this.movesRepository.save(lastMove);
    
    // Revert the board state
    const updatedBoard = [...game.board];
    updatedBoard[lastMove.row][lastMove.col] = null;
    
    // Update game
    game.board = updatedBoard;
    game.currentTurn = lastMove.symbol; // Switch back to the player who made the move
    game.moveCount -= 1;
    
    return this.gamesRepository.save(game);
  }

  private checkWinner(board: Array<Array<string | null>>): 'X' | 'O' | null {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (board[i][0] && board[i][0] === board[i][1] && board[i][0] === board[i][2]) {
        return board[i][0] as 'X' | 'O';
      }
    }
    
    // Check columns
    for (let i = 0; i < 3; i++) {
      if (board[0][i] && board[0][i] === board[1][i] && board[0][i] === board[2][i]) {
        return board[0][i] as 'X' | 'O';
      }
    }
    
    // Check diagonals
    if (board[0][0] && board[0][0] === board[1][1] && board[0][0] === board[2][2]) {
      return board[0][0] as 'X' | 'O';
    }
    
    if (board[0][2] && board[0][2] === board[1][1] && board[0][2] === board[2][0]) {
      return board[0][2] as 'X' | 'O';
    }
    
    return null;
  }
}
