import {
  Concept,
  Pair,
  Data,
  HookMap,
  BlockConfig,
  BlockState,
} from '../types';
import { BlockExplorer } from './block-explorer';

/**
 * A Block represents a collection of concepts, their relationships, and inference rules.
 * It serves as the core data structure for the Concept language system.
 */
export class Block {
  private readonly _concepts: Map<string, Concept> = new Map();
  private readonly _pairs: Map<string, Pair> = new Map();
  private readonly _chain: Data[] = [];
  private _hookMap: HookMap;
  private readonly _blockExplorer: BlockExplorer;

  constructor(config: BlockConfig = {}) {
    this._hookMap = config.hookMap || {};
    this._blockExplorer = new BlockExplorer(this);

    // Initialize with provided data
    if (config.concepts) {
      config.concepts.forEach(concept => this.addConcept(concept));
    }
    if (config.pairs) {
      config.pairs.forEach(pair => this.addPair(pair));
    }
    if (config.chain) {
      config.chain.forEach(data => this.addData(data));
    }
  }

  /**
   * Get all concepts in the block
   */
  get concepts(): readonly Concept[] {
    return Array.from(this._concepts.values());
  }

  /**
   * Get all pairs in the block
   */
  get pairs(): readonly Pair[] {
    return Array.from(this._pairs.values());
  }

  /**
   * Get all data entries in the chain
   */
  get chain(): readonly Data[] {
    return [...this._chain];
  }

  /**
   * Get the block explorer instance
   */
  get blockExplorer(): BlockExplorer {
    return this._blockExplorer;
  }

  /**
   * Add a concept to the block if it doesn't already exist
   */
  addConcept(concept: Concept): Concept {
    const existing = this._concepts.get(concept.name);
    if (existing) {
      return existing;
    }
    this._concepts.set(concept.name, concept);
    return concept;
  }

  /**
   * Check if a concept exists in the block
   */
  hasConcept(concept: Concept): boolean {
    return this._concepts.has(concept.name);
  }

  /**
   * Get a concept by name
   */
  getConcept(name: string): Concept | undefined {
    return this._concepts.get(name);
  }

  /**
   * Check if a pair exists in the block
   */
  isPairAvailable(conceptA: Concept, conceptB: Concept): boolean {
    const key = this._getPairKey(conceptA, conceptB);
    return this._pairs.has(key);
  }

  /**
   * Add a pair to the block if it doesn't already exist
   */
  addPair(conceptA: Concept, conceptB: Concept): Pair;
  addPair(pair: Pair): Pair;
  addPair(conceptAOrPair: Concept | Pair, conceptB?: Concept): Pair {
    let pair: Pair;

    if (conceptB) {
      // Called with two concepts
      pair = { conceptA: conceptAOrPair as Concept, conceptB };
    } else {
      // Called with a pair object
      pair = conceptAOrPair as Pair;
    }

    const key = this._getPairKey(pair.conceptA, pair.conceptB);
    const existing = this._pairs.get(key);
    if (existing) {
      return existing;
    }

    // Ensure both concepts are in the block
    this.addConcept(pair.conceptA);
    this.addConcept(pair.conceptB);

    this._pairs.set(key, pair);
    return pair;
  }

  /**
   * Add a data entry to the chain
   */
  addData(pair: Pair, value: boolean): void;
  addData(data: Data): void;
  addData(pairOrData: Pair | Data, value?: boolean): void {
    let data: Data;

    if (value !== undefined) {
      // Called with pair and value
      data = { pair: pairOrData as Pair, value };
    } else {
      // Called with data object
      data = pairOrData as Data;
    }

    // Ensure the pair exists
    this.addPair(data.pair);

    // Check if this exact relationship already exists
    const existingData = this._chain.find(
      d =>
        d.pair.conceptA.name === data.pair.conceptA.name &&
        d.pair.conceptB.name === data.pair.conceptB.name &&
        d.value === data.value
    );

    if (!existingData) {
      this._chain.push(data);
    }
  }

  /**
   * Add a relationship to the chain (convenience method)
   */
  addToChain(conceptA: Concept, conceptB: Concept, relation: boolean): void {
    const pair = this.addPair(conceptA, conceptB);
    this.addData(pair, relation);
  }

  /**
   * Infer missing pairs based on existing relationships
   */
  inferMissingPairs(): void {
    const pairsArray = Array.from(this._pairs.values());

    for (const pair of pairsArray) {
      const { conceptA, conceptB } = pair;

      // Find pairs where conceptA is the conceptB of another pair
      const dependentPairs = pairsArray.filter(
        p => p.conceptB.name === conceptA.name
      );

      for (const dependentPair of dependentPairs) {
        // Skip if we're creating a self-reference
        if (dependentPair.conceptA.name === conceptB.name) {
          continue;
        }

        // Check if the inferred pair already exists
        const inferredPairKey = this._getPairKey(
          dependentPair.conceptA,
          conceptB
        );
        if (this._pairs.has(inferredPairKey)) {
          continue;
        }

        // Calculate the states of the relevant pairs
        const dependentPairState =
          this._blockExplorer.calculateCurrentPairState(dependentPair);
        const currentPairState = this._blockExplorer.calculateCurrentPairState({
          conceptA: dependentPair.conceptB,
          conceptB: conceptB,
        });

        // Only infer if we have a definitive state for the dependent pair
        if (dependentPairState !== null) {
          const inferredValue =
            currentPairState === true
              ? dependentPairState
              : !dependentPairState;
          this.addToChain(dependentPair.conceptA, conceptB, inferredValue);
        }
      }
    }
  }

  /**
   * Calculate the result of a hook function
   */
  calculateHookResult(token: Concept, line: Concept[]): Concept | undefined {
    const hook = this._hookMap[token.name];
    if (!hook) {
      return undefined;
    }

    const result = hook(line);
    if (result) {
      return this.parseLine(result);
    }
    return undefined;
  }

  /**
   * Parse a line of concepts
   */
  parseLine(line: Concept[]): Concept | undefined {
    // Check if any token in the line is a hook
    for (const token of line) {
      if (token.name in this._hookMap) {
        return this.calculateHookResult(token, line);
      }
    }

    // If no hooks were triggered, add the first concept to the chain
    if (line.length > 0 && line[0]) {
      return this.addConcept(line[0]);
    }

    return undefined;
  }

  /**
   * Tokenize a raw string into concept lines
   */
  tokenize(raw: string): Concept[][] {
    return raw
      .trim()
      .split('\n')
      .map(line =>
        line
          .trim()
          .split(' ')
          .map(str => ({ name: str }) as Concept)
          .filter(c => c.name !== '')
      )
      .filter(line => line.length > 0);
  }

  /**
   * Parse tokenized concepts
   */
  parse(tokens: Concept[][]): void {
    for (const line of tokens) {
      this.parseLine(line);
      this.inferMissingPairs();
    }
  }

  /**
   * Serialize the block to a string representation
   */
  serialize(): string {
    return this._chain
      .map(data =>
        data.value
          ? `${data.pair.conceptA.name} is ${data.pair.conceptB.name}`
          : `${data.pair.conceptA.name} isnt ${data.pair.conceptB.name}`
      )
      .join('\n');
  }

  /**
   * Get the current state of the block as a nested object
   */
  getState(): BlockState {
    return this._blockExplorer.calculateBlockState();
  }

  /**
   * Generate a unique key for a pair
   */
  private _getPairKey(conceptA: Concept, conceptB: Concept): string {
    // Ensure consistent ordering for pairs
    const [first, second] = [conceptA.name, conceptB.name].sort();
    return `${first}:${second}`;
  }
}
