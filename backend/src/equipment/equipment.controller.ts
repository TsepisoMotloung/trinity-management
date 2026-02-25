import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import * as express from 'express';
import { EquipmentService } from './equipment.service';
import {
  CreateEquipmentCategoryDto,
  UpdateEquipmentCategoryDto,
  CreateEquipmentItemDto,
  UpdateEquipmentItemDto,
  UpdateEquipmentStatusDto,
  EquipmentStatus,
} from './dto/equipment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Equipment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  // ==================== CATEGORIES ====================

  @Post('categories')
  @ApiOperation({ summary: 'Create equipment category' })
  createCategory(@Body() dto: CreateEquipmentCategoryDto, @CurrentUser('id') userId: string, @Req() req: express.Request) {
    return this.equipmentService.createCategory(dto, userId, req.ip || req.socket.remoteAddress);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all equipment categories' })
  findAllCategories() {
    return this.equipmentService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get equipment category by ID' })
  findCategoryById(@Param('id') id: string) {
    return this.equipmentService.findCategoryById(id);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update equipment category' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateEquipmentCategoryDto, @CurrentUser('id') userId: string, @Req() req: express.Request) {
    return this.equipmentService.updateCategory(id, dto, userId, req.ip || req.socket.remoteAddress);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete equipment category' })
  deleteCategory(@Param('id') id: string, @CurrentUser('id') userId: string, @Req() req: express.Request) {
    return this.equipmentService.deleteCategory(id, userId, req.ip || req.socket.remoteAddress);
  }

  // ==================== EQUIPMENT ITEMS ====================

  @Post('items')
  @ApiOperation({ summary: 'Create equipment item (individual unit)' })
  createItem(@Body() dto: CreateEquipmentItemDto, @CurrentUser('id') userId: string, @Req() req: express.Request) {
    return this.equipmentService.createItem(dto, userId, req.ip || req.socket.remoteAddress);
  }

  @Get('items')
  @ApiOperation({ summary: 'Get all equipment items' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: EquipmentStatus })
  findAllItems(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: EquipmentStatus,
  ) {
    return this.equipmentService.findAllItems({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
      categoryId,
      status,
    });
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get equipment item by ID' })
  findItemById(@Param('id') id: string) {
    return this.equipmentService.findItemById(id);
  }

  @Get('lookup/barcode/:barcode')
  @ApiOperation({ summary: 'Find equipment by barcode' })
  findItemByBarcode(@Param('barcode') barcode: string) {
    return this.equipmentService.findItemByBarcode(barcode);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update equipment item' })
  updateItem(@Param('id') id: string, @Body() dto: UpdateEquipmentItemDto, @CurrentUser('id') userId: string, @Req() req: express.Request) {
    return this.equipmentService.updateItem(id, dto, userId, req.ip || req.socket.remoteAddress);
  }

  @Patch('items/:id/status')
  @ApiOperation({ summary: 'Update equipment status' })
  updateItemStatus(@Param('id') id: string, @Body() dto: UpdateEquipmentStatusDto, @CurrentUser('id') userId: string, @Req() req: express.Request) {
    return this.equipmentService.updateItemStatus(id, dto, userId, req.ip || req.socket.remoteAddress);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete equipment item' })
  deleteItem(@Param('id') id: string, @CurrentUser('id') userId: string, @Req() req: express.Request) {
    return this.equipmentService.deleteItem(id, userId, req.ip || req.socket.remoteAddress);
  }

  // ==================== AVAILABILITY & STATS ====================

  @Get('available')
  @ApiOperation({ summary: 'Get equipment available for a date range' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'excludeEventId', required: false, type: String })
  getAvailableItems(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('categoryId') categoryId?: string,
    @Query('excludeEventId') excludeEventId?: string,
  ) {
    return this.equipmentService.getAvailableItems(new Date(startDate), new Date(endDate), categoryId, excludeEventId);
  }

  @Post('availability')
  @ApiOperation({ summary: 'Check specific equipment availability' })
  checkAvailability(@Body() body: { equipmentIds: string[]; startDate: string; endDate: string; excludeEventId?: string }) {
    return this.equipmentService.checkAvailability(body.equipmentIds, new Date(body.startDate), new Date(body.endDate), body.excludeEventId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get equipment statistics' })
  getStatistics() {
    return this.equipmentService.getStatistics();
  }
}
