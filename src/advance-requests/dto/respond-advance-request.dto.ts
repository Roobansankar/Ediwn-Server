import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondAdvanceRequestDto {
  @ApiProperty({ enum: ['accepted', 'admin_approved', 'rejected'] })
  @IsIn(['accepted', 'admin_approved', 'rejected'])
  action: 'accepted' | 'admin_approved' | 'rejected';
}
