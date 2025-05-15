import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Game } from './game.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Move {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  gameId: string;

  @ManyToOne(() => Game, game => game.moves, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @Column()
  playerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'playerId' })
  player: User;

  @Column()
  row: number;

  @Column()
  col: number;

  @Column()
  symbol: 'X' | 'O';

  @Column({ default: false })
  isUndone: boolean;

  @Column({ default: 0 })
  moveNumber: number;

  @CreateDateColumn()
  createdAt: Date;
}
