import { IsUUID, IsString, MinLength, MaxLength, IsInt, Min, Max } from 'class-validator';
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

  @ApiProperty({ example: 2, description: 'Day of week the request is for (0=Mon..6=Sun)' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayIndex: number;
}
