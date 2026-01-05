import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/db.service';
import { rpgLocations, rpgCampaigns } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { GenerateLocationDto } from './dto/generate-location.dto';
import { GenerateEncounterDto } from './dto/generate-encounter.dto';
import { Dnd5eService } from '../dnd5e/dnd5e.service';
import { NarratorService } from '../narrator/narrator.service';

@Injectable()
export class LocationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly dnd5eService: Dnd5eService,
    private readonly narratorService: NarratorService,
  ) {}

  async createLocation(campaignId: string, userId: string, dto: CreateLocationDto) {
    const campaign = await this.verifyCampaignAccess(campaignId, userId);
    
    const [location] = await this.db.db
      .insert(rpgLocations)
      .values({
        campaignId,
        name: dto.name,
        type: dto.type as any,
        description: dto.description || null,
        content: dto.content || {},
        metadata: dto.metadata || {},
        coordinates: dto.coordinates || null,
      })
      .returning();

    return location;
  }

  async getLocationsByCampaign(campaignId: string, userId: string) {
    await this.verifyCampaignAccess(campaignId, userId);
    
    return this.db.db
      .select()
      .from(rpgLocations)
      .where(eq(rpgLocations.campaignId, campaignId))
      .orderBy(rpgLocations.createdAt);
  }

  async getLocationById(id: string, userId: string) {
    const [location] = await this.db.db
      .select()
      .from(rpgLocations)
      .where(eq(rpgLocations.id, id))
      .limit(1);

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    await this.verifyCampaignAccess(location.campaignId, userId);
    return location;
  }

  async updateLocation(id: string, userId: string, dto: UpdateLocationDto) {
    const location = await this.getLocationById(id, userId);
    
    const [updated] = await this.db.db
      .update(rpgLocations)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(rpgLocations.id, id))
      .returning();

    return updated;
  }

  async deleteLocation(id: string, userId: string) {
    await this.getLocationById(id, userId);
    await this.db.db.delete(rpgLocations).where(eq(rpgLocations.id, id));
  }

  async generateLocation(campaignId: string, userId: string, dto: GenerateLocationDto) {
    const campaign = await this.verifyCampaignAccess(campaignId, userId);

    const searchQuery = dto.name || `${dto.type} location`;
    const mcpResults = await this.dnd5eService.searchAllCategories(searchQuery);

    const locationContext = {
      campaignName: campaign.name,
      campaignWorld: campaign.world,
      campaignConcept: campaign.concept,
      locationType: dto.type,
      mcpResults: mcpResults.top_results?.slice(0, 5) || [],
    };

    const generatedContent = await this.narratorService.generateCampaignStep(
      'world' as any,
      locationContext,
      {},
      Math.random().toString(36).substring(7),
    );

    const locationName = dto.name || generatedContent.name || `${dto.type} Location`;
    const description = generatedContent.description || generatedContent.geography || '';

    const [location] = await this.db.db
      .insert(rpgLocations)
      .values({
        campaignId,
        name: locationName,
        type: dto.type as any,
        description,
        content: {
          generated: true,
          mcpData: mcpResults.top_results?.slice(0, 3) || [],
          ...generatedContent,
        },
        metadata: {
          generated: true,
          generatedAt: new Date().toISOString(),
        },
      })
      .returning();

    return location;
  }

  async generateEncounter(locationId: string, userId: string, dto: GenerateEncounterDto) {
    const location = await this.getLocationById(locationId, userId);
    await this.verifyCampaignAccess(location.campaignId, userId);

    const targetCR = this.calculateTargetCR(dto.partyLevel, dto.difficulty);
    const minCR = Math.max(0, targetCR * 0.5);
    const maxCR = targetCR * 1.5;

    const monsters = await this.dnd5eService.findMonstersByCR(minCR, maxCR);

    const encounter = {
      locationId,
      locationName: location.name,
      partyLevel: dto.partyLevel,
      partySize: dto.partySize,
      difficulty: dto.difficulty,
      targetCR,
      monsters: monsters.items.slice(0, 5),
      environment: dto.environment || location.type,
    };

    if (location.content && typeof location.content === 'object') {
      const currentContent = location.content as Record<string, any>;
      const encounters = currentContent.encounters || [];
      encounters.push(encounter);
      
      await this.db.db
        .update(rpgLocations)
        .set({
          content: { ...currentContent, encounters },
          updatedAt: new Date(),
        })
        .where(eq(rpgLocations.id, locationId));
    }

    return encounter;
  }

  private calculateTargetCR(partyLevel: number, difficulty: string): number {
    const multipliers = {
      easy: 0.5,
      medium: 0.75,
      hard: 1.0,
      deadly: 1.5,
    };
    return partyLevel * (multipliers[difficulty] || 1.0);
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

