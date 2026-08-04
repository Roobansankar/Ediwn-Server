import {
  Controller,
  Get,
  Post,
  Patch,
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
import { Role, DrawingCategory } from '../common/enums.js';
import { DrawingsService } from './drawings.service.js';

@ApiTags('Drawings')
@Controller({ path: 'drawings', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class DrawingsController {
  constructor(private readonly drawingsService: DrawingsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SITE_ENGINEER, Role.OFFICE_STAFF)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/drawings';
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
  @ApiOperation({ summary: 'Upload a drawing' })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      projectId: string;
      title: string;
      category: DrawingCategory;
      revision?: string;
    },
    @Request() req: any,
  ) {
    if (!file) {
      throw new Error('File is required');
    }

    const fileUrl = `/uploads/drawings/${file.filename}`;
    const fileKey = file.filename;

    return this.drawingsService.create({
      projectId: body.projectId,
      title: body.title,
      category: body.category,
      revision: body.revision || 'Rev A',
      fileUrl,
      fileKey,
      uploadedBy: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List drawings' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'category', required: false, enum: DrawingCategory })
  @ApiQuery({ name: 'revision', required: false })
  findAll(
    @Query('projectId') projectId: string,
    @Query('category') category: DrawingCategory,
    @Query('revision') revision: string,
    @Request() req: any,
  ) {
    return this.drawingsService.findAll(
      { projectId, category, revision },
      req.user,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get drawing metadata + download URL' })
  findOne(@Param('id') id: string) {
    return this.drawingsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SITE_ENGINEER, Role.OFFICE_STAFF)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/drawings';
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
  @ApiOperation({ summary: 'Update drawing metadata and optionally the file' })
  update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: { title?: string; category?: DrawingCategory; revision?: string },
  ) {
    const updateData: any = { ...body };
    if (file) {
      updateData.fileUrl = `/uploads/drawings/${file.filename}`;
      updateData.fileKey = file.filename;
    }
    return this.drawingsService.update(id, updateData);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft delete drawing (admin only)' })
  softDelete(@Param('id') id: string) {
    return this.drawingsService.softDelete(id);
  }
}
