import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { EventStoreModule } from './event-store/event-store.module';
import { TasksModule } from './tasks/tasks.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }) as never,
    DatabaseModule,
    EventStoreModule,
    TasksModule,
    BillingModule,
  ],
})
export class AppModule {}
