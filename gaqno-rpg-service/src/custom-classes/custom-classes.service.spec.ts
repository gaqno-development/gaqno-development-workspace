import { Test, TestingModule } from '@nestjs/testing';
import { CustomClassesService } from './custom-classes.service';
import { DatabaseService } from '../database/db.service';
import { McpService } from '../mcp/mcp.service';
import { NarratorService } from '../narrator/narrator.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('CustomClassesService', () => {
  let service: CustomClassesService;
  let dbService: jest.Mocked<DatabaseService>;
  let mcpService: jest.Mocked<McpService>;
  let narratorService: jest.Mocked<NarratorService>;

  const mockCampaign = {
    id: 'campaign-1',
    userId: 'user-1',
    name: 'Test Campaign',
    isPublic: false,
  };

  const mockCustomClass = {
    id: 'class-1',
    campaignId: 'campaign-1',
    name: 'Custom Fighter',
    description: 'A custom fighter variant',
    baseClass: 'fighter',
    features: {},
    hitDie: 10,
    proficiencies: {},
    spellcasting: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockDbService = {
      db: {
        insert: jest.fn(() => ({
          values: jest.fn(() => ({
            returning: jest.fn().mockResolvedValue([mockCustomClass]),
          })),
        })),
        select: jest.fn(() => ({
          from: jest.fn(() => ({
            where: jest.fn(() => ({
              orderBy: jest.fn().mockResolvedValue([mockCustomClass]),
              limit: jest.fn().mockResolvedValue([mockCustomClass, mockCampaign]),
            })),
          })),
        })),
        update: jest.fn(() => ({
          set: jest.fn(() => ({
            where: jest.fn(() => ({
              returning: jest.fn().mockResolvedValue([mockCustomClass]),
            })),
          })),
        })),
        delete: jest.fn(() => ({
          where: jest.fn().mockResolvedValue(undefined),
        })),
      },
    };

    const mockMcpService = {
      getClassStartingEquipment: jest.fn(),
      searchAllCategories: jest.fn(),
      filterSpellsByLevel: jest.fn(),
    };

    const mockNarratorService = {
      generateCampaignStep: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomClassesService,
        { provide: DatabaseService, useValue: mockDbService },
        { provide: McpService, useValue: mockMcpService },
        { provide: NarratorService, useValue: mockNarratorService },
      ],
    }).compile();

    service = module.get<CustomClassesService>(CustomClassesService);
    dbService = module.get(DatabaseService);
    mcpService = module.get(McpService);
    narratorService = module.get(NarratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCustomClass', () => {
    it('should create a custom class', async () => {
      const mockSelect = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([mockCampaign]),
          })),
        })),
      };
      (dbService.db.select as jest.Mock).mockReturnValueOnce(mockSelect);

      const dto = {
        name: 'Custom Wizard',
        description: 'A custom wizard',
        baseClass: 'wizard',
      };

      const result = await service.createCustomClass('campaign-1', 'user-1', dto);
      expect(result).toBeDefined();
      expect(dbService.db.insert).toHaveBeenCalled();
    });
  });

  describe('getCustomClassesByCampaign', () => {
    it('should return custom classes for a campaign', async () => {
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
            orderBy: jest.fn().mockResolvedValue([mockCustomClass]),
          })),
        })),
      };
      (dbService.db.select as jest.Mock)
        .mockReturnValueOnce(mockSelect1)
        .mockReturnValueOnce(mockSelect2);

      const result = await service.getCustomClassesByCampaign('campaign-1', 'user-1');
      expect(result).toEqual([mockCustomClass]);
    });
  });

  describe('getCustomClassById', () => {
    it('should return a custom class by id', async () => {
      const mockSelect1 = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([mockCustomClass]),
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

      const result = await service.getCustomClassById('class-1', 'user-1');
      expect(result).toEqual(mockCustomClass);
    });

    it('should throw NotFoundException if class not found', async () => {
      const mockSelect = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([]),
          })),
        })),
      };
      (dbService.db.select as jest.Mock).mockReturnValueOnce(mockSelect);

      await expect(
        service.getCustomClassById('invalid-id', 'user-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateCustomClass', () => {
    it('should generate a custom class using MCP', async () => {
      const mockSelect = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([mockCampaign]),
          })),
        })),
      };
      (dbService.db.select as jest.Mock).mockReturnValueOnce(mockSelect);
      
      mcpService.getClassStartingEquipment.mockResolvedValue({
        class: 'Fighter',
        starting_equipment: [],
        equipment_options: [],
      });
      mcpService.searchAllCategories.mockResolvedValue({
        query: 'fighter',
        results: { classes: { items: [{ name: 'Fighter', index: 'fighter' }], count: 1 } },
        total_count: 1,
        top_results: [{ category: 'classes', name: 'Fighter', index: 'fighter', score: 100 }],
      });
      narratorService.generateCampaignStep.mockResolvedValue({
        description: 'A custom fighter variant',
      });

      const dto = {
        baseClass: 'fighter',
        theme: 'Knight',
      };

      const result = await service.generateCustomClass('campaign-1', 'user-1', dto);
      expect(result).toBeDefined();
      expect(mcpService.getClassStartingEquipment).toHaveBeenCalledWith('fighter');
      expect(mcpService.searchAllCategories).toHaveBeenCalled();
    });
  });

  describe('getClassSpells', () => {
    it('should return spells for a class using MCP', async () => {
      const mockSelect1 = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([mockCustomClass]),
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

      mcpService.filterSpellsByLevel.mockResolvedValue({
        query: 'Spells level 0-5',
        items: [],
        count: 0,
      });

      const result = await service.getClassSpells('class-1', 5, 'user-1');
      expect(result).toBeDefined();
      expect(mcpService.filterSpellsByLevel).toHaveBeenCalledWith(0, 5);
    });
  });
});

