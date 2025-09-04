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
  private _labeledBlocks?: Map<string, Concept[]>;
  private _references: Map<string, string> = new Map();
  private _blockReferences: Map<string, Concept[]> = new Map();

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
  calculateHookResult(
    token: Concept,
    line: Concept[],
    block?: Concept[]
  ): Concept | undefined {
    const hook = this._hookMap[token.name];
    if (!hook) {
      return undefined;
    }

    const result = hook(line, block);
    if (result && result.length > 0) {
      // Return the first concept from the result instead of parsing recursively
      return result[0];
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
   * Parse a line with potential indented block
   */
  parseLineWithBlock(line: Concept[], block?: Concept[]): Concept | undefined {
    // Check if any token in the line is a hook
    for (const token of line) {
      if (token.name in this._hookMap) {
        // Pass only the command concepts as params, not the entire line
        const commandConcepts = line.slice(0, 3); // First 3 concepts are the command (db create users)
        return this.calculateHookResult(token, commandConcepts, block);
      }
    }

    // If no hooks were triggered, add the first concept to the chain
    if (line.length > 0 && line[0]) {
      return this.addConcept(line[0]);
    }

    return undefined;
  }

  /**
   * Tokenize a raw string into concept lines with labeled block support
   */
  tokenize(raw: string): Concept[][] {
    const lines = raw.trim().split('\n');
    const result: Concept[][] = [];
    let currentBlock: Concept[] | null = null;
    let blockLabel: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const trimmedLine = line.trim();
      if (trimmedLine === '') continue;

      // Calculate indentation level (count leading spaces/tabs)
      const indent = line.length - line.trimStart().length;

      // Parse the line into concepts
      const concepts = trimmedLine
        .split(' ')
        .map(str => ({ name: str }) as Concept)
        .filter(c => c.name !== '');

      if (concepts.length === 0) continue;

      // Check if this is a labeled block start (concept name followed by "is")
      if (
        indent === 0 &&
        concepts.length >= 2 &&
        concepts[1] &&
        concepts[1].name === 'is' &&
        concepts[0]
      ) {
        // This is a labeled block start
        blockLabel = concepts[0].name;
        currentBlock = [];
        result.push(concepts); // Add the label line to result
        continue;
      }

      // Check if this is a command that might have a block (like "db create users")
      if (indent === 0 && concepts.length >= 2) {
        // Check if the next line is indented (indicating a block)
        const nextLineIndex = i + 1;
        if (nextLineIndex < lines.length) {
          const nextLine = lines[nextLineIndex];
          if (nextLine) {
            const nextIndent = nextLine.length - nextLine.trimStart().length;
            if (nextIndent > 0) {
              // This command has a block - start collecting it
              blockLabel = concepts[0]?.name || null; // Use the first concept as the block label
              currentBlock = [];
              // Add the command part (first 3 concepts: db create users) to result
              result.push(concepts.slice(0, 3));
              continue;
            }
          }
        }
      }

      // Handle indented content within a block
      if (indent > 0 && currentBlock !== null) {
        // Add this line to the current block
        currentBlock.push(...concepts);
        continue;
      }

      // Regular line (no indentation or no active block)
      if (currentBlock !== null) {
        // End the current block and attach it to the last result line
        const lastLine = result[result.length - 1];
        if (lastLine && lastLine[0] && lastLine[0].name === blockLabel) {
          // Attach the block to the label line
          lastLine.push(...currentBlock);
        }
        currentBlock = null;
        blockLabel = null;
      }

      // Add regular line
      result.push(concepts);
    }

    // Handle case where file ends with an active block
    if (currentBlock !== null) {
      const lastLine = result[result.length - 1];
      if (lastLine && lastLine[0] && lastLine[0].name === blockLabel) {
        lastLine.push(...currentBlock);
      }
    }

    return result;
  }

  /**
   * Parse tokenized concepts
   */
  parse(tokens: Concept[][]): void {
    for (const line of tokens) {
      // Check if this line has a labeled block
      if (line.length >= 2 && line[1] && line[1].name === 'is' && line[0]) {
        // This is a labeled block - store it for later use
        const blockLabel = line[0];
        const blockContent = line.slice(2).filter(c => c !== undefined); // Everything after "concept is"

        // Store the labeled block for plugins to use
        this.storeLabeledBlock(blockLabel.name, blockContent);

        // Don't process the label line through hooks - it's just a label
        this.addConcept(blockLabel);
      } else if (this.hasCommandBlock(line)) {
        // This is a command with a block - the block content is already attached
        const commandConcepts = this.extractCommandConcepts(line);
        const blockContent = this.extractBlockContent(line.slice(2)); // Everything after the command

        // Process the command with the block content as waiting concepts
        this.parseLineWithBlock(commandConcepts, blockContent);
      } else {
        // Regular line
        this.parseLine(line);
      }
      this.inferMissingPairs();
    }
  }

  private storeLabeledBlock(label: string, content: Concept[]): void {
    // Store labeled blocks for plugins to access
    if (!this._labeledBlocks) {
      this._labeledBlocks = new Map();
    }
    this._labeledBlocks.set(label, content);
  }

  getLabeledBlock(label: string): Concept[] | undefined {
    return this._labeledBlocks?.get(label);
  }

  private hasCommandBlock(line: Concept[]): boolean {
    // Check if this line has block content (more than just the command)
    // A command block has the command concepts followed by block content
    return line.length > 2 && this.hasBlockContent(line);
  }

  private hasBlockContent(line: Concept[]): boolean {
    // Look for patterns that indicate block content
    // For now, we'll assume any line with more than 2 concepts might have block content
    // This is a simple heuristic - we could make it more sophisticated
    return line.length > 2;
  }

  private extractCommandConcepts(line: Concept[]): Concept[] {
    // The command concepts are already separated in the tokenize method
    // They should be the first 2 concepts (e.g., "db create")
    return line;
  }

  private extractBlockContent(line: Concept[]): Concept[] {
    // The block content is passed separately from the command
    // This method is called with the block content directly
    return line;
  }

  /**
   * Execute a concept block (array of concepts) using the same parsing logic
   */
  executeConceptBlock(concepts: Concept[]): any {
    const results: any[] = [];

    // Group concepts into lines (split by 'say' or similar delimiters)
    const lines = this.groupConceptsIntoLines(concepts);

    for (const line of lines) {
      const result = this.parseLine(line);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Group concepts into logical lines for execution
   */
  private groupConceptsIntoLines(concepts: Concept[]): Concept[][] {
    const lines: Concept[][] = [];
    let currentLine: Concept[] = [];

    for (const concept of concepts) {
      if (concept.name === 'say') {
        // 'say' ends a line
        if (currentLine.length > 0) {
          currentLine.push(concept);
          lines.push([...currentLine]);
          currentLine = [];
        }
      } else {
        currentLine.push(concept);
      }
    }

    // Add any remaining concepts as a line
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Execute concept logic and return structured data
   */
  executeConceptLogic(concepts: Concept[]): { actions: string[]; data: any } {
    const actions: string[] = [];
    const data: any = {};

    const lines = this.groupConceptsIntoLines(concepts);

    for (const line of lines) {
      // Extract action from the line
      const action = line.map(c => c.name).join(' ');
      actions.push(action);

      // Process the line through the parser
      const result = this.parseLine(line);
      if (result) {
        data[result.name] = result;
      }
    }

    return { actions, data };
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

  /**
   * Reference System Methods
   */

  /**
   * Resolve a reference (works for both simple and block references)
   */
  resolveReference(conceptName: string): any {
    // Check if it's a direct reference
    if (this._references.has(conceptName)) {
      const target = this._references.get(conceptName)!;
      // Recursively resolve if the target is also a reference
      return this.resolveReference(target);
    }

    // Check if it's a block reference
    if (this._blockReferences.has(conceptName)) {
      return this._blockReferences.get(conceptName);
    }

    // Check if it's a concept
    if (this._concepts.has(conceptName)) {
      return this._concepts.get(conceptName)!.name;
    }

    // Return the concept name as-is if no reference found
    return conceptName;
  }

  /**
   * Check if a concept is a reference
   */
  isReference(conceptName: string): boolean {
    return (
      this._references.has(conceptName) ||
      this._blockReferences.has(conceptName)
    );
  }

  /**
   * Get all references for a concept
   */
  getReferences(conceptName: string): string[] {
    const references: string[] = [];

    // Check direct references
    if (this._references.has(conceptName)) {
      references.push(this._references.get(conceptName)!);
    }

    // Check block references
    if (this._blockReferences.has(conceptName)) {
      references.push('block');
    }

    return references;
  }

  /**
   * Resolve with custom resolver
   */
  resolveWithResolver(
    conceptName: string,
    resolver: (ref: string) => any
  ): any {
    if (this.isReference(conceptName)) {
      const references = this.getReferences(conceptName);
      if (references.length > 0 && references[0]) {
        return resolver(references[0]);
      }
    }
    return conceptName;
  }

  /**
   * Add a reference
   */
  addReference(from: string, to: string): void {
    this._references.set(from, to);
  }

  /**
   * Add a block reference
   */
  addBlockReference(name: string, block: Concept[]): void {
    this._blockReferences.set(name, block);
  }
}
