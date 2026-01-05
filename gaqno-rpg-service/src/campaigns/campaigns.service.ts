import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/db.service';
import { rpgCampaigns } from '../database/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { GenerateStepDto, CampaignStep } from './dto/generate-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { NarratorService } from '../narrator/narrator.service';
import { Dnd5eService } from '../dnd5e/dnd5e.service';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly narratorService: NarratorService,
    private readonly dnd5eService: Dnd5eService,
  ) {}

  async createCampaign(tenantId: string | null, userId: string, dto: CreateCampaignDto) {
    const [campaign] = await this.db.db
      .insert(rpgCampaigns)
      .values({
        tenantId: tenantId ?? null,
        userId,
        name: dto.name,
        description: dto.description || null,
        isPublic: dto.isPublic || false,
        status: 'draft',
      })
      .returning();

    return campaign;
  }

  async getCampaigns(tenantId: string | null, userId: string) {
    let query = this.db.db
      .select()
      .from(rpgCampaigns);

    if (tenantId) {
      query = query.where(eq(rpgCampaigns.tenantId, tenantId)) as typeof query;
    }

    const allCampaigns = await query.orderBy(rpgCampaigns.createdAt);

    // Filtrar campanhas públicas ou do usuário
    return allCampaigns.filter((campaign) => {
      return campaign.isPublic || campaign.userId === userId;
    });
  }

  async getPublicCampaigns() {
    const campaigns = await this.db.db
      .select()
      .from(rpgCampaigns)
      .where(eq(rpgCampaigns.status, 'active'))
      .orderBy(rpgCampaigns.createdAt);

    // Filtrar campanhas públicas
    return campaigns.filter((campaign) => campaign.isPublic);
  }

  async getUserCampaigns(userId: string) {
    return this.db.db
      .select()
      .from(rpgCampaigns)
      .where(eq(rpgCampaigns.userId, userId))
      .orderBy(rpgCampaigns.createdAt);
  }

  async getCampaignById(id: string, userId: string) {
    const [campaign] = await this.db.db
      .select()
      .from(rpgCampaigns)
      .where(eq(rpgCampaigns.id, id))
      .limit(1);

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (!campaign.isPublic && campaign.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return campaign;
  }

  async updateCampaign(id: string, userId: string, dto: UpdateCampaignDto) {
    const campaign = await this.getCampaignById(id, userId);

    if (campaign.userId !== userId) {
      throw new ForbiddenException('Only the owner can update this campaign');
    }

    const [updated] = await this.db.db
      .update(rpgCampaigns)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(rpgCampaigns.id, id))
      .returning();

    return updated;
  }

  async generateStep(id: string, userId: string, dto: GenerateStepDto) {
    const campaign = await this.getCampaignById(id, userId);

    if (campaign.userId !== userId) {
      throw new ForbiddenException('Only the owner can generate steps');
    }

    const seed = dto.seed || Math.random().toString(36).substring(7);
    
    let enhancedContext = { ...(dto.context || {}) };
    
    if (dto.step === CampaignStep.NPCS) {
      const monsters = await this.dnd5eService.findMonstersByCR(0, 10);
      enhancedContext.mcpMonsters = monsters.items.slice(0, 10);
    } else if (dto.step === CampaignStep.WORLD) {
      const locations = await this.dnd5eService.searchAllCategories('location dungeon city');
      enhancedContext.mcpLocations = locations.top_results?.slice(0, 5) || [];
    } else if (dto.step === CampaignStep.HOOKS) {
      const treasure = await this.dnd5eService.generateTreasureHoard(5, false, 'hoard');
      enhancedContext.mcpTreasure = treasure;
    }

    const generatedContent = await this.narratorService.generateCampaignStep(
      dto.step,
      enhancedContext,
      dto.existingContent || {},
      seed,
    );

    const updateField = this.getStepField(dto.step);
    const [updated] = await this.db.db
      .update(rpgCampaigns)
      .set({
        [updateField]: generatedContent,
        updatedAt: new Date(),
      })
      .where(eq(rpgCampaigns.id, id))
      .returning();

    return {
      step: dto.step,
      content: generatedContent,
      campaign: updated,
    };
  }

  async generateStepVariants(id: string, userId: string, dto: GenerateStepDto) {
    const campaign = await this.getCampaignById(id, userId);

    if (campaign.userId !== userId) {
      throw new ForbiddenException('Only the owner can generate step variants');
    }

    const variants = await Promise.all([
      this.narratorService.generateCampaignStep(
        dto.step,
        dto.context || {},
        dto.existingContent || {},
        Math.random().toString(36).substring(7),
      ),
      this.narratorService.generateCampaignStep(
        dto.step,
        dto.context || {},
        dto.existingContent || {},
        Math.random().toString(36).substring(7),
      ),
      this.narratorService.generateCampaignStep(
        dto.step,
        dto.context || {},
        dto.existingContent || {},
        Math.random().toString(36).substring(7),
      ),
    ]);

    return {
      step: dto.step,
      variants,
    };
  }

  async regenerateStep(id: string, userId: string, dto: GenerateStepDto) {
    const campaign = await this.getCampaignById(id, userId);

    if (campaign.userId !== userId) {
      throw new ForbiddenException('Only the owner can regenerate steps');
    }

    const seed = Math.random().toString(36).substring(7);
    const generatedContent = await this.narratorService.generateCampaignStep(
      dto.step,
      dto.context || {},
      dto.existingContent || {},
      seed,
    );

    return {
      step: dto.step,
      content: generatedContent,
      seed,
    };
  }

  async updateStep(id: string, userId: string, dto: UpdateStepDto) {
    const campaign = await this.getCampaignById(id, userId);

    if (campaign.userId !== userId) {
      throw new ForbiddenException('Only the owner can update steps');
    }

    const updateField = this.getStepField(dto.step);
    const [updated] = await this.db.db
      .update(rpgCampaigns)
      .set({
        [updateField]: dto.content,
        updatedAt: new Date(),
      })
      .where(eq(rpgCampaigns.id, id))
      .returning();

    return updated;
  }

  async finalizeCampaign(id: string, userId: string) {
    const campaign = await this.getCampaignById(id, userId);

    if (campaign.userId !== userId) {
      throw new ForbiddenException('Only the owner can finalize this campaign');
    }

    if (!campaign.concept || !campaign.world || !campaign.initialNarrative) {
      throw new Error('Campaign must have concept, world, and initial narrative to be finalized');
    }

    const [finalized] = await this.db.db
      .update(rpgCampaigns)
      .set({
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(rpgCampaigns.id, id))
      .returning();

    return finalized;
  }

  async deleteCampaign(id: string, userId: string) {
    const campaign = await this.getCampaignById(id, userId);

    if (campaign.userId !== userId) {
      throw new ForbiddenException('Only the owner can delete this campaign');
    }

    await this.db.db.delete(rpgCampaigns).where(eq(rpgCampaigns.id, id));
  }

  private getStepField(step: CampaignStep): string {
    const fieldMap: Record<CampaignStep, string> = {
      [CampaignStep.CONCEPT]: 'concept',
      [CampaignStep.WORLD]: 'world',
      [CampaignStep.NARRATIVE]: 'initialNarrative',
      [CampaignStep.NPCS]: 'npcs',
      [CampaignStep.HOOKS]: 'hooks',
    };
    return fieldMap[step];
  }
}

