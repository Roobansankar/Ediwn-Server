import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { DprService } from './dpr.service.js';

@ApiTags('DPR')
@Controller({ path: 'dpr', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class DprController {
  constructor(private readonly dprService: DprService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SITE_ENGINEER, Role.OFFICE_STAFF)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/dpr';
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
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a DPR report' })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { projectId: string; reportDate: string },
    @Request() req: any,
  ) {
    if (!file) {
      throw new Error('File is required');
    }

    const fileUrl = `/uploads/dpr/${file.filename}`;
    const fileKey = file.filename;
    const fileType = file.mimetype;

    return this.dprService.create({
      projectId: body.projectId,
      reportDate: new Date(body.reportDate),
      fileUrl,
      fileKey,
      fileType,
      uploadedBy: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List DPR reports' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  findAll(
    @Query('projectId') projectId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Request() req: any,
  ) {
    return this.dprService.findAll(
      { projectId, dateFrom, dateTo, page, limit },
      req.user,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single DPR report' })
  findOne(@Param('id') id: string) {
    return this.dprService.findOne(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft delete DPR report (admin only)' })
  softDelete(@Param('id') id: string) {
    return this.dprService.softDelete(id);
  }
}
