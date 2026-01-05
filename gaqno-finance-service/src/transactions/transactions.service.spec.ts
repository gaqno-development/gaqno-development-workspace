import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { DatabaseService } from '../database/db.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionType, TransactionStatus } from './dto/create-transaction.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let dbService: DatabaseService;

  const mockDbService = {
    db: {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{
        id: 'test-transaction-id',
        tenantId: 'test-tenant-id',
        userId: 'test-user-id',
        description: 'Test Transaction',
        amount: '1230.30',
        type: 'expense',
        transactionDate: new Date('2025-12-25'),
        dueDate: null,
        categoryId: 'test-category-id',
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
      }]),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
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

    const tenantId = 'test-tenant-id';
    const userId = 'test-user-id';

    it('should create a transaction successfully', async () => {
      const result = await service.createTransaction(tenantId, userId, validDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-transaction-id');
      expect(result.description).toBe('Test Transaction');
      expect(result.amount).toBe(1230.3);
      expect(result.type).toBe('expense');
      expect(mockDbService.db.insert).toHaveBeenCalled();
    });

    it('should throw error if userId is missing', async () => {
      await expect(
        service.createTransaction(tenantId, '', validDto)
      ).rejects.toThrow('ID do usuário é obrigatório para criar transações');
    });

    it('should throw error if description is empty', async () => {
      const invalidDto = { ...validDto, description: '' };
      await expect(
        service.createTransaction(tenantId, userId, invalidDto)
      ).rejects.toThrow('A descrição da transação é obrigatória');
    });

    it('should throw error if amount is zero or negative', async () => {
      const invalidDto = { ...validDto, amount: 0 };
      await expect(
        service.createTransaction(tenantId, userId, invalidDto)
      ).rejects.toThrow('O valor da transação deve ser maior que zero');
    });

    it('should throw error if transaction_date is missing', async () => {
      const invalidDto = { ...validDto, transaction_date: '' };
      await expect(
        service.createTransaction(tenantId, userId, invalidDto)
      ).rejects.toThrow('A data da transação é obrigatória');
    });

    it('should handle null values correctly', async () => {
      const result = await service.createTransaction(tenantId, userId, validDto);
      
      expect(result.category).toBeNull();
      expect(result.subcategory).toBeNull();
      expect(result.creditCard).toBeNull();
    });

    it('should convert amount from string to number', async () => {
      const result = await service.createTransaction(tenantId, userId, validDto);
      
      expect(typeof result.amount).toBe('number');
      expect(result.amount).toBe(1230.3);
    });

    it('should handle recurring transaction', async () => {
      const recurringDto: CreateTransactionDto = {
        ...validDto,
        is_recurring: true,
        recurring_type: 'day_15' as any,
        recurring_day: 15,
      };

      mockDbService.db.returning.mockResolvedValueOnce([{
        ...mockDbService.db.returning().then((r: any) => r[0]),
        isRecurring: true,
        recurringType: 'day_15',
        recurringDay: 15,
      }]);

      const result = await service.createTransaction(tenantId, userId, recurringDto);

      expect(result).toBeDefined();
      expect(mockDbService.db.insert).toHaveBeenCalled();
    });
  });
});

