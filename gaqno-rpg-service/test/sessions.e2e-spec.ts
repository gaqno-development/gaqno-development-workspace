import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const testJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOGNkZjFkMi0xNmQ5LTRiZDgtODFiMS04MTBmZjhhYjAyNDkiLCJ0ZW5hbnRJZCI6IjZlYmYyYmE4LTJmMmMtNDJiNC1iZTQzLTcwMTZjMDUwMjNjMyIsImlhdCI6MTYxNjIzOTAyMn0.test';

describe('Sessions (e2e)', () => {
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

  describe('POST /v1/rpg/sessions', () => {
    it('should create a session successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/rpg/sessions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send({
          name: 'E2E Test Session',
          description: 'Test Description',
        })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('E2E Test Session');
      expect(response.body.status).toBe('draft');
    });

    it('should return 400 if name is missing', async () => {
      await request(app.getHttpServer())
        .post('/v1/rpg/sessions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send({
          description: 'Test Description',
        })
        .expect(400);
    });
  });

  describe('GET /v1/rpg/sessions', () => {
    it('should return sessions list', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/rpg/sessions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

