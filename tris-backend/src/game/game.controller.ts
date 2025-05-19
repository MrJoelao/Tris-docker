import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { GameService } from './game.service';
import { Game } from '../entities/game.entity';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  async createGame(): Promise<Game> {
    return this.gameService.createGame();
  }

  @Get()
  async findAllGames(): Promise<Game[]> {
    return this.gameService.findAllGames();
  }

  @Get(':id')
  async findGame(@Param('id') id: string): Promise<Game> {
    const game = await this.gameService.findGame(id);
    if (!game) {
      throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
    }
    return game;
  }

  @Post(':id/join')
  async joinGame(
    @Param('id') id: string,
    @Body('playerId') playerId: string,
  ): Promise<Game> {
    try {
      return await this.gameService.joinGame(id, playerId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
