import { IsUUID, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeQueryDto {
  @ApiProperty({ example: 'uuid-of-timesheet' })
  @IsUUID()
  timesheetId: string;

  @ApiProperty({ example: 'Entered wrong hours on Monday' })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reason: string;
}
