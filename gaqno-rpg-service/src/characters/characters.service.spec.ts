import { Test, TestingModule } from '@nestjs/testing';
import { CharactersService } from './characters.service';
import { DatabaseService } from '../database/db.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { NotFoundException } from '@nestjs/common';

describe('CharactersService', () => {
  let service: CharactersService;
  let dbService: DatabaseService;

  const mockSession = {
    id: 'test-session-id',
    userId: 'test-user-id',
    name: 'Test Session',
  };

  const mockCharacter = {
    id: 'test-character-id',
    sessionId: 'test-session-id',
    playerId: 'test-user-id',
    name: 'Test Character',
    attributes: { strength: 10, dexterity: 12 },
    resources: { hp: 100, mana: 50 },
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMockSelectChain = (result: any) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
  });

  const mockDbService = {
    db: {
      select: jest.fn().mockImplementation(() => createMockSelectChain([mockSession])),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([mockSession]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([mockCharacter]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharactersService,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<CharactersService>(CharactersService);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCharacter', () => {
    const validDto: CreateCharacterDto = {
      sessionId: 'test-session-id',
      name: 'Test Character',
      attributes: { strength: 10 },
      resources: { hp: 100 },
    };

    const tenantId = 'test-tenant-id';
    const userId = 'test-user-id';

    it('should create a character successfully', async () => {
      mockDbService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([mockSession]),
      });

      const result = await service.createCharacter(tenantId, userId, validDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-character-id');
      expect(result.name).toBe('Test Character');
      expect(mockDbService.db.insert).toHaveBeenCalled();
    });

    it('should throw NotFoundException if session not found', async () => {
      mockDbService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([]),
      });

      await expect(
        service.createCharacter(tenantId, userId, validDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if session userId does not match', async () => {
      mockDbService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([{
          ...mockSession,
          userId: 'different-user-id',
        }]),
      });

      await expect(
        service.createCharacter(tenantId, userId, validDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCharactersBySession', () => {
    const sessionId = 'test-session-id';
    const userId = 'test-user-id';

    it('should return characters for session', async () => {
      mockDbService.db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockSession]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValueOnce([mockCharacter]),
        });

      const result = await service.getCharactersBySession(sessionId, userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw NotFoundException if session not found', async () => {
      mockDbService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([]),
      });

      await expect(
        service.getCharactersBySession('non-existent', userId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCharacterById', () => {
    const characterId = 'test-character-id';
    const userId = 'test-user-id';

    it('should return character by id', async () => {
      mockDbService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([mockCharacter]),
      });

      const result = await service.getCharacterById(characterId, userId);

      expect(result).toBeDefined();
      expect(result.id).toBe(characterId);
    });

    it('should throw NotFoundException if character not found', async () => {
      mockDbService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([]),
      });

      await expect(
        service.getCharacterById('non-existent', userId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCharacter', () => {
    const characterId = 'test-character-id';
    const userId = 'test-user-id';

    it('should update character successfully', async () => {
      mockDbService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([mockCharacter]),
      });

      const updatedCharacter = { ...mockCharacter, name: 'Updated Character' };
      mockDbService.db.update.mockReturnValueOnce({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([updatedCharacter]),
      });

      const result = await service.updateCharacter(characterId, userId, {
        name: 'Updated Character',
      });

      expect(result).toBeDefined();
      expect(mockDbService.db.update).toHaveBeenCalled();
    });
  });

  describe('deleteCharacter', () => {
    const characterId = 'test-character-id';
    const userId = 'test-user-id';

    it('should delete character successfully', async () => {
      mockDbService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([mockCharacter]),
      });

      mockDbService.db.delete.mockReturnValueOnce({
        where: jest.fn().mockResolvedValueOnce(undefined),
      });

      const result = await service.deleteCharacter(characterId, userId);

      expect(result.success).toBe(true);
      expect(mockDbService.db.delete).toHaveBeenCalled();
    });
  });
});

