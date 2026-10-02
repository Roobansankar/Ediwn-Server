import { IsString, IsEmail, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubcontractorDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  gstNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @ValidateIf((o) => o.email !== '' && o.email != null)
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  workCategoryId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  accountHolderName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  ifscCode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  branch?: string;
}
