import { IsUUID, IsInt, Min, Max } from 'class-validator';

export class MakeMoveDto {
  @IsUUID()
  playerId: string;

  @IsInt()
  @Min(0)
  @Max(2)
  row: number;

  @IsInt()
  @Min(0)
  @Max(2)
  col: number;
}
