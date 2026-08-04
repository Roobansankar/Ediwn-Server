import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateSubcontractWorkOrderDto } from './create-subcontract-work-order.dto.js';
import { IsEnum } from 'class-validator';
import { SubcontractWorkOrderStatus } from '../../common/enums.js';

export class UpdateSubcontractWorkOrderDto extends PartialType(
  CreateSubcontractWorkOrderDto,
) {}

export class UpdateSubcontractWorkOrderStatusDto {
  @ApiProperty({ enum: SubcontractWorkOrderStatus })
  @IsEnum(SubcontractWorkOrderStatus)
  status: SubcontractWorkOrderStatus;
}
