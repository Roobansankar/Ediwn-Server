import { IsString, IsNumber, IsIn, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSalaryDto {
  @ApiProperty({ example: 'Grade A', description: 'Employee grade/level' })
  @IsString()
  grades: string;

  @ApiProperty({
    example: 'White Collar',
    description: 'Employee category (White Collar or Blue Collar)',
  })
  @IsIn(['White Collar', 'Blue Collar'])
  category: string;

  @ApiProperty({
    example: 'Site Engineer',
    description: 'Employee role/designation',
  })
  @IsString()
  role: string;

  @ApiProperty({
    example: '2-4',
    description: 'Experience range in years (e.g. 0-1, 2-4, 5-7)',
  })
  @IsString()
  expInYears: string;

  @ApiProperty({ example: 50000, description: 'Monthly salary amount' })
  @IsNumber()
  @Min(0)
  monthlySalary: number;

  @ApiProperty({ example: 312.5, description: 'Average cost per hour' })
  @IsNumber()
  @Min(0)
  avgCostPerHr: number;

  @ApiProperty({ example: 25000, description: 'Booking cost' })
  @IsNumber()
  @Min(0)
  bookingCost: number;
}
