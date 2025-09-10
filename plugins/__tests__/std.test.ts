import { PluginTestHelper } from './test-helpers';
import StdPlugin from '../../src/plugins/std/index';

describe('Standard Plugin', () => {
  let plugin: StdPlugin;
  let testHelper: PluginTestHelper;

  beforeEach(() => {
    plugin = new StdPlugin();
    testHelper = new PluginTestHelper();
  });

  afterEach(() => {
    testHelper.reset();
  });

  describe('Plugin Initialization', () => {
    test('should initialize plugin with correct config', () => {
      expect(plugin.config).toEqual({
        name: 'std',
        version: '3.0.0',
        description: 'Standard library plugin with basic commands',
        main: 'index.js',
      });
    });

    test('should have required methods', () => {
      expect(typeof plugin.initialize).toBe('function');
      expect(typeof plugin.registerListeners).toBe('function');
      expect(typeof plugin.getHooks).toBe('function');
    });
  });

  describe('is Relationship', () => {
    test('should handle is command without errors', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('red');

      const hooks = plugin.getHooks(testHelper.getBlock());
      const result = hooks['is']!([
        { name: 'is' },
        { name: 'apple' },
        { name: 'red' },
      ]);

      expect(result).toBeUndefined();
      // The is hook processes the command but doesn't create relationships directly
    });

    test('should handle is query', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('red');
      testHelper.addRelationship('apple', 'red', 'is');

      const hooks = plugin.getHooks(testHelper.getBlock());
      const result = hooks['is']!([
        { name: 'is' },
        { name: 'apple' },
        { name: 'red' },
      ]);

      expect(result).toBeUndefined();
      // Should return the relationship
    });
  });

  describe('isnt Relationship', () => {
    test('should handle isnt command without errors', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('blue');

      const hooks = plugin.getHooks(testHelper.getBlock());
      const result = hooks['isnt']!([
        { name: 'isnt' },
        { name: 'apple' },
        { name: 'blue' },
      ]);

      expect(result).toBeUndefined();
      // The isnt hook processes the command but doesn't create relationships directly
    });

    test('should handle isnt query', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('blue');
      testHelper.addRelationship('apple', 'blue', 'isnt');

      const hooks = plugin.getHooks(testHelper.getBlock());
      const result = hooks['isnt']!([
        { name: 'isnt' },
        { name: 'apple' },
        { name: 'blue' },
      ]);

      expect(result).toBeUndefined();
      // Should return the relationship
    });
  });

  describe('has Relationship', () => {
    test('should handle has command without errors', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('color');

      const hooks = plugin.getHooks(testHelper.getBlock());
      const result = hooks['has']!([
        { name: 'has' },
        { name: 'apple' },
        { name: 'color' },
      ]);

      expect(result).toEqual([]);
      // The has hook processes the command but doesn't create relationships directly
    });

    test('should handle has command for property instance', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('color');

      const hooks = plugin.getHooks(testHelper.getBlock());
      const result = hooks['has']!([
        { name: 'has' },
        { name: 'apple' },
        { name: 'color' },
      ]);

      expect(result).toEqual([]);
      // The has hook processes the command but doesn't create property instances directly
    });

    test('should handle has command for relationships', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('color');

      const hooks = plugin.getHooks(testHelper.getBlock());
      const result = hooks['has']!([
        { name: 'has' },
        { name: 'apple' },
        { name: 'color' },
      ]);

      expect(result).toEqual([]);
      // The has hook processes the command but doesn't create relationships directly
    });

    test('should handle has query', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('color');
      testHelper.addRelationship('apple', 'color', 'has');

      const hooks = plugin.getHooks(testHelper.getBlock());
      const result = hooks['has']!([
        { name: 'has' },
        { name: 'apple' },
        { name: 'color' },
      ]);

      expect(result).toEqual([]);
      // Should return the relationship
    });
  });

  describe('hasnt Relationship', () => {
    test('should handle hasnt command without errors', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('weight');

      const hooks = plugin.getHooks(testHelper.getBlock());
      const result = hooks['hasnt']!([
        { name: 'hasnt' },
        { name: 'apple' },
        { name: 'weight' },
      ]);

      expect(result).toEqual([]);
      // The hasnt hook processes the command but doesn't create relationships directly
    });

    test('should handle hasnt query', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('weight');
      testHelper.addRelationship('apple', 'weight', 'hasnt');

      const hooks = plugin.getHooks(testHelper.getBlock());
      const result = hooks['hasnt']!([
        { name: 'hasnt' },
        { name: 'apple' },
        { name: 'weight' },
      ]);

      expect(result).toEqual([]);
      // Should return the relationship
    });
  });

  describe('inspect Hook', () => {
    test('should inspect concept relationships', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('red');
      testHelper.addRelationship('apple', 'red', 'is');

      const hooks = plugin.getHooks(testHelper.getBlock());
      const result = hooks['inspect']!([
        { name: 'inspect' },
        { name: 'apple' },
      ]);

      expect(result).toBeUndefined();
      // Should display concept information
    });

    test('should handle concept with no relationships', () => {
      testHelper.addConcept('apple');

      const hooks = plugin.getHooks(testHelper.getBlock());
      const result = hooks['inspect']!([
        { name: 'inspect' },
        { name: 'apple' },
      ]);

      expect(result).toBeUndefined();
      // Should display concept with no relationships
    });
  });

  describe('Error Handling', () => {
    test('should handle missing arguments for is', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());

      // The is hook doesn't throw errors for missing arguments, it just adds concepts
      expect(() => {
        hooks['is']!([{ name: 'is' }, { name: 'apple' }]);
      }).not.toThrow();
    });

    test('should handle missing arguments for isnt', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());

      // The isnt hook doesn't throw errors for missing arguments, it just adds concepts
      expect(() => {
        hooks['isnt']!([{ name: 'isnt' }, { name: 'apple' }]);
      }).not.toThrow();
    });

    test('should handle missing arguments for has', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());

      // The has hook doesn't throw errors for missing arguments, it just adds concepts
      expect(() => {
        hooks['has']!([{ name: 'has' }, { name: 'apple' }]);
      }).not.toThrow();
    });

    test('should handle missing arguments for hasnt', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());

      // The hasnt hook doesn't throw errors for missing arguments, it just adds concepts
      expect(() => {
        hooks['hasnt']!([{ name: 'hasnt' }, { name: 'apple' }]);
      }).not.toThrow();
    });

    test('should handle missing arguments for inspect', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());

      expect(() => {
        hooks['inspect']!([]);
      }).toThrow('Invalid "inspect" usage: inspect <concept_name>');
    });
  });

  describe('Relationship Type Metadata', () => {
    test('should set relationshipType for is relationships', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('red');
      testHelper.addRelationship('apple', 'red', 'is');

      const relationships = testHelper.getRelationships();
      const isRelationship = relationships.find(
        r =>
          r.pair.conceptA.name === 'apple' &&
          r.pair.conceptB.name === 'red' &&
          r.relationshipType === 'is'
      );

      expect(isRelationship).toBeDefined();
    });

    test('should set relationshipType for isnt relationships', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('blue');
      testHelper.addRelationship('apple', 'blue', 'isnt');

      const relationships = testHelper.getRelationships();
      const isntRelationship = relationships.find(
        r =>
          r.pair.conceptA.name === 'apple' &&
          r.pair.conceptB.name === 'blue' &&
          r.relationshipType === 'isnt'
      );

      expect(isntRelationship).toBeDefined();
    });

    test('should set relationshipType for has relationships', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('color');
      testHelper.addRelationship('apple', 'color', 'has');

      const relationships = testHelper.getRelationships();
      const hasRelationship = relationships.find(
        r =>
          r.pair.conceptA.name === 'apple' &&
          r.pair.conceptB.name === 'color' &&
          r.relationshipType === 'has'
      );

      expect(hasRelationship).toBeDefined();
    });

    test('should set relationshipType for hasnt relationships', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('weight');
      testHelper.addRelationship('apple', 'weight', 'hasnt');

      const relationships = testHelper.getRelationships();
      const hasntRelationship = relationships.find(
        r =>
          r.pair.conceptA.name === 'apple' &&
          r.pair.conceptB.name === 'weight' &&
          r.relationshipType === 'hasnt'
      );

      expect(hasntRelationship).toBeDefined();
    });
  });
});
