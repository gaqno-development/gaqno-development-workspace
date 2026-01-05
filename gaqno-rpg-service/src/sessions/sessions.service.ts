import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/db.service';
import { rpgSessions, rpgSessionMasters } from '../database/schema';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class SessionsService {
  constructor(private readonly db: DatabaseService) {}

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private async ensureUniqueRoomCode(): Promise<string> {
    let code = this.generateRoomCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await this.db.db
        .select()
        .from(rpgSessions)
        .where(eq(rpgSessions.roomCode, code))
        .limit(1);

      if (existing.length === 0) {
        return code;
      }

      code = this.generateRoomCode();
      attempts++;
    }

    throw new Error('Failed to generate unique room code');
  }

  async createSession(tenantId: string | null, userId: string, dto: CreateSessionDto) {
    const roomCode = await this.ensureUniqueRoomCode();

    // Garantir que campaignId seja null se não foi fornecido ou se for string vazia
    const campaignId = dto.campaignId && dto.campaignId.trim() !== '' ? dto.campaignId.trim() : null;

    const [session] = await this.db.db
      .insert(rpgSessions)
      .values({
        tenantId: tenantId ?? null,
        userId,
        campaignId,
        name: dto.name,
        description: dto.description || null,
        status: 'draft',
        roomCode
      })
      .returning();

    await this.db.db
      .insert(rpgSessionMasters)
      .values({
        sessionId: session.id,
        userId,
        isOriginalCreator: true
      });

    return session;
  }

  async getSessions(tenantId: string | null, userId: string) {
    const conditions = [eq(rpgSessions.userId, userId)];
    if (tenantId) {
      conditions.push(eq(rpgSessions.tenantId, tenantId));
    }

    return this.db.db
      .select()
      .from(rpgSessions)
      .where(and(...conditions))
      .orderBy(rpgSessions.createdAt);
  }

  async getSessionById(id: string, tenantId: string | null, userId: string | null) {
    const [session] = await this.db.db
      .select()
      .from(rpgSessions)
      .where(eq(rpgSessions.id, id))
      .limit(1);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async updateSession(tenantId: string | null, userId: string, id: string, dto: UpdateSessionDto) {
    await this.getSessionById(id, tenantId, userId);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status) updateData.status = dto.status;
    updateData.updatedAt = new Date();

    const [session] = await this.db.db
      .update(rpgSessions)
      .set(updateData)
      .where(
        and(
          eq(rpgSessions.id, id),
          eq(rpgSessions.userId, userId),
          tenantId ? eq(rpgSessions.tenantId, tenantId) : undefined
        )
      )
      .returning();

    return session;
  }

  async deleteSession(tenantId: string | null, userId: string, id: string) {
    await this.getSessionById(id, tenantId, userId);

    await this.db.db
      .delete(rpgSessions)
      .where(
        and(
          eq(rpgSessions.id, id),
          eq(rpgSessions.userId, userId),
          tenantId ? eq(rpgSessions.tenantId, tenantId) : undefined
        )
      );

    return { success: true };
  }

  async getSessionByCode(code: string) {
    const [session] = await this.db.db
      .select()
      .from(rpgSessions)
      .where(eq(rpgSessions.roomCode, code.toUpperCase()))
      .limit(1);

    if (!session) {
      throw new NotFoundException('Session not found with this code');
    }

    return session;
  }

  async isSessionMaster(sessionId: string, userId: string): Promise<boolean> {
    const [master] = await this.db.db
      .select()
      .from(rpgSessionMasters)
      .where(
        and(
          eq(rpgSessionMasters.sessionId, sessionId),
          eq(rpgSessionMasters.userId, userId)
        )
      )
      .limit(1);

    return !!master;
  }

  async isOriginalCreator(sessionId: string, userId: string): Promise<boolean> {
    const [master] = await this.db.db
      .select()
      .from(rpgSessionMasters)
      .where(
        and(
          eq(rpgSessionMasters.sessionId, sessionId),
          eq(rpgSessionMasters.userId, userId),
          eq(rpgSessionMasters.isOriginalCreator, true)
        )
      )
      .limit(1);

    return !!master;
  }

  async getSessionMasters(sessionId: string) {
    return this.db.db
      .select()
      .from(rpgSessionMasters)
      .where(eq(rpgSessionMasters.sessionId, sessionId));
  }

  async promoteToMaster(sessionId: string, creatorUserId: string, targetUserId: string, websocketGateway?: any) {
    const isCreator = await this.isOriginalCreator(sessionId, creatorUserId);
    if (!isCreator) {
      throw new ForbiddenException('Only the original creator can promote users to master');
    }

    const targetIsCreator = await this.isOriginalCreator(sessionId, targetUserId);
    if (targetIsCreator) {
      return await this.db.db
        .select()
        .from(rpgSessionMasters)
        .where(
          and(
            eq(rpgSessionMasters.sessionId, sessionId),
            eq(rpgSessionMasters.userId, targetUserId)
          )
        )
        .limit(1)
        .then(([master]) => master);
    }

    const existingMasters = await this.db.db
      .select()
      .from(rpgSessionMasters)
      .where(
        and(
          eq(rpgSessionMasters.sessionId, sessionId),
          eq(rpgSessionMasters.isOriginalCreator, false)
        )
      );

    const existingTarget = existingMasters.find(m => m.userId === targetUserId);

    if (existingTarget) {
      if (websocketGateway) {
        await websocketGateway.updateUserMode(sessionId, targetUserId, 'master');
      }
      return existingTarget;
    }

    for (const master of existingMasters) {
      await this.db.db
        .delete(rpgSessionMasters)
        .where(
          and(
            eq(rpgSessionMasters.sessionId, sessionId),
            eq(rpgSessionMasters.userId, master.userId),
            eq(rpgSessionMasters.isOriginalCreator, false)
          )
        );

      if (websocketGateway) {
        await websocketGateway.updateUserMode(sessionId, master.userId, 'player');
      }
    }

    const [newMaster] = await this.db.db
      .insert(rpgSessionMasters)
      .values({
        sessionId,
        userId: targetUserId,
        isOriginalCreator: false
      })
      .returning();

    if (websocketGateway) {
      await websocketGateway.updateUserMode(sessionId, targetUserId, 'master');
    }

    return newMaster;
  }

  async demoteFromMaster(sessionId: string, creatorUserId: string, targetUserId: string, websocketGateway?: any) {
    const isCreator = await this.isOriginalCreator(sessionId, creatorUserId);
    if (!isCreator) {
      throw new ForbiddenException('Only the original creator can demote masters');
    }

    const targetIsCreator = await this.isOriginalCreator(sessionId, targetUserId);
    if (targetIsCreator) {
      throw new ForbiddenException('Cannot demote the original creator');
    }

    await this.db.db
      .delete(rpgSessionMasters)
      .where(
        and(
          eq(rpgSessionMasters.sessionId, sessionId),
          eq(rpgSessionMasters.userId, targetUserId)
        )
      );

    if (websocketGateway) {
      await websocketGateway.updateUserMode(sessionId, targetUserId, 'player');
    }

    return { success: true };
  }

  async renounceMaster(sessionId: string, userId: string, websocketGateway?: any) {
    const isCreator = await this.isOriginalCreator(sessionId, userId);
    if (isCreator) {
      throw new ForbiddenException('Original creator cannot renounce master status. Promote another master first.');
    }

    await this.db.db
      .delete(rpgSessionMasters)
      .where(
        and(
          eq(rpgSessionMasters.sessionId, sessionId),
          eq(rpgSessionMasters.userId, userId)
        )
      );

    if (websocketGateway) {
      await websocketGateway.updateUserMode(sessionId, userId, 'player');
    }

    return { success: true };
  }
}

