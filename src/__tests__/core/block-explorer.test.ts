import { Block, BlockExplorer, Concept } from '../../core';

describe('BlockExplorer', () => {
  let block: Block;
  let explorer: BlockExplorer;

  beforeEach(() => {
    block = new Block();
    explorer = block.blockExplorer;
  });

  describe('concept queries', () => {
    beforeEach(() => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };
      const conceptC: Concept = { name: 'C' };

      block.addToChain(conceptA, conceptB, true);
      block.addToChain(conceptA, conceptC, false);
    });

    it('should get concept by name', () => {
      const concept = explorer.getConceptByName('A');
      expect(concept).toBeDefined();
      expect(concept?.name).toBe('A');
    });

    it('should return undefined for non-existent concept', () => {
      const concept = explorer.getConceptByName('NonExistent');
      expect(concept).toBeUndefined();
    });

    it('should get all concepts', () => {
      const concepts = explorer.getConcepts();
      expect(concepts).toHaveLength(3);
      expect(concepts.map(c => c.name)).toContain('A');
      expect(concepts.map(c => c.name)).toContain('B');
      expect(concepts.map(c => c.name)).toContain('C');
    });
  });

  describe('pair queries', () => {
    beforeEach(() => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };
      const conceptC: Concept = { name: 'C' };

      block.addToChain(conceptA, conceptB, true);
      block.addToChain(conceptA, conceptC, false);
    });

    it('should get pair by concepts', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };

      const pair = explorer.getPair({ conceptA, conceptB });
      expect(pair).toBeDefined();
      expect(pair?.conceptA.name).toBe('A');
      expect(pair?.conceptB.name).toBe('B');
    });

    it('should return undefined for non-existent pair', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptD: Concept = { name: 'D' };

      const pair = explorer.getPair({ conceptA, conceptB: conceptD });
      expect(pair).toBeUndefined();
    });

    it('should get all pairs', () => {
      const pairs = explorer.getPairs();
      expect(pairs).toHaveLength(2);
    });
  });

  describe('data queries', () => {
    beforeEach(() => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };
      const conceptC: Concept = { name: 'C' };

      block.addToChain(conceptA, conceptB, true);
      block.addToChain(conceptA, conceptC, false);
    });

    it('should get data by pair', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };

      const data = explorer.getData({
        pair: { conceptA, conceptB },
        value: true,
      });
      expect(data).toBeDefined();
      expect(data?.value).toBe(true);
    });

    it('should get all chain data', () => {
      const chain = explorer.getChain();
      expect(chain).toHaveLength(2);
    });
  });

  describe('concept-specific queries', () => {
    beforeEach(() => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };
      const conceptC: Concept = { name: 'C' };

      block.addToChain(conceptA, conceptB, true);
      block.addToChain(conceptA, conceptC, false);
      block.addToChain(conceptB, conceptC, true);
    });

    it('should get concept pairs', () => {
      const conceptA: Concept = { name: 'A' };
      const pairs = explorer.getConceptPairs(conceptA);

      expect(pairs).toHaveLength(2);
      expect(pairs.some(p => p.conceptB.name === 'B')).toBe(true);
      expect(pairs.some(p => p.conceptB.name === 'C')).toBe(true);
    });

    it('should get concept data', () => {
      const conceptA: Concept = { name: 'A' };
      const data = explorer.getConceptData(conceptA);

      expect(data).toHaveLength(2);
      expect(data.some(d => d.pair.conceptB.name === 'B')).toBe(true);
      expect(data.some(d => d.pair.conceptB.name === 'C')).toBe(true);
    });

    it('should get pair data', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };

      const data = explorer.getPairData({ conceptA, conceptB });
      expect(data).toHaveLength(1);
      expect(data[0]?.value).toBe(true);
    });
  });

  describe('state calculations', () => {
    beforeEach(() => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };
      const conceptC: Concept = { name: 'C' };

      block.addToChain(conceptA, conceptB, true);
      block.addToChain(conceptA, conceptC, false);
    });

    it('should calculate current pair state', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };

      const state = explorer.calculateCurrentPairState({ conceptA, conceptB });
      expect(state).toBe(true);
    });

    it('should return null for non-existent pair state', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptD: Concept = { name: 'D' };

      const state = explorer.calculateCurrentPairState({
        conceptA,
        conceptB: conceptD,
      });
      expect(state).toBeNull();
    });

    it('should calculate block state', () => {
      const state = explorer.calculateBlockState();

      expect(state['A']).toBeDefined();
      expect(state['A']?.['B']).toBe(true);
      expect(state['A']?.['C']).toBe(false);
    });
  });

  describe('relationship queries', () => {
    beforeEach(() => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };
      const conceptC: Concept = { name: 'C' };

      block.addToChain(conceptA, conceptB, true);
      block.addToChain(conceptA, conceptC, false);
    });

    it('should get related concepts', () => {
      const conceptA: Concept = { name: 'A' };
      const related = explorer.getRelatedConcepts(conceptA);

      expect(related).toHaveLength(2);
      expect(related.map(c => c.name)).toContain('B');
      expect(related.map(c => c.name)).toContain('C');
    });

    it('should check if concepts are related', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };
      const conceptD: Concept = { name: 'D' };

      expect(explorer.areConceptsRelated(conceptA, conceptB)).toBe(true);
      expect(explorer.areConceptsRelated(conceptA, conceptD)).toBe(false);
    });

    it('should get relationship value', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };
      const conceptC: Concept = { name: 'C' };

      expect(explorer.getRelationshipValue(conceptA, conceptB)).toBe(true);
      expect(explorer.getRelationshipValue(conceptA, conceptC)).toBe(false);
      expect(explorer.getRelationshipValue(conceptA, { name: 'D' })).toBeNull();
    });

    it('should find concepts with specific value', () => {
      const conceptA: Concept = { name: 'A' };

      const trueConcepts = explorer.findConceptsWithValue(conceptA, true);
      const falseConcepts = explorer.findConceptsWithValue(conceptA, false);

      expect(trueConcepts).toHaveLength(1);
      expect(trueConcepts[0]?.name).toBe('B');

      expect(falseConcepts).toHaveLength(1);
      expect(falseConcepts[0]?.name).toBe('C');
    });
  });

  describe('statistics', () => {
    it('should calculate stats', () => {
      const conceptA: Concept = { name: 'A' };
      const conceptB: Concept = { name: 'B' };
      const conceptC: Concept = { name: 'C' };

      block.addToChain(conceptA, conceptB, true);
      block.addToChain(conceptA, conceptC, false);

      const stats = explorer.getStats();

      expect(stats.conceptCount).toBe(3);
      expect(stats.pairCount).toBe(2);
      expect(stats.dataCount).toBe(2);
      expect(stats.averageRelationsPerConcept).toBeCloseTo(0.67, 2);
    });
  });
});
