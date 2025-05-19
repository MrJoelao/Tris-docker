import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { Game } from '../entities/game.entity';
import { Move } from '../entities/move.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Move])],
  providers: [GameGateway, GameService],
  controllers: [GameController],
})
export class GameModule {}
