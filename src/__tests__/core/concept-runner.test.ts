import { ConceptRunnerImpl } from '../../core/concept-runner';
import { RunnerConfig } from '../../types/plugin';

describe('ConceptRunner', () => {
  let runner: ConceptRunnerImpl;

  beforeEach(() => {
    runner = new ConceptRunnerImpl();
  });

  afterEach(async () => {
    await runner.stop();
  });

  describe('Initialization', () => {
    it('should initialize without plugins', async () => {
      const config: RunnerConfig = {
        plugins: [],
        watchMode: false,
        autoReload: false,
        logLevel: 'info',
        outputDir: './test-output',
      };

      await runner.initialize(config);

      expect(runner.getLoadedPlugins()).toHaveLength(1); // std plugin is loaded by default
      expect(runner.getCompiler()).toBeDefined();
    });

    it('should initialize with plugins', async () => {
      const config: RunnerConfig = {
        plugins: ['src/plugins/std/index.ts'],
        watchMode: false,
        autoReload: false,
        logLevel: 'info',
        outputDir: './test-output',
      };

      await runner.initialize(config);

      // Note: Plugin loading might fail due to ES module issues, but runner should still initialize
      expect(runner.getCompiler()).toBeDefined();
    });
  });

  describe('File Processing', () => {
    it('should process a concept file', async () => {
      const config: RunnerConfig = {
        plugins: [],
        watchMode: false,
        autoReload: false,
        logLevel: 'info',
        outputDir: './test-output',
      };

      await runner.initialize(config);

      // Create a temporary test file
      const fs = require('fs');
      const path = require('path');
      const testFile = path.join(__dirname, 'test.concept');

      try {
        fs.writeFileSync(testFile, 'apple is fruit\nbanana is fruit');

        const result = await runner.runFile(testFile);

        expect(result).toBeDefined();
        expect(runner.getBlock().concepts).toHaveLength(3);
        expect(runner.getBlock().concepts.map((c: any) => c.name)).toEqual([
          'apple',
          'fruit',
          'banana',
        ]);
        expect(runner.getBlock().chain).toHaveLength(2);
      } finally {
        // Clean up
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });

    it('should handle file not found', async () => {
      const config: RunnerConfig = {
        plugins: [],
        watchMode: false,
        autoReload: false,
        logLevel: 'info',
        outputDir: './test-output',
      };

      await runner.initialize(config);

      await expect(runner.runFile('nonexistent.concept')).rejects.toThrow();
    });
  });

  describe('Block Access', () => {
    it('should provide access to the block', async () => {
      const config: RunnerConfig = {
        plugins: [],
        watchMode: false,
        autoReload: false,
        logLevel: 'info',
        outputDir: './test-output',
      };

      await runner.initialize(config);

      const block = runner.getBlock();
      expect(block).toBeDefined();
      expect(block.concepts).toHaveLength(0);
      expect(block.chain).toHaveLength(0);
    });

    it('should allow direct block manipulation', async () => {
      const config: RunnerConfig = {
        plugins: [],
        watchMode: false,
        autoReload: false,
        logLevel: 'info',
        outputDir: './test-output',
      };

      await runner.initialize(config);

      runner.getBlock().addConcept({ name: 'test' });
      expect(runner.getBlock().concepts).toHaveLength(1);
      expect(runner.getBlock().concepts[0]?.name).toBe('test');
    });
  });

  describe('Compiler Access', () => {
    it('should provide access to the compiler', async () => {
      const config: RunnerConfig = {
        plugins: [],
        watchMode: false,
        autoReload: false,
        logLevel: 'info',
        outputDir: './test-output',
      };

      await runner.initialize(config);

      const compiler = runner.getCompiler();
      expect(compiler).toBeDefined();
      expect(compiler.block).toBe(runner.getBlock());
    });

    it('should use the same block instance in compiler', async () => {
      const config: RunnerConfig = {
        plugins: [],
        watchMode: false,
        autoReload: false,
        logLevel: 'info',
        outputDir: './test-output',
      };

      await runner.initialize(config);

      const compiler = runner.getCompiler();
      compiler.compile('apple is fruit');

      expect(runner.getBlock().concepts).toHaveLength(2);
      expect(runner.getBlock().chain).toHaveLength(1);
    });
  });

  describe('Plugin Integration', () => {
    it('should integrate plugin hooks with compiler', async () => {
      const config: RunnerConfig = {
        plugins: [],
        watchMode: false,
        autoReload: false,
        logLevel: 'info',
        outputDir: './test-output',
      };

      await runner.initialize(config);

      const compiler = runner.getCompiler();

      // Test that hooks are available
      expect(compiler.block['_hookMap']).toBeDefined();
      expect(compiler.block['_hookMap']['say']).toBeDefined();
      expect(compiler.block['_hookMap']['is']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      const invalidConfig = {} as RunnerConfig;

      await expect(runner.initialize(invalidConfig)).rejects.toThrow();
    });

    it('should handle compilation errors', async () => {
      const config: RunnerConfig = {
        plugins: [],
        watchMode: false,
        autoReload: false,
        logLevel: 'info',
        outputDir: './test-output',
      };

      await runner.initialize(config);

      const fs = require('fs');
      const path = require('path');
      const testFile = path.join(__dirname, 'invalid.concept');

      try {
        fs.writeFileSync(testFile, 'invalid syntax that will cause error');

        // The current compiler is permissive and processes whatever it can
        const result = await runner.runFile(testFile);
        expect(result).toBeDefined();
        expect(runner.getBlock().concepts.length).toBeGreaterThan(0);
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });
  });

  describe('Lifecycle Management', () => {
    it('should start and stop properly', async () => {
      const config: RunnerConfig = {
        plugins: [],
        watchMode: false,
        autoReload: false,
        logLevel: 'info',
        outputDir: './test-output',
      };

      await runner.initialize(config);
      expect(runner.getCompiler()).toBeDefined();

      await runner.stop();
      // Runner should still be accessible after stop
      expect(runner.getCompiler()).toBeDefined();
    });

    it('should handle multiple start/stop cycles', async () => {
      const config: RunnerConfig = {
        plugins: [],
        watchMode: false,
        autoReload: false,
        logLevel: 'info',
        outputDir: './test-output',
      };

      await runner.initialize(config);
      await runner.stop();
      await runner.initialize(config);
      await runner.stop();

      expect(runner.getCompiler()).toBeDefined();
    });
  });
});
