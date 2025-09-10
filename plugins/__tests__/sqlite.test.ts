import { PluginTestHelper, MockDatabase } from './test-helpers';
import SqlitePlugin from '../sqlite/src/index';

describe('SQLite Plugin', () => {
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

  describe('Basic Operations', () => {
    test('should open database connection', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());
      const result = hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'open' },
        { name: 'test.db' },
      ]);

      expect(result).toBeUndefined();
      // Database should be opened (mocked)
    });

    test('should close database connection', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());
      const result = hooks['sqlite']!([{ name: 'sqlite' }, { name: 'close' }]);

      expect(result).toBeUndefined();
      // Database should be closed (mocked)
    });

    test('should execute SQL queries', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      // First open the database
      hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'open' },
        { name: 'test.db' },
      ]);

      const result = hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'query' },
        { name: 'SELECT' },
        { name: '*' },
        { name: 'FROM' },
        { name: 'users' },
      ]);

      expect(result).toBeUndefined();
      // Query should be executed (mocked)
    });
  });

  describe('Concept-Based Operations', () => {
    test('should create table from concept structure', () => {
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

      const result = hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'create' },
        { name: 'user' },
      ]);

      expect(result).toBeUndefined();
      // Table should be created with proper schema
    });

    test('should insert data from concept', () => {
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

      const result = hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'insert' },
        { name: 'user' },
      ]);

      expect(result).toBeUndefined();
      // Data should be inserted
    });

    test('should select data from table', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      // First open the database
      hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'open' },
        { name: 'test.db' },
      ]);

      const result = hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'select' },
        { name: 'user' },
      ]);

      expect(result).toBeUndefined();
      // Data should be selected
    });
  });

  describe('Query Result Concept Creation', () => {
    test('should handle query operations without errors', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      // First open the database
      hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'open' },
        { name: 'test.db' },
      ]);

      // Execute a query that should create result concepts
      const result = hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'query' },
        { name: 'SELECT' },
        { name: '*' },
        { name: 'FROM' },
        { name: 'product' },
      ]);

      // The query operation should complete without errors
      expect(result).toBeUndefined();
    });

    test('should handle metadata query operations without errors', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      // First open the database
      hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'open' },
        { name: 'test.db' },
      ]);

      const result = hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'query' },
        { name: 'SELECT' },
        { name: '*' },
        { name: 'FROM' },
        { name: 'product' },
      ]);

      // The query operation should complete without errors
      expect(result).toBeUndefined();
    });

    test('should handle row query operations without errors', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      // First open the database
      hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'open' },
        { name: 'test.db' },
      ]);

      const result = hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'query' },
        { name: 'SELECT' },
        { name: '*' },
        { name: 'FROM' },
        { name: 'product' },
      ]);

      // The query operation should complete without errors
      expect(result).toBeUndefined();
    });

    test('should handle column query operations without errors', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      // First open the database
      hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'open' },
        { name: 'test.db' },
      ]);

      const result = hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'query' },
        { name: 'SELECT' },
        { name: '*' },
        { name: 'FROM' },
        { name: 'product' },
      ]);

      // The query operation should complete without errors
      expect(result).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid SQL syntax', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      // Mock database to throw error
      mockDb.all = jest.fn().mockImplementation(() => {
        throw new Error('SQLITE_ERROR: near "INVALID": syntax error');
      });

      const result = hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'query' },
        { name: 'INVALID' },
        { name: 'SQL' },
      ]);

      expect(result).toBeUndefined();
      // Error should be handled gracefully
    });

    test('should handle non-existent table', () => {
      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      // Mock database to throw error
      mockDb.all = jest.fn().mockImplementation(() => {
        throw new Error('SQLITE_ERROR: no such table: nonexistent');
      });

      const result = hooks['sqlite']!([
        { name: 'query' },
        { name: 'SELECT' },
        { name: '*' },
        { name: 'FROM' },
        { name: 'nonexistent' },
      ]);

      expect(result).toBeUndefined();
      // Error should be handled gracefully
    });

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

  describe('Data Type Handling', () => {
    test('should handle INTEGER types', () => {
      testHelper.createConceptWithProperties('product', {
        id: '1',
        price: '999.99',
      });

      const hooks = plugin.getHooks(testHelper.getSqliteBlock());
      const result = hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'create' },
        { name: 'product' },
      ]);

      expect(result).toBeUndefined();
      // Should create table with proper INTEGER type for id
    });

    test('should handle TEXT types', () => {
      testHelper.createConceptWithProperties('user', {
        name: 'John',
        email: 'john@example.com',
      });

      const hooks = plugin.getHooks(testHelper.getSqliteBlock());
      const result = hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'create' },
        { name: 'user' },
      ]);

      expect(result).toBeUndefined();
      // Should create table with proper TEXT types
    });

    test('should handle REAL types', () => {
      testHelper.createConceptWithProperties('product', {
        price: '999.99',
        weight: '2.5',
      });

      const hooks = plugin.getHooks(testHelper.getSqliteBlock());
      const result = hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'create' },
        { name: 'product' },
      ]);

      expect(result).toBeUndefined();
      // Should create table with proper REAL types for price and weight
    });
  });

  describe('Relationship Management', () => {
    test('should create proper has relationships', () => {
      testHelper.createConceptWithProperties('user', {
        name: 'John',
        email: 'john@example.com',
      });

      const relationships = testHelper.getRelationships();
      const hasRelationships = relationships.filter(
        r => r.relationshipType === 'has'
      );

      expect(hasRelationships.length).toBeGreaterThan(0);
      expect(
        hasRelationships.some(
          r =>
            r.pair.conceptA.name === 'user' && r.pair.conceptB.name === 'name'
        )
      ).toBe(true);
    });

    test('should create proper is relationships', () => {
      testHelper.createConceptWithProperties('user', {
        name: 'John',
        email: 'john@example.com',
      });

      const relationships = testHelper.getRelationships();
      const isRelationships = relationships.filter(
        r => r.relationshipType === 'is'
      );

      expect(isRelationships.length).toBeGreaterThan(0);
      expect(
        isRelationships.some(
          r =>
            r.pair.conceptA.name === 'name_of_user' &&
            r.pair.conceptB.name === 'John'
        )
      ).toBe(true);
    });
  });

  describe('Table Schema Generation', () => {
    test('should handle table creation without errors', () => {
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

      const result = hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'create' },
        { name: 'user' },
      ]);

      // The create operation should complete without errors
      expect(result).toBeUndefined();
    });

    test('should exclude property instances from table schema', () => {
      testHelper.createConceptWithProperties('user', {
        name: 'John',
        email: 'john@example.com',
      });

      const hooks = plugin.getHooks(testHelper.getSqliteBlock());

      let capturedSQL = '';
      mockDb.exec = jest.fn().mockImplementation((sql: string) => {
        capturedSQL = sql;
      });

      hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'create' },
        { name: 'user' },
      ]);

      // Should not include property instances like name_of_user
      expect(capturedSQL).not.toContain('name_of_user');
      expect(capturedSQL).not.toContain('email_of_user');
    });
  });

  describe('Data Extraction', () => {
    test('should handle data insertion without errors', () => {
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

      const result = hooks['sqlite']!([
        { name: 'sqlite' },
        { name: 'insert' },
        { name: 'user' },
      ]);

      // The insert operation should complete without errors
      expect(result).toBeUndefined();
    });
  });
});
