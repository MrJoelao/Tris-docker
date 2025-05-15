import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { nickname: createUserDto.nickname },
    });
    
    if (existingUser) {
      throw new Error('Nickname already taken');
    }
    
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByNickname(nickname: string): Promise<User> {
    return this.usersRepository.findOne({ where: { nickname } });
  }

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.isOnline = isOnline;
    user.lastActiveAt = new Date();
    
    return this.usersRepository.save(user);
  }

  async updateGameStats(id: string, result: 'win' | 'loss' | 'tie'): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.gamesPlayed += 1;
    
    if (result === 'win') {
      user.gamesWon += 1;
    } else if (result === 'loss') {
      user.gamesLost += 1;
    } else if (result === 'tie') {
      user.gamesTied += 1;
    }
    
    return this.usersRepository.save(user);
  }
}
