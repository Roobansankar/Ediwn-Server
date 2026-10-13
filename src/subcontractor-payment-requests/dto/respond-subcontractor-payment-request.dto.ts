import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RespondSubcontractorPaymentRequestDto {
  @ApiProperty({ enum: ['accepted', 'admin_approved', 'rejected'] })
  @IsIn(['accepted', 'admin_approved', 'rejected'])
  action: 'accepted' | 'admin_approved' | 'rejected';

  // Final amount to be paid, set by admin on admin_approved.
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  approvedAmount?: number;
}
