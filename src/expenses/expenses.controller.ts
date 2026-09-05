import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role, ExpenseCategory } from '../common/enums.js';
import { ExpensesService } from './expenses.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';

@ApiTags('Expenses')
@Controller({ path: 'expenses', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.SITE_ENGINEER, Role.OFFICE_STAFF)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/expenses';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `expense-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create expense' })
  create(
    @Body() dto: CreateExpenseDto,
    @Request() req: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.expensesService.create(dto, req.user.id, files);
  }

  @Get()
  @ApiOperation({ summary: 'List expenses' })
  @ApiQuery({ name: 'category', required: false, enum: ExpenseCategory })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({
    name: 'mine',
    required: false,
    description: 'Only the current user\'s own expenses (used by the personal "My Expense" page, regardless of role)',
  })
  findAll(
    @Query('category') category: ExpenseCategory,
    @Query('projectId') projectId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('mine') mine: string,
    @Request() req: any,
  ) {
    return this.expensesService.findAll(
      { category, projectId, dateFrom, dateTo, page, limit, mine: mine === 'true' },
      req.user,
    );
  }

  @Get('summary')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.PURCHASE_TEAM)
  @ApiOperation({ summary: 'Category-wise expense totals' })
  getSummary() {
    return this.expensesService.getSummary();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by id' })
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.SITE_ENGINEER, Role.OFFICE_STAFF)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/expenses';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `expense-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update expense' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateExpenseDto>,
    @Request() req: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.expensesService.update(id, dto, req.user, files);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTS_MANAGER, Role.SITE_ENGINEER, Role.OFFICE_STAFF)
  @ApiOperation({ summary: 'Delete expense' })
  remove(@Param('id') id: string) {
    return this.expensesService.softDelete(id);
  }
}
