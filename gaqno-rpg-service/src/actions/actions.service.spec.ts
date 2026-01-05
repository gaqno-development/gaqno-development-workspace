import { Test, TestingModule } from '@nestjs/testing';
import { ActionsService } from './actions.service';
import { DatabaseService } from '../database/db.service';
import { NarratorService } from '../narrator/narrator.service';
import { ImageService } from '../narrator/image.service';
import { SubmitActionDto } from './dto/submit-action.dto';
import { NotFoundException } from '@nestjs/common';

describe('ActionsService', () => {
  let service: ActionsService;
  let dbService: DatabaseService;
  let narratorService: NarratorService;
  let imageService: ImageService;

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
    attributes: { strength: 10 },
    resources: { hp: 100 },
  };

  const mockNarratorResponse = {
    outcome: 'success',
    dice: { roll: 18, formula: '1d20+3', natural: 18 },
    narratives: [{ level: 'success', text: 'Success!' }],
    mechanics: { xp_gain: 10 },
    updated_character_sheet: {
      id: 'test-character-id',
      attributes: { strength: 12 },
      resources: { hp: 95 },
    },
    memory_updates: [
      { key: 'test_key', value: 'test_value', replace: true },
    ],
    history_entry: {
      summary: 'Action completed',
      timestamp: new Date().toISOString(),
    },
    image_prompts: [
      {
        id: 'prompt-1',
        prompt: 'Test prompt',
        style: 'realistic',
        aspect_ratio: '16:9',
        negative_tags: [],
      },
    ],
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
      returning: jest.fn().mockResolvedValue([{
        id: 'test-action-id',
        sessionId: 'test-session-id',
        action: 'Test action',
        dice: {},
        outcome: 'success',
        narrative: {},
        mechanics: {},
      }]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    },
  };

  const mockNarratorService = {
    narrateAction: jest.fn().mockResolvedValue(mockNarratorResponse),
  };

  const mockImageService = {
    generateImage: jest.fn().mockResolvedValue({
      imageUrl: 'http://example.com/image.png',
      metadata: { provider: 'stable_diffusion' },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionsService,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
        {
          provide: NarratorService,
          useValue: mockNarratorService,
        },
        {
          provide: ImageService,
          useValue: mockImageService,
        },
      ],
    }).compile();

    service = module.get<ActionsService>(ActionsService);
    dbService = module.get<DatabaseService>(DatabaseService);
    narratorService = module.get<NarratorService>(NarratorService);
    imageService = module.get<ImageService>(ImageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitAction', () => {
    const validDto: SubmitActionDto = {
      sessionId: 'test-session-id',
      characterId: 'test-character-id',
      action: 'Tentar abrir a porta',
      dice: {
        formula: '1d20+3',
        roll: 18,
        natural: 18,
        target: 15,
      },
      context: {
        location: 'Castelo',
      },
    };

    const tenantId = 'test-tenant-id';
    const userId = 'test-user-id';

    it('should submit action successfully', async () => {
      mockDbService.db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockSession]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockCharacter]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValueOnce([]),
        });

      const result = await service.submitAction(tenantId, userId, validDto);

      expect(result).toBeDefined();
      expect(result.action).toBeDefined();
      expect(result.narratorResponse).toBeDefined();
      expect(mockNarratorService.narrateAction).toHaveBeenCalled();
      expect(mockDbService.db.insert).toHaveBeenCalled();
    });

    it('should throw NotFoundException if session not found', async () => {
      mockDbService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([]),
      });

      await expect(
        service.submitAction(tenantId, userId, validDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should update character sheet if provided', async () => {
      mockDbService.db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockSession]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockCharacter]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValueOnce([]),
        });

      await service.submitAction(tenantId, userId, validDto);

      expect(mockDbService.db.update).toHaveBeenCalled();
    });

    it('should save memory updates', async () => {
      mockDbService.db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockSession]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockCharacter]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValueOnce([]),
        });

      await service.submitAction(tenantId, userId, validDto);

      expect(mockDbService.db.insert).toHaveBeenCalled();
    });

    it('should save history entry', async () => {
      mockDbService.db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockSession]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockCharacter]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValueOnce([]),
        });

      await service.submitAction(tenantId, userId, validDto);

      expect(mockDbService.db.insert).toHaveBeenCalled();
    });

    it('should generate images if prompts provided', async () => {
      mockDbService.db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockSession]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockCharacter]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValueOnce([]),
        });

      await service.submitAction(tenantId, userId, validDto);

      expect(mockImageService.generateImage).toHaveBeenCalled();
    });

    it('should handle action without character', async () => {
      const dtoWithoutCharacter = {
        ...validDto,
        characterId: undefined,
      };

      mockDbService.db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockSession]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValueOnce([]),
        });

      const result = await service.submitAction(tenantId, userId, dtoWithoutCharacter);

      expect(result).toBeDefined();
      expect(mockNarratorService.narrateAction).toHaveBeenCalled();
    });
  });

  describe('getSessionHistory', () => {
    const sessionId = 'test-session-id';
    const userId = 'test-user-id';

    it('should return session history', async () => {
      const mockHistory = [{
        id: 'history-1',
        summary: 'Test history',
        timestamp: new Date(),
      }];

      mockDbService.db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockSession]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockResolvedValueOnce(mockHistory),
        });

      const result = await service.getSessionHistory(sessionId, userId);

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
        service.getSessionHistory('non-existent', userId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSessionMemory', () => {
    const sessionId = 'test-session-id';
    const userId = 'test-user-id';

    it('should return session memory', async () => {
      const mockMemory = [{
        id: 'memory-1',
        key: 'test_key',
        value: 'test_value',
      }];

      mockDbService.db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockSession]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValueOnce(mockMemory),
        });

      const result = await service.getSessionMemory(sessionId, userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('submitAction with enhanced context', () => {
    const tenantId = 'test-tenant-id';
    const userId = 'test-user-id';

    it('should enhance context with memory location', async () => {
      const dto: SubmitActionDto = {
        sessionId: 'test-session-id',
        characterId: 'test-character-id',
        action: 'Explorar a área',
        dice: {
          formula: '1d20',
          roll: 15,
          natural: 15,
        },
        context: {
          location: 'Floresta',
        },
      };

      const mockMemory = [
        { id: 'mem-1', key: 'current_location', value: 'Castelo de Pedra' },
        { id: 'mem-2', key: 'current_npc', value: 'Guarda Real' },
      ];

      mockDbService.db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockSession]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockCharacter]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValueOnce(mockMemory),
        });

      await service.submitAction(tenantId, userId, dto);

      expect(mockNarratorService.narrateAction).toHaveBeenCalled();
      const callArgs = mockNarratorService.narrateAction.mock.calls[0][0];
      expect(callArgs.context?.location).toBe('Castelo de Pedra');
      expect(callArgs.session_memory).toHaveProperty('current_location', 'Castelo de Pedra');
      expect(callArgs.session_memory).toHaveProperty('current_npc', 'Guarda Real');
    });

    it('should use context location if memory location not available', async () => {
      const dto: SubmitActionDto = {
        sessionId: 'test-session-id',
        characterId: 'test-character-id',
        action: 'Explorar',
        dice: {
          formula: '1d20',
          roll: 15,
          natural: 15,
        },
        context: {
          location: 'Floresta Sombria',
        },
      };

      mockDbService.db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockSession]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockCharacter]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValueOnce([]),
        });

      await service.submitAction(tenantId, userId, dto);

      const callArgs = mockNarratorService.narrateAction.mock.calls[0][0];
      expect(callArgs.context?.location).toBe('Floresta Sombria');
    });

    it('should integrate with NarratorService with enhanced context', async () => {
      const dto: SubmitActionDto = {
        sessionId: 'test-session-id',
        characterId: 'test-character-id',
        action: 'Atacar o goblin',
        dice: {
          formula: '1d20+5',
          roll: 18,
          natural: 18,
          target: 15,
        },
        context: {
          location: 'Caverna',
          npc: 'Goblin',
        },
      };

      const mockMemory = [
        { id: 'mem-1', key: 'current_location', value: 'Caverna Escura' },
        { id: 'mem-2', key: 'battle_context', value: 'Em combate' },
      ];

      mockDbService.db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockSession]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValueOnce([mockCharacter]),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValueOnce(mockMemory),
        });

      await service.submitAction(tenantId, userId, dto);

      expect(mockNarratorService.narrateAction).toHaveBeenCalled();
      const callArgs = mockNarratorService.narrateAction.mock.calls[0][0];
      expect(callArgs.context).toBeDefined();
      expect(callArgs.session_memory).toBeDefined();
      expect(callArgs.character_sheet).toBeDefined();
    });
  });
});

