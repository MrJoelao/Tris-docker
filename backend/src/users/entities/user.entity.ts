import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nickname: string;

  @Column({ default: 0 })
  gamesPlayed: number;

  @Column({ default: 0 })
  gamesWon: number;

  @Column({ default: 0 })
  gamesLost: number;

  @Column({ default: 0 })
  gamesTied: number;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ nullable: true })
  lastActiveAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
