import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/db.service';
import { rpgBibleEntities, rpgBibleLinks, rpgBibleVersions } from '../database/schema';
import { eq, and, or } from 'drizzle-orm';

export type EntityType = 'npc' | 'location' | 'item' | 'event' | 'organization' | 'concept';

interface CreateEntityDto {
  type: EntityType;
  name: string;
  description?: string;
  content: Record<string, any>;
}

interface CreateLinkDto {
  fromEntityId: string;
  toEntityId: string;
  relationship?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class BibleService {
  constructor(private readonly db: DatabaseService) {}

  async createEntity(campaignId: string, dto: CreateEntityDto) {
    const [entity] = await this.db.db
      .insert(rpgBibleEntities)
      .values({
        campaignId,
        type: dto.type,
        name: dto.name,
        description: dto.description || null,
        content: dto.content,
      })
      .returning();

    return entity;
  }

  async getEntity(id: string) {
    const [entity] = await this.db.db
      .select()
      .from(rpgBibleEntities)
      .where(eq(rpgBibleEntities.id, id))
      .limit(1);

    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    return entity;
  }

  async getEntitiesByCampaign(campaignId: string, type?: EntityType) {
    const conditions = [eq(rpgBibleEntities.campaignId, campaignId)];
    if (type) {
      conditions.push(eq(rpgBibleEntities.type, type));
    }

    return this.db.db
      .select()
      .from(rpgBibleEntities)
      .where(and(...conditions))
      .orderBy(rpgBibleEntities.name);
  }

  async updateEntity(id: string, dto: Partial<CreateEntityDto>) {
    const [updated] = await this.db.db
      .update(rpgBibleEntities)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(rpgBibleEntities.id, id))
      .returning();

    await this.createVersion(id, updated.content);

    return updated;
  }

  async createLink(dto: CreateLinkDto) {
    const [link] = await this.db.db
      .insert(rpgBibleLinks)
      .values({
        fromEntityId: dto.fromEntityId,
        toEntityId: dto.toEntityId,
        relationship: dto.relationship || null,
        metadata: dto.metadata || {},
      })
      .returning();

    return link;
  }

  async getEntityLinks(entityId: string) {
    const outgoing = await this.db.db
      .select()
      .from(rpgBibleLinks)
      .where(eq(rpgBibleLinks.fromEntityId, entityId));

    const incoming = await this.db.db
      .select()
      .from(rpgBibleLinks)
      .where(eq(rpgBibleLinks.toEntityId, entityId));

    return {
      outgoing,
      incoming,
    };
  }

  async searchEntities(campaignId: string, query: string) {
    const entities = await this.db.db
      .select()
      .from(rpgBibleEntities)
      .where(eq(rpgBibleEntities.campaignId, campaignId));

    return entities.filter(
      (entity) =>
        entity.name.toLowerCase().includes(query.toLowerCase()) ||
        entity.description?.toLowerCase().includes(query.toLowerCase())
    );
  }

  private async createVersion(entityId: string, content: Record<string, any>) {
    const [latestVersion] = await this.db.db
      .select()
      .from(rpgBibleVersions)
      .where(eq(rpgBibleVersions.entityId, entityId))
      .orderBy(rpgBibleVersions.version)
      .limit(1);

    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    await this.db.db.insert(rpgBibleVersions).values({
      entityId,
      content,
      version: nextVersion,
    });
  }
}

