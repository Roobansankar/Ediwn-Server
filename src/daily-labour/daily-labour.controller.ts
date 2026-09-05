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
  UseInterceptors,
  Body,
  UploadedFiles,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
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
import { DailyLabourService } from './daily-labour.service.js';

@ApiTags('Daily Labour Entry (DPW)')
@Controller({ path: 'daily-labour', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class DailyLabourController {
  constructor(private readonly dailyLabourService: DailyLabourService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SITE_ENGINEER, Role.ACCOUNTS_MANAGER)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/dpw';
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
            `dpw-${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create Daily Labour Entry' })
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
    @Request() req: any,
  ) {
    // Parse workers array since it comes as a stringified JSON in multipart form data
    const workers = body.workers ? JSON.parse(body.workers) : [];

    return this.dailyLabourService.create(
      {
        projectId: body.projectId,
        reportDate: body.reportDate,
        remarks: body.remarks,
        workers: workers,
      },
      req.user.id,
      files,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all DPW reports' })
  @ApiQuery({ name: 'projectId', required: false })
  findAll(@Query('projectId') projectId: string, @Request() req: any) {
    return this.dailyLabourService.findAll(req.user, projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single DPW report' })
  findOne(@Param('id') id: string) {
    return this.dailyLabourService.findOne(id);
  }

  @Post(':id')
  @Roles(Role.ADMIN, Role.SITE_ENGINEER, Role.ACCOUNTS_MANAGER)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/dpw';
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
            `dpw-${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update Daily Labour Entry' })
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    const workers = body.workers ? JSON.parse(body.workers) : [];

    return this.dailyLabourService.update(
      id,
      {
        projectId: body.projectId,
        reportDate: body.reportDate,
        remarks: body.remarks,
        workers: workers,
      },
      files,
    );
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SITE_ENGINEER, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Update DPW report status' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.dailyLabourService.updateStatus(id, status);
  }

  @Patch(':reportId/workers/:workerId/status')
  @Roles(Role.ADMIN, Role.SITE_ENGINEER, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Update individual worker status' })
  updateWorkerStatus(
    @Param('reportId') reportId: string,
    @Param('workerId') workerId: string,
    @Body('status') status: string,
    @Body('remarks') remarks: string,
    @Request() req: any,
  ) {
    return this.dailyLabourService.updateWorkerStatus(
      reportId,
      workerId,
      status,
      remarks,
      req.user.id,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SITE_ENGINEER, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Delete DPW report' })
  remove(@Param('id') id: string) {
    return this.dailyLabourService.remove(id);
  }
}
