import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Put,
  Patch,
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
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { MaterialReceivedService } from './material-received.service.js';
import { CreateMaterialReceivedDto } from './dto/create-material-received.dto.js';
import { UpdateMaterialReceivedStatusDto } from './dto/update-material-received-status.dto.js';

@ApiTags('Material Received')
@Controller({ path: 'material-received', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class MaterialReceivedController {
  constructor(private readonly service: MaterialReceivedService) {}

  @Post()
  @Roles(
    Role.ADMIN,
    Role.ACCOUNTS_MANAGER,
    Role.PURCHASE_TEAM,
    Role.SITE_ENGINEER,
  )
  @ApiOperation({ summary: 'Create a material received record' })
  create(@Body() dto: CreateMaterialReceivedDto, @Request() req: any) {
    return this.service.create(dto, req.user);
  }

  @Get()
  @Roles(
    Role.ADMIN,
    Role.ACCOUNTS_MANAGER,
    Role.PURCHASE_TEAM,
    Role.SITE_ENGINEER,
  )
  @ApiOperation({ summary: 'List material received records' })
  findAll(@Request() req: any) {
    return this.service.findAll(req.user);
  }

  @Get(':id')
  @Roles(
    Role.ADMIN,
    Role.ACCOUNTS_MANAGER,
    Role.PURCHASE_TEAM,
    Role.SITE_ENGINEER,
  )
  @ApiOperation({ summary: 'Get single material received record' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(
    Role.ADMIN,
    Role.ACCOUNTS_MANAGER,
    Role.PURCHASE_TEAM,
    Role.SITE_ENGINEER,
  )
  @ApiOperation({ summary: 'Update material received record' })
  update(
    @Param('id') id: string,
    @Body() dto: CreateMaterialReceivedDto,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user.id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Update material received status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialReceivedStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }

  @Post('upload')
  @Roles(
    Role.ADMIN,
    Role.ACCOUNTS_MANAGER,
    Role.PURCHASE_TEAM,
    Role.SITE_ENGINEER,
  )
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/material-received';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `material-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a material received photo or bill' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('File is required');
    return {
      fileUrl: `/uploads/material-received/${file.filename}`,
      fileKey: file.filename,
    };
  }

  @Delete(':id')
  @Roles(
    Role.ADMIN,
    Role.ACCOUNTS_MANAGER,
    Role.PURCHASE_TEAM,
    Role.SITE_ENGINEER,
  )
  @ApiOperation({ summary: 'Delete material received record' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
