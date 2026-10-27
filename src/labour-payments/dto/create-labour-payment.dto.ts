import {
  IsNumber,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  Min,
  IsUUID,
  IsDateString,
  IsIn,
  IsString,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLabourPaymentDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  workerIds?: string[];

  @IsUUID()
  @IsOptional()
  paymentId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @IsIn(['cash', 'upi', 'rtgs', 'cheque', 'bank_transfer'])
  @IsOptional()
  paymentMode?: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiProperty({ example: 'uuid-of-site-engineer' })
  @IsUUID()
  userId: string;

  @ApiProperty({
    example: '2026-09-01',
    description: 'Monday of the week being paid',
  })
  @IsDateString()
  weekStart: string;

  @ApiProperty({
    example: '2026-09-07',
    description: 'Sunday of the week being paid',
  })
  @IsDateString()
  weekEnd: string;

  @ApiProperty({ example: '2026-09-08' })
  @IsDateString()
  paymentDate: string;

  @ApiPropertyOptional({ enum: ['pending', 'paid'], example: 'pending' })
  @IsIn(['pending', 'paid'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'Paid by cash' })
  @IsString()
  @IsOptional()
  notes?: string;
}
