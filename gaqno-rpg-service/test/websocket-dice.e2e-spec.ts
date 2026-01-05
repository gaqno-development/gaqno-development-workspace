import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from '../src/app.module';
import { ActionsService } from '../src/actions/actions.service';
import { Server } from 'socket.io';
import io from 'socket.io-client';
type ClientSocket = ReturnType<typeof io>;

const mockNarratorResponse = {
  outcome: 'success' as const,
  dice: { roll: 15, formula: '1d20+5', natural: 15 },
  narratives: [{ level: 'success', text: 'Test narrative' }],
  mechanics: {},
};

describe('WebSocket Dice Roll (E2E)', () => {
  let app: INestApplication;
  let ioServer: Server;
  const testPort = 4009;
  const baseUrl = `http://localhost:${testPort}`;

  beforeAll(async () => {
    const mockActionsService = {
      submitAction: jest.fn().mockResolvedValue({
        action: {
          id: 'test-action-id',
          sessionId: 'test-session-dice',
          action: 'Test dice roll',
          dice: { formula: '1d20+5', roll: 18, natural: 18 },
        },
        narratorResponse: mockNarratorResponse,
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ActionsService)
      .useValue(mockActionsService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(testPort);

    ioServer = app.getHttpServer() as any;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Dice Roll Flow', () => {
    it('should complete full dice roll flow: master requests, player receives, player completes, master receives', (done) => {
      const sessionId = 'test-session-dice';
      const masterUserId = 'master-user-id';
      const playerUserId = 'player-user-id';

      let masterSocket: ClientSocket;
      let playerSocket: ClientSocket;
      let diceRequestId: string;
      let receivedRequest: any;

      const cleanup = () => {
        if (masterSocket) masterSocket.disconnect();
        if (playerSocket) playerSocket.disconnect();
      };

      masterSocket = io(baseUrl, {
        transports: ['websocket'],
        query: {
          sessionId,
          userId: masterUserId,
          mode: 'master',
        },
      });

      playerSocket = io(baseUrl, {
        transports: ['websocket'],
        query: {
          sessionId,
          userId: playerUserId,
          mode: 'player',
        },
      });

      masterSocket.on('connect', () => {
        masterSocket.emit('join_session', {
          sessionId,
          userId: masterUserId,
          mode: 'master',
        });
      });

      playerSocket.on('connect', () => {
        playerSocket.emit('join_session', {
          sessionId,
          userId: playerUserId,
          mode: 'player',
        });
      });

      playerSocket.on('dice_roll_requested', (request: any) => {
        receivedRequest = request;
        diceRequestId = request.id;

        expect(request).toBeDefined();
        expect(request.sessionId).toBe(sessionId);
        expect(request.requestedFor).toBe(playerUserId);
        expect(request.formula).toBe('1d20+5');
        expect(request.target).toBe(15);
        expect(request.status).toBe('pending');

        setTimeout(() => {
          const mockResult = {
            roll: 18,
            formula: '1d20+5',
            natural: 18,
            target: 15,
          };

          playerSocket.emit('dice_roll_completed', {
            requestId: diceRequestId,
            sessionId,
            result: mockResult,
          });
        }, 100);
      });

      masterSocket.on('dice_roll_completed', (completed: any) => {
        expect(completed).toBeDefined();
        expect(completed.id).toBe(diceRequestId);
        expect(completed.status).toBe('submitted');
        expect(completed.result).toBeDefined();
        expect(completed.result.roll).toBe(18);
        expect(completed.result.formula).toBe('1d20+5');
        expect(completed.result.natural).toBe(18);

        cleanup();
        done();
      });

      setTimeout(() => {
        masterSocket.emit('request_dice_roll', {
          sessionId,
          requestedFor: playerUserId,
          formula: '1d20+5',
          target: 15,
          context: 'Test dice roll context',
        });
      }, 500);
    });

    it('should reject dice roll request if not joined to session', (done) => {
      const sessionId = 'test-session-reject';
      const socket = io(baseUrl, {
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        socket.emit('request_dice_roll', {
          sessionId,
          requestedFor: 'player-id',
          formula: '1d20',
        });

        socket.on('error', (error: any) => {
          expect(error.message).toBe('Not joined to a session');
          socket.disconnect();
          done();
        });
      });
    });

    it('should reject dice roll completion if not joined to session', (done) => {
      const sessionId = 'test-session-reject-complete';
      const socket = io(baseUrl, {
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        socket.emit('dice_roll_completed', {
          requestId: 'dice-123',
          sessionId,
          result: {
            roll: 15,
            formula: '1d20',
            natural: 15,
          },
        });

        socket.on('error', (error: any) => {
          expect(error.message).toBe('Not joined to a session');
          socket.disconnect();
          done();
        });
      });
    });
  });
});

