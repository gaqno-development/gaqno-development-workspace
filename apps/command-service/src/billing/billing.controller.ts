import { Body, Controller, Post } from '@nestjs/common';
import { AllocateCreditsHandler } from './allocate-credits.handler';

export class AllocateCreditsDto {
  orgId!: string;
  amount!: number;
}

@Controller('internal/billing')
export class BillingController {
  constructor(private readonly handler: AllocateCreditsHandler) {}

  @Post('allocate')
  async allocate(@Body() dto: AllocateCreditsDto) {
    return this.handler.execute(dto.orgId, dto.amount);
  }
}
