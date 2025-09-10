import { PluginTestHelper } from './test-helpers';
import StdPlugin from '../../src/plugins/std/index';

describe('Standard Plugin - Simple', () => {
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

  describe('Hook Creation', () => {
    test('should create hooks with getHooks', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());
      expect(hooks).toBeDefined();
      expect(typeof hooks).toBe('object');
    });

    test('should have is hook', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());
      expect(hooks['is']).toBeDefined();
      expect(typeof hooks['is']).toBe('function');
    });

    test('should have isnt hook', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());
      expect(hooks['isnt']).toBeDefined();
      expect(typeof hooks['isnt']).toBe('function');
    });

    test('should have has hook', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());
      expect(hooks['has']).toBeDefined();
      expect(typeof hooks['has']).toBe('function');
    });

    test('should have hasnt hook', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());
      expect(hooks['hasnt']).toBeDefined();
      expect(typeof hooks['hasnt']).toBe('function');
    });

    test('should have inspect hook', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());
      expect(hooks['inspect']).toBeDefined();
      expect(typeof hooks['inspect']).toBe('function');
    });
  });

  describe('Basic Hook Execution', () => {
    test('should execute is hook without errors', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('red');

      const hooks = plugin.getHooks(testHelper.getBlock());
      expect(() => {
        hooks['is']!([{ name: 'apple' }, { name: 'red' }]);
      }).not.toThrow();
    });

    test('should execute isnt hook without errors', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('blue');

      const hooks = plugin.getHooks(testHelper.getBlock());
      expect(() => {
        hooks['isnt']!([{ name: 'apple' }, { name: 'blue' }]);
      }).not.toThrow();
    });

    test('should execute has hook without errors', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('color');

      const hooks = plugin.getHooks(testHelper.getBlock());
      expect(() => {
        hooks['has']!([{ name: 'apple' }, { name: 'color' }]);
      }).not.toThrow();
    });

    test('should execute hasnt hook without errors', () => {
      testHelper.addConcept('apple');
      testHelper.addConcept('weight');

      const hooks = plugin.getHooks(testHelper.getBlock());
      expect(() => {
        hooks['hasnt']!([{ name: 'apple' }, { name: 'weight' }]);
      }).not.toThrow();
    });

    test('should execute inspect hook without errors', () => {
      testHelper.addConcept('apple');

      const hooks = plugin.getHooks(testHelper.getBlock());
      expect(() => {
        hooks['inspect']!([{ name: 'inspect' }, { name: 'apple' }]);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing arguments for is', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());

      expect(() => {
        hooks['is']!([{ name: 'is' }]);
      }).toThrow('Invalid "is" usage: is <statement>');
    });

    test('should handle missing arguments for isnt', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());

      expect(() => {
        hooks['isnt']!([{ name: 'isnt' }]);
      }).toThrow('Invalid "isnt" usage: isnt <statement>');
    });

    test('should handle missing arguments for has', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());

      expect(() => {
        hooks['has']!([{ name: 'has' }]);
      }).toThrow('Invalid "has" usage: has <statement>');
    });

    test('should handle missing arguments for hasnt', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());

      expect(() => {
        hooks['hasnt']!([{ name: 'hasnt' }]);
      }).toThrow('Invalid "hasnt" usage: hasnt <statement>');
    });

    test('should handle missing arguments for inspect', () => {
      const hooks = plugin.getHooks(testHelper.getBlock());

      expect(() => {
        hooks['inspect']!([{ name: 'inspect' }]);
      }).toThrow('Invalid "inspect" usage: inspect <concept_name>');
    });
  });
});
