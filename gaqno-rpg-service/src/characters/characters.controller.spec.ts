import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

describe('CharactersController (integration)', () => {
  let app: INestApplication;
  let charactersService: CharactersService;

  const mockCharactersService = {
    createCharacter: jest.fn(),
    getCharactersBySession: jest.fn(),
    getCharacterById: jest.fn(),
    updateCharacter: jest.fn(),
    deleteCharacter: jest.fn(),
  };

  const mockUser = {
    sub: 'test-user-id',
    tenantId: 'test-tenant-id',
  };

  const mockCharacter = {
    id: 'test-character-id',
    sessionId: 'test-session-id',
    playerId: mockUser.sub,
    name: 'Test Character',
    attributes: { strength: 10 },
    resources: { hp: 100 },
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CharactersController],
      providers: [
        {
          provide: CharactersService,
          useValue: mockCharactersService,
        },
      ],
    }).compile();

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

    charactersService = moduleFixture.get<CharactersService>(CharactersService);

    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/rpg/characters', () => {
    it('should create a character successfully', async () => {
      mockCharactersService.createCharacter.mockResolvedValue(mockCharacter);

      const response = await request(app.getHttpServer())
        .post('/v1/rpg/characters')
        .set('Cookie', `gaqno_session=test-token`)
        .send({
          sessionId: 'test-session-id',
          name: 'Test Character',
          attributes: { strength: 10 },
          resources: { hp: 100 },
        })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.name).toBe('Test Character');
      expect(mockCharactersService.createCharacter).toHaveBeenCalled();
    });

    it('should return 400 if sessionId is missing', async () => {
      await request(app.getHttpServer())
        .post('/v1/rpg/characters')
        .set('Cookie', `gaqno_session=test-token`)
        .send({
          name: 'Test Character',
        })
        .expect(400);
    });

    it('should return 400 if name is missing', async () => {
      await request(app.getHttpServer())
        .post('/v1/rpg/characters')
        .set('Cookie', `gaqno_session=test-token`)
        .send({
          sessionId: 'test-session-id',
        })
        .expect(400);
    });
  });

  describe('GET /v1/rpg/characters', () => {
    it('should return characters by session', async () => {
      mockCharactersService.getCharactersBySession.mockResolvedValue([mockCharacter]);

      const response = await request(app.getHttpServer())
        .get('/v1/rpg/characters?sessionId=test-session-id')
        .set('Cookie', `gaqno_session=test-token`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(mockCharactersService.getCharactersBySession).toHaveBeenCalled();
    });
  });

  describe('GET /v1/rpg/characters/:id', () => {
    it('should return character by id', async () => {
      mockCharactersService.getCharacterById.mockResolvedValue(mockCharacter);

      const response = await request(app.getHttpServer())
        .get('/v1/rpg/characters/test-character-id')
        .set('Cookie', `gaqno_session=test-token`)
        .expect(200);

      expect(response.body.id).toBe('test-character-id');
      expect(mockCharactersService.getCharacterById).toHaveBeenCalled();
    });
  });

  describe('PATCH /v1/rpg/characters/:id', () => {
    it('should update character successfully', async () => {
      const updatedCharacter = {
        ...mockCharacter,
        name: 'Updated Character',
        attributes: { strength: 12 },
      };
      mockCharactersService.updateCharacter.mockResolvedValue(updatedCharacter);

      const response = await request(app.getHttpServer())
        .patch('/v1/rpg/characters/test-character-id')
        .set('Cookie', `gaqno_session=test-token`)
        .send({
          name: 'Updated Character',
          attributes: { strength: 12 },
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Character');
      expect(mockCharactersService.updateCharacter).toHaveBeenCalled();
    });
  });

  describe('DELETE /v1/rpg/characters/:id', () => {
    it('should delete character successfully', async () => {
      mockCharactersService.deleteCharacter.mockResolvedValue({ success: true });

      const response = await request(app.getHttpServer())
        .delete('/v1/rpg/characters/test-character-id')
        .set('Cookie', `gaqno_session=test-token`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockCharactersService.deleteCharacter).toHaveBeenCalled();
    });
  });
});

