import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../common/enums.js';
import { SubcontractWorkOrdersService } from './subcontract-work-orders.service.js';
import { CreateSubcontractWorkOrderDto } from './dto/create-subcontract-work-order.dto.js';
import {
  UpdateSubcontractWorkOrderDto,
  UpdateSubcontractWorkOrderStatusDto,
} from './dto/update-subcontract-work-order.dto.js';

@ApiTags('Subcontract Work Orders')
@Controller({ path: 'subcontract-work-orders', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class SubcontractWorkOrdersController {
  constructor(
    private readonly subcontractWorkOrdersService: SubcontractWorkOrdersService,
  ) {}

  @Post('upload')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @UseInterceptors(
    FileInterceptor('workorder', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/subcontract-work-orders';
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
            `workorder-${uniqueSuffix}${extname(file.originalname)}`,
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
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only PDF and Excel files are allowed.'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a work order file' })
  uploadWorkOrder(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('File is required');
    }
    return {
      workorderUrl: `/uploads/subcontract-work-orders/${file.filename}`,
      workorderKey: file.filename,
    };
  }

  @Post()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Create a new subcontract work order' })
  create(@Body() dto: CreateSubcontractWorkOrderDto) {
    return this.subcontractWorkOrdersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all subcontract work orders' })
  @ApiQuery({ name: 'subcontractorId', required: false })
  findAll(@Query('subcontractorId') subcontractorId?: string) {
    return this.subcontractWorkOrdersService.findAll(subcontractorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subcontract work order by ID' })
  findOne(@Param('id') id: string) {
    return this.subcontractWorkOrdersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Update a subcontract work order' })
  update(@Param('id') id: string, @Body() dto: UpdateSubcontractWorkOrderDto) {
    return this.subcontractWorkOrdersService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Update a subcontract work order status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSubcontractWorkOrderStatusDto,
    @Request() req: any,
  ) {
    return this.subcontractWorkOrdersService.updateStatus(
      id,
      dto.status,
      req.user.role,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Delete a subcontract work order' })
  remove(@Param('id') id: string) {
    return this.subcontractWorkOrdersService.remove(id);
  }
}
