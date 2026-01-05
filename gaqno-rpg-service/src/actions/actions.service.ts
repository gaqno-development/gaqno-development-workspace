import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/db.service';
import { NarratorService } from '../narrator/narrator.service';
import { ImageService } from '../narrator/image.service';
import { rpgActions, rpgSessions, rpgCharacters, rpgHistory, rpgMemory, rpgImages } from '../database/schema';
import { SubmitActionDto } from './dto/submit-action.dto';
import { eq, and, asc } from 'drizzle-orm';

@Injectable()
export class ActionsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly narratorService: NarratorService,
    private readonly imageService: ImageService
  ) {}

  async submitAction(tenantId: string | null, userId: string, dto: SubmitActionDto) {
    const [session] = await this.db.db
      .select()
      .from(rpgSessions)
      .where(eq(rpgSessions.id, dto.sessionId))
      .limit(1);

    if (!session) {
      throw new NotFoundException('Session not found or access denied');
    }

    let character = null;
    if (dto.characterId) {
      const [char] = await this.db.db
        .select()
        .from(rpgCharacters)
        .where(
          and(
            eq(rpgCharacters.id, dto.characterId),
            eq(rpgCharacters.sessionId, dto.sessionId)
          )
        )
        .limit(1);
      character = char;
    }

    const sessionMemory = await this.db.db
      .select()
      .from(rpgMemory)
      .where(eq(rpgMemory.sessionId, dto.sessionId));

    const memoryMap: Record<string, string> = {};
    sessionMemory.forEach(m => {
      memoryMap[m.key] = m.value;
    });

    // Melhorar contexto com informações adicionais
    const enhancedContext = {
      ...dto.context,
      // Adicionar informações de localização da memória se disponível
      location: dto.context?.location || memoryMap['current_location'] || undefined,
      // Adicionar informações de NPCs se disponível
      npc: dto.context?.npc || memoryMap['current_npc'] || undefined,
    };

    const narrateDto = {
      player_id: userId,
      action: dto.action,
      dice: {
        formula: dto.dice.formula,
        roll: typeof dto.dice.roll === 'string' ? parseInt(dto.dice.roll) : dto.dice.roll,
        natural: typeof dto.dice.natural === 'string' ? parseInt(dto.dice.natural) : dto.dice.natural,
        target: dto.dice.target
      },
      context: enhancedContext,
      character_sheet: character ? {
        attributes: character.attributes,
        resources: character.resources
      } : undefined,
      session_memory: memoryMap
    };

    const narratorResponse = await this.narratorService.narrateAction(narrateDto, dto.sessionId);

    const [action] = await this.db.db
      .insert(rpgActions)
      .values({
        sessionId: dto.sessionId,
        characterId: dto.characterId || null,
        action: dto.action,
        dice: dto.dice as any,
        outcome: narratorResponse.outcome,
        narrative: narratorResponse as any,
        mechanics: narratorResponse.mechanics as any
      })
      .returning();

    if (narratorResponse.updated_character_sheet && character) {
      await this.db.db
        .update(rpgCharacters)
        .set({
          attributes: narratorResponse.updated_character_sheet.attributes || character.attributes,
          resources: narratorResponse.updated_character_sheet.resources || character.resources,
          updatedAt: new Date()
        })
        .where(eq(rpgCharacters.id, character.id));
    }

    if (narratorResponse.memory_updates) {
      for (const update of narratorResponse.memory_updates) {
        if (update.replace) {
          await this.db.db
            .delete(rpgMemory)
            .where(
              and(
                eq(rpgMemory.sessionId, dto.sessionId),
                eq(rpgMemory.key, update.key)
              )
            );
        }
        await this.db.db
          .insert(rpgMemory)
          .values({
            sessionId: dto.sessionId,
            key: update.key,
            value: update.value,
            type: 'general'
          });
      }
    }

    if (narratorResponse.history_entry) {
      await this.db.db
        .insert(rpgHistory)
        .values({
          sessionId: dto.sessionId,
          summary: narratorResponse.history_entry.summary,
          timestamp: new Date(narratorResponse.history_entry.timestamp),
          metadata: {}
        });
    }

    if (narratorResponse.image_prompts && narratorResponse.image_prompts.length > 0) {
      for (const prompt of narratorResponse.image_prompts) {
        try {
          const imageResult = await this.imageService.generateImage({
            prompt: prompt.prompt,
            style: prompt.style,
            aspect_ratio: prompt.aspect_ratio,
            negative_tags: prompt.negative_tags
          });

          await this.db.db
            .insert(rpgImages)
            .values({
              sessionId: dto.sessionId,
              promptId: prompt.id,
              imageUrl: imageResult.imageUrl,
              metadata: imageResult.metadata as any
            });
        } catch (error) {
          console.error('Error generating image:', error);
        }
      }
    }

    return {
      action,
      narratorResponse
    };
  }

  async getSessionHistory(sessionId: string, userId: string) {
    const [session] = await this.db.db
      .select()
      .from(rpgSessions)
      .where(eq(rpgSessions.id, sessionId))
      .limit(1);

    if (!session) {
      throw new NotFoundException('Session not found or access denied');
    }

    return this.db.db
      .select()
      .from(rpgHistory)
      .where(eq(rpgHistory.sessionId, sessionId))
      .orderBy(rpgHistory.timestamp);
  }

  async getSessionMemory(sessionId: string, userId: string) {
    const [session] = await this.db.db
      .select()
      .from(rpgSessions)
      .where(eq(rpgSessions.id, sessionId))
      .limit(1);

    if (!session) {
      throw new NotFoundException('Session not found or access denied');
    }

    return this.db.db
      .select()
      .from(rpgMemory)
      .where(eq(rpgMemory.sessionId, sessionId));
  }

  async getCanonicalMemory(campaignId: string) {
    return this.db.db
      .select()
      .from(rpgMemory)
      .where(and(eq(rpgMemory.campaignId, campaignId), eq(rpgMemory.type, 'canonical')));
  }

  async getImprovisedMemory(sessionId: string) {
    return this.db.db
      .select()
      .from(rpgMemory)
      .where(and(eq(rpgMemory.sessionId, sessionId), eq(rpgMemory.type, 'improvised')));
  }

  async getSessionActions(sessionId: string, userId: string) {
    const [session] = await this.db.db
      .select()
      .from(rpgSessions)
      .where(eq(rpgSessions.id, sessionId))
      .limit(1);

    if (!session) {
      throw new NotFoundException('Session not found or access denied');
    }

    return this.db.db
      .select()
      .from(rpgActions)
      .where(eq(rpgActions.sessionId, sessionId))
      .orderBy(asc(rpgActions.createdAt));
  }
}

