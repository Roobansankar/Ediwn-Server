import { IsUUID, IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubcontractorPaymentRequestDto {
  @ApiProperty({ example: 'uuid-of-subcontractor' })
  @IsUUID()
  subcontractorId: string;

  @ApiProperty({ example: 'uuid-of-project' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ example: 'uuid-of-subcontract-work-order' })
  @IsUUID()
  @IsOptional()
  subcontractWorkOrderId?: string;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Payment needed for completed milestone' })
  @IsString()
  @IsOptional()
  notes?: string;
}
