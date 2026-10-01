import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength } from 'class-validator';

export class CreatePurchaseTodoDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
