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
        const connectionString = config.get<string>('DATABASE_URL');
        if (!connectionString) throw new Error('DATABASE_URL required');
        const pool = new Pool({ connectionString });
        return drizzle(pool);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DB'],
})
export class DatabaseModule {}
