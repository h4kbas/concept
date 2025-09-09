import { Concept, Pair, Data, BlockConfig, BlockState } from '../types';
import { BlockExplorer } from './block-explorer';
/**
 * A Block represents a collection of concepts, their relationships, and inference rules.
 * It serves as the core data structure for the Concept language system.
 */
export declare class Block {
    private readonly _concepts;
    private readonly _pairs;
    private readonly _chain;
    private _hookMap;
    private readonly _blockExplorer;
    private _labeledBlocks?;
    private _references;
    private _blockReferences;
    constructor(config?: BlockConfig);
    /**
     * Get all concepts in the block
     */
    get concepts(): readonly Concept[];
    /**
     * Get all pairs in the block
     */
    get pairs(): readonly Pair[];
    /**
     * Get all data entries in the chain
     */
    get chain(): readonly Data[];
    /**
     * Get the block explorer instance
     */
    get blockExplorer(): BlockExplorer;
    /**
     * Add a concept to the block if it doesn't already exist
     */
    addConcept(concept: Concept): Concept;
    /**
     * Check if a concept exists in the block
     */
    hasConcept(concept: Concept): boolean;
    /**
     * Get a concept by name
     */
    getConcept(name: string): Concept | undefined;
    /**
     * Check if a pair exists in the block
     */
    isPairAvailable(conceptA: Concept, conceptB: Concept): boolean;
    /**
     * Add a pair to the block if it doesn't already exist
     */
    addPair(conceptA: Concept, conceptB: Concept): Pair;
    addPair(pair: Pair): Pair;
    /**
     * Add a data entry to the chain
     */
    addData(pair: Pair, value: boolean): void;
    addData(data: Data): void;
    /**
     * Add a relationship to the chain (convenience method)
     */
    addToChain(conceptA: Concept, conceptB: Concept, relation: boolean, relationshipType?: string): void;
    /**
     * Infer missing pairs based on existing relationships
     */
    inferMissingPairs(): void;
    /**
     * Calculate the result of a hook function
     */
    calculateHookResult(token: Concept, line: Concept[], block?: Concept[]): Concept | undefined;
    /**
     * Parse a line of concepts
     */
    parseLine(line: Concept[]): Concept | undefined;
    /**
     * Parse a line with potential indented block
     */
    parseLineWithBlock(line: Concept[], block?: Concept[]): Concept | undefined;
    /**
     * Tokenize a raw string into concept lines with native block support
     * This method handles both single-line commands and multi-line blocks natively
     */
    tokenize(raw: string): Concept[][];
    /**
     * Parse tokenized concepts with native block support
     */
    parse(tokens: Concept[][]): void;
    getLabeledBlock(label: string): Concept[] | undefined;
    private hasCommandBlock;
    private extractBlockContent;
    /**
     * Execute a concept block (array of concepts) using the same parsing logic
     */
    executeConceptBlock(concepts: Concept[]): any;
    /**
     * Group concepts into logical lines for execution
     */
    private groupConceptsIntoLines;
    /**
     * Group concepts into relationship lines (split by 'is' commands)
     */
    private groupConceptsIntoRelationshipLines;
    /**
     * Execute concept logic and return structured data
     */
    executeConceptLogic(concepts: Concept[]): {
        actions: string[];
        data: any;
    };
    /**
     * Serialize the block to a string representation
     */
    serialize(): string;
    /**
     * Get the current state of the block as a nested object
     */
    getState(): BlockState;
    /**
     * Generate a unique key for a pair
     */
    private _getPairKey;
    /**
     * Reference System Methods
     */
    /**
     * Resolve a reference (works for both simple and block references)
     */
    resolveReference(conceptName: string): any;
    /**
     * Check if a concept is a reference
     */
    isReference(conceptName: string): boolean;
    /**
     * Get all references for a concept
     */
    getReferences(conceptName: string): string[];
    /**
     * Resolve with custom resolver
     */
    resolveWithResolver(conceptName: string, resolver: (ref: string) => any): any;
    /**
     * Add a reference
     */
    addReference(from: string, to: string): void;
    /**
     * Add a block reference
     */
    addBlockReference(name: string, block: Concept[]): void;
}
//# sourceMappingURL=block.d.ts.map