import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
  Put,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { compressImageToWebp, compressPdfBuffer } from '../common/utils/file-compression.util.js';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { PurchaseOrdersService } from './purchase-orders.service.js';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto.js';
import { UpdatePurchaseOrderStatusDto } from './dto/update-purchase-order-status.dto.js';

@ApiTags('Purchase Orders')
@Controller({ path: 'purchase-orders', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Create a new purchase order' })
  create(@Body() dto: CreatePurchaseOrderDto, @Request() req: any) {
    return this.poService.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM, Role.SITE_ENGINEER)
  @ApiOperation({ summary: 'List purchase orders' })
  findAll() {
    return this.poService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Get single purchase order' })
  findOne(@Param('id') id: string) {
    return this.poService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Update purchase order status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderStatusDto,
    @Request() req: any,
  ) {
    return this.poService.updateStatus(id, dto.status, req.user);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Update purchase order' })
  update(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    return this.poService.update(id, dto, req.user.id);
  }

  @Post('upload')
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a quotation bill file' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('File is required');

    const uploadPath = './uploads/quotation-bill';
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

    let filename: string;
    if (file.mimetype.startsWith('image/')) {
      filename = `${file.fieldname}-${uniqueSuffix}.webp`;
      const webpBuffer = await compressImageToWebp(file.buffer);
      fs.writeFileSync(`${uploadPath}/${filename}`, webpBuffer);
    } else if (file.mimetype === 'application/pdf') {
      filename = `${file.fieldname}-${uniqueSuffix}.pdf`;
      const compressed = await compressPdfBuffer(file.buffer);
      fs.writeFileSync(`${uploadPath}/${filename}`, compressed);
    } else {
      filename = `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`;
      fs.writeFileSync(`${uploadPath}/${filename}`, file.buffer);
    }

    return {
      fileUrl: `/uploads/quotation-bill/${filename}`,
      fileKey: filename,
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Delete purchase order' })
  remove(@Param('id') id: string) {
    return this.poService.remove(id);
  }
}
