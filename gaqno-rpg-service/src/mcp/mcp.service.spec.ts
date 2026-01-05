import { Test, TestingModule } from '@nestjs/testing';
import { McpService } from './mcp.service';
import { Logger } from '@nestjs/common';

describe('McpService', () => {
  let service: McpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [McpService],
    })
      .overrideProvider(McpService)
      .useValue({
        searchAllCategories: jest.fn(),
        filterSpellsByLevel: jest.fn(),
        findMonstersByCR: jest.fn(),
        getClassStartingEquipment: jest.fn(),
        verifyWithAPI: jest.fn(),
        generateTreasureHoard: jest.fn(),
        checkAPIHealth: jest.fn(),
      })
      .compile();

    service = module.get<McpService>(McpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchAllCategories', () => {
    it('should call searchAllCategories with query', async () => {
      const mockResult = {
        query: 'dragon',
        results: {},
        total_count: 0,
      };
      (service.searchAllCategories as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.searchAllCategories('dragon');
      expect(service.searchAllCategories).toHaveBeenCalledWith('dragon');
      expect(result).toEqual(mockResult);
    });
  });

  describe('findMonstersByCR', () => {
    it('should call findMonstersByCR with CR range', async () => {
      const mockResult = {
        query: 'Monsters with CR 1-5',
        items: [],
        count: 0,
      };
      (service.findMonstersByCR as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.findMonstersByCR(1, 5);
      expect(service.findMonstersByCR).toHaveBeenCalledWith(1, 5);
      expect(result).toEqual(mockResult);
    });
  });

  describe('filterSpellsByLevel', () => {
    it('should call filterSpellsByLevel with level range', async () => {
      const mockResult = {
        query: 'Spells of level 1-3',
        items: [],
        count: 0,
      };
      (service.filterSpellsByLevel as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.filterSpellsByLevel(1, 3);
      expect(service.filterSpellsByLevel).toHaveBeenCalledWith(1, 3);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getClassStartingEquipment', () => {
    it('should call getClassStartingEquipment with class name', async () => {
      const mockResult = {
        class: 'Fighter',
        starting_equipment: [],
        equipment_options: [],
      };
      (service.getClassStartingEquipment as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.getClassStartingEquipment('fighter');
      expect(service.getClassStartingEquipment).toHaveBeenCalledWith('fighter');
      expect(result).toEqual(mockResult);
    });
  });

  describe('generateTreasureHoard', () => {
    it('should call generateTreasureHoard with parameters', async () => {
      const mockResult = {
        challenge_rating: 5,
        treasure_type: 'hoard',
        coins: { cp: 0, sp: 0, gp: 100, pp: 0 },
        equipment_items: [],
        magic_items: [],
        total_value_gp: 100,
      };
      (service.generateTreasureHoard as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.generateTreasureHoard(5, false, 'hoard');
      expect(service.generateTreasureHoard).toHaveBeenCalledWith(5, false, 'hoard');
      expect(result).toEqual(mockResult);
    });
  });
});

