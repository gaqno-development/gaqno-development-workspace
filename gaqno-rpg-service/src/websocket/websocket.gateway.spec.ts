import { Test, TestingModule } from '@nestjs/testing';
import { RpgWebSocketGateway } from './websocket.gateway';
import { ActionsService } from '../actions/actions.service';
import { SessionsService } from '../sessions/sessions.service';
import { Server, Socket } from 'socket.io';

describe('WebSocketGateway', () => {
  let gateway: RpgWebSocketGateway;
  let actionsService: ActionsService;
  let sessionsService: SessionsService;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;

  const mockActionsService = {
    submitAction: jest.fn(),
  };

  const mockSessionsService = {
    getSessionById: jest.fn(),
  };

  beforeEach(async () => {
    mockServer = {
      sockets: {
        sockets: new Map(),
      },
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    mockSocket = {
      id: 'test-socket-id',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RpgWebSocketGateway,
        {
          provide: ActionsService,
          useValue: mockActionsService,
        },
        {
          provide: SessionsService,
          useValue: mockSessionsService,
        },
      ],
    }).compile();

    gateway = module.get<RpgWebSocketGateway>(RpgWebSocketGateway);
    actionsService = module.get<ActionsService>(ActionsService);
    sessionsService = module.get<SessionsService>(SessionsService);
    
    (gateway as any).server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('request_dice_roll', () => {
    beforeEach(() => {
      (mockSocket as any).sessionData = {
        userId: 'master-user-id',
        sessionId: 'test-session-id',
        mode: 'master',
      };
    });

    it('should create dice roll request', () => {
      const data = {
        sessionId: 'test-session-id',
        requestedFor: 'player-user-id',
        formula: '1d20+5',
        target: 15,
        context: 'Test context',
      };

      (gateway as any).handleRequestDiceRoll(mockSocket as Socket, data);

      expect(mockServer.to).toHaveBeenCalledWith('test-session-id');
      expect(mockServer.emit).toHaveBeenCalledWith('dice_roll_requested', expect.objectContaining({
        sessionId: 'test-session-id',
        requestedFor: 'player-user-id',
        formula: '1d20+5',
        target: 15,
        context: 'Test context',
        status: 'pending',
      }));
    });

    it('should emit to target player', () => {
      const data = {
        sessionId: 'test-session-id',
        requestedFor: 'player-user-id',
        formula: '1d20',
      };

      (gateway as any).handleRequestDiceRoll(mockSocket as Socket, data);

      expect(mockServer.to).toHaveBeenCalledWith('test-session-id');
      expect(mockServer.emit).toHaveBeenCalledWith('dice_roll_requested', expect.objectContaining({
        requestedFor: 'player-user-id',
      }));
    });

    it('should store pending request with unique ID', () => {
      const data = {
        sessionId: 'test-session-id',
        requestedFor: 'player-user-id',
        formula: '1d20',
      };

      (gateway as any).handleRequestDiceRoll(mockSocket as Socket, data);

      const emitCall = (mockServer.emit as jest.Mock).mock.calls.find(
        call => call[0] === 'dice_roll_requested'
      );
      expect(emitCall).toBeDefined();
      expect(emitCall[1].id).toBeDefined();
      expect(emitCall[1].id).toContain('dice-');
    });

    it('should reject if not joined to session', () => {
      delete (mockSocket as any).sessionData;

      const data = {
        sessionId: 'test-session-id',
        requestedFor: 'player-user-id',
        formula: '1d20',
      };

      (gateway as any).handleRequestDiceRoll(mockSocket as Socket, data);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Not joined to a session' });
      expect(mockServer.emit).not.toHaveBeenCalledWith('dice_roll_requested', expect.anything());
    });
  });

  describe('dice_roll_completed', () => {
    beforeEach(() => {
      (mockSocket as any).sessionData = {
        userId: 'player-user-id',
        sessionId: 'test-session-id',
        mode: 'player',
      };
    });

    it('should update pending request', () => {
      const data = {
        requestId: 'dice-123',
        sessionId: 'test-session-id',
        result: {
          roll: 18,
          formula: '1d20+5',
          natural: 18,
          target: 15,
        },
      };

      (gateway as any).handleDiceRollCompleted(mockSocket as Socket, data);

      expect(mockServer.to).toHaveBeenCalledWith('test-session-id');
      expect(mockServer.emit).toHaveBeenCalledWith('dice_roll_completed', expect.objectContaining({
        id: 'dice-123',
        status: 'submitted',
        result: data.result,
      }));
    });

    it('should emit to master', () => {
      const data = {
        requestId: 'dice-123',
        sessionId: 'test-session-id',
        result: {
          roll: 18,
          formula: '1d20+5',
          natural: 18,
        },
      };

      (gateway as any).handleDiceRollCompleted(mockSocket as Socket, data);

      expect(mockServer.to).toHaveBeenCalledWith('test-session-id');
      expect(mockServer.emit).toHaveBeenCalledWith('dice_roll_completed', expect.anything());
    });

    it('should include requestedFor from session data', () => {
      const data = {
        requestId: 'dice-123',
        sessionId: 'test-session-id',
        result: {
          roll: 18,
          formula: '1d20+5',
          natural: 18,
        },
      };

      (gateway as any).handleDiceRollCompleted(mockSocket as Socket, data);

      const emitCall = (mockServer.emit as jest.Mock).mock.calls.find(
        call => call[0] === 'dice_roll_completed'
      );
      expect(emitCall[1].requestedFor).toBe('player-user-id');
    });

    it('should reject if not joined to session', () => {
      delete (mockSocket as any).sessionData;

      const data = {
        requestId: 'dice-123',
        sessionId: 'test-session-id',
        result: {
          roll: 18,
          formula: '1d20',
          natural: 18,
        },
      };

      (gateway as any).handleDiceRollCompleted(mockSocket as Socket, data);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Not joined to a session' });
      expect(mockServer.emit).not.toHaveBeenCalledWith('dice_roll_completed', expect.anything());
    });
  });
});

