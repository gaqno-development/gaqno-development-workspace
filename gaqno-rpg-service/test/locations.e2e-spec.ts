import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/db.service';
import { rpgCampaigns, rpgLocations } from '../src/database/schema';
import { eq } from 'drizzle-orm';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { McpService } from '../src/mcp/mcp.service';

const testJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOGNkZjFkMi0xNmQ5LTRiZDgtODFiMS04MTBmZjhhYjAyNDkiLCJ0ZW5hbnRJZCI6IjZlYmYyYmE4LTJmMmMtNDJiNC1iZTQzLTcwMTZjMDUwMjNjMyIsImlhdCI6MTYxNjIzOTAyMn0.test';

describe('Locations (e2e)', () => {
  let app: INestApplication;
  let dbService: DatabaseService;
  let campaignId: string;
  let userId: string;
  let locationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(McpService)
      .useValue({
        searchAllCategories: jest.fn().mockResolvedValue({
          query: 'dungeon',
          results: {},
          total_count: 0,
          top_results: [],
        }),
        findMonstersByCR: jest.fn().mockResolvedValue({
          query: 'Monsters CR 1-5',
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
        name: 'Test Campaign for Locations E2E',
        isPublic: 'false',
        status: 'draft',
      })
      .returning();
    
    campaignId = campaign.id;
  });

  afterAll(async () => {
    if (locationId) {
      await dbService.db.delete(rpgLocations).where(eq(rpgLocations.id, locationId));
    }
    if (campaignId) {
      await dbService.db.delete(rpgCampaigns).where(eq(rpgCampaigns.id, campaignId));
    }
    await app.close();
  });

  it('/campaigns/:campaignId/locations (POST) - should create a location', async () => {
    const response = await request(app.getHttpServer())
      .post(`/v1/rpg/campaigns/${campaignId}/locations`)
      .set('Cookie', `gaqno_session=${testJwtToken}`)
      .set('Origin', 'http://localhost:3000')
      .set('Content-Type', 'application/json')
      .send({
        name: 'Test Dungeon',
        type: 'dungeon',
        description: 'A test dungeon',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Dungeon');
    expect(response.body.type).toBe('dungeon');
    locationId = response.body.id;
  });

  it('/campaigns/:campaignId/locations (GET) - should get locations', async () => {
    const response = await request(app.getHttpServer())
      .get(`/v1/rpg/campaigns/${campaignId}/locations`)
      .set('Cookie', `gaqno_session=${testJwtToken}`)
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('/campaigns/:campaignId/locations/:id (GET) - should get a location by id', async () => {
    if (!locationId) return;
    
    const response = await request(app.getHttpServer())
      .get(`/v1/rpg/campaigns/${campaignId}/locations/${locationId}`)
      .set('Cookie', `gaqno_session=${testJwtToken}`)
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    expect(response.body).toHaveProperty('id', locationId);
    expect(response.body.name).toBe('Test Dungeon');
  });

  it('/campaigns/:campaignId/locations/:id (PATCH) - should update a location', async () => {
    if (!locationId) return;
    
    const response = await request(app.getHttpServer())
      .patch(`/v1/rpg/campaigns/${campaignId}/locations/${locationId}`)
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

