import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/db.service';
import { rpgCharacters, rpgSessions } from '../database/schema';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class CharactersService {
  constructor(private readonly db: DatabaseService) {}

  async createCharacter(tenantId: string | null, userId: string, dto: CreateCharacterDto) {
    const session = await this.db.db
      .select()
      .from(rpgSessions)
      .where(eq(rpgSessions.id, dto.sessionId))
      .limit(1);

    if (!session.length || session[0].userId !== userId) {
      throw new NotFoundException('Session not found or access denied');
    }

    const [character] = await this.db.db
      .insert(rpgCharacters)
      .values({
        sessionId: dto.sessionId,
        playerId: userId,
        name: dto.name,
        attributes: dto.attributes || {},
        resources: dto.resources || {},
        metadata: dto.metadata || {}
      })
      .returning();

    return character;
  }

  async getCharactersBySession(sessionId: string, userId: string) {
    const session = await this.db.db
      .select()
      .from(rpgSessions)
      .where(eq(rpgSessions.id, sessionId))
      .limit(1);

    if (!session.length) {
      throw new NotFoundException('Session not found');
    }

    return this.db.db
      .select()
      .from(rpgCharacters)
      .where(eq(rpgCharacters.sessionId, sessionId));
  }

  async getCharacterById(id: string, userId: string) {
    const [character] = await this.db.db
      .select()
      .from(rpgCharacters)
      .where(eq(rpgCharacters.id, id))
      .limit(1);

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    return character;
  }

  async updateCharacter(id: string, userId: string, dto: UpdateCharacterDto) {
    const character = await this.getCharacterById(id, userId);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.attributes) updateData.attributes = dto.attributes;
    if (dto.resources) updateData.resources = dto.resources;
    if (dto.metadata) updateData.metadata = dto.metadata;
    updateData.updatedAt = new Date();

    const [updated] = await this.db.db
      .update(rpgCharacters)
      .set(updateData)
      .where(eq(rpgCharacters.id, id))
      .returning();

    return updated;
  }

  async deleteCharacter(id: string, userId: string) {
    await this.getCharacterById(id, userId);

    await this.db.db
      .delete(rpgCharacters)
      .where(eq(rpgCharacters.id, id));

    return { success: true };
  }
}

