import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AuthenticatedRequest } from '../types/request.types';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getTransactions(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const tenantId = req.user?.tenantId || null;
    const userId = req.user?.sub;
    return this.transactionsService.getTransactions(tenantId, userId, startDate, endDate);
  }

  @Get(':id')
  async getTransactionById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || null;
    const userId = req.user?.sub;
    return this.transactionsService.getTransactionById(tenantId, userId, id);
  }

  @Post()
  async createTransaction(@Req() req: AuthenticatedRequest, @Body() dto: CreateTransactionDto) {
    const tenantId = req.user?.tenantId || null;
    const userId = req.user?.sub;
    
    if (!userId) {
      throw new Error('Usuário não autenticado. É necessário estar logado para criar transações.');
    }
    
    try {
      const result = await this.transactionsService.createTransaction(tenantId, userId, dto);
      return result;
    } catch (error: any) {
      console.error('Error in createTransaction controller:', error);
      throw new Error(error.message || 'Erro ao criar transação. Verifique os dados e tente novamente.');
    }
  }

  @Patch(':id')
  async updateTransaction(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Omit<UpdateTransactionDto, 'id'>
  ) {
    const tenantId = req.user?.tenantId || null;
    const userId = req.user?.sub;
    return this.transactionsService.updateTransaction(tenantId, userId, { ...dto, id });
  }

  @Delete(':id')
  async deleteTransaction(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || null;
    const userId = req.user?.sub;
    return this.transactionsService.deleteTransaction(tenantId, userId, id);
  }
}

