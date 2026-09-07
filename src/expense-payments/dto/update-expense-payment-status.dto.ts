import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateExpensePaymentStatusDto {
  @ApiProperty({ enum: ['pending', 'paid'] })
  @IsIn(['pending', 'paid'])
  status: 'pending' | 'paid';
}
