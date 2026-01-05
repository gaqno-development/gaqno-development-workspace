import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { DatabaseService } from '../database/db.service';
import { CreateTransactionDto, TransactionType, TransactionStatus } from './dto/create-transaction.dto';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

describe('TransactionsController (integration)', () => {
  let app: INestApplication;
  let transactionsService: TransactionsService;

  const mockTransactionsService = {
    createTransaction: jest.fn(),
    getTransactions: jest.fn(),
    getTransactionById: jest.fn(),
    updateTransaction: jest.fn(),
    deleteTransaction: jest.fn(),
  };

  const mockUser = {
    sub: 'a8cdf1d2-16d9-4bd8-81b1-810ff8ab0249',
    tenantId: '6ebf2ba8-2f2c-42b4-be43-7016c05023c3',
  };

  const mockTransaction = {
    id: 'test-transaction-id',
    tenantId: mockUser.tenantId,
    userId: mockUser.sub,
    description: 'Pai',
    amount: 1230.3,
    type: 'expense',
    transactionDate: new Date('2025-12-25'),
    dueDate: null,
    categoryId: '8dbec804-1ce8-4cbb-890a-c01d69ce3dc9',
    subcategoryId: null,
    creditCardId: null,
    status: 'a_pagar',
    assignedTo: null,
    notes: null,
    installmentCount: 1,
    installmentCurrent: 1,
    isRecurring: false,
    recurringType: null,
    recurringDay: null,
    recurringMonths: null,
    icon: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: null,
    subcategory: null,
    creditCard: null,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: DatabaseService,
          useValue: {},
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Mock do middleware de autenticação
    app.use((req: any, res: any, next: any) => {
      req.user = mockUser;
      next();
    });
    
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

    transactionsService = moduleFixture.get<TransactionsService>(TransactionsService);

    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/finance/transactions', () => {
    const validDto: CreateTransactionDto = {
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

    it('should create a transaction successfully', async () => {
      mockTransactionsService.createTransaction.mockResolvedValue(mockTransaction);

      // Mock the auth middleware by creating a custom request handler
      const response = await request(app.getHttpServer())
        .post('/v1/finance/transactions')
        .set('Cookie', `gaqno_session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOGNkZjFkMi0xNmQ5LTRiZDgtODFiMS04MTBmZjhhYjAyNDkiLCJlbWFpbCI6ImdhYnJpZWwuYXF1aW5vQG91dGxvb2suY29tIiwidGVuYW50SWQiOiI2ZWJmMmJhOC0yZjJjLTQyYjQtYmU0My03MDE2YzA1MDIzYzMiLCJ0eXBlIjoiYWNjZXNzIiwianRpIjoiNTllYmZiNjktZTJiYS00NGE5LTk5ODktNmU1NDQxMjFkMjZhIiwiaWF0IjoxNzY2Njg1NzgzLCJleHAiOjE3NjY2ODkzODN9.xm_bT_L6GdOIkXat1KMqKpgkHou1kxpZSqqmtGpC120`)
        .set('Origin', 'http://localhost:3000')
        .send(validDto)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.description).toBe('Pai');
      expect(response.body.amount).toBe(1230.3);
      expect(mockTransactionsService.createTransaction).toHaveBeenCalledWith(
        mockUser.tenantId,
        mockUser.sub,
        expect.objectContaining({
          description: 'Pai',
          amount: 1230.3,
          type: TransactionType.EXPENSE,
        })
      );
    });

    it('should return 400 if description is missing', async () => {
      const invalidDto = { ...validDto };
      delete (invalidDto as any).description;

      const testJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOGNkZjFkMi0xNmQ5LTRiZDgtODFiMS04MTBmZjhhYjAyNDkiLCJlbWFpbCI6ImdhYnJpZWwuYXF1aW5vQG91dGxvb2suY29tIiwidGVuYW50SWQiOiI2ZWJmMmJhOC0yZjJjLTQyYjQtYmU0My03MDE2YzA1MDIzYzMiLCJ0eXBlIjoiYWNjZXNzIiwianRpIjoiNTllYmZiNjktZTJiYS00NGE5LTk5ODktNmU1NDQxMjFkMjZhIiwiaWF0IjoxNzY2Njg1NzgzLCJleHAiOjE3NjY2ODkzODN9.xm_bT_L6GdOIkXat1KMqKpgkHou1kxpZSqqmtGpC120';

      await request(app.getHttpServer())
        .post('/v1/finance/transactions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 if amount is missing', async () => {
      const invalidDto = { ...validDto };
      delete (invalidDto as any).amount;

      const testJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOGNkZjFkMi0xNmQ5LTRiZDgtODFiMS04MTBmZjhhYjAyNDkiLCJlbWFpbCI6ImdhYnJpZWwuYXF1aW5vQG91dGxvb2suY29tIiwidGVuYW50SWQiOiI2ZWJmMmJhOC0yZjJjLTQyYjQtYmU0My03MDE2YzA1MDIzYzMiLCJ0eXBlIjoiYWNjZXNzIiwianRpIjoiNTllYmZiNjktZTJiYS00NGE5LTk5ODktNmU1NDQxMjFkMjZhIiwiaWF0IjoxNzY2Njg1NzgzLCJleHAiOjE3NjY2ODkzODN9.xm_bT_L6GdOIkXat1KMqKpgkHou1kxpZSqqmtGpC120';

      await request(app.getHttpServer())
        .post('/v1/finance/transactions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 if transaction_date is missing', async () => {
      const invalidDto = { ...validDto };
      delete (invalidDto as any).transaction_date;

      const testJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOGNkZjFkMi0xNmQ5LTRiZDgtODFiMS04MTBmZjhhYjAyNDkiLCJlbWFpbCI6ImdhYnJpZWwuYXF1aW5vQG91dGxvb2suY29tIiwidGVuYW50SWQiOiI2ZWJmMmJhOC0yZjJjLTQyYjQtYmU0My03MDE2YzA1MDIzYzMiLCJ0eXBlIjoiYWNjZXNzIiwianRpIjoiNTllYmZiNjktZTJiYS00NGE5LTk5ODktNmU1NDQxMjFkMjZhIiwiaWF0IjoxNzY2Njg1NzgzLCJleHAiOjE3NjY2ODkzODN9.xm_bT_L6GdOIkXat1KMqKpgkHou1kxpZSqqmtGpC120';

      await request(app.getHttpServer())
        .post('/v1/finance/transactions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send(invalidDto)
        .expect(400);
    });

    it('should handle recurring transaction', async () => {
      const recurringDto: CreateTransactionDto = {
        ...validDto,
        is_recurring: true,
        recurring_type: 'day_15' as any,
        recurring_day: 15,
      };

      const recurringTransaction = {
        ...mockTransaction,
        isRecurring: true,
        recurringType: 'day_15',
        recurringDay: 15,
      };

      mockTransactionsService.createTransaction.mockResolvedValue(recurringTransaction);

      const testJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOGNkZjFkMi0xNmQ5LTRiZDgtODFiMS04MTBmZjhhYjAyNDkiLCJlbWFpbCI6ImdhYnJpZWwuYXF1aW5vQG91dGxvb2suY29tIiwidGVuYW50SWQiOiI2ZWJmMmJhOC0yZjJjLTQyYjQtYmU0My03MDE2YzA1MDIzYzMiLCJ0eXBlIjoiYWNjZXNzIiwianRpIjoiNTllYmZiNjktZTJiYS00NGE5LTk5ODktNmU1NDQxMjFkMjZhIiwiaWF0IjoxNzY2Njg1NzgzLCJleHAiOjE3NjY2ODkzODN9.xm_bT_L6GdOIkXat1KMqKpgkHou1kxpZSqqmtGpC120';

      const response = await request(app.getHttpServer())
        .post('/v1/finance/transactions')
        .set('Cookie', `gaqno_session=${testJwtToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send(recurringDto)
        .expect(201);

      expect(response.body.isRecurring).toBe(true);
      expect(response.body.recurringType).toBe('day_15');
    });
  });
});

