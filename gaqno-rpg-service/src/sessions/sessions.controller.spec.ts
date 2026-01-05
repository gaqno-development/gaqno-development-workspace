import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

describe('SessionsController (integration)', () => {
  let app: INestApplication;
  let sessionsService: SessionsService;

  const mockSessionsService = {
    createSession: jest.fn(),
    getSessions: jest.fn(),
    getSessionById: jest.fn(),
    updateSession: jest.fn(),
    deleteSession: jest.fn(),
  };

  const mockUser = {
    sub: 'test-user-id',
    tenantId: 'test-tenant-id',
  };

  const mockSession = {
    id: 'test-session-id',
    tenantId: mockUser.tenantId,
    userId: mockUser.sub,
    name: 'Test Session',
    description: 'Test Description',
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        {
          provide: SessionsService,
          useValue: mockSessionsService,
        },
      ],
    })
      .overrideGuard(require('@nestjs/common').CanActivate)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    
    app.use((req: any, res: any, next: any) => {
      req.user = mockUser;
      next();
    });
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('v1/rpg');

    sessionsService = moduleFixture.get<SessionsService>(SessionsService);

    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/rpg/sessions', () => {
    it('should create a session successfully', async () => {
      mockSessionsService.createSession.mockResolvedValue(mockSession);

      const response = await request(app.getHttpServer())
        .post('/v1/rpg/sessions')
        .set('Cookie', `gaqno_session=test-token`)
        .send({
          name: 'Test Session',
          description: 'Test Description',
        })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.name).toBe('Test Session');
      expect(mockSessionsService.createSession).toHaveBeenCalled();
    });

    it('should return 400 if name is missing', async () => {
      await request(app.getHttpServer())
        .post('/v1/rpg/sessions')
        .set('Cookie', `gaqno_session=test-token`)
        .send({
          description: 'Test Description',
        })
        .expect(400);
    });
  });

  describe('GET /v1/rpg/sessions', () => {
    it('should return sessions list', async () => {
      mockSessionsService.getSessions.mockResolvedValue([mockSession]);

      const response = await request(app.getHttpServer())
        .get('/v1/rpg/sessions')
        .set('Cookie', `gaqno_session=test-token`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(mockSessionsService.getSessions).toHaveBeenCalled();
    });
  });

  describe('GET /v1/rpg/sessions/:id', () => {
    it('should return session by id', async () => {
      mockSessionsService.getSessionById.mockResolvedValue(mockSession);

      const response = await request(app.getHttpServer())
        .get('/v1/rpg/sessions/test-session-id')
        .set('Cookie', `gaqno_session=test-token`)
        .expect(200);

      expect(response.body.id).toBe('test-session-id');
      expect(mockSessionsService.getSessionById).toHaveBeenCalled();
    });
  });

  describe('PATCH /v1/rpg/sessions/:id', () => {
    it('should update session successfully', async () => {
      const updatedSession = {
        ...mockSession,
        name: 'Updated Session',
        status: 'active',
      };
      mockSessionsService.updateSession.mockResolvedValue(updatedSession);

      const response = await request(app.getHttpServer())
        .patch('/v1/rpg/sessions/test-session-id')
        .set('Cookie', `gaqno_session=test-token`)
        .send({
          name: 'Updated Session',
          status: 'active',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Session');
      expect(mockSessionsService.updateSession).toHaveBeenCalled();
    });
  });

  describe('DELETE /v1/rpg/sessions/:id', () => {
    it('should delete session successfully', async () => {
      mockSessionsService.deleteSession.mockResolvedValue({ success: true });

      const response = await request(app.getHttpServer())
        .delete('/v1/rpg/sessions/test-session-id')
        .set('Cookie', `gaqno_session=test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockSessionsService.deleteSession).toHaveBeenCalled();
    });
  });
});

