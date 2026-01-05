import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from './locations.service';
import { DatabaseService } from '../database/db.service';
import { McpService } from '../mcp/mcp.service';
import { NarratorService } from '../narrator/narrator.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { LocationType } from './dto/create-location.dto';

describe('LocationsService', () => {
  let service: LocationsService;
  let dbService: jest.Mocked<DatabaseService>;
  let mcpService: jest.Mocked<McpService>;
  let narratorService: jest.Mocked<NarratorService>;

  const mockCampaign = {
    id: 'campaign-1',
    userId: 'user-1',
    name: 'Test Campaign',
    isPublic: false,
    world: { name: 'Test World' },
    concept: { theme: 'Fantasy' },
  };

  const mockLocation = {
    id: 'location-1',
    campaignId: 'campaign-1',
    name: 'Test Location',
    type: LocationType.DUNGEON,
    description: 'A test dungeon',
    content: {},
    metadata: {},
    coordinates: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      limit: jest.fn().mockResolvedValue([mockLocation]),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([mockLocation]),
    };

    const mockDbService = {
      db: {
        insert: jest.fn(() => ({
          values: jest.fn(() => ({
            returning: jest.fn().mockResolvedValue([mockLocation]),
          })),
        })),
        select: jest.fn(() => ({
          from: jest.fn(() => ({
            where: jest.fn(() => ({
              orderBy: jest.fn().mockResolvedValue([mockLocation]),
              limit: jest.fn().mockResolvedValue([mockLocation, mockCampaign]),
            })),
          })),
        })),
        update: jest.fn(() => ({
          set: jest.fn(() => ({
            where: jest.fn(() => ({
              returning: jest.fn().mockResolvedValue([mockLocation]),
            })),
          })),
        })),
        delete: jest.fn(() => ({
          where: jest.fn().mockResolvedValue(undefined),
        })),
      },
    };

    const mockMcpService = {
      searchAllCategories: jest.fn(),
      findMonstersByCR: jest.fn(),
    };

    const mockNarratorService = {
      generateCampaignStep: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: DatabaseService, useValue: mockDbService },
        { provide: McpService, useValue: mockMcpService },
        { provide: NarratorService, useValue: mockNarratorService },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
    dbService = module.get(DatabaseService);
    mcpService = module.get(McpService);
    narratorService = module.get(NarratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLocation', () => {
    it('should create a location', async () => {
      const mockSelect = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([mockCampaign]),
          })),
        })),
      };
      (dbService.db.select as jest.Mock).mockReturnValueOnce(mockSelect);

      const dto = {
        name: 'New Location',
        type: LocationType.CITY,
        description: 'A new city',
      };

      const result = await service.createLocation('campaign-1', 'user-1', dto);
      expect(result).toBeDefined();
      expect(dbService.db.insert).toHaveBeenCalled();
    });

    it('should throw NotFoundException if campaign not found', async () => {
      const mockSelect = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([]),
          })),
        })),
      };
      (dbService.db.select as jest.Mock).mockReturnValueOnce(mockSelect);

      await expect(
        service.createLocation('invalid-campaign', 'user-1', {
          name: 'Test',
          type: LocationType.DUNGEON,
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLocationsByCampaign', () => {
    it('should return locations for a campaign', async () => {
      const mockSelect1 = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([mockCampaign]),
          })),
        })),
      };
      const mockSelect2 = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            orderBy: jest.fn().mockResolvedValue([mockLocation]),
          })),
        })),
      };
      (dbService.db.select as jest.Mock)
        .mockReturnValueOnce(mockSelect1)
        .mockReturnValueOnce(mockSelect2);

      const result = await service.getLocationsByCampaign('campaign-1', 'user-1');
      expect(result).toEqual([mockLocation]);
    });
  });

  describe('getLocationById', () => {
    it('should return a location by id', async () => {
      const mockSelect1 = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([mockLocation]),
          })),
        })),
      };
      const mockSelect2 = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([mockCampaign]),
          })),
        })),
      };
      (dbService.db.select as jest.Mock)
        .mockReturnValueOnce(mockSelect1)
        .mockReturnValueOnce(mockSelect2);

      const result = await service.getLocationById('location-1', 'user-1');
      expect(result).toEqual(mockLocation);
    });

    it('should throw NotFoundException if location not found', async () => {
      const mockSelect = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([]),
          })),
        })),
      };
      (dbService.db.select as jest.Mock).mockReturnValueOnce(mockSelect);

      await expect(
        service.getLocationById('invalid-id', 'user-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateLocation', () => {
    it('should generate a location using MCP', async () => {
      const mockSelect = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([mockCampaign]),
          })),
        })),
      };
      (dbService.db.select as jest.Mock)
        .mockReturnValueOnce(mockSelect)
        .mockReturnValueOnce(mockSelect);
      
      mcpService.searchAllCategories.mockResolvedValue({
        query: 'dungeon',
        results: {},
        total_count: 0,
        top_results: [],
      });
      narratorService.generateCampaignStep.mockResolvedValue({
        name: 'Generated Dungeon',
        description: 'A generated dungeon',
        geography: 'Underground',
      });

      const dto = {
        type: LocationType.DUNGEON,
      };

      const result = await service.generateLocation('campaign-1', 'user-1', dto);
      expect(result).toBeDefined();
      expect(mcpService.searchAllCategories).toHaveBeenCalled();
      expect(narratorService.generateCampaignStep).toHaveBeenCalled();
    });
  });

  describe('generateEncounter', () => {
    it('should generate an encounter using MCP', async () => {
      const mockLocationWithCampaign = { ...mockLocation, campaignId: 'campaign-1' };
      const mockSelect1 = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([mockLocationWithCampaign]),
          })),
        })),
      };
      const mockSelect2 = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([mockCampaign]),
          })),
        })),
      };
      const mockSelect3 = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([mockCampaign]),
          })),
        })),
      };
      (dbService.db.select as jest.Mock)
        .mockReturnValueOnce(mockSelect1)
        .mockReturnValueOnce(mockSelect2)
        .mockReturnValueOnce(mockSelect3);
      
      const mockUpdate = {
        set: jest.fn(() => ({
          where: jest.fn().mockResolvedValue(undefined),
        })),
      };
      (dbService.db.update as jest.Mock).mockReturnValueOnce(mockUpdate);

      mcpService.findMonstersByCR.mockResolvedValue({
        query: 'Monsters CR 1-5',
        items: [
          {
            name: 'Goblin',
            challenge_rating: 0.25,
            type: 'humanoid',
            size: 'Small',
            alignment: 'neutral evil',
            hit_points: 7,
            armor_class: 15,
            uri: 'resource://dnd/item/monsters/goblin',
          },
        ],
        count: 1,
      });

      const dto = {
        partyLevel: 3,
        partySize: 4,
        difficulty: 'medium' as const,
      };

      const result = await service.generateEncounter('location-1', 'user-1', dto);
      expect(result).toBeDefined();
      expect(result.monsters).toBeDefined();
      expect(mcpService.findMonstersByCR).toHaveBeenCalled();
    });
  });
});

