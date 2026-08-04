import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateItemDescriptionDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;
}
