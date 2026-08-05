import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondAdvanceRequestDto {
  @ApiProperty({ enum: ['accepted', 'rejected'] })
  @IsIn(['accepted', 'rejected'])
  action: 'accepted' | 'rejected';
}
