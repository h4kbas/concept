import { Compiler } from '../../core/compiler';
import { Block } from '../../core/block';
import { ConceptRunnerImpl } from '../../core/concept-runner';
import { RunnerConfig } from '../../types/plugin';

describe('Compiler', () => {
  let compiler: Compiler;
  let runner: ConceptRunnerImpl;
  let config: RunnerConfig;

  beforeEach(async () => {
    compiler = new Compiler();
    runner = new ConceptRunnerImpl();
    config = {
      plugins: [],
      logLevel: 'error' as const,
      outputDir: './test-output',
    };
    await runner.initialize(config);
  });

  afterEach(async () => {
    await runner.stop();
  });

  describe('Basic Compilation', () => {
    it('should compile a simple concept', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('apple');

      expect(block.concepts).toHaveLength(1);
      expect(block.concepts[0]?.name).toBe('apple');
    });

    it('should compile a relationship', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('apple is fruit');

      expect(block.concepts).toHaveLength(2);
      expect(block.concepts.map(c => c.name)).toEqual(['apple', 'fruit']);
      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.pair.conceptA.name).toBe('apple');
      expect(block.chain[0]?.pair.conceptB.name).toBe('fruit');
    });

    it('should compile multiple statements', () => {
      const block = runner.getBlock();
      const input = `apple is fruit
banana is fruit
orange is fruit`;
      runner.getCompiler().compile(input);

      expect(block.concepts).toHaveLength(4);
      expect(block.concepts.map(c => c.name)).toEqual([
        'apple',
        'fruit',
        'banana',
        'orange',
      ]);
      expect(block.chain).toHaveLength(3);
    });
  });

  describe('Hook Commands', () => {
    it('should execute say command', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      runner.getCompiler().compile('say hello world');

      expect(consoleSpy).toHaveBeenCalledWith('hello world');
      consoleSpy.mockRestore();
    });

    it('should handle is command with incomplete relationship', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('d is');

      expect(block.concepts).toHaveLength(2);
      expect(block.concepts.map(c => c.name)).toEqual(['d', 'is']);
    });

    it('should handle is command with complete relationship', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('a is b');

      expect(block.concepts).toHaveLength(2);
      expect(block.concepts.map(c => c.name)).toEqual(['a', 'b']);
      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.pair.conceptA.name).toBe('a');
      expect(block.chain[0]?.pair.conceptB.name).toBe('b');
    });

    it('should handle isnt command with complete relationship', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('a isnt b');

      expect(block.concepts).toHaveLength(2);
      expect(block.concepts.map(c => c.name)).toEqual(['a', 'b']);
      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.pair.conceptA.name).toBe('a');
      expect(block.chain[0]?.pair.conceptB.name).toBe('b');
      expect(block.chain[0]?.value).toBe(false);
    });
  });

  describe('Block Processing', () => {
    it('should process indented content as boxed concept', () => {
      const block = runner.getBlock();
      const input = `        apple is fruit`;
      runner.getCompiler().compile(input);

      expect(block.concepts).toHaveLength(3);
      expect(block.concepts.some(c => c.name === 'apple is fruit')).toBe(true);
      expect(block.concepts.some(c => c.name === 'apple')).toBe(true);
      expect(block.concepts.some(c => c.name === 'fruit')).toBe(true);
    });

    it('should process command with block content', () => {
      const block = runner.getBlock();
      const input = `d is
        e is a`;
      runner.getCompiler().compile(input);

      expect(block.concepts).toHaveLength(5);
      expect(block.concepts.some(c => c.name === 'd')).toBe(true);
      expect(block.concepts.some(c => c.name === 'is')).toBe(true);
      expect(block.concepts.some(c => c.name === 'e is a')).toBe(true);
      expect(block.concepts.some(c => c.name === 'e')).toBe(true);
      expect(block.concepts.some(c => c.name === 'a')).toBe(true);
    });

    it('should create relationships from boxed content', () => {
      const block = runner.getBlock();
      const input = `        apple is fruit`;
      runner.getCompiler().compile(input);

      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.pair.conceptA.name).toBe('apple');
      expect(block.chain[0]?.pair.conceptB.name).toBe('fruit');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid say usage', () => {
      expect(() => {
        runner.getCompiler().compile('say');
      }).toThrow('Invalid "say" usage: say <message>');
    });

    // print and echo commands no longer exist - they are treated as regular concepts

    it('should throw error for invalid is usage as first token', () => {
      expect(() => {
        runner.getCompiler().compile('is');
      }).toThrow('Invalid "is" usage: is <statement>');
    });

    it('should throw error for invalid isnt usage as first token', () => {
      expect(() => {
        runner.getCompiler().compile('isnt');
      }).toThrow('Invalid "isnt" usage: isnt <statement>');
    });
  });

  describe('State Management', () => {
    it('should maintain state across multiple compilations', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('apple is fruit');
      runner.getCompiler().compile('banana is fruit');

      expect(block.concepts).toHaveLength(3);
      expect(block.concepts.map(c => c.name)).toEqual([
        'apple',
        'fruit',
        'banana',
      ]);
      expect(block.chain).toHaveLength(2);
    });

    it('should clear state when reset', () => {
      runner.getCompiler().compile('apple is fruit');
      compiler.reset();

      expect(compiler.block.concepts).toHaveLength(0);
      expect(compiler.block.chain).toHaveLength(0);
    });
  });

  describe('Custom Block Instance', () => {
    it('should use provided block instance', () => {
      const customBlock = new Block();
      const customCompiler = new Compiler(undefined, customBlock);

      customCompiler.compile('apple is fruit');

      expect(customCompiler.block).toBe(customBlock);
      expect(customBlock.concepts).toHaveLength(3); // apple, is, fruit
      expect(customBlock.chain).toHaveLength(0); // No hooks, so no relationships created
    });
  });
});
