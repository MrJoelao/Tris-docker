import { IsUUID } from 'class-validator';

export class CreateGameDto {
  @IsUUID()
  creatorId: string;
}
