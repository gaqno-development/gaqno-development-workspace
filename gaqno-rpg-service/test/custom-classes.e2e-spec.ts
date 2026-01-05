import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/db.service';
import { rpgCampaigns, rpgCustomClasses } from '../src/database/schema';
import { eq } from 'drizzle-orm';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { McpService } from '../src/mcp/mcp.service';

const testJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOGNkZjFkMi0xNmQ5LTRiZDgtODFiMS04MTBmZjhhYjAyNDkiLCJ0ZW5hbnRJZCI6IjZlYmYyYmE4LTJmMmMtNDJiNC1iZTQzLTcwMTZjMDUwMjNjMyIsImlhdCI6MTYxNjIzOTAyMn0.test';

describe('Custom Classes (e2e)', () => {
  let app: INestApplication;
  let dbService: DatabaseService;
  let campaignId: string;
  let userId: string;
  let classId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(McpService)
      .useValue({
        getClassStartingEquipment: jest.fn().mockResolvedValue({
          class: 'Fighter',
          starting_equipment: [],
          equipment_options: [],
        }),
        searchAllCategories: jest.fn().mockResolvedValue({
          query: 'fighter',
          results: { classes: { items: [{ name: 'Fighter', index: 'fighter' }], count: 1 } },
          total_count: 1,
          top_results: [{ category: 'classes', name: 'Fighter', index: 'fighter', score: 100 }],
        }),
        filterSpellsByLevel: jest.fn().mockResolvedValue({
          query: 'Spells level 0-5',
          items: [],
          count: 0,
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    dbService = moduleFixture.get<DatabaseService>(DatabaseService);
    
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

    const payload = JSON.parse(Buffer.from(testJwtToken.split('.')[1], 'base64').toString());
    userId = payload.sub;
    
    const [campaign] = await dbService.db
      .insert(rpgCampaigns)
      .values({
        userId,
        name: 'Test Campaign for Classes E2E',
        isPublic: 'false',
        status: 'draft',
      })
      .returning();
    
    campaignId = campaign.id;
  });

  afterAll(async () => {
    if (classId) {
      await dbService.db.delete(rpgCustomClasses).where(eq(rpgCustomClasses.id, classId));
    }
    if (campaignId) {
      await dbService.db.delete(rpgCampaigns).where(eq(rpgCampaigns.id, campaignId));
    }
    await app.close();
  });

  it('/campaigns/:campaignId/custom-classes (POST) - should create a custom class', async () => {
    const response = await request(app.getHttpServer())
      .post(`/v1/rpg/campaigns/${campaignId}/custom-classes`)
      .set('Cookie', `gaqno_session=${testJwtToken}`)
      .set('Origin', 'http://localhost:3000')
      .set('Content-Type', 'application/json')
      .send({
        name: 'Custom Fighter',
        description: 'A custom fighter variant',
        baseClass: 'fighter',
        hitDie: 10,
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Custom Fighter');
    expect(response.body.baseClass).toBe('fighter');
    classId = response.body.id;
  });

  it('/campaigns/:campaignId/custom-classes (GET) - should get custom classes', async () => {
    const response = await request(app.getHttpServer())
      .get(`/v1/rpg/campaigns/${campaignId}/custom-classes`)
      .set('Cookie', `gaqno_session=${testJwtToken}`)
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('/campaigns/:campaignId/custom-classes/:id (GET) - should get a custom class by id', async () => {
    if (!classId) return;
    
    const response = await request(app.getHttpServer())
      .get(`/v1/rpg/campaigns/${campaignId}/custom-classes/${classId}`)
      .set('Cookie', `gaqno_session=${testJwtToken}`)
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    expect(response.body).toHaveProperty('id', classId);
    expect(response.body.name).toBe('Custom Fighter');
  });

  it('/campaigns/:campaignId/custom-classes/:id (PATCH) - should update a custom class', async () => {
    if (!classId) return;
    
    const response = await request(app.getHttpServer())
      .patch(`/v1/rpg/campaigns/${campaignId}/custom-classes/${classId}`)
      .set('Cookie', `gaqno_session=${testJwtToken}`)
      .set('Origin', 'http://localhost:3000')
      .set('Content-Type', 'application/json')
      .send({
        description: 'Updated description',
      })
      .expect(200);

    expect(response.body.description).toBe('Updated description');
  });
});

