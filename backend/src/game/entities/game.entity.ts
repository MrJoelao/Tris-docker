import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Move } from './move.entity';
import { User } from '../../users/entities/user.entity';

export enum GameStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

@Entity()
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  playerXId: string;

  @Column({ nullable: true })
  playerOId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'playerXId' })
  playerX: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'playerOId' })
  playerO: User;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.WAITING,
  })
  status: GameStatus;

  @Column({ nullable: true })
  winnerId: string;

  @Column({ default: false })
  isDraw: boolean;

  @Column({ default: 'X' })
  currentTurn: 'X' | 'O';

  @Column('json', { default: [
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ]})
  board: Array<Array<string | null>>;

  @OneToMany(() => Move, move => move.game, { cascade: true })
  moves: Move[];

  @Column({ default: 0 })
  moveCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
