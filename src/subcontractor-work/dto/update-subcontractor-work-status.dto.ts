import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSubcontractorWorkStatusDto {
  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  @IsIn(['pending', 'approved', 'rejected'])
  status: 'pending' | 'approved' | 'rejected';
}
