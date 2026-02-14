import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    {
      provide: 'DB',
      useFactory: (config: ConfigService) => {
        const u = config.get<string>('DATABASE_URL');
        if (!u) throw new Error('DATABASE_URL required');
        return drizzle(new Pool({ connectionString: u }));
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DB'],
})
export class DatabaseModule {}
