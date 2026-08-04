import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTradeDto {
  @ApiProperty({ example: 'Mason' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
