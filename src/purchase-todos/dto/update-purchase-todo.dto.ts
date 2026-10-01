import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength } from 'class-validator';

export class UpdatePurchaseTodoDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isDone?: boolean;
}
