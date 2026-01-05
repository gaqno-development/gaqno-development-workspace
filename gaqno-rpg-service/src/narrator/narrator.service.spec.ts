import { Test, TestingModule } from '@nestjs/testing';
import { NarratorService } from './narrator.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NarrateActionDto } from './dto/narrate-action.dto';
import { of, throwError } from 'rxjs';

describe('NarratorService', () => {
  let service: NarratorService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'AI_SERVICE_URL') return 'http://ai-service:4002';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NarratorService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<NarratorService>(NarratorService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('narrateAction', () => {
    const validDto: NarrateActionDto = {
      player_id: 'test-player-id',
      action: 'Tentar abrir a porta',
      dice: {
        formula: '1d20+3',
        roll: 18,
        natural: 18,
        target: '15',
      },
      context: {
        location: 'Castelo',
        npc: 'Guarda',
        target_dc: '15',
      },
    };

    const mockNarratorResponse = {
      outcome: 'success',
      dice: {
        roll: 18,
        formula: '1d20+3',
        natural: 18,
        target: 15,
      },
      narratives: [
        {
          level: 'success',
          text: 'Você consegue abrir a porta com sucesso.',
        },
      ],
      mechanics: {
        xp_gain: 10,
      },
      ui_actions: [
        {
          type: 'toast',
          name: 'action_result',
          duration_ms: 3000,
          priority: 'média',
          message: 'Sucesso!',
        },
      ],
    };

    it('should generate narrative successfully', async () => {
      mockHttpService.post.mockReturnValue(of({
        data: mockNarratorResponse,
      }));

      const result = await service.narrateAction(validDto, 'test-session-id');

      expect(result).toBeDefined();
      expect(result.outcome).toBe('success');
      expect(result.narratives).toBeDefined();
      expect(mockHttpService.post).toHaveBeenCalled();
    });

    it('should handle AI service error and return fallback', async () => {
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('AI Service Error'))
      );

      const result = await service.narrateAction(validDto, 'test-session-id');

      expect(result).toBeDefined();
      expect(result.outcome).toBeDefined();
      expect(result.narratives.length).toBeGreaterThan(0);
    });

    it('should parse string JSON response', async () => {
      mockHttpService.post.mockReturnValue(of({
        data: JSON.stringify(mockNarratorResponse),
      }));

      const result = await service.narrateAction(validDto, 'test-session-id');

      expect(result).toBeDefined();
      expect(result.outcome).toBe('success');
    });

    it('should handle response with content field', async () => {
      mockHttpService.post.mockReturnValue(of({
        data: {
          content: JSON.stringify(mockNarratorResponse),
        },
      }));

      const result = await service.narrateAction(validDto, 'test-session-id');

      expect(result).toBeDefined();
      expect(result.outcome).toBe('success');
    });

    it('should generate fallback for critical success (natural 20)', async () => {
      const criticalDto = {
        ...validDto,
        dice: {
          ...validDto.dice,
          roll: 20,
          natural: 20,
        },
      };

      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('AI Service Error'))
      );

      const result = await service.narrateAction(criticalDto, 'test-session-id');

      expect(result.outcome).toBe('critical_success');
    });

    it('should generate fallback for critical failure (natural 1)', async () => {
      const failureDto = {
        ...validDto,
        dice: {
          ...validDto.dice,
          roll: 1,
          natural: 1,
        },
      };

      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('AI Service Error'))
      );

      const result = await service.narrateAction(failureDto, 'test-session-id');

      expect(result.outcome).toBe('critical_failure');
    });

    it('should parse locationContext from response', async () => {
      const responseWithLocation = {
        ...mockNarratorResponse,
        locationContext: {
          city: 'Porto Real',
          terrain: 'Planalto',
          environment: 'Urbano',
          description: 'Uma cidade movimentada',
        },
      };

      mockHttpService.post.mockReturnValue(of({
        data: responseWithLocation,
      }));

      const result = await service.narrateAction(validDto, 'test-session-id');

      expect(result).toBeDefined();
      expect((result as any).locationContext).toBeDefined();
      expect((result as any).locationContext.city).toBe('Porto Real');
    });
  });

  describe('detectActionType', () => {
    const baseDto: NarrateActionDto = {
      player_id: 'test-player-id',
      action: 'Test action',
      dice: {
        formula: '1d20+3',
        roll: 18,
        natural: 18,
        target: '15',
      },
      context: {
        location: 'Castelo',
        npc: 'Guarda',
        target_dc: '15',
      },
    };

    it('should detect battle actions', () => {
      const service = new NarratorService(mockHttpService as any, mockConfigService as any);
      const battleActions = ['atacar o goblin', 'golpe com espada', 'defender do ataque'];
      
      battleActions.forEach(action => {
        const dto = { ...baseDto, action };
        const prompt = (service as any).buildUserPrompt(dto);
        expect(prompt).toContain('COMBATE');
      });
    });

    it('should detect dialogue actions', () => {
      const service = new NarratorService(mockHttpService as any, mockConfigService as any);
      const dialogueActions = ['falar com o guarda', 'perguntar sobre o tesouro', 'persuadir o mercador'];
      
      dialogueActions.forEach(action => {
        const dto = { ...baseDto, action };
        const prompt = (service as any).buildUserPrompt(dto);
        expect(prompt).toContain('DIÁLOGO');
      });
    });

    it('should detect exploration actions', () => {
      const service = new NarratorService(mockHttpService as any, mockConfigService as any);
      const explorationActions = ['procurar na sala', 'investigar o baú', 'explorar o corredor'];
      
      explorationActions.forEach(action => {
        const dto = { ...baseDto, action };
        const prompt = (service as any).buildUserPrompt(dto);
        expect(prompt).toContain('EXPLORAÇÃO');
      });
    });

    it('should detect item actions', () => {
      const service = new NarratorService(mockHttpService as any, mockConfigService as any);
      const itemActions = ['pegar a espada', 'encontrar um item', 'usar a poção'];
      
      itemActions.forEach(action => {
        const dto = { ...baseDto, action };
        const prompt = (service as any).buildUserPrompt(dto);
        expect(prompt).toContain('ITENS');
      });
    });

    it('should return other for unknown actions', () => {
      const service = new NarratorService(mockHttpService as any, mockConfigService as any);
      const dto = { ...baseDto, action: 'fazer algo estranho' };
      const prompt = (service as any).buildUserPrompt(dto);
      expect(prompt).toContain('geral');
    });
  });

  describe('buildUserPrompt', () => {
    const baseDto: NarrateActionDto = {
      player_id: 'test-player-id',
      action: 'Test action',
      dice: {
        formula: '1d20+3',
        roll: 18,
        natural: 18,
        target: '15',
      },
      context: {
        location: 'Castelo',
        npc: 'Guarda',
        target_dc: '15',
      },
    };

    it('should include action type instruction', () => {
      const service = new NarratorService(mockHttpService as any, mockConfigService as any);
      const dto = { ...baseDto, action: 'atacar o dragão' };
      const prompt = (service as any).buildUserPrompt(dto);
      
      expect(prompt).toContain('Tipo de Ação: BATTLE');
      expect(prompt).toContain('COMBATE');
    });

    it('should include enhanced context from memory', () => {
      const service = new NarratorService(mockHttpService as any, mockConfigService as any);
      const dto = {
        ...baseDto,
        session_memory: {
          current_location: 'Castelo de Pedra',
          current_npc: 'Rei Artur',
          previous_action: 'Entrou no castelo',
        },
      };
      const prompt = (service as any).buildUserPrompt(dto);
      
      expect(prompt).toContain('current_location: Castelo de Pedra');
      expect(prompt).toContain('current_npc: Rei Artur');
    });

    it('should format memory entries legibly', () => {
      const service = new NarratorService(mockHttpService as any, mockConfigService as any);
      const dto = {
        ...baseDto,
        session_memory: {
          key1: 'value1',
          key2: 'value2',
        },
      };
      const prompt = (service as any).buildUserPrompt(dto);
      
      expect(prompt).toContain('key1: value1');
      expect(prompt).toContain('key2: value2');
      expect(prompt).toContain(';');
    });

    it('should include character sheet info', () => {
      const service = new NarratorService(mockHttpService as any, mockConfigService as any);
      const dto = {
        ...baseDto,
        character_sheet: {
          attributes: { strength: 18, dexterity: 14 },
          resources: { hp: 100, mp: 50 },
        },
      };
      const prompt = (service as any).buildUserPrompt(dto);
      
      expect(prompt).toContain('Personagem:');
      expect(prompt).toContain('Atributos:');
      expect(prompt).toContain('Recursos:');
    });

    it('should include context information', () => {
      const service = new NarratorService(mockHttpService as any, mockConfigService as any);
      const dto = {
        ...baseDto,
        context: {
          location: 'Floresta Sombria',
          npc: 'Elfo Sábio',
          target_dc: '18',
        },
      };
      const prompt = (service as any).buildUserPrompt(dto);
      
      expect(prompt).toContain('Localização: Floresta Sombria');
      expect(prompt).toContain('NPC: Elfo Sábio');
      expect(prompt).toContain('DC Alvo: 18');
    });
  });
});

