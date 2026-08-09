import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTradeDto {
  @ApiProperty({ example: 'Mason' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'uuid-of-team' })
  @ValidateIf((o) => o.teamId !== undefined && o.teamId !== '')
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({ example: 800 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  shiftWiseAmount?: number;
}
