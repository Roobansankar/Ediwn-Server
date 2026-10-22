import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export const ERP_DOMAINS = [
  'projects',
  'expenses',
  'cashflow',
  'purchases',
  'accounts',
  'subcontracts',
] as const;
export class ErpContextDto {
  @IsOptional()
  @IsIn(['pending', 'outstanding'])
  purchaseOrderView?: 'pending' | 'outstanding';

  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(6)
  @IsIn(ERP_DOMAINS, { each: true })
  domains: string[];

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  dateFrom?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  dateTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;
}
