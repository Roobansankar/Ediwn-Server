import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OfficeStaffType } from '../../common/enums.js';

export class CreateOfficeStaffDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ enum: OfficeStaffType })
  @IsIn(Object.values(OfficeStaffType))
  staffType: OfficeStaffType;

  @ApiPropertyOptional({ example: 'EMP-101' })
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'john@company.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Chennai' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'john.doe' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ example: 'password123' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  salaryGradeId?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  projectIds?: string[];
}
