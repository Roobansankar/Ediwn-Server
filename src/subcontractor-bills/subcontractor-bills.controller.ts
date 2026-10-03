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
import { SubcontractorBillsService } from './subcontractor-bills.service.js';
import { CreateSubcontractorBillDto } from './dto/create-subcontractor-bill.dto.js';

@ApiTags('Subcontractor Bills')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@Controller({ path: 'subcontractor-bills', version: '1' })
export class SubcontractorBillsController {
  constructor(private readonly service: SubcontractorBillsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Create subcontractor bill' })
  create(@Body() dto: CreateSubcontractorBillDto, @Request() req: any) {
    return this.service.create(dto, req.user);
  }

  @Post('upload')
  @Roles(Role.ADMIN, Role.PURCHASE_TEAM)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/subcontractor-bills';
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
  @ApiOperation({ summary: 'Upload a subcontractor bill file' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('File is required');
    return {
      fileUrl: `/uploads/subcontractor-bills/${file.filename}`,
      fileKey: file.filename,
    };
  }

  @Get()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'List subcontractor bills' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Get single subcontractor bill' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/trail')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Get the Work Order trail for a subcontractor bill' })
  getBillTrail(@Param('id') id: string) {
    return this.service.getBillTrail(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Update subcontractor bill status' })
  updateStatus(@Param('id') id: string, @Body('status') status: BillStatus) {
    return this.service.updateStatus(id, status);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Update subcontractor bill' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateSubcontractorBillDto>,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER)
  @ApiOperation({ summary: 'Delete subcontractor bill' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
