import { Compiler, createDefaultHookMap } from '../../core/compiler';
import { Block, Concept } from '../../core';

describe('Compiler', () => {
  let compiler: Compiler;

  beforeEach(() => {
    compiler = new Compiler();
  });

  describe('basic compilation', () => {
    it('should compile a simple source', () => {
      const source = 'A is B\nC isnt D';
      const result = compiler.compile(source);

      expect(result).toContain('A is B');
      expect(result).toContain('C isnt D');
    });

    it('should compile with inference', () => {
      const source = 'A is B\nB is C';
      const result = compiler.compile(source);

      expect(result).toContain('A is B');
      expect(result).toContain('B is C');
      expect(result).toContain('A is C'); // Inferred
    });

    it('should compile to block state', () => {
      const source = 'A is B\nC isnt D';
      const block = compiler.compileToState(source);

      expect(block.concepts).toHaveLength(4);
      expect(block.chain).toHaveLength(2);
    });
  });

  describe('hook functions', () => {
    it('should handle is hook for assignment', () => {
      const source = 'A is B';
      compiler.compile(source);

      const block = compiler.block;
      const state = block.blockExplorer.calculateCurrentPairState({
        conceptA: { name: 'A' },
        conceptB: { name: 'B' },
      });

      expect(state).toBe(true);
    });

    it('should handle isnt hook for assignment', () => {
      const source = 'A isnt B';
      compiler.compile(source);

      const block = compiler.block;
      const state = block.blockExplorer.calculateCurrentPairState({
        conceptA: { name: 'A' },
        conceptB: { name: 'B' },
      });

      expect(state).toBe(false);
    });

    it('should handle is hook for conditional', () => {
      const source = 'A is B\nis A B say yes';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      compiler.compile(source);

      expect(consoleSpy).toHaveBeenCalledWith('yes');
      consoleSpy.mockRestore();
    });

    it('should handle isnt hook for conditional', () => {
      const source = 'A isnt B\nisnt A B say no';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      compiler.compile(source);

      expect(consoleSpy).toHaveBeenCalledWith('no');
      consoleSpy.mockRestore();
    });

    it('should handle say hook', () => {
      const source = 'say hello world';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      compiler.compile(source);

      expect(consoleSpy).toHaveBeenCalledWith('hello world');
      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid is usage', () => {
      const source = 'A is';

      expect(() => compiler.compile(source)).toThrow(
        'Invalid "is" usage: A is B'
      );
    });

    it('should throw error for invalid isnt usage', () => {
      const source = 'A isnt';

      expect(() => compiler.compile(source)).toThrow(
        'Invalid "isnt" usage: A isnt B'
      );
    });

    it('should throw error for invalid say usage', () => {
      const source = 'say';

      expect(() => compiler.compile(source)).toThrow(
        'Invalid "say" usage: say A'
      );
    });
  });

  describe('custom hooks', () => {
    it('should work with custom hook map', () => {
      const customHooks = {
        ...createDefaultHookMap(() => new Block()),
        custom: (params: Concept[]) => {
          if (params[0]?.name === 'custom') {
            console.log('Custom hook called');
          }
        },
      };

      const customCompiler = new Compiler(customHooks);
      const source = 'custom test';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      customCompiler.compile(source);

      expect(consoleSpy).toHaveBeenCalledWith('Custom hook called');
      consoleSpy.mockRestore();
    });
  });

  describe('reset functionality', () => {
    it('should reset compiler state', () => {
      const source1 = 'A is B';
      compiler.compile(source1);

      expect(compiler.block.concepts).toHaveLength(2);

      compiler.reset();

      expect(compiler.block.concepts).toHaveLength(0);
    });
  });

  describe('complex scenarios', () => {
    it('should handle the elma_mela example', () => {
      const source = `
Elma is red
Elma is food
Elma isnt blue
Elma isnt great

Mela is Elma

is Elma great say yes elma great
is Mela great say yes mela great
isnt Elma great say no elma great
isnt Mela great say no mela great

is Mela red say yes mela red
isnt Mela red say no mela red
is Elma red say yes elma red
isnt Elma red say no elma red

is Mela food say yes mela food
isnt Mela food say no mela food
is Elma food say yes elma food
isnt Elma food say no elma food

is Mela blue say yes mela blue
isnt Mela blue say no mela blue
is Elma blue say yes elma blue
isnt Elma blue say no elma blue
      `.trim();

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = compiler.compile(source);

      // Should contain the basic relationships
      expect(result).toContain('Elma is red');
      expect(result).toContain('Elma is food');
      expect(result).toContain('Elma isnt blue');
      expect(result).toContain('Elma isnt great');
      expect(result).toContain('Mela is Elma');

      // Should contain inferred relationships
      expect(result).toContain('Mela is red');
      expect(result).toContain('Mela is food');
      expect(result).toContain('Mela isnt blue');
      expect(result).toContain('Mela isnt great');

      // Should have executed say commands
      expect(consoleSpy).toHaveBeenCalledWith('no elma great');
      expect(consoleSpy).toHaveBeenCalledWith('no mela great');
      expect(consoleSpy).toHaveBeenCalledWith('yes mela red');
      expect(consoleSpy).toHaveBeenCalledWith('yes elma red');
      expect(consoleSpy).toHaveBeenCalledWith('yes mela food');
      expect(consoleSpy).toHaveBeenCalledWith('yes elma food');
      expect(consoleSpy).toHaveBeenCalledWith('no mela blue');
      expect(consoleSpy).toHaveBeenCalledWith('no elma blue');

      consoleSpy.mockRestore();
    });
  });
});
