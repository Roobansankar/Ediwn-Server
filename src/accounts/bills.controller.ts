import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  Patch,
  Put,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role, BillStatus } from '../common/enums.js';
import { AccountsService } from './accounts.service.js';
import { CreateBillDto } from './dto/accounts.dto.js';

@ApiTags('Bills')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@Controller({ path: 'bills', version: '1' })
export class BillsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Create purchase bill' })
  createBill(@Body() dto: CreateBillDto, @Request() req: any) {
    return this.accountsService.createBill(dto, req.user);
  }

  @Post('upload')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/bills';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a bill file' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('File is required');
    }
    return {
      fileUrl: `/uploads/bills/${file.filename}`,
      fileKey: file.filename,
    };
  }

  @Get()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'List bills' })
  findBills() {
    return this.accountsService.findBills();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Get single bill' })
  findOneBill(@Param('id') id: string) {
    return this.accountsService.findOneBill(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Update bill status' })
  updateBillStatus(
    @Param('id') id: string,
    @Body('status') status: BillStatus,
  ) {
    return this.accountsService.updateBillStatus(id, status);
  }

  @Post('../purchase-orders/:id/convert')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Convert PO to bill' })
  convertPoToBill(@Param('id') id: string, @Request() req: any) {
    return this.accountsService.convertPoToBill(id, req.user.id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Update bill' })
  updateBill(
    @Param('id') id: string,
    @Body() dto: CreateBillDto,
    @Request() req: any,
  ) {
    return this.accountsService.updateBill(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Delete bill' })
  removeBill(@Param('id') id: string) {
    return this.accountsService.removeBill(id);
  }
}
