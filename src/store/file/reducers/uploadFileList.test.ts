import { describe, expect, it } from 'vitest';

import { UploadFileItem } from '@/types/files/upload';

import { uploadFileListReducer } from './uploadFileList';

// 创建测试用的文件项
const createMockFile = (id: string): UploadFileItem => ({
  file: new File(['test'], 'test.txt'),
  id,
  status: 'pending',
  uploadState: { progress: 10, restTime: 2, speed: 2 },
});

describe('uploadFileListReducer', () => {
  describe('addFile action', () => {
    it('should add a file at the end by default', () => {
      const initialState: UploadFileItem[] = [createMockFile('1')];
      const newFile = createMockFile('2');

      const result = uploadFileListReducer(initialState, {
        file: newFile,
        type: 'addFile',
      });

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual(newFile);
    });

    it('should add a file at the start when atStart is true', () => {
      const initialState: UploadFileItem[] = [createMockFile('1')];
      const newFile = createMockFile('2');

      const result = uploadFileListReducer(initialState, {
        atStart: true,
        file: newFile,
        type: 'addFile',
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(newFile);
    });
  });

  describe('addFiles action', () => {
    it('should add multiple files at the end by default', () => {
      const initialState: UploadFileItem[] = [createMockFile('1')];
      const newFiles = [createMockFile('2'), createMockFile('3')];

      const result = uploadFileListReducer(initialState, {
        files: newFiles,
        type: 'addFiles',
      });

      expect(result).toHaveLength(3);
      expect(result.slice(1)).toEqual(newFiles);
    });

    it('should add multiple files at the start when atStart is true', () => {
      const initialState: UploadFileItem[] = [createMockFile('1')];
      const newFiles = [createMockFile('2'), createMockFile('3')];

      const result = uploadFileListReducer(initialState, {
        atStart: true,
        files: newFiles,
        type: 'addFiles',
      });

      expect(result).toHaveLength(3);
      expect(result.slice(0, 2)).toEqual(newFiles.reverse());
    });
  });

  describe('updateFile action', () => {
    it('should update file properties', () => {
      const initialState: UploadFileItem[] = [createMockFile('1')];
      const updateValue = { name: 'updated.txt' } as File;

      const result = uploadFileListReducer(initialState, {
        id: '1',
        type: 'updateFile',
        value: { file: updateValue },
      });

      expect(result[0].file.name).toBe('updated.txt');
    });

    it('should not modify state if file id is not found', () => {
      const initialState: UploadFileItem[] = [createMockFile('1')];

      const result = uploadFileListReducer(initialState, {
        id: 'non-existent',
        type: 'updateFile',
        value: { file: { name: 'updated.txt' } as File },
      });

      expect(result).toEqual(initialState);
    });
  });

  describe('updateFileStatus action', () => {
    it('should update file status', () => {
      const initialState: UploadFileItem[] = [createMockFile('1')];

      const result = uploadFileListReducer(initialState, {
        id: '1',
        status: 'success',
        type: 'updateFileStatus',
      });

      expect(result[0].status).toBe('success');
    });
  });

  describe('updateFileUploadState action', () => {
    it('should update file upload state', () => {
      const initialState: UploadFileItem[] = [createMockFile('1')];

      const result = uploadFileListReducer(initialState, {
        id: '1',
        type: 'updateFileUploadState',
        uploadState: { progress: 12, restTime: 12, speed: 12 },
      });

      expect(result[0].uploadState).toEqual({
        progress: 12,
        restTime: 12,
        speed: 12,
      });
    });
  });

  describe('removeFile action', () => {
    it('should remove a file by id', () => {
      const initialState: UploadFileItem[] = [createMockFile('1'), createMockFile('2')];

      const result = uploadFileListReducer(initialState, {
        id: '1',
        type: 'removeFile',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should not modify state if file id is not found', () => {
      const initialState: UploadFileItem[] = [createMockFile('1')];

      const result = uploadFileListReducer(initialState, {
        id: 'non-existent',
        type: 'removeFile',
      });

      expect(result).toEqual(initialState);
    });
  });

  describe('removeFiles action', () => {
    it('should remove multiple files by ids', () => {
      const initialState: UploadFileItem[] = [
        createMockFile('1'),
        createMockFile('2'),
        createMockFile('3'),
      ];

      const result = uploadFileListReducer(initialState, {
        ids: ['1', '2'],
        type: 'removeFiles',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    it('should not modify state if no file ids are found', () => {
      const initialState: UploadFileItem[] = [createMockFile('1')];

      const result = uploadFileListReducer(initialState, {
        ids: ['non-existent'],
        type: 'removeFiles',
      });

      expect(result).toEqual(initialState);
    });
  });

  describe('error handling', () => {
    it('should throw error for unhandled action type', () => {
      const initialState: UploadFileItem[] = [];

      // @ts-expect-error Testing invalid action type
      expect(() => uploadFileListReducer(initialState, { type: 'invalid' })).toThrow(
        'Unhandled action type',
      );
    });
  });
});
