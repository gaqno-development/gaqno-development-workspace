import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { AllocateCreditsHandler } from './allocate-credits.handler';

@Module({
  controllers: [BillingController],
  providers: [AllocateCreditsHandler],
})
export class BillingModule {}
