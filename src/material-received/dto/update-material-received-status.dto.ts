import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { MaterialReceivedStatus } from '../../common/enums.js';

export class UpdateMaterialReceivedStatusDto {
  @ApiProperty({ enum: MaterialReceivedStatus })
  @IsEnum(MaterialReceivedStatus)
  status: MaterialReceivedStatus;
}
