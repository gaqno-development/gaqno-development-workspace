import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/db.service';
import { rpgCodexEntries } from '../database/schema';
import { eq, and, or } from 'drizzle-orm';

@Injectable()
export class CodexService {
  constructor(private readonly db: DatabaseService) {}

  async indexContent(
    campaignId: string | null,
    sessionId: string | null,
    content: string,
    metadata: Record<string, any> = {}
  ) {
    const [entry] = await this.db.db
      .insert(rpgCodexEntries)
      .values({
        campaignId: campaignId || null,
        sessionId: sessionId || null,
        content,
        metadata,
      })
      .returning();

    return entry;
  }

  async searchContent(
    campaignId: string | null,
    sessionId: string | null,
    query: string,
    limit: number = 10
  ) {
    const conditions = [];

    if (campaignId) {
      conditions.push(eq(rpgCodexEntries.campaignId, campaignId));
    }
    if (sessionId) {
      conditions.push(eq(rpgCodexEntries.sessionId, sessionId));
    }

    const results = await this.db.db
      .select()
      .from(rpgCodexEntries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit);

    return results.filter((entry) =>
      entry.content.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getContextForGeneration(
    campaignId: string | null,
    sessionId: string | null,
    limit: number = 5
  ) {
    const conditions = [];

    if (campaignId) {
      conditions.push(eq(rpgCodexEntries.campaignId, campaignId));
    }
    if (sessionId) {
      conditions.push(eq(rpgCodexEntries.sessionId, sessionId));
    }

    const results = await this.db.db
      .select()
      .from(rpgCodexEntries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(rpgCodexEntries.createdAt)
      .limit(limit);

    return results.map((entry) => entry.content).join('\n\n');
  }
}

