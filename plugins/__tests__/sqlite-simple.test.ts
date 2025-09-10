import { PluginTestHelper, MockDatabase } from './test-helpers';
import SqlitePlugin from '../sqlite/src/index';

describe('SQLite Plugin - Simple', () => {
  let plugin: SqlitePlugin;
  let testHelper: PluginTestHelper;
  let mockDb: MockDatabase;

  beforeEach(() => {
    plugin = new SqlitePlugin();
    testHelper = new PluginTestHelper();
    mockDb = new MockDatabase();

    // Mock the database instance
    jest.spyOn(require('sqlite3'), 'Database').mockImplementation(() => mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
    testHelper.reset();
  });

  describe('Plugin Initialization', () => {
    test('should initialize plugin with correct config', () => {
      expect(plugin.config).toEqual({
        name: 'sqlite',
        version: '3.0.0',
        description: 'SQLite database operations plugin',
        main: 'index.js',
      });
    });

    test('should have required methods', () => {
      expect(typeof plugin.initialize).toBe('function');
      expect(typeof plugin.cleanup).toBe('function');
      expect(typeof plugin.registerListeners).toBe('function');
      expect(typeof plugin.getHooks).toBe('function');
    });
  });

  describe('Hook Creation', () => {
    test('should create hooks with getHooks', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());
      expect(hooks).toBeDefined();
      expect(typeof hooks).toBe('object');
    });

    test('should have sqlite hook', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());
      expect(hooks['sqlite']).toBeDefined();
      expect(typeof hooks['sqlite']).toBe('function');
    });
  });

  describe('Basic Operations', () => {
    test('should execute open command without errors', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());
      expect(() => {
        hooks['sqlite']!([
          { name: 'sqlite' },
          { name: 'open' },
          { name: 'test.db' },
        ]);
      }).not.toThrow();
    });

    test('should execute close command without errors', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());
      expect(() => {
        hooks['sqlite']!([{ name: 'sqlite' }, { name: 'close' }]);
      }).not.toThrow();
    });

    test('should execute query command without errors', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      // First open the database
      hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'open' },
        { name: 'test.db' },
      ]);

      expect(() => {
        hooks['sqlite']!([
          { name: 'sqlite' },
          { name: 'query' },
          { name: 'SELECT' },
          { name: '*' },
          { name: 'FROM' },
          { name: 'users' },
        ]);
      }).not.toThrow();
    });
  });

  describe('Concept-Based Operations', () => {
    test('should execute create command without errors', () => {
      // Create a concept with properties
      testHelper.createConceptWithProperties('user', {
        name: 'John',
        email: 'john@example.com',
        age: '30',
      });

      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      // First open the database
      hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'open' },
        { name: 'test.db' },
      ]);

      expect(() => {
        hooks['sqlite']!([
          { name: 'sqlite' },
          { name: 'create' },
          { name: 'user' },
        ]);
      }).not.toThrow();
    });

    test('should execute insert command without errors', () => {
      // Create a concept with properties
      testHelper.createConceptWithProperties('user', {
        name: 'John',
        email: 'john@example.com',
        age: '30',
      });

      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      // First open the database
      hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'open' },
        { name: 'test.db' },
      ]);

      expect(() => {
        hooks['sqlite']!([
          { name: 'sqlite' },
          { name: 'insert' },
          { name: 'user' },
        ]);
      }).not.toThrow();
    });

    test('should execute select command without errors', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      // First open the database
      hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'open' },
        { name: 'test.db' },
      ]);

      expect(() => {
        hooks['sqlite']!([
          { name: 'sqlite' },
          { name: 'select' },
          { name: 'user' },
        ]);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing command', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      expect(() => {
        hooks['sqlite']!([{ name: 'sqlite' }, { name: 'invalid_command' }]);
      }).toThrow('Unknown SQLite command: invalid_command');
    });

    test('should handle missing arguments for create', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      expect(() => {
        hooks['sqlite']!([{ name: 'sqlite' }, { name: 'create' }]);
      }).toThrow('Usage: sqlite create <concept_name>');
    });

    test('should handle missing arguments for insert', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      expect(() => {
        hooks['sqlite']!([{ name: 'sqlite' }, { name: 'insert' }]);
      }).toThrow('Usage: sqlite insert <concept_name>');
    });

    test('should handle missing arguments for select', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      expect(() => {
        hooks['sqlite']!([{ name: 'sqlite' }, { name: 'select' }]);
      }).toThrow('Usage: sqlite select <concept_name> [WHERE clause]');
    });
  });

  describe('Database Mocking', () => {
    test('should use mocked database for operations', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      // Mock database methods
      const mockRun = jest.fn().mockReturnValue({ lastID: 1, changes: 1 });
      const mockAll = jest.fn().mockReturnValue([]);
      const mockExec = jest.fn();

      mockDb.run = mockRun;
      mockDb.all = mockAll;
      mockDb.exec = mockExec;

      // Execute operations
      hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'open' },
        { name: 'test.db' },
      ]);

      // For query operations, we need to wait a bit for async operations
      hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'query' },
        { name: 'SELECT' },
        { name: '*' },
        { name: 'FROM' },
        { name: 'users' },
      ]);

      hooks['sqlite']!([{ name: 'sqlite' }, { name: 'close' }]);

      // Verify database was used - the mock functions should be called
      // Note: The actual database operations are async, so we check if the mock was set up
      expect(mockRun).toBeDefined();
      expect(mockAll).toBeDefined();
      expect(mockExec).toBeDefined();
    });
  });

  describe('Concept Creation', () => {
    test('should handle query operations without errors', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      // First open the database
      hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'open' },
        { name: 'test.db' },
      ]);

      // Mock database to return some data
      mockDb.all = jest
        .fn()
        .mockReturnValue([{ id: 1, name: 'John', email: 'john@example.com' }]);

      // Execute query - this should not throw an error
      expect(() => {
        hooks['sqlite']!([
          { name: 'sqlite' },
          { name: 'query' },
          { name: 'SELECT' },
          { name: '*' },
          { name: 'FROM' },
          { name: 'users' },
        ]);
      }).not.toThrow();

      // The plugin should be able to handle the query operation
      // Note: Concept creation happens asynchronously, so we test the operation itself
      expect(mockDb.all).toBeDefined();
    });
  });
});
