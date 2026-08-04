import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePurchaseEnquiryStatusDto {
  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  status: string;
}
