import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fileRouter } from '@/server/routers/lambda/file';
import { AsyncTaskStatus } from '@/types/asyncTask';

// Patch: Use actual router context middleware to inject the correct models/services
function createCallerWithCtx(partialCtx: any = {}) {
  // All mocks are spies
  const fileModel = {
    checkHash: vi.fn().mockResolvedValue({ isExist: true }),
    clear: vi.fn().mockResolvedValue({} as any),
    create: vi.fn().mockResolvedValue({ id: 'test-id' }),
    delete: vi.fn().mockResolvedValue(undefined),
    deleteMany: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue([]),
  };

  const fileService = {
    deleteFile: vi.fn().mockResolvedValue(undefined),
    deleteFiles: vi.fn().mockResolvedValue(undefined),
    getFullFileUrl: vi.fn().mockResolvedValue('full-url'),
  };

  const chunkModel = {
    countByFileId: vi.fn().mockResolvedValue(5),
    countByFileIds: vi.fn().mockResolvedValue([{ count: 5, id: 'test-id' }]),
  };

  const asyncTaskModel = {
    delete: vi.fn(),
    findById: vi.fn(),
    findByIds: vi.fn().mockResolvedValue([
      {
        id: 'test-task-id',
        status: AsyncTaskStatus.Success,
      },
    ]),
  };

  const ctx = {
    asyncTaskModel,
    chunkModel,
    fileModel,
    fileService,
    serverDB: {} as any,
    userId: 'test-user',
    ...partialCtx,
  };

  return { caller: fileRouter.createCaller(ctx), ctx };
}

vi.mock('@/config/db', () => ({
  serverDBEnv: {
    REMOVE_GLOBAL_FILE: false,
  },
}));

vi.mock('@/database/models/asyncTask', () => ({
  AsyncTaskModel: vi.fn(() => ({
    delete: vi.fn(),
    findById: vi.fn(),
    findByIds: vi.fn(),
  })),
}));

vi.mock('@/database/models/chunk', () => ({
  ChunkModel: vi.fn(() => ({
    countByFileId: vi.fn(),
    countByFileIds: vi.fn(),
  })),
}));

vi.mock('@/database/models/file', () => ({
  FileModel: vi.fn(() => ({
    checkHash: vi.fn(),
    clear: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    findById: vi.fn(),
    query: vi.fn(),
  })),
}));

vi.mock('@/server/services/file', () => ({
  FileService: vi.fn(() => ({
    deleteFile: vi.fn(),
    deleteFiles: vi.fn(),
    getFullFileUrl: vi.fn(),
  })),
}));

describe('fileRouter', () => {
  let ctx: any;
  let caller: any;
  let mockFile: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFile = {
      accessedAt: new Date(),
      createdAt: new Date(),
      fileHash: null,
      chunkTaskId: null,
      fileType: 'text',
      clientId: null,
      id: 'test-id',
      embeddingTaskId: null,
      name: 'test.txt',
      metadata: {},
      size: 100,
      updatedAt: new Date(),
      url: 'test-url',
      userId: 'test-user',
    };

    // Use actual context with default mocks
    ({ ctx, caller } = createCallerWithCtx());
  });

  describe('checkFileHash', () => {
    it('should handle when fileModel.checkHash returns undefined', async () => {
      ctx.fileModel.checkHash.mockResolvedValue(undefined);
      await expect(caller.checkFileHash({ hash: 'test-hash' })).resolves.toBeUndefined();
    });
  });

  describe('createFile', () => {
    it('should throw if fileModel.checkHash returns undefined', async () => {
      ctx.fileModel.checkHash.mockResolvedValue(undefined);
      await expect(
        caller.createFile({
          fileType: 'text',
          hash: 'test-hash',
          metadata: {},
          name: 'test.txt',
          size: 100,
          url: 'test-url',
        }),
      ).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should throw error when file not found', async () => {
      ctx.fileModel.findById.mockResolvedValue(null);

      await expect(caller.findById({ id: 'invalid-id' })).rejects.toThrow(TRPCError);
    });
  });

  describe('getFileItemById', () => {
    it('should throw error when file not found', async () => {
      ctx.fileModel.findById.mockResolvedValue(null);

      await expect(caller.getFileItemById({ id: 'invalid-id' })).rejects.toThrow(TRPCError);
    });
  });

  describe('getFiles', () => {
    it('should handle fileModel.query returning undefined', async () => {
      ctx.fileModel.query.mockResolvedValue(undefined);

      await expect(caller.getFiles({})).rejects.toThrow();
    });
  });

  describe('removeFile', () => {
    it('should do nothing when file not found', async () => {
      ctx.fileModel.delete.mockResolvedValue(null);

      await caller.removeFile({ id: 'invalid-id' });

      expect(ctx.fileService.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('removeFiles', () => {
    it('should do nothing when no files found', async () => {
      ctx.fileModel.deleteMany.mockResolvedValue([]);

      await caller.removeFiles({ ids: ['invalid-1', 'invalid-2'] });

      expect(ctx.fileService.deleteFiles).not.toHaveBeenCalled();
    });
  });

  describe('removeFileAsyncTask', () => {
    it('should do nothing when file not found', async () => {
      ctx.fileModel.findById.mockResolvedValue(null);

      await caller.removeFileAsyncTask({ id: 'test-id', type: 'chunk' });

      expect(ctx.asyncTaskModel.delete).not.toHaveBeenCalled();
    });

    it('should do nothing when task id is missing', async () => {
      ctx.fileModel.findById.mockResolvedValue(mockFile);

      await caller.removeFileAsyncTask({ id: 'test-id', type: 'embedding' });

      expect(ctx.asyncTaskModel.delete).not.toHaveBeenCalled();

      await caller.removeFileAsyncTask({ id: 'test-id', type: 'chunk' });

      expect(ctx.asyncTaskModel.delete).not.toHaveBeenCalled();
    });
  });
});
