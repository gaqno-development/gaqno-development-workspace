import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/db.service';
import { rpgSessions, rpgSessionMasters } from '../src/database/schema';
import { eq } from 'drizzle-orm';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const createMockJWT = (userId: string, tenantId: string = 'test-tenant-id'): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: userId, tenantId, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
  const signature = 'test-signature';
  return `${header}.${payload}.${signature}`;
};

describe('Sessions Masters (e2e)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let creatorToken: string;
  let playerToken: string;
  let sessionId: string;
  let creatorUserId: string;
  let playerUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );
    
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('v1/rpg');

    await app.init();
    db = moduleFixture.get<DatabaseService>(DatabaseService);

    creatorUserId = 'creator-user-id';
    playerUserId = 'player-user-id';

    creatorToken = createMockJWT(creatorUserId);
    playerToken = createMockJWT(playerUserId);
  });

  afterAll(async () => {
    if (sessionId) {
      await db.db.delete(rpgSessionMasters).where(eq(rpgSessionMasters.sessionId, sessionId));
      await db.db.delete(rpgSessions).where(eq(rpgSessions.id, sessionId));
    }
    await app.close();
  });

  describe('POST /sessions - Create session', () => {
    it('should create a session and automatically make creator a master', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/rpg/sessions')
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send({
          name: 'Test Session',
          description: 'Test Description'
        })
        .expect(201);

      sessionId = response.body.id;
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Session');

      const mastersResponse = await request(app.getHttpServer())
        .get(`/v1/rpg/sessions/${sessionId}/masters`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(mastersResponse.body).toHaveLength(1);
      expect(mastersResponse.body[0].userId).toBe(creatorUserId);
      expect(mastersResponse.body[0].isOriginalCreator).toBe(true);
    });
  });

  describe('GET /sessions/:id/masters', () => {
    it('should return list of masters for a session', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/rpg/sessions/${sessionId}/masters`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /sessions/:id/promote-master', () => {
    it('should allow creator to promote a player to master', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/rpg/sessions/${sessionId}/promote-master`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send({ userId: playerUserId })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(playerUserId);
      expect(response.body.isOriginalCreator).toBe(false);

      const mastersResponse = await request(app.getHttpServer())
        .get(`/v1/rpg/sessions/${sessionId}/masters`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(mastersResponse.body.length).toBe(2);
      const promotedMaster = mastersResponse.body.find((m: any) => m.userId === playerUserId);
      expect(promotedMaster).toBeDefined();
      expect(promotedMaster.isOriginalCreator).toBe(false);
    });

    it('should not allow non-creator to promote players', async () => {
      await request(app.getHttpServer())
        .post(`/v1/rpg/sessions/${sessionId}/promote-master`)
        .set('Cookie', `gaqno_session=${playerToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send({ userId: 'another-user-id' })
        .expect(403);
    });

    it('should return existing master if already promoted', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/rpg/sessions/${sessionId}/promote-master`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send({ userId: playerUserId })
        .expect(201);

      expect(response.body.userId).toBe(playerUserId);
    });
  });

  describe('POST /sessions/:id/demote-master', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post(`/v1/rpg/sessions/${sessionId}/promote-master`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send({ userId: playerUserId });
    });

    it('should allow creator to demote a master', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/rpg/sessions/${sessionId}/demote-master`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send({ userId: playerUserId })
        .expect(201);

      expect(response.body.success).toBe(true);

      const mastersResponse = await request(app.getHttpServer())
        .get(`/v1/rpg/sessions/${sessionId}/masters`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      const demotedMaster = mastersResponse.body.find((m: any) => m.userId === playerUserId);
      expect(demotedMaster).toBeUndefined();
    });

    it('should not allow non-creator to demote masters', async () => {
      await request(app.getHttpServer())
        .post(`/v1/rpg/sessions/${sessionId}/demote-master`)
        .set('Cookie', `gaqno_session=${playerToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send({ userId: creatorUserId })
        .expect(403);
    });

    it('should not allow demoting the original creator', async () => {
      await request(app.getHttpServer())
        .post(`/v1/rpg/sessions/${sessionId}/demote-master`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send({ userId: creatorUserId })
        .expect(403);
    });
  });

  describe('POST /sessions/:id/renounce-master', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post(`/v1/rpg/sessions/${sessionId}/promote-master`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send({ userId: playerUserId });
    });

    it('should allow a master to renounce their status', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/rpg/sessions/${sessionId}/renounce-master`)
        .set('Cookie', `gaqno_session=${playerToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .expect(201);

      expect(response.body.success).toBe(true);

      const mastersResponse = await request(app.getHttpServer())
        .get(`/v1/rpg/sessions/${sessionId}/masters`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      const renouncedMaster = mastersResponse.body.find((m: any) => m.userId === playerUserId);
      expect(renouncedMaster).toBeUndefined();
    });

    it('should not allow original creator to renounce', async () => {
      await request(app.getHttpServer())
        .post(`/v1/rpg/sessions/${sessionId}/renounce-master`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .expect(403);
    });
  });

  describe('Integration: Full master lifecycle', () => {
    it('should handle complete master promotion and demotion flow', async () => {
      const testPlayerId = 'test-player-id';
      
      const promoteResponse = await request(app.getHttpServer())
        .post(`/v1/rpg/sessions/${sessionId}/promote-master`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send({ userId: testPlayerId })
        .expect(201);

      expect(promoteResponse.body.userId).toBe(testPlayerId);

      let mastersResponse = await request(app.getHttpServer())
        .get(`/v1/rpg/sessions/${sessionId}/masters`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(mastersResponse.body.length).toBeGreaterThanOrEqual(2);

      const demoteResponse = await request(app.getHttpServer())
        .post(`/v1/rpg/sessions/${sessionId}/demote-master`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send({ userId: testPlayerId })
        .expect(201);

      expect(demoteResponse.body.success).toBe(true);

      mastersResponse = await request(app.getHttpServer())
        .get(`/v1/rpg/sessions/${sessionId}/masters`)
        .set('Cookie', `gaqno_session=${creatorToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      const demotedMaster = mastersResponse.body.find((m: any) => m.userId === testPlayerId);
      expect(demotedMaster).toBeUndefined();
    });
  });
});

