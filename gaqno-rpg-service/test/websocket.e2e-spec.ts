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
  dice: { roll: 15, formula: '1d20', natural: 15 },
  narratives: [{ level: 'success', text: 'Test narrative' }],
  mechanics: {},
};

describe('WebSocket Gateway (E2E)', () => {
  let app: INestApplication;
  let ioServer: Server;
  const testPort = 4008;
  const baseUrl = `http://localhost:${testPort}`;

  beforeAll(async () => {
    const mockActionsService = {
      submitAction: jest.fn().mockResolvedValue({
        action: {
          id: 'test-action-id',
          sessionId: 'test-session-broadcast',
          action: 'Test action',
          dice: { formula: '1d20', roll: 15, natural: 15 },
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

  describe('Connection and Join Session', () => {
    it('should connect client successfully', (done) => {
      const client = io(`${baseUrl}/rpg`, {
        transports: ['websocket', 'polling'],
        reconnection: false,
      });

      client.on('connect', () => {
        expect(client.connected).toBe(true);
        client.disconnect();
        done();
      });

      client.on('connect_error', (error) => {
        client.disconnect();
        done(error);
      });
    });

    it('should join session in presentation mode', (done) => {
      const client = io(`${baseUrl}/rpg`, {
        transports: ['websocket', 'polling'],
        reconnection: false,
      });

      client.on('connect', () => {
        client.emit('join_session', {
          sessionId: 'test-session-1',
          mode: 'presentation',
        });
      });

      client.on('joined_session', (data) => {
        expect(data.sessionId).toBe('test-session-1');
        expect(data.mode).toBe('presentation');
        client.disconnect();
        done();
      });

      client.on('error', (error) => {
        client.disconnect();
        done(new Error(error.message));
      });
    });

    it('should join session in player mode with userId', (done) => {
      const client = io(`${baseUrl}/rpg`, {
        transports: ['websocket', 'polling'],
        reconnection: false,
      });

      client.on('connect', () => {
        client.emit('join_session', {
          sessionId: 'test-session-2',
          userId: 'test-user-1',
          mode: 'player',
        });
      });

      client.on('joined_session', (data) => {
        expect(data.sessionId).toBe('test-session-2');
        expect(data.mode).toBe('player');
        client.disconnect();
        done();
      });

      client.on('error', (error) => {
        client.disconnect();
        done(new Error(error.message));
      });
    });

    it('should reject join session in player mode without userId', (done) => {
      const client = io(`${baseUrl}/rpg`, {
        transports: ['websocket', 'polling'],
        reconnection: false,
      });

      let timeoutId: NodeJS.Timeout;

      client.on('connect', () => {
        client.emit('join_session', {
          sessionId: 'test-session-3',
          mode: 'player',
        });
      });

      client.on('error', (error) => {
        clearTimeout(timeoutId);
        expect(error.message).toContain('User ID required');
        client.disconnect();
        done();
      });

      timeoutId = setTimeout(() => {
        client.disconnect();
        done(new Error('Expected error event'));
      }, 1000);
    });
  });

  describe('Action Submission and Broadcasting', () => {
    let masterClient: ClientSocket;
    let playerClient: ClientSocket;
    let presentationClient: ClientSocket;
    const sessionId = 'test-session-broadcast';
    const masterUserId = 'master-user';
    const playerUserId = 'player-user';

    beforeEach((done) => {
      let connectedCount = 0;
      const onConnect = () => {
        connectedCount++;
        if (connectedCount === 3) {
          masterClient.emit('join_session', {
            sessionId,
            userId: masterUserId,
            mode: 'master',
          });
        }
      };

      masterClient = io(`${baseUrl}/rpg`, {
        transports: ['websocket', 'polling'],
        reconnection: false,
      });

      playerClient = io(`${baseUrl}/rpg`, {
        transports: ['websocket', 'polling'],
        reconnection: false,
      });

      presentationClient = io(`${baseUrl}/rpg`, {
        transports: ['websocket', 'polling'],
        reconnection: false,
      });

      masterClient.on('connect', onConnect);
      playerClient.on('connect', onConnect);
      presentationClient.on('connect', onConnect);

      masterClient.on('joined_session', () => {
        playerClient.emit('join_session', {
          sessionId,
          userId: playerUserId,
          mode: 'player',
        });
      });

      playerClient.on('joined_session', () => {
        presentationClient.emit('join_session', {
          sessionId,
          mode: 'presentation',
        });
      });

      presentationClient.on('joined_session', () => {
        done();
      });
    });

    afterEach(() => {
      masterClient?.disconnect();
      playerClient?.disconnect();
      presentationClient?.disconnect();
    });

    it('should broadcast action_result to all clients in session', (done) => {
      let receivedCount = 0;
      const expectedCount = 3;
      let timeoutId: NodeJS.Timeout;

      const onActionResult = () => {
        receivedCount++;
        if (receivedCount === expectedCount) {
          clearTimeout(timeoutId);
          done();
        }
      };

      masterClient.on('action_result', onActionResult);
      playerClient.on('action_result', onActionResult);
      presentationClient.on('action_result', onActionResult);

      setTimeout(() => {
        masterClient.emit('submit_action', {
          sessionId,
          userId: masterUserId,
          action: 'Test action',
          dice: {
            formula: '1d20',
            roll: 15,
            natural: 15,
          },
        });
      }, 100);

      timeoutId = setTimeout(() => {
        if (receivedCount < expectedCount) {
          done(new Error(`Expected ${expectedCount} broadcasts, got ${receivedCount}`));
        }
      }, 5000);
    });

    it('should not allow presentation mode to submit actions', (done) => {
      let timeoutId: NodeJS.Timeout;

      presentationClient.on('error', (error) => {
        clearTimeout(timeoutId);
        expect(error.message).toContain('Presentation mode cannot submit actions');
        done();
      });

      setTimeout(() => {
        presentationClient.emit('submit_action', {
          sessionId,
          userId: 'anonymous',
          action: 'Test action',
          dice: {
            formula: '1d20',
            roll: 10,
            natural: 10,
          },
        });
      }, 100);

      timeoutId = setTimeout(() => {
        done(new Error('Expected error event'));
      }, 2000);
    });
  });

  describe('Leave Session', () => {
    it('should leave session successfully', (done) => {
      const client = io(`${baseUrl}/rpg`, {
        transports: ['websocket', 'polling'],
        reconnection: false,
      });

      client.on('connect', () => {
        client.emit('join_session', {
          sessionId: 'test-session-leave',
          userId: 'test-user',
          mode: 'player',
        });
      });

      client.on('joined_session', () => {
        client.emit('leave_session', {
          sessionId: 'test-session-leave',
        });

        setTimeout(() => {
          expect(client.connected).toBe(true);
          client.disconnect();
          done();
        }, 100);
      });
    });
  });

  describe('Request Update', () => {
    it('should broadcast update_requested to all clients', (done) => {
      const client1 = io(`${baseUrl}/rpg`, {
        transports: ['websocket', 'polling'],
        reconnection: false,
      });

      const client2 = io(`${baseUrl}/rpg`, {
        transports: ['websocket', 'polling'],
        reconnection: false,
      });

      const sessionId = 'test-session-update';
      let joinedCount = 0;
      let timeoutId: NodeJS.Timeout;

      const onJoined = () => {
        joinedCount++;
        if (joinedCount === 2) {
          client1.on('update_requested', (data) => {
            clearTimeout(timeoutId);
            expect(data.type).toBe('refresh');
            expect(data.requestedBy).toBe('test-user-1');
            client1.disconnect();
            client2.disconnect();
            done();
          });

          client2.on('update_requested', (data) => {
            expect(data.type).toBe('refresh');
            expect(data.requestedBy).toBe('test-user-1');
          });

          setTimeout(() => {
            client1.emit('request_update', {
              sessionId,
              type: 'refresh',
            });
          }, 100);
        }
      };

      client1.on('connect', () => {
        client1.emit('join_session', {
          sessionId,
          userId: 'test-user-1',
          mode: 'player',
        });
      });

      client2.on('connect', () => {
        client2.emit('join_session', {
          sessionId,
          userId: 'test-user-2',
          mode: 'player',
        });
      });

      client1.on('joined_session', onJoined);
      client2.on('joined_session', onJoined);

      timeoutId = setTimeout(() => {
        client1.disconnect();
        client2.disconnect();
        done(new Error('Expected update_requested event'));
      }, 3000);
    });
  });
});

