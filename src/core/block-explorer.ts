import { Concept, Pair, Data, BlockState } from '../types';
import { Block } from './block';

/**
 * BlockExplorer provides query and analysis capabilities for a Block.
 * It allows efficient searching and state calculation without modifying the block.
 */
export class BlockExplorer {
  private readonly _block: Block;

  constructor(block: Block) {
    this._block = block;
  }

  /**
   * Get a concept by name
   */
  getConcept(concept: Concept): Concept | undefined {
    return this._block.getConcept(concept.name);
  }

  /**
   * Get a concept by name string
   */
  getConceptByName(name: string): Concept | undefined {
    return this._block.getConcept(name);
  }

  /**
   * Get a pair by its concepts
   */
  getPair(pair: Pair): Pair | undefined {
    return this._block.pairs.find(
      p =>
        p.conceptA.name === pair.conceptA.name &&
        p.conceptB.name === pair.conceptB.name
    );
  }

  /**
   * Get a data entry by its pair
   */
  getData(data: Data): Data | undefined {
    return this._block.chain.find(
      d =>
        d.pair.conceptA.name === data.pair.conceptA.name &&
        d.pair.conceptB.name === data.pair.conceptB.name
    );
  }

  /**
   * Get all concepts in the block
   */
  getConcepts(): readonly Concept[] {
    return this._block.concepts;
  }

  /**
   * Get all pairs in the block
   */
  getPairs(): readonly Pair[] {
    return this._block.pairs;
  }

  /**
   * Get all data entries in the chain
   */
  getChain(): readonly Data[] {
    return this._block.chain;
  }

  /**
   * Get all pairs involving a specific concept
   */
  getConceptPairs(concept: Concept): readonly Pair[] {
    return this._block.pairs.filter(
      p => p.conceptA.name === concept.name || p.conceptB.name === concept.name
    );
  }

  /**
   * Get all data entries involving a specific concept
   */
  getConceptData(concept: Concept): readonly Data[] {
    return this._block.chain.filter(
      d =>
        d.pair.conceptA.name === concept.name ||
        d.pair.conceptB.name === concept.name
    );
  }

  /**
   * Get all data entries for a specific pair
   */
  getPairData(pair: Pair): readonly Data[] {
    return this._block.chain.filter(
      d =>
        d.pair.conceptA.name === pair.conceptA.name &&
        d.pair.conceptB.name === pair.conceptB.name
    );
  }

  /**
   * Calculate the current state of a pair based on the chain
   * Returns the most recent value for the pair, or null if not found
   */
  calculateCurrentPairState(pair: Pair): boolean | null {
    const pairData = this.getPairData(pair);
    if (pairData.length === 0) {
      return null;
    }

    // Return the most recent value (last in chain)
    const lastData = pairData[pairData.length - 1];
    return lastData?.value ?? null;
  }

  /**
   * Calculate the current state of the entire block
   */
  calculateBlockState(): BlockState {
    const state: Record<string, Record<string, boolean>> = {};

    for (const data of this._block.chain) {
      const conceptA = data.pair.conceptA.name;
      const conceptB = data.pair.conceptB.name;

      if (!state[conceptA]) {
        state[conceptA] = {};
      }
      state[conceptA][conceptB] = data.value;
    }

    return state as BlockState;
  }

  /**
   * Find all concepts that are related to a given concept
   */
  getRelatedConcepts(concept: Concept): readonly Concept[] {
    const relatedNames = new Set<string>();

    for (const pair of this._block.pairs) {
      if (pair.conceptA.name === concept.name) {
        relatedNames.add(pair.conceptB.name);
      } else if (pair.conceptB.name === concept.name) {
        relatedNames.add(pair.conceptA.name);
      }
    }

    return Array.from(relatedNames)
      .map(name => this.getConceptByName(name))
      .filter((c): c is Concept => c !== undefined);
  }

  /**
   * Check if two concepts are directly related
   */
  areConceptsRelated(conceptA: Concept, conceptB: Concept): boolean {
    return this._block.isPairAvailable(conceptA, conceptB);
  }

  /**
   * Get the relationship value between two concepts
   */
  getRelationshipValue(conceptA: Concept, conceptB: Concept): boolean | null {
    const pair = this.getPair({ conceptA, conceptB });
    if (!pair) {
      return null;
    }
    return this.calculateCurrentPairState(pair);
  }

  /**
   * Find all concepts that have a specific relationship value with another concept
   */
  findConceptsWithValue(concept: Concept, value: boolean): readonly Concept[] {
    return this._block.chain
      .filter(data => {
        const isConceptA = data.pair.conceptA.name === concept.name;
        const isConceptB = data.pair.conceptB.name === concept.name;
        return (isConceptA || isConceptB) && data.value === value;
      })
      .map(data => {
        const isConceptA = data.pair.conceptA.name === concept.name;
        return isConceptA ? data.pair.conceptB : data.pair.conceptA;
      });
  }

  /**
   * Get statistics about the block
   */
  getStats(): {
    conceptCount: number;
    pairCount: number;
    dataCount: number;
    averageRelationsPerConcept: number;
  } {
    const conceptCount = this._block.concepts.length;
    const pairCount = this._block.pairs.length;
    const dataCount = this._block.chain.length;
    const averageRelationsPerConcept =
      conceptCount > 0 ? dataCount / conceptCount : 0;

    return {
      conceptCount,
      pairCount,
      dataCount,
      averageRelationsPerConcept,
    };
  }
}
