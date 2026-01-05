import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const testJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOGNkZjFkMi0xNmQ5LTRiZDgtODFiMS04MTBmZjhhYjAyNDkiLCJ0ZW5hbnRJZCI6IjZlYmYyYmE4LTJmMmMtNDJiNC1iZTQzLTcwMTZjMDUwMjNjMyIsImlhdCI6MTYxNjIzOTAyMn0.test';

describe('D&D 5e API (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/rpg/dnd5e/categories', () => {
    it('should return list of available categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/rpg/dnd5e/categories')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
      expect(Object.keys(response.body).length).toBeGreaterThan(0);
    });
  });

  describe('GET /v1/rpg/dnd5e/health/check', () => {
    it('should check API health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/rpg/dnd5e/health/check')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('status');
      expect(['online', 'error']).toContain(response.body.status);
    });
  });

  describe('GET /v1/rpg/dnd5e/:category', () => {
    it('should return list of items for valid category (monsters)', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/rpg/dnd5e/monsters')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBeGreaterThan(0);
    });

    it('should return list of items for valid category (spells)', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/rpg/dnd5e/spells')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should return list of items for valid category (classes)', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/rpg/dnd5e/classes')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should return list of items for valid category (races)', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/rpg/dnd5e/races')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should return list of items for valid category (equipment)', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/rpg/dnd5e/equipment')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should return error for invalid category', async () => {
      await request(app.getHttpServer())
        .get('/v1/rpg/dnd5e/invalid-category')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(500);
    });
  });

  describe('GET /v1/rpg/dnd5e/:category/:index', () => {
    it('should return item details for valid category and index (barbarian)', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/rpg/dnd5e/classes/barbarian')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('index');
    }, 30000);

    it('should return item details for valid category and index (fireball)', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/rpg/dnd5e/spells/fireball')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('index');
    }, 30000);

    it('should return error for non-existent item', async () => {
      await request(app.getHttpServer())
        .get('/v1/rpg/dnd5e/classes/non-existent-class')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(500);
    }, 30000);
  });

  describe('GET /v1/rpg/dnd5e/:category/search?q={query}', () => {
    it('should return search results for valid query', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/rpg/dnd5e/monsters/search')
        .query({ q: 'dragon' })
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    }, 30000);

    it('should return error if query has less than 2 characters', async () => {
      await request(app.getHttpServer())
        .get('/v1/rpg/dnd5e/monsters/search')
        .query({ q: 'a' })
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(400);
    });

    it('should return error if query parameter is missing', async () => {
      await request(app.getHttpServer())
        .get('/v1/rpg/dnd5e/monsters/search')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(400);
    });

    it('should return empty array if no results found', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/rpg/dnd5e/monsters/search')
        .query({ q: 'xyzabc123nonexistent' })
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    }, 30000);
  });

  describe('POST /v1/rpg/dnd5e/sync/:category', () => {
    it('should sync a valid category (monsters)', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/rpg/dnd5e/sync/monsters')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('synced');
      expect(response.body).toHaveProperty('errors');
      expect(typeof response.body.synced).toBe('number');
      expect(typeof response.body.errors).toBe('number');
    }, 60000);

    it('should sync a valid category (spells)', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/rpg/dnd5e/sync/spells')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('synced');
      expect(response.body).toHaveProperty('errors');
      expect(typeof response.body.synced).toBe('number');
      expect(typeof response.body.errors).toBe('number');
    }, 60000);

    it('should return error for invalid category', async () => {
      await request(app.getHttpServer())
        .post('/v1/rpg/dnd5e/sync/invalid-category')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(500);
    });
  });

  describe('POST /v1/rpg/dnd5e/sync/all', () => {
    it('should sync all categories', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/rpg/dnd5e/sync/all')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
      expect(Object.keys(response.body).length).toBeGreaterThan(0);
      
      const firstCategory = Object.keys(response.body)[0];
      expect(response.body[firstCategory]).toHaveProperty('synced');
      expect(response.body[firstCategory]).toHaveProperty('errors');
    }, 300000);
  });
});

