import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePurchaseTeamDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'john@edwinconstructions.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'john_pur' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ example: 'PUR001' })
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'password123' })
  @IsString()
  @MinLength(4)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['uuid-1', 'uuid-2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  projectIds?: string[];

  @ApiPropertyOptional({ example: 'salary-grade-uuid' })
  @IsString()
  @IsOptional()
  salaryGradeId?: string;
}
