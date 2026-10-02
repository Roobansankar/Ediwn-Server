import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, UseInterceptors, UploadedFile, Request,
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
import { SubcontractorEnquiriesService } from './subcontractor-enquiries.service.js';
import { CreateSubcontractorEnquiryDto } from './dto/create-subcontractor-enquiry.dto.js';
import { UpdateSubcontractorEnquiryDto } from './dto/update-subcontractor-enquiry.dto.js';

@ApiTags('Subcontractor Enquiries')
@Controller({ path: 'subcontractor-enquiries', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class SubcontractorEnquiriesController {
  constructor(private readonly service: SubcontractorEnquiriesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Create a subcontractor enquiry (quote request)' })
  create(@Body() dto: CreateSubcontractorEnquiryDto, @Request() req: any) {
    return this.service.create(dto, req.user);
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
  @ApiOperation({ summary: 'Upload a quotation file for comparison' })
  async uploadFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('No file uploaded');

    const uploadPath = './uploads/subcontractor-enquiries';
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
  @ApiOperation({ summary: 'List all subcontractor enquiries' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Get single subcontractor enquiry' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Update subcontractor enquiry' })
  update(@Param('id') id: string, @Body() dto: UpdateSubcontractorEnquiryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Delete subcontractor enquiry' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
