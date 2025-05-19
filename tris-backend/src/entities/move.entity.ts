import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Game } from './game.entity';

@Entity()
export class Move {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  playerId: string;

  @Column()
  position: number;

  @Column()
  symbol: string;

  @ManyToOne(() => Game, game => game.moves)
  game: Game;

  @CreateDateColumn()
  createdAt: Date;
}
