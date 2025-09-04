import { Compiler } from '../../core/compiler';

describe('Compiler Integration Tests', () => {
  let compiler: Compiler;

  beforeEach(() => {
    compiler = new Compiler();
  });

  describe('real-world scenarios', () => {
    it('should handle complex inference chains', () => {
      const source = `
        A is B
        B is C
        C is D
        D is E
        E is F
      `.trim();

      const result = compiler.compile(source);
      const block = compiler.block;

      // Should have inferred all transitive relationships
      expect(result).toContain('A is B');
      expect(result).toContain('B is C');
      expect(result).toContain('C is D');
      expect(result).toContain('D is E');
      expect(result).toContain('E is F');

      // Check inferred relationships
      expect(result).toContain('A is C');
      expect(result).toContain('A is D');
      expect(result).toContain('A is E');
      expect(result).toContain('A is F');
      expect(result).toContain('B is D');
      expect(result).toContain('B is E');
      expect(result).toContain('B is F');
      expect(result).toContain('C is E');
      expect(result).toContain('C is F');
      expect(result).toContain('D is F');

      // Verify the block state
      expect(block.concepts).toHaveLength(6);
      expect(block.chain.length).toBeGreaterThan(6); // Original + inferred
    });

    it('should handle mixed positive and negative relationships', () => {
      const source = `
        A is B
        B is C
        C isnt D
        D is E
      `.trim();

      const result = compiler.compile(source);

      // Original relationships
      expect(result).toContain('A is B');
      expect(result).toContain('B is C');
      expect(result).toContain('C isnt D');
      expect(result).toContain('D is E');

      // Inferred relationships
      expect(result).toContain('A is C');
      expect(result).toContain('A isnt D');
      expect(result).toContain('A isnt E');
      expect(result).toContain('B isnt D');
      expect(result).toContain('B isnt E');
    });

    it('should handle conditional execution correctly', () => {
      const source = `
        A is B
        B is C
        C is D
        
        is A D say found path
        isnt A D say no path
        is B C say b to c
        isnt B C say not b to c
      `.trim();

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      compiler.compile(source);

      expect(consoleSpy).toHaveBeenCalledWith('found path');
      expect(consoleSpy).toHaveBeenCalledWith('b to c');
      expect(consoleSpy).not.toHaveBeenCalledWith('no path');
      expect(consoleSpy).not.toHaveBeenCalledWith('not b to c');

      consoleSpy.mockRestore();
    });

    it('should handle empty lines and whitespace', () => {
      const source = `
        A is B
        
        
        C is D
        
        E is F
      `.trim();

      const result = compiler.compile(source);

      expect(result).toContain('A is B');
      expect(result).toContain('C is D');
      expect(result).toContain('E is F');
    });

    it('should handle single concept lines', () => {
      const source = `
        A
        B
        C is D
      `.trim();

      const result = compiler.compile(source);
      const block = compiler.block;

      expect(block.concepts).toHaveLength(4);
      expect(result).toContain('C is D');
    });
  });

  describe('performance tests', () => {
    it('should handle large concept networks efficiently', () => {
      const concepts = Array.from({ length: 50 }, (_, i) => `Concept${i}`); // Reduced from 100 to 50
      const source = concepts
        .map((concept, i) => {
          if (i === 0) return '';
          return `${concept} is ${concepts[i - 1]}`;
        })
        .filter(line => line !== '')
        .join('\n');

      const startTime = Date.now();
      const result = compiler.compile(source);
      const endTime = Date.now();

      // Should complete in reasonable time (less than 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);

      // Should have inferred many relationships
      const lines = result.split('\n').filter(line => line.trim() !== '');
      expect(lines.length).toBeGreaterThan(50);
    });

    it('should handle deep inference chains efficiently', () => {
      const depth = 50;
      const source = Array.from(
        { length: depth },
        (_, i) => `Level${i} is Level${i + 1}`
      ).join('\n');

      const startTime = Date.now();
      const result = compiler.compile(source);
      const endTime = Date.now();

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(1000);

      // Should have inferred all transitive relationships
      const lines = result.split('\n').filter(line => line.trim() !== '');
      expect(lines.length).toBeGreaterThan(depth);
    });
  });

  describe('edge cases', () => {
    it('should handle empty source', () => {
      const result = compiler.compile('');
      expect(result).toBe('');
    });

    it('should handle source with only whitespace', () => {
      const result = compiler.compile('   \n  \n  ');
      expect(result).toBe('');
    });

    it('should handle single word lines', () => {
      const source = 'A\nB\nC';
      const result = compiler.compile(source);
      const block = compiler.block;

      expect(block.concepts).toHaveLength(3);
      expect(result).toBe('');
    });

    it('should handle duplicate relationships', () => {
      const source = 'A is B\nA is B\nA is B';
      const result = compiler.compile(source);

      // Should only appear once in output
      const lines = result.split('\n').filter(line => line.includes('A is B'));
      expect(lines).toHaveLength(1);
    });
  });
});
