import { Controller, Get, Post, Body, Param, Put, HttpException, HttpStatus } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { MakeMoveDto } from './dto/make-move.dto';

@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  async create(@Body() createGameDto: CreateGameDto) {
    try {
      return await this.gameService.create(createGameDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll() {
    return await this.gameService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const game = await this.gameService.findOne(id);
    if (!game) {
      throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
    }
    return game;
  }

  @Put(':id/join')
  async join(@Param('id') id: string, @Body('userId') userId: string) {
    try {
      return await this.gameService.join(id, userId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/moves')
  async makeMove(@Param('id') id: string, @Body() makeMoveDto: MakeMoveDto) {
    try {
      return await this.gameService.makeMove(id, makeMoveDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/undo')
  async undoLastMove(@Param('id') id: string, @Body('playerId') playerId: string) {
    try {
      return await this.gameService.undoLastMove(id, playerId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
