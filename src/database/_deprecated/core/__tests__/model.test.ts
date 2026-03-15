import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { BaseModel } from '../model';

// Define a mock schema for testing
const mockSchema = z.object({
  content: z.string(),
  name: z.string(),
});

// Define a mock table name
const mockTableName = 'files';

describe('BaseModel', () => {
  let baseModel: BaseModel<typeof mockTableName>;

  beforeEach(() => {
    baseModel = new BaseModel(mockTableName, mockSchema);
    // Mock the console.error to test error logging
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // console.error = originalConsoleError;
  });

  it('should have a table property', () => {
    expect(baseModel.table).toBeDefined();
  });

  describe('add method', () => {
    it('should add a valid record to the database', async () => {
      const validData = {
        content: 'Hello, World!',
        name: 'testfile.txt',
      };

      const result = await baseModel['_addWithSync'](validData);

      expect(result).toHaveProperty('id');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should throw an error and log to console when adding an invalid record', async () => {
      const invalidData = {
        // Invalid type, should be a string
content: 'Hello, World!', 
        name: 123,
      };

      await expect(baseModel['_addWithSync'](invalidData)).rejects.toThrow(TypeError);
    });
  });
});
