import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/db.service';
import { rpgCustomClasses, rpgCampaigns } from '../database/schema';
import { eq } from 'drizzle-orm';
import { CreateCustomClassDto } from './dto/create-custom-class.dto';
import { UpdateCustomClassDto } from './dto/update-custom-class.dto';
import { GenerateCustomClassDto } from './dto/generate-custom-class.dto';
import { Dnd5eService } from '../dnd5e/dnd5e.service';
import { NarratorService } from '../narrator/narrator.service';

@Injectable()
export class CustomClassesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly dnd5eService: Dnd5eService,
    private readonly narratorService: NarratorService,
  ) {}

  async createCustomClass(campaignId: string, userId: string, dto: CreateCustomClassDto) {
    await this.verifyCampaignAccess(campaignId, userId);
    
    const [customClass] = await this.db.db
      .insert(rpgCustomClasses)
      .values({
        campaignId,
        name: dto.name,
        description: dto.description || null,
        baseClass: dto.baseClass || null,
        features: dto.features || {},
        hitDie: dto.hitDie || null,
        proficiencies: dto.proficiencies || {},
        spellcasting: dto.spellcasting || null,
      })
      .returning();

    return customClass;
  }

  async getCustomClassesByCampaign(campaignId: string, userId: string) {
    await this.verifyCampaignAccess(campaignId, userId);
    
    return this.db.db
      .select()
      .from(rpgCustomClasses)
      .where(eq(rpgCustomClasses.campaignId, campaignId))
      .orderBy(rpgCustomClasses.createdAt);
  }

  async getCustomClassById(id: string, userId: string) {
    const [customClass] = await this.db.db
      .select()
      .from(rpgCustomClasses)
      .where(eq(rpgCustomClasses.id, id))
      .limit(1);

    if (!customClass) {
      throw new NotFoundException('Custom class not found');
    }

    await this.verifyCampaignAccess(customClass.campaignId, userId);
    return customClass;
  }

  async updateCustomClass(id: string, userId: string, dto: UpdateCustomClassDto) {
    await this.getCustomClassById(id, userId);
    
    const [updated] = await this.db.db
      .update(rpgCustomClasses)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(rpgCustomClasses.id, id))
      .returning();

    return updated;
  }

  async deleteCustomClass(id: string, userId: string) {
    await this.getCustomClassById(id, userId);
    await this.db.db.delete(rpgCustomClasses).where(eq(rpgCustomClasses.id, id));
  }

  async generateCustomClass(campaignId: string, userId: string, dto: GenerateCustomClassDto) {
    const campaign = await this.verifyCampaignAccess(campaignId, userId);

    const startingEquipment = await this.dnd5eService.getClassStartingEquipment(dto.baseClass);
    
    const searchResults = await this.dnd5eService.searchAllCategories(dto.baseClass);
    const classData = searchResults.results.classes?.items?.[0] || searchResults.top_results?.find(r => r.category === 'classes');

    const context = {
      campaignName: campaign.name,
      baseClass: dto.baseClass,
      theme: dto.theme,
      startingEquipment,
      classData,
      modifications: dto.modifications || {},
    };

    const generatedContent = await this.narratorService.generateCampaignStep(
      'npcs' as any,
      context,
      {},
      Math.random().toString(36).substring(7),
    );

    const className = dto.name || `${dto.theme || 'Custom'} ${dto.baseClass}`;
    
    const [customClass] = await this.db.db
      .insert(rpgCustomClasses)
      .values({
        campaignId,
        name: className,
        description: generatedContent.description || `A custom ${dto.baseClass} variant`,
        baseClass: dto.baseClass,
        features: {
          generated: true,
          baseFeatures: classData || {},
          customFeatures: generatedContent,
          startingEquipment,
        },
        hitDie: 8,
        proficiencies: {},
        spellcasting: null,
        metadata: {
          generated: true,
          generatedAt: new Date().toISOString(),
        },
      } as any)
      .returning();

    return customClass;
  }

  async getClassSpells(classId: string, level: number, userId: string) {
    const customClass = await this.getCustomClassById(classId, userId);
    
    if (!customClass.baseClass) {
      return { items: [], count: 0 };
    }

    const spells = await this.dnd5eService.filterSpellsByLevel(0, level);
    return spells;
  }

  private async verifyCampaignAccess(campaignId: string, userId: string) {
    const [campaign] = await this.db.db
      .select()
      .from(rpgCampaigns)
      .where(eq(rpgCampaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (!campaign.isPublic && campaign.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return campaign;
  }
}

