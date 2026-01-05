import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/db.module';
import { SessionsModule } from './sessions/sessions.module';
import { CharactersModule } from './characters/characters.module';
import { ActionsModule } from './actions/actions.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { NarratorModule } from './narrator/narrator.module';
import { WebSocketModule } from './websocket/websocket.module';
import { Dnd5eModule } from './dnd5e/dnd5e.module';
import { LocationsModule } from './locations/locations.module';
import { CustomClassesModule } from './custom-classes/custom-classes.module';
import { AuthMiddleware } from './common/middleware/auth.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    DatabaseModule,
    SessionsModule,
    CharactersModule,
    ActionsModule,
    CampaignsModule,
    NarratorModule,
    WebSocketModule,
    Dnd5eModule,
    LocationsModule,
    CustomClassesModule
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*');
  }
}

