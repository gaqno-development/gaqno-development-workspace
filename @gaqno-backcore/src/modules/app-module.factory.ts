import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

export interface AppModuleOptions {
  envValidation: (config: Record<string, unknown>) => Record<string, unknown>;
  imports?: any[];
  modules?: any[];
}

export function createAppModule(options: AppModuleOptions): DynamicModule {
  const { envValidation, imports = [], modules = [] } = options;

  @Module({})
  class AppModuleFactory {}

  return {
    module: AppModuleFactory,
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        validate: envValidation,
        envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      }),
      ThrottlerModule.forRoot([
        {
          ttl: 60,
          limit: 120,
        },
      ]),
      ...imports,
      ...modules,
    ],
  };
}

