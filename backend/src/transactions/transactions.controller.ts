import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateCheckOutDto, CreateCheckInDto } from './dto/transactions.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('check-out')
  @ApiOperation({ summary: 'Check out equipment for an event' })
  checkOut(@Body() dto: CreateCheckOutDto, @CurrentUser('id') userId: string) {
    return this.transactionsService.createCheckOut(dto, userId);
  }

  @Post('check-in')
  @ApiOperation({ summary: 'Check in equipment after an event' })
  checkIn(@Body() dto: CreateCheckInDto, @CurrentUser('id') userId: string) {
    return this.transactionsService.createCheckIn(dto, userId);
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get all transactions for an event' })
  getEventTransactions(@Param('eventId') eventId: string) {
    return this.transactionsService.getEventTransactions(eventId);
  }

  @Get('equipment/:equipmentId/history')
  @ApiOperation({ summary: 'Get transaction history for equipment item' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  getEquipmentHistory(
    @Param('equipmentId') equipmentId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.transactionsService.getEquipmentTransactionHistory(
      equipmentId,
      {
        skip: skip ? parseInt(skip) : undefined,
        take: take ? parseInt(take) : undefined,
      },
    );
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get all pending check-ins' })
  getPendingCheckIns() {
    return this.transactionsService.getPendingCheckIns();
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get all overdue check-ins' })
  getOverdueCheckIns() {
    return this.transactionsService.getOverdueCheckIns();
  }
}
