import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondEmployeeQueryDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'])
  action: 'approved' | 'rejected';
}
