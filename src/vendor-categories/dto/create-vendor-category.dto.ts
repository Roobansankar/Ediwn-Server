import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVendorCategoryDto {
  @ApiProperty({ example: 'Cement' })
  @IsString()
  @MinLength(2)
  name: string;
}
