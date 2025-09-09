import { Block } from '../../core/block';
import { Compiler } from '../../core/compiler';
import { Concept } from '../../types';
import { ConceptRunnerImpl } from '../../core/concept-runner';
import { RunnerConfig } from '../../types/plugin';

describe('Block', () => {
  let block: Block;
  let runner: ConceptRunnerImpl;
  let config: RunnerConfig;

  beforeEach(async () => {
    block = new Block();
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

  describe('Basic Concept Operations', () => {
    it('should add a single concept', () => {
      const concept: Concept = { name: 'apple' };
      block.addConcept(concept);

      expect(block.concepts).toHaveLength(1);
      expect(block.concepts[0]?.name).toBe('apple');
    });

    it('should not add duplicate concepts', () => {
      const concept1: Concept = { name: 'apple' };
      const concept2: Concept = { name: 'apple' };

      block.addConcept(concept1);
      block.addConcept(concept2);

      expect(block.concepts).toHaveLength(1);
      expect(block.concepts[0]?.name).toBe('apple');
    });

    it('should add multiple different concepts', () => {
      block.addConcept({ name: 'apple' });
      block.addConcept({ name: 'banana' });
      block.addConcept({ name: 'orange' });

      expect(block.concepts).toHaveLength(3);
      expect(block.concepts.map(c => c.name)).toEqual([
        'apple',
        'banana',
        'orange',
      ]);
    });
  });

  describe('Relationship Operations', () => {
    it('should add a relationship between two concepts', () => {
      const conceptA: Concept = { name: 'apple' };
      const conceptB: Concept = { name: 'fruit' };

      block.addToChain(conceptA, conceptB, true);

      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.pair.conceptA.name).toBe('apple');
      expect(block.chain[0]?.pair.conceptB.name).toBe('fruit');
      expect(block.chain[0]?.value).toBe(true);
    });

    it('should add negative relationships', () => {
      const conceptA: Concept = { name: 'apple' };
      const conceptB: Concept = { name: 'vegetable' };

      block.addToChain(conceptA, conceptB, false);

      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.value).toBe(false);
    });

    it('should not add duplicate relationships', () => {
      const conceptA: Concept = { name: 'apple' };
      const conceptB: Concept = { name: 'fruit' };

      block.addToChain(conceptA, conceptB, true);
      block.addToChain(conceptA, conceptB, true);

      expect(block.chain).toHaveLength(1);
    });

    it('should distinguish between directional relationships', () => {
      const conceptA: Concept = { name: 'apple' };
      const conceptB: Concept = { name: 'fruit' };

      block.addToChain(conceptA, conceptB, true);
      block.addToChain(conceptB, conceptA, true);

      expect(block.chain).toHaveLength(2);
      expect(block.chain[0]?.pair.conceptA.name).toBe('apple');
      expect(block.chain[0]?.pair.conceptB.name).toBe('fruit');
      expect(block.chain[1]?.pair.conceptA.name).toBe('fruit');
      expect(block.chain[1]?.pair.conceptB.name).toBe('apple');
    });
  });

  describe('Tokenization', () => {
    it('should tokenize a simple concept', () => {
      const tokens = block.tokenize('apple');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toHaveLength(1);
      expect(tokens[0]?.[0]?.name).toBe('apple');
    });

    it('should tokenize a relationship', () => {
      const tokens = block.tokenize('apple is fruit');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toHaveLength(3);
      expect(tokens[0]?.map(c => c.name)).toEqual(['apple', 'is', 'fruit']);
    });

    it('should tokenize indented content as single concept', () => {
      const tokens = block.tokenize('        apple is fruit');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toHaveLength(1);
      expect(tokens[0]?.[0]?.name).toBe('apple is fruit');
    });

    it('should tokenize command with block content', () => {
      const input = `d is
        e is a`;
      const tokens = block.tokenize(input);

      expect(tokens).toHaveLength(2);
      expect(tokens[0]?.map(c => c.name)).toEqual(['d', 'is']);
      expect(tokens[1]).toHaveLength(1);
      expect(tokens[1]?.[0]?.name).toBe('e is a');
    });

    it('should tokenize multiple lines', () => {
      const input = `apple is fruit
banana is fruit
orange is fruit`;
      const tokens = block.tokenize(input);

      expect(tokens).toHaveLength(3);
      expect(tokens[0]?.map(c => c.name)).toEqual(['apple', 'is', 'fruit']);
      expect(tokens[1]?.map(c => c.name)).toEqual(['banana', 'is', 'fruit']);
      expect(tokens[2]?.map(c => c.name)).toEqual(['orange', 'is', 'fruit']);
    });
  });

  describe('Parsing', () => {
    it('should parse a simple concept', () => {
      const tokens = block.tokenize('apple');
      block.parse(tokens);

      expect(block.concepts).toHaveLength(1);
      expect(block.concepts[0]?.name).toBe('apple');
    });

    it('should parse a relationship', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('apple is fruit');

      expect(block.concepts).toHaveLength(2);
      expect(block.concepts.map(c => c.name)).toEqual(['apple', 'fruit']);
      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.pair.conceptA.name).toBe('apple');
      expect(block.chain[0]?.pair.conceptB.name).toBe('fruit');
    });

    it('should parse indented content as boxed concept', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('        apple is fruit');

      expect(block.concepts).toHaveLength(3); // apple, fruit, and the boxed concept
      expect(block.concepts.some(c => c.name === 'apple is fruit')).toBe(true);
      expect(block.concepts.some(c => c.name === 'apple')).toBe(true);
      expect(block.concepts.some(c => c.name === 'fruit')).toBe(true);
    });

    it('should parse command with block content', () => {
      const compiler = new Compiler();
      const input = `d is
        e is a`;
      const tokens = compiler.block.tokenize(input);
      compiler.block.parse(tokens);

      expect(compiler.block.concepts).toHaveLength(5); // d, is, e is a, e, a
      expect(compiler.block.concepts.some(c => c.name === 'd')).toBe(true);
      expect(compiler.block.concepts.some(c => c.name === 'is')).toBe(true);
      expect(compiler.block.concepts.some(c => c.name === 'e is a')).toBe(true);
      expect(compiler.block.concepts.some(c => c.name === 'e')).toBe(true);
      expect(compiler.block.concepts.some(c => c.name === 'a')).toBe(true);
    });
  });

  describe('Boxed Concepts', () => {
    it('should create boxed concepts for indented content', () => {
      const compiler = new Compiler();
      const tokens = compiler.block.tokenize('        apple is fruit');
      compiler.block.parse(tokens);

      const boxedConcept = compiler.block.concepts.find(
        c => c.name === 'apple is fruit'
      );
      expect(boxedConcept).toBeDefined();
      expect(boxedConcept?.block).toBeDefined();
      expect(boxedConcept?.block).toHaveLength(3);
      expect(boxedConcept?.block?.map(c => c.name)).toEqual([
        'apple',
        'is',
        'fruit',
      ]);
    });

    it('should process boxed concept content', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('        apple is fruit');

      // The boxed content should be processed as a regular line
      expect(block.concepts.some(c => c.name === 'apple')).toBe(true);
      expect(block.concepts.some(c => c.name === 'fruit')).toBe(true);
      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.pair.conceptA.name).toBe('apple');
      expect(block.chain[0]?.pair.conceptB.name).toBe('fruit');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const tokens = block.tokenize('');
      block.parse(tokens);

      expect(block.concepts).toHaveLength(0);
      expect(block.chain).toHaveLength(0);
    });

    it('should handle whitespace-only input', () => {
      const tokens = block.tokenize('   \n  \t  \n  ');
      block.parse(tokens);

      expect(block.concepts).toHaveLength(0);
      expect(block.chain).toHaveLength(0);
    });

    it('should handle single character concepts', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('a is b');

      expect(block.concepts).toHaveLength(2);
      expect(block.concepts.map(c => c.name)).toEqual(['a', 'b']);
      expect(block.chain).toHaveLength(1);
    });

    it('should handle concepts with special characters', () => {
      const block = runner.getBlock();
      runner.getCompiler().compile('user-name is valid-identifier');

      expect(block.concepts).toHaveLength(2);
      expect(block.concepts.map(c => c.name)).toEqual([
        'user-name',
        'valid-identifier',
      ]);
      expect(block.chain).toHaveLength(1);
    });
  });
});
