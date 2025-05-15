import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3, { message: 'Nickname must be at least 3 characters long' })
  @MaxLength(20, { message: 'Nickname must not exceed 20 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Nickname can only contain letters, numbers, underscores, and hyphens' })
  nickname: string;
}
