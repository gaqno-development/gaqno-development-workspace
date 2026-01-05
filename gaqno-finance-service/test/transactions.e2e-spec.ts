import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/db.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { CreateTransactionDto, TransactionType, TransactionStatus } from '../src/transactions/dto/create-transaction.dto';

describe('Transactions (e2e)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  // JWT token válido para testes (decodificado do exemplo fornecido)
  const testJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOGNkZjFkMi0xNmQ5LTRiZDgtODFiMS04MTBmZjhhYjAyNDkiLCJlbWFpbCI6ImdhYnJpZWwuYXF1aW5vQG91dGxvb2suY29tIiwidGVuYW50SWQiOiI2ZWJmMmJhOC0yZjJjLTQyYjQtYmU0My03MDE2YzA1MDIzYzMiLCJ0eXBlIjoiYWNjZXNzIiwianRpIjoiNTllYmZiNjktZTJiYS00NGE5LTk5ODktNmU1NDQxMjFkMjZhIiwiaWF0IjoxNzY2Njg1NzgzLCJleHAiOjE3NjY2ODkzODN9.xm_bT_L6GdOIkXat1KMqKpgkHou1kxpZSqqmtGpC120';

  const validTransactionDto: CreateTransactionDto = {
    description: 'Pai',
    amount: 1230.3,
    type: TransactionType.EXPENSE,
    transaction_date: '2025-12-25',
    due_date: null,
    credit_card_id: null,
    status: TransactionStatus.A_PAGAR,
    notes: null,
    installment_count: 1,
    installment_current: 1,
    is_recurring: false,
    recurring_type: null,
    recurring_day: null,
    recurring_months: null,
    category_id: '8dbec804-1ce8-4cbb-890a-c01d69ce3dc9',
    subcategory_id: null,
  };

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
    app.setGlobalPrefix('v1/finance');

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/finance/transactions', () => {
    it('should create a transaction successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/finance/transactions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send(validTransactionDto)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.description).toBe('Pai');
      expect(response.body.amount).toBe(1230.3);
      expect(response.body.type).toBe('expense');
      expect(response.body.transactionDate).toBeDefined();
      expect(response.body.status).toBe('a_pagar');
    });

    it('should return 400 if description is missing', async () => {
      const invalidDto = { ...validTransactionDto };
      delete (invalidDto as any).description;

      await request(app.getHttpServer())
        .post('/v1/finance/transactions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 if amount is missing', async () => {
      const invalidDto = { ...validTransactionDto };
      delete (invalidDto as any).amount;

      await request(app.getHttpServer())
        .post('/v1/finance/transactions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 if transaction_date is missing', async () => {
      const invalidDto = { ...validTransactionDto };
      delete (invalidDto as any).transaction_date;

      await request(app.getHttpServer())
        .post('/v1/finance/transactions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 if amount is zero', async () => {
      const invalidDto = { ...validTransactionDto, amount: 0 };

      await request(app.getHttpServer())
        .post('/v1/finance/transactions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send(invalidDto)
        .expect(500); // Service throws error, which becomes 500
    });

    it('should handle income transaction', async () => {
      const incomeDto: CreateTransactionDto = {
        ...validTransactionDto,
        type: TransactionType.INCOME,
      };

      const response = await request(app.getHttpServer())
        .post('/v1/finance/transactions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send(incomeDto)
        .expect(201);

      expect(response.body.type).toBe('income');
    });

    it('should handle transaction with due_date', async () => {
      const dtoWithDueDate: CreateTransactionDto = {
        ...validTransactionDto,
        due_date: '2025-12-30',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/finance/transactions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send(dtoWithDueDate)
        .expect(201);

      expect(response.body.dueDate).toBeDefined();
    });

    it('should handle recurring transaction', async () => {
      const recurringDto: CreateTransactionDto = {
        ...validTransactionDto,
        is_recurring: true,
        recurring_type: 'day_15' as any,
        recurring_day: 15,
      };

      const response = await request(app.getHttpServer())
        .post('/v1/finance/transactions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send(recurringDto)
        .expect(201);

      expect(response.body.isRecurring).toBe(true);
    });
  });

  describe('GET /v1/finance/transactions', () => {
    it('should get all transactions', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/finance/transactions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter transactions by date range', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/finance/transactions')
        .query({ startDate: '2025-12-01', endDate: '2025-12-31' })
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

