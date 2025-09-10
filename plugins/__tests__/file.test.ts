import { PluginTestHelper } from './test-helpers';
import FilePlugin from '../file/src/index';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('File Plugin', () => {
  let plugin: FilePlugin;
  let testHelper: PluginTestHelper;

  beforeEach(() => {
    plugin = new FilePlugin();
    testHelper = new PluginTestHelper();

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    testHelper.reset();
  });

  describe('Plugin Initialization', () => {
    test('should initialize plugin with correct config', () => {
      expect(plugin.config).toEqual({
        name: 'file',
        version: '1.0.0',
        description:
          'File operations plugin - read files into concepts and write concepts to files',
        main: 'dist/index.js',
      });
    });

    test('should have required methods', () => {
      expect(typeof plugin.initialize).toBe('function');
      expect(typeof plugin.cleanup).toBe('function');
      expect(typeof plugin.registerListeners).toBe('function');
      expect(typeof plugin.getHooks).toBe('function');
    });
  });

  describe('File Reading', () => {
    test('should read file content and create concepts', () => {
      const mockContent = 'Hello, World!';
      const mockStats = {
        size: 13,
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
      };

      mockedFs.readFileSync.mockReturnValue(mockContent);
      mockedFs.statSync.mockReturnValue(mockStats as any);

      const hooks = plugin.getHooks(testHelper.getFileBlock());
      const result = hooks['file']!([
        { name: 'file' },
        { name: 'read' },
        { name: 'test.txt' },
        { name: 'as' },
        { name: 'test_txt' },
      ]);

      expect(result).toEqual([]);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test.txt'),
        'utf-8'
      );
    });

    test('should create file content concept', () => {
      const mockContent = 'Hello, World!';
      const mockStats = {
        size: 13,
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
      };

      mockedFs.readFileSync.mockReturnValue(mockContent);
      mockedFs.statSync.mockReturnValue(mockStats as any);

      const hooks = plugin.getHooks(testHelper.getFileBlock());
      hooks['file']!([
        { name: 'file' },
        { name: 'read' },
        { name: 'test.txt' },
        { name: 'as' },
        { name: 'test_txt' },
      ]);

      const concepts = testHelper.getConcepts();
      expect(concepts.some(c => c.name === 'test_txt')).toBe(true);
    });

    test('should create file metadata concepts', () => {
      const mockContent = 'Hello, World!';
      const mockStats = {
        size: 13,
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
      };

      mockedFs.readFileSync.mockReturnValue(mockContent);
      mockedFs.statSync.mockReturnValue(mockStats as any);

      const hooks = plugin.getHooks(testHelper.getFileBlock());
      hooks['file']!([
        { name: 'file' },
        { name: 'read' },
        { name: 'test.txt' },
        { name: 'as' },
        { name: 'test_txt' },
      ]);

      const concepts = testHelper.getConcepts();
      expect(concepts.some(c => c.name === 'filename')).toBe(true);
      expect(concepts.some(c => c.name === 'type')).toBe(true);
      expect(concepts.some(c => c.name === 'size')).toBe(true);
    });

    test('should handle file read errors', () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      const hooks = plugin.getHooks(testHelper.getFileBlock());

      expect(() => {
        hooks['file']!([
          { name: 'file' },
          { name: 'read' },
          { name: 'nonexistent.txt' },
          { name: 'as' },
          { name: 'test_txt' },
        ]);
      }).toThrow('ENOENT: no such file or directory');
    });
  });

  describe('File Writing', () => {
    test('should write concept content to file', () => {
      // Create a concept with content
      testHelper.addConcept('test_concept');
      testHelper.addConcept('content');
      testHelper.addRelationship('test_concept', 'content', 'has');
      testHelper.addRelationship('content', 'Hello, World!', 'is');

      const hooks = plugin.getHooks(testHelper.getFileBlock());
      const result = hooks['file']!([
        { name: 'file' },
        { name: 'write' },
        { name: 'test_concept' },
        { name: 'to' },
        { name: 'test.txt' },
      ]);

      expect(result).toEqual([]);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test.txt'),
        expect.stringContaining('test_concept'),
        'utf-8'
      );
    });

    test('should handle file write errors', () => {
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      testHelper.addConcept('test_concept');
      testHelper.addConcept('content');
      testHelper.addRelationship('test_concept', 'content', 'has');
      testHelper.addRelationship('content', 'Hello, World!', 'is');

      const hooks = plugin.getHooks(testHelper.getFileBlock());

      expect(() => {
        hooks['file']!([
          { name: 'file' },
          { name: 'write' },
          { name: 'test_concept' },
          { name: 'to' },
          { name: '/root/test.txt' },
        ]);
      }).toThrow('EACCES: permission denied');
    });
  });

  describe('File Metadata Handling', () => {
    test('should extract file extension correctly', () => {
      const mockContent = 'Hello, World!';
      const mockStats = {
        size: 13,
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
      };

      mockedFs.readFileSync.mockReturnValue(mockContent);
      mockedFs.statSync.mockReturnValue(mockStats as any);

      const hooks = plugin.getHooks(testHelper.getFileBlock());
      hooks['file']!([
        { name: 'file' },
        { name: 'read' },
        { name: 'test.txt' },
        { name: 'as' },
        { name: 'test_txt' },
      ]);

      const relationships = testHelper.getRelationships();
      const filetypeRelationship = relationships.find(
        r =>
          r.pair.conceptA.name === 'extension' &&
          r.pair.conceptB.name === '.txt'
      );

      expect(filetypeRelationship).toBeDefined();
    });

    test('should extract file size correctly', () => {
      const mockContent = 'Hello, World!';
      const mockStats = {
        size: 13,
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
      };

      mockedFs.readFileSync.mockReturnValue(mockContent);
      mockedFs.statSync.mockReturnValue(mockStats as any);

      const hooks = plugin.getHooks(testHelper.getFileBlock());
      hooks['file']!([
        { name: 'file' },
        { name: 'read' },
        { name: 'test.txt' },
        { name: 'as' },
        { name: 'test_txt' },
      ]);

      const relationships = testHelper.getRelationships();
      const filesizeRelationship = relationships.find(
        r => r.pair.conceptA.name === 'size' && r.pair.conceptB.name === '13'
      );

      expect(filesizeRelationship).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing command', () => {
      const hooks = plugin.getHooks(testHelper.getFileBlock());

      expect(() => {
        hooks['file']!([{ name: 'file' }, { name: 'invalid_command' }]);
      }).toThrow('Unknown file command: invalid_command');
    });

    test('should handle missing arguments for read', () => {
      const hooks = plugin.getHooks(testHelper.getFileBlock());

      expect(() => {
        hooks['file']!([{ name: 'file' }, { name: 'read' }]);
      }).toThrow('Usage: file read <filename> as <conceptName>');
    });

    test('should handle missing arguments for write', () => {
      const hooks = plugin.getHooks(testHelper.getFileBlock());

      expect(() => {
        hooks['file']!([{ name: 'file' }, { name: 'write' }]);
      }).toThrow('Usage: file write <conceptName> to <filename>');
    });
  });

  describe('Concept Creation', () => {
    test('should create proper has relationships for file metadata', () => {
      const mockContent = 'Hello, World!';
      const mockStats = {
        size: 13,
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
      };

      mockedFs.readFileSync.mockReturnValue(mockContent);
      mockedFs.statSync.mockReturnValue(mockStats as any);

      const hooks = plugin.getHooks(testHelper.getFileBlock());
      hooks['file']!([
        { name: 'file' },
        { name: 'read' },
        { name: 'test.txt' },
        { name: 'as' },
        { name: 'test_txt' },
      ]);

      const relationships = testHelper.getRelationships();
      const hasRelationships = relationships.filter(
        r => r.relationshipType === 'has'
      );

      expect(
        hasRelationships.some(
          r =>
            r.pair.conceptA.name === 'test_txt' &&
            r.pair.conceptB.name === 'filename'
        )
      ).toBe(true);
      expect(
        hasRelationships.some(
          r =>
            r.pair.conceptA.name === 'test_txt' &&
            r.pair.conceptB.name === 'type'
        )
      ).toBe(true);
    });

    test('should create proper is relationships for file metadata values', () => {
      const mockContent = 'Hello, World!';
      const mockStats = {
        size: 13,
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
      };

      mockedFs.readFileSync.mockReturnValue(mockContent);
      mockedFs.statSync.mockReturnValue(mockStats as any);

      const hooks = plugin.getHooks(testHelper.getFileBlock());
      hooks['file']!([
        { name: 'file' },
        { name: 'read' },
        { name: 'test.txt' },
        { name: 'as' },
        { name: 'test_txt' },
      ]);

      const relationships = testHelper.getRelationships();
      const isRelationships = relationships.filter(
        r => r.relationshipType === 'is'
      );

      expect(
        isRelationships.some(
          r =>
            r.pair.conceptA.name === 'filename' &&
            r.pair.conceptB.name === 'test.txt'
        )
      ).toBe(true);
      expect(
        isRelationships.some(
          r => r.pair.conceptA.name === 'size' && r.pair.conceptB.name === '13'
        )
      ).toBe(true);
    });
  });
});
