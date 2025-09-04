import { Block, Concept } from '../../core';

describe('Block', () => {
  let block: Block;

  beforeEach(() => {
    block = new Block();
  });

  describe('concept management', () => {
    it('should add a concept', () => {
      const concept: Concept = { name: 'test' };
      const result = block.addConcept(concept);

      expect(result).toBe(concept);
      expect(block.concepts).toContain(concept);
      expect(block.hasConcept(concept)).toBe(true);
    });

    it('should not add duplicate concepts', () => {
      const concept: Concept = { name: 'test' };
      const result1 = block.addConcept(concept);
      const result2 = block.addConcept(concept);

      expect(result1).toBe(result2);
      expect(block.concepts).toHaveLength(1);
    });

    it('should get concept by name', () => {
      const concept: Concept = { name: 'test' };
      block.addConcept(concept);

      expect(block.getConcept('test')).toBe(concept);
      expect(block.getConcept('nonexistent')).toBeUndefined();
    });
  });

  describe('pair management', () => {
    it('should add a pair', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };

      const pair = block.addPair(conceptA, conceptB);

      expect(pair.conceptA).toBe(conceptA);
      expect(pair.conceptB).toBe(conceptB);
      expect(block.isPairAvailable(conceptA, conceptB)).toBe(true);
      expect(block.pairs).toContain(pair);
    });

    it('should add concepts when adding a pair', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };

      block.addPair(conceptA, conceptB);

      expect(block.hasConcept(conceptA)).toBe(true);
      expect(block.hasConcept(conceptB)).toBe(true);
    });

    it('should not add duplicate pairs', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };

      const pair1 = block.addPair(conceptA, conceptB);
      const pair2 = block.addPair(conceptA, conceptB);

      expect(pair1).toBe(pair2);
      expect(block.pairs).toHaveLength(1);
    });
  });

  describe('data management', () => {
    it('should add data to chain', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };
      const pair = block.addPair(conceptA, conceptB);

      block.addData(pair, true);

      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.pair).toBe(pair);
      expect(block.chain[0]?.value).toBe(true);
    });

    it('should add to chain with convenience method', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };

      block.addToChain(conceptA, conceptB, true);

      expect(block.chain).toHaveLength(1);
      expect(block.chain[0]?.value).toBe(true);
    });
  });

  describe('inference', () => {
    it('should infer missing pairs', () => {
      // A is B, B is C -> A is C
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };
      const conceptC: Concept = { name: 'C' };

      block.addToChain(conceptA, conceptB, true);
      block.addToChain(conceptB, conceptC, true);

      block.inferMissingPairs();

      const inferredPair = block.blockExplorer.calculateCurrentPairState({
        conceptA,
        conceptB: conceptC,
      });

      expect(inferredPair).toBe(true);
    });

    it('should handle negative inference', () => {
      // A is B, B isnt C -> A isnt C
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };
      const conceptC: Concept = { name: 'C' };

      block.addToChain(conceptA, conceptB, true);
      block.addToChain(conceptB, conceptC, false);

      block.inferMissingPairs();

      const inferredPair = block.blockExplorer.calculateCurrentPairState({
        conceptA,
        conceptB: conceptC,
      });

      expect(inferredPair).toBe(false);
    });

    it('should not infer self-references', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };

      block.addToChain(conceptA, conceptB, true);
      block.addToChain(conceptB, conceptA, true);

      block.inferMissingPairs();

      // Should not create A is A
      const selfRef = block.blockExplorer.calculateCurrentPairState({
        conceptA,
        conceptB: conceptA,
      });

      expect(selfRef).toBeNull();
    });
  });

  describe('tokenization and parsing', () => {
    it('should tokenize a simple string', () => {
      const source = 'A is B\nC isnt D';
      const tokens = block.tokenize(source);

      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual([{ name: 'A' }, { name: 'is' }, { name: 'B' }]);
      expect(tokens[1]).toEqual([
        { name: 'C' },
        { name: 'isnt' },
        { name: 'D' },
      ]);
    });

    it('should parse tokens', () => {
      const tokens: Concept[][] = [
        [{ name: 'A' }, { name: 'is' }, { name: 'B' }],
        [{ name: 'C' }, { name: 'isnt' }, { name: 'D' }],
      ];

      // Add basic hooks for testing
      block['_hookMap'] = {
        is: (params: Concept[]) => {
          if (params[0]?.name !== 'is' && params.length >= 3) {
            const [a, , ...b] = params;
            if (a && b.length === 1 && b[0]) {
              block.addToChain(a, b[0], true);
            }
          }
        },
        isnt: (params: Concept[]) => {
          if (params[0]?.name !== 'isnt' && params.length >= 3) {
            const [a, , ...b] = params;
            if (a && b.length === 1 && b[0]) {
              block.addToChain(a, b[0], false);
            }
          }
        },
      };

      block.parse(tokens);

      expect(block.concepts).toHaveLength(4);
      expect(block.chain).toHaveLength(2);
    });
  });

  describe('serialization', () => {
    it('should serialize to string', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };
      const conceptC: Concept = { name: 'C' };

      block.addToChain(conceptA, conceptB, true);
      block.addToChain(conceptA, conceptC, false);

      const result = block.serialize();

      expect(result).toContain('A is B');
      expect(result).toContain('A isnt C');
    });
  });

  describe('state management', () => {
    it('should get block state', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };

      block.addToChain(conceptA, conceptB, true);

      const state = block.getState();

      expect(state['A']).toBeDefined();
      expect(state['A']?.['B']).toBe(true);
    });
  });
});
