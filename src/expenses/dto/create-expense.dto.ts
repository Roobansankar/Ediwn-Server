import {
  IsEnum,
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory, ExpenseStatus } from '../../common/enums.js';

export class CreateExpenseDto {
  @ApiPropertyOptional({ enum: ExpenseCategory })
  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;
  @ApiPropertyOptional() @IsUUID() @IsOptional() expenseTypeId?: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsNumber() amount: number;
  @ApiProperty() @IsDateString() expenseDate: string;
  @ApiPropertyOptional() @IsString() @IsOptional() paidBy?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() projectId?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() tradeId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() remarks?: string;
  @ApiPropertyOptional({ enum: ExpenseStatus })
  @IsEnum(ExpenseStatus)
  @IsOptional()
  status?: ExpenseStatus;
}
