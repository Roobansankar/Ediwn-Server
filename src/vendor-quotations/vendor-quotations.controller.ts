import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { compressImageToWebp, compressPdfBuffer } from '../common/utils/file-compression.util.js';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { VendorQuotationsService } from './vendor-quotations.service.js';
import { CreateVendorQuotationDto } from './dto/create-vendor-quotation.dto.js';
import { UpdateVendorQuotationDto } from './dto/update-vendor-quotation.dto.js';

@ApiTags('Vendor Quotations')
@Controller({ path: 'vendor-quotations', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class VendorQuotationsController {
  constructor(private readonly service: VendorQuotationsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Create a vendor quotation' })
  create(@Body() dto: CreateVendorQuotationDto) {
    return this.service.create(dto, dto.groupId);
  }

  @Post(':id/upload')
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM)
  @UseInterceptors(
    FileInterceptor('quotation', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.doc', '.docx', '.xls', '.xlsx'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) cb(null, true);
        else cb(new Error('Invalid file type. Allowed: PDF, images, Word, Excel.'), false);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload quotation bill file' })
  async uploadFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('No file uploaded');

    const uploadPath = './uploads/vendor-quotations';
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

    let filename: string;
    if (file.mimetype.startsWith('image/')) {
      filename = `quotation-${uniqueSuffix}.webp`;
      const webpBuffer = await compressImageToWebp(file.buffer);
      fs.writeFileSync(`${uploadPath}/${filename}`, webpBuffer);
    } else if (file.mimetype === 'application/pdf') {
      filename = `quotation-${uniqueSuffix}.pdf`;
      const compressed = await compressPdfBuffer(file.buffer);
      fs.writeFileSync(`${uploadPath}/${filename}`, compressed);
    } else {
      filename = `quotation-${uniqueSuffix}${extname(file.originalname)}`;
      fs.writeFileSync(`${uploadPath}/${filename}`, file.buffer);
    }

    return this.service.uploadFile(id, filename);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'List all vendor quotations' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Get single vendor quotation' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Update vendor quotation' })
  update(@Param('id') id: string, @Body() dto: UpdateVendorQuotationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Delete vendor quotation' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
