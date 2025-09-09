import { ConceptRunnerImpl } from '../../core/concept-runner';
import { RunnerConfig } from '../../types/plugin';

describe('Core Integration Tests', () => {
  let runner: ConceptRunnerImpl;
  let config: RunnerConfig;

  beforeEach(async () => {
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

  describe('Concept Types and Processing', () => {
    it('should handle all four concept types correctly', () => {
      const block = runner.getBlock();
      // 1. Simple concept: 'a'

      runner.getCompiler().compile('a');
      expect(block.concepts).toHaveLength(1);
      expect(block.concepts[0]?.name).toBe('a');

      // 2. Series of concepts: 'a is b'
      runner.getCompiler().compile('a is b');
      expect(block.concepts).toHaveLength(2); // a, b (a already exists)
      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.pair.conceptA.name).toBe('a');
      expect(block.chain[0]?.pair.conceptB.name).toBe('b');

      // 3. Boxed concept: '<tab>a'
      runner.getCompiler().compile('        a');
      expect(block.concepts).toHaveLength(2); // a, b (a already exists)
      expect(block.concepts.some(c => c.name === 'a')).toBe(true);

      // 4. Command with boxed content: 'a is' + '<tab>c is d'
      const input = `a is
        c is d`;
      runner.getCompiler().compile(input);

      expect(block.concepts).toHaveLength(6); // a, b, is, c is d, c, d
      expect(block.concepts.some(c => c.name === 'c is d')).toBe(true);
      expect(block.chain).toHaveLength(2); // a is b + c is d
    });

    it('should process standalone indented content as boxed concept', () => {
      const block = runner.getBlock();
      const input = `        apple is fruit`;
      runner.getCompiler().compile(input);

      // Should create the boxed concept and process its content
      expect(block.concepts.some(c => c.name === 'apple is fruit')).toBe(true);
      expect(block.concepts.some(c => c.name === 'apple')).toBe(true);
      expect(block.concepts.some(c => c.name === 'fruit')).toBe(true);

      // Should create the relationship from the boxed content
      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.pair.conceptA.name).toBe('apple');
      expect(block.chain[0]?.pair.conceptB.name).toBe('fruit');
    });

    it('should process command with block content', () => {
      const block = runner.getBlock();
      const input = `d is
        e is a`;
      runner.getCompiler().compile(input);

      // Should create all concepts
      expect(block.concepts.some(c => c.name === 'd')).toBe(true);
      expect(block.concepts.some(c => c.name === 'is')).toBe(true);
      expect(block.concepts.some(c => c.name === 'e is a')).toBe(true);
      expect(block.concepts.some(c => c.name === 'e')).toBe(true);
      expect(block.concepts.some(c => c.name === 'a')).toBe(true);

      // Should create the relationship from the boxed content
      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.pair.conceptA.name).toBe('e');
      expect(block.chain[0]?.pair.conceptB.name).toBe('a');
    });
  });

  describe('Indentation-Based Block Detection', () => {
    it('should detect indented content correctly', () => {
      const block = runner.getBlock();

      // Test hasCommandBlock method - using type assertion to access private method
      expect((block as any).hasCommandBlock([{ name: 'apple' }])).toBe(false);
      expect(
        (block as any).hasCommandBlock([{ name: 'apple' }, { name: 'is' }])
      ).toBe(false);
      expect((block as any).hasCommandBlock([{ name: 'apple is fruit' }])).toBe(
        true
      );
    });

    it('should extract block content correctly', () => {
      const block = runner.getBlock();

      const line = [{ name: 'apple is fruit' }];
      const extracted = (block as any).extractBlockContent(line);

      expect(extracted).toHaveLength(3);
      expect(extracted.map((c: any) => c.name)).toEqual([
        'apple',
        'is',
        'fruit',
      ]);
    });

    it('should handle non-indented content as regular concepts', () => {
      const block = runner.getBlock();
      const input = `apple is fruit
banana is fruit`;
      runner.getCompiler().compile(input);

      expect(block.concepts).toHaveLength(3);
      expect(block.concepts.map(c => c.name)).toEqual([
        'apple',
        'fruit',
        'banana',
      ]);
      expect(block.chain).toHaveLength(2);
    });
  });

  describe('Hook Integration', () => {
    it('should execute hooks for all command types', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Test say command
      runner.getCompiler().compile('say hello world');
      expect(consoleSpy).toHaveBeenCalledWith('hello world');

      consoleSpy.mockRestore();
    });

    it('should handle is command in different contexts', () => {
      const block = runner.getBlock();
      // Complete relationship
      runner.getCompiler().compile('a is b');
      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.pair.conceptA.name).toBe('a');
      expect(block.chain[0]?.pair.conceptB.name).toBe('b');

      // Incomplete relationship (should just add concepts)
      runner.getCompiler().compile('c is');
      expect(block.concepts.some(c => c.name === 'c')).toBe(true);
      expect(block.concepts.some(c => c.name === 'is')).toBe(true);
    });

    it('should handle isnt command correctly', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('a isnt b');
      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.pair.conceptA.name).toBe('a');
      expect(block.chain[0]?.pair.conceptB.name).toBe('b');
      expect(block.chain[0]?.value).toBe(false);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle mixed content types', () => {
      const block = runner.getBlock();
      const input = `apple is fruit
        banana is fruit
orange is fruit
        grape is fruit`;
      runner.getCompiler().compile(input);

      // Should have all concepts
      expect(block.concepts.some(c => c.name === 'apple')).toBe(true);
      expect(block.concepts.some(c => c.name === 'orange')).toBe(true);
      expect(block.concepts.some(c => c.name === 'grape')).toBe(true);
      expect(block.concepts.some(c => c.name === 'fruit')).toBe(true);

      // Should have boxed concepts
      expect(block.concepts.some(c => c.name === 'grape is fruit')).toBe(true);

      // Should have relationships
      expect(block.chain).toHaveLength(3);
    });

    it('should handle nested indentation', () => {
      const block = runner.getBlock();
      const input = `        apple is fruit
        banana is fruit`;
      runner.getCompiler().compile(input);

      // Both lines should be treated as boxed concepts
      expect(block.concepts.some(c => c.name === 'apple is fruit')).toBe(true);
      expect(block.concepts.some(c => c.name === 'banana is fruit')).toBe(true);

      // Both should create relationships
      expect(block.chain).toHaveLength(2);
    });

    it('should handle commands with multiple indented lines', () => {
      const block = runner.getBlock();
      const input = `d is
        e is a
        f is b`;
      runner.getCompiler().compile(input);

      // Should have all concepts
      expect(block.concepts.some(c => c.name === 'd')).toBe(true);
      expect(block.concepts.some(c => c.name === 'is')).toBe(true);
      expect(block.concepts.some(c => c.name === 'e')).toBe(true);
      expect(block.concepts.some(c => c.name === 'a')).toBe(true);
      expect(block.concepts.some(c => c.name === 'f')).toBe(true);
      expect(block.concepts.some(c => c.name === 'b')).toBe(true);
      expect(block.concepts.some(c => c.name === 'e is a f is b')).toBe(true);

      // Should have relationships from boxed content
      expect(block.chain).toHaveLength(2);
      expect(
        block.chain.some(
          r => r.pair.conceptA.name === 'e' && r.pair.conceptB.name === 'a'
        )
      ).toBe(true);
      expect(
        block.chain.some(
          r => r.pair.conceptA.name === 'f' && r.pair.conceptB.name === 'b'
        )
      ).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid command usage gracefully', () => {
      expect(() => {
        runner.getCompiler().compile('say');
      }).toThrow('Invalid "say" usage: say <message>');

      // print and echo commands no longer exist - they are treated as regular concepts
    });

    it('should handle empty and whitespace input', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('');
      expect(block.concepts).toHaveLength(0);
      expect(block.chain).toHaveLength(0);

      runner.getCompiler().compile('   \n  \t  \n  ');
      expect(block.concepts).toHaveLength(0);
      expect(block.chain).toHaveLength(0);
    });

    it('should handle malformed input gracefully', () => {
      const block = runner.getBlock();
      // This should not throw, just add concepts
      runner.getCompiler().compile('a b c d e');
      expect(block.concepts).toHaveLength(5);
      expect(block.concepts.map(c => c.name)).toEqual([
        'a',
        'b',
        'c',
        'd',
        'e',
      ]);
    });
  });
});
