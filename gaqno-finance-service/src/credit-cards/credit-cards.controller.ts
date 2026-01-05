import { Controller, Get, Post, Patch, Delete, Body, Param, Req } from '@nestjs/common';
import { CreditCardsService } from './credit-cards.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { AuthenticatedRequest } from '../types/request.types';

@Controller('credit-cards')
export class CreditCardsController {
  constructor(private readonly creditCardsService: CreditCardsService) {}

  @Get()
  async getCreditCards(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId || null;
    const userId = req.user?.sub;
    return this.creditCardsService.getCreditCards(tenantId, userId);
  }

  @Get(':id')
  async getCreditCardById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || null;
    const userId = req.user?.sub;
    return this.creditCardsService.getCreditCardById(tenantId, userId, id);
  }

  @Post()
  async createCreditCard(@Req() req: AuthenticatedRequest, @Body() dto: CreateCreditCardDto) {
    const tenantId = req.user?.tenantId || null;
    const userId = req.user?.sub;
    return this.creditCardsService.createCreditCard(tenantId, userId, dto);
  }

  @Patch(':id')
  async updateCreditCard(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Omit<UpdateCreditCardDto, 'id'>
  ) {
    const tenantId = req.user?.tenantId || null;
    const userId = req.user?.sub;
    return this.creditCardsService.updateCreditCard(tenantId, userId, { ...dto, id });
  }

  @Delete(':id')
  async deleteCreditCard(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || null;
    const userId = req.user?.sub;
    return this.creditCardsService.deleteCreditCard(tenantId, userId, id);
  }
}

