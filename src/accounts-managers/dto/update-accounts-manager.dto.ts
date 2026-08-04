import { PartialType } from '@nestjs/swagger';
import { CreateAccountsManagerDto } from './create-accounts-manager.dto.js';

export class UpdateAccountsManagerDto extends PartialType(
  CreateAccountsManagerDto,
) {}
