import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'Team A' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
