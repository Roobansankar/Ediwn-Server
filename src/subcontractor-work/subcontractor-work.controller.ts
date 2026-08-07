import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
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
import { SubcontractorWorkService } from './subcontractor-work.service.js';
import { CreateSubcontractorWorkDto } from './dto/create-subcontractor-work.dto.js';
import { UpdateSubcontractorWorkStatusDto } from './dto/update-subcontractor-work-status.dto.js';

@ApiTags('Subcontractor Work')
@Controller({ path: 'subcontractor-work', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class SubcontractorWorkController {
  constructor(private readonly service: SubcontractorWorkService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/subcontractor-work';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `sw-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit a subcontractor work entry' })
  create(
    @Body() dto: CreateSubcontractorWorkDto,
    @Request() req: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.service.create(dto, req.user.id, files);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SITE_ENGINEER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'List subcontractor work entries' })
  findAll(@Request() req: any) {
    return this.service.findAll(req.user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Update subcontractor work status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSubcontractorWorkStatusDto,
    @Request() req: any,
  ) {
    return this.service.updateStatus(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SITE_ENGINEER)
  @ApiOperation({ summary: 'Delete a subcontractor work entry' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user);
  }
}
