import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
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
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { OfficeReportsService } from './office-reports.service.js';

@ApiTags('Office Reports')
@Controller({ path: 'office-reports', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class OfficeReportsController {
  constructor(private readonly reportsService: OfficeReportsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.OFFICE_STAFF)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/reports';
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
  @ApiOperation({ summary: 'Upload an office report' })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      category: string;
      title: string;
      description?: string;
      projectId?: string;
    },
    @Request() req: any,
  ) {
    if (!file) {
      throw new Error('File is required');
    }

    const fileUrl = `/uploads/reports/${file.filename}`;
    const fileKey = file.filename;

    return this.reportsService.create({
      category: body.category,
      title: body.title,
      description: body.description,
      projectId: body.projectId,
      fileUrl,
      fileKey,
      uploadedBy: req.user.id,
    });
  }

  @Get('categories')
  @ApiOperation({ summary: 'List report categories' })
  findCategories() {
    return this.reportsService.findCategories();
  }

  @Get()
  @ApiOperation({ summary: 'List office reports' })
  findAll() {
    return this.reportsService.findAll();
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.OFFICE_STAFF)
  @ApiOperation({ summary: 'Soft delete a report' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.reportsService.remove(id, req.user.id);
  }
}
