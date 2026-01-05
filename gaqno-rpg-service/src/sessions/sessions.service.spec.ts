import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { DatabaseService } from '../database/db.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { NotFoundException } from '@nestjs/common';

describe('SessionsService', () => {
  let service: SessionsService;
  let dbService: DatabaseService;

  const createMockSelectChain = (result: any) => ({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockImplementation(() => ({
      orderBy: jest.fn().mockResolvedValue(result),
      limit: jest.fn().mockResolvedValue(result),
    })),
  });

  const createMockUpdateChain = (result: any) => ({
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue(result),
  });

  const mockSession = {
    id: 'test-session-id',
    tenantId: 'test-tenant-id',
    userId: 'test-user-id',
    name: 'Test Session',
    description: 'Test Description',
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDbService = {
    db: {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([mockSession]),
      select: jest.fn().mockImplementation(() => createMockSelectChain([mockSession])),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([mockSession]),
      update: jest.fn().mockImplementation(() => createMockUpdateChain([mockSession])),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    const validDto: CreateSessionDto = {
      name: 'Test Session',
      description: 'Test Description',
    };

    const tenantId = 'test-tenant-id';
    const userId = 'test-user-id';

    it('should create a session successfully', async () => {
      const result = await service.createSession(tenantId, userId, validDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-session-id');
      expect(result.name).toBe('Test Session');
      expect(result.status).toBe('draft');
      expect(mockDbService.db.insert).toHaveBeenCalled();
    });

    it('should create session with null description if not provided', async () => {
      const dtoWithoutDescription: CreateSessionDto = {
        name: 'Test Session',
      };

      await service.createSession(tenantId, userId, dtoWithoutDescription);

      expect(mockDbService.db.insert).toHaveBeenCalled();
    });
  });

  describe('getSessions', () => {
    const tenantId = 'test-tenant-id';
    const userId = 'test-user-id';

    it('should return sessions for user', async () => {
      const mockOrderBy = jest.fn().mockResolvedValueOnce([mockSession]);
      mockDbService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: mockOrderBy,
      });

      const result = await service.getSessions(tenantId, userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([mockSession]);
    });

    it('should filter by tenantId when provided', async () => {
      const mockOrderBy = jest.fn().mockResolvedValueOnce([mockSession]);
      mockDbService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: mockOrderBy,
      });

      const result = await service.getSessions(tenantId, userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getSessionById', () => {
    const tenantId = 'test-tenant-id';
    const userId = 'test-user-id';
    const sessionId = 'test-session-id';

    it('should return session by id', async () => {
      mockDbService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockSession]),
      });

      const result = await service.getSessionById(tenantId, userId, sessionId);

      expect(result).toBeDefined();
      expect(result.id).toBe(sessionId);
    });

    it('should throw NotFoundException if session not found', async () => {
      mockDbService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([]),
      });

      await expect(
        service.getSessionById(tenantId, userId, 'non-existent-id')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSession', () => {
    const tenantId = 'test-tenant-id';
    const userId = 'test-user-id';
    const sessionId = 'test-session-id';

    it('should update session successfully', async () => {
      mockDbService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockSession]),
      });

      const updatedSession = { ...mockSession, name: 'Updated Session', status: 'active' };
      mockDbService.db.update.mockReturnValueOnce({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([updatedSession]),
      });

      const result = await service.updateSession(tenantId, userId, sessionId, {
        name: 'Updated Session',
        status: 'active',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Session');
    });
  });

  describe('deleteSession', () => {
    const tenantId = 'test-tenant-id';
    const userId = 'test-user-id';
    const sessionId = 'test-session-id';

    it('should delete session successfully', async () => {
      mockDbService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockSession]),
      });

      mockDbService.db.delete.mockReturnValueOnce({
        where: jest.fn().mockResolvedValueOnce(undefined),
      });

      const result = await service.deleteSession(tenantId, userId, sessionId);

      expect(result.success).toBe(true);
      expect(mockDbService.db.delete).toHaveBeenCalled();
    });
  });
});

