import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseTypeDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;
}
