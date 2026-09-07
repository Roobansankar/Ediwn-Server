import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLabourPaymentStatusDto {
  @ApiProperty({ enum: ['pending', 'paid'] })
  @IsIn(['pending', 'paid'])
  status: 'pending' | 'paid';
}
