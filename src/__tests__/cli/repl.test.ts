import { Compiler } from '../../core/compiler';
import { ConceptRunnerImpl } from '../../core/concept-runner';
import { RunnerConfig } from '../../types/plugin';

describe('REPL Functionality', () => {
  let compiler: Compiler;
  let runner: ConceptRunnerImpl;
  let config: RunnerConfig;

  beforeEach(async () => {
    compiler = new Compiler();
    runner = new ConceptRunnerImpl();
    config = {
      plugins: ['./dist/plugins/std/index.js'],
      logLevel: 'error' as const,
      outputDir: './test-output',
    };
    await runner.initialize(config);
  });

  afterEach(async () => {
    await runner.stop();
  });

  describe('Basic REPL Commands', () => {
    it('should process simple concepts', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('apple');
      expect(block.concepts).toHaveLength(1);
      expect(block.concepts[0]?.name).toBe('apple');
    });

    it('should process relationships', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('apple is fruit');
      expect(block.concepts).toHaveLength(3);
      expect(block.concepts.map(c => c.name)).toEqual(['apple', 'is', 'fruit']);
      expect(block.chain).toHaveLength(1);
    });

    it('should process say commands', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      runner.getCompiler().compile('say hello world');
      expect(consoleSpy).toHaveBeenCalledWith('hello world');

      consoleSpy.mockRestore();
    });
  });

  describe('Block Processing in REPL', () => {
    it('should process standalone indented content', () => {
      const block = runner.getBlock();
      const input = `        apple is fruit`;
      runner.getCompiler().compile(input);

      expect(block.concepts.some(c => c.name === 'apple is fruit')).toBe(true);
      expect(block.concepts.some(c => c.name === 'apple')).toBe(true);
      expect(block.concepts.some(c => c.name === 'fruit')).toBe(true);
      expect(block.chain).toHaveLength(1);
    });

    it('should process command with block content', () => {
      const block = runner.getBlock();
      const input = `d is
        e is a`;
      runner.getCompiler().compile(input);

      expect(block.concepts.some(c => c.name === 'd')).toBe(true);
      expect(block.concepts.some(c => c.name === 'is')).toBe(true);
      expect(block.concepts.some(c => c.name === 'e is a')).toBe(true);
      expect(block.concepts.some(c => c.name === 'e')).toBe(true);
      expect(block.concepts.some(c => c.name === 'a')).toBe(true);
      expect(block.chain).toHaveLength(1);
    });

    it('should handle multiple indented lines', () => {
      const block = runner.getBlock();
      const input = `        apple is fruit
        banana is fruit`;
      runner.getCompiler().compile(input);

      expect(block.concepts.some(c => c.name === 'apple is fruit')).toBe(true);
      expect(block.concepts.some(c => c.name === 'banana is fruit')).toBe(true);
      expect(block.chain).toHaveLength(2);
    });
  });

  describe('REPL State Management', () => {
    it('should maintain state across multiple inputs', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('apple is fruit');
      runner.getCompiler().compile('banana is fruit');

      expect(block.concepts).toHaveLength(4);
      expect(block.concepts.map(c => c.name)).toEqual([
        'apple',
        'is',
        'fruit',
        'banana',
      ]);
      expect(block.chain).toHaveLength(2);
    });

    it('should reset state when clear is called', () => {
      runner.getCompiler().compile('apple is fruit');
      compiler.reset();

      expect(compiler.block.concepts).toHaveLength(0);
      expect(compiler.block.chain).toHaveLength(0);
    });
  });

  describe('REPL Command Processing', () => {
    it('should handle incomplete relationships', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('a is');

      expect(block.concepts).toHaveLength(2);
      expect(block.concepts.map(c => c.name)).toEqual(['a', 'is']);
      expect(block.chain).toHaveLength(0);
    });

    it('should handle complete relationships', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('a is b');

      expect(block.concepts).toHaveLength(3);
      expect(block.concepts.map(c => c.name)).toEqual(['a', 'is', 'b']);
      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.pair.conceptA.name).toBe('a');
      expect(block.chain[0]?.pair.conceptB.name).toBe('b');
    });

    it('should handle negative relationships', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('a isnt b');

      expect(block.concepts).toHaveLength(3);
      expect(block.concepts.map(c => c.name)).toEqual(['a', 'isnt', 'b']);
      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.value).toBe(false);
    });
  });

  describe('Complex REPL Scenarios', () => {
    it('should handle mixed content types in sequence', () => {
      const block = runner.getBlock();
      // Simple concept
      runner.getCompiler().compile('apple');
      expect(block.concepts).toHaveLength(1);

      // Relationship
      runner.getCompiler().compile('apple is fruit');
      expect(block.concepts).toHaveLength(3);
      expect(block.chain).toHaveLength(1);

      // Boxed concept
      runner.getCompiler().compile('        banana is fruit');
      expect(block.concepts).toHaveLength(5); // apple, is, fruit, banana is fruit, banana
      expect(block.chain).toHaveLength(2);

      // Command with block
      const input = `d is
        e is a`;
      runner.getCompiler().compile(input);
      expect(block.concepts).toHaveLength(9); // previous + d, is, e is a, e, is, a
      expect(block.chain).toHaveLength(3);
    });

    it('should handle commands that could have blocks', () => {
      const block = runner.getBlock();
      // Commands ending with keywords that could have blocks
      const commands = ['d is', 'db create', 'file write', 'user say'];

      commands.forEach(cmd => {
        runner.getCompiler().compile(cmd);
        expect(block.concepts.some(c => c.name === cmd.split(' ')[0])).toBe(
          true
        );
      });
    });
  });

  describe('Error Handling in REPL', () => {
    it('should handle invalid command usage', () => {
      expect(() => {
        runner.getCompiler().compile('say');
      }).toThrow('Invalid "say" usage: say <message>');

      // print and echo commands no longer exist - they are treated as regular concepts
    });

    it('should handle empty input gracefully', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('');
      expect(block.concepts).toHaveLength(0);
      expect(block.chain).toHaveLength(0);
    });

    it('should handle whitespace input gracefully', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('   \n  \t  \n  ');
      expect(block.concepts).toHaveLength(0);
      expect(block.chain).toHaveLength(0);
    });
  });

  describe('REPL Integration with Runner', () => {
    it('should work with ConceptRunner', async () => {
      const config = {
        plugins: [],
        watchMode: false,
        autoReload: false,
        logLevel: 'info' as const,
        outputDir: './test-output',
      };

      await runner.initialize(config);
      const runnerCompiler = runner.getCompiler();
      const block = runner.getBlock();

      runnerCompiler.compile('apple is fruit');
      expect(block.concepts).toHaveLength(3);
      expect(block.chain).toHaveLength(1);
    });

    it('should maintain state consistency between runner and compiler', async () => {
      const config = {
        plugins: [],
        watchMode: false,
        autoReload: false,
        logLevel: 'info' as const,
        outputDir: './test-output',
      };

      await runner.initialize(config);
      const runnerCompiler = runner.getCompiler();
      const block = runner.getBlock();

      runnerCompiler.compile('apple is fruit');
      expect(block.concepts).toHaveLength(3);
      expect(runnerCompiler.block.concepts).toHaveLength(3);
      expect(runner.getBlock()).toBe(runnerCompiler.block);
    });
  });
});
