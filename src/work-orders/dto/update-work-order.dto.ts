import { PartialType, ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CreateWorkOrderDto } from './create-work-order.dto.js';
import { WorkOrderStatus } from '../../common/enums.js';

export class UpdateWorkOrderDto extends PartialType(CreateWorkOrderDto) {}

export class UpdateWorkOrderStatusDto {
  @ApiProperty({ enum: WorkOrderStatus })
  @IsEnum(WorkOrderStatus)
  status: WorkOrderStatus;
}
