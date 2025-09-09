import { Concept, Pair, Data, BlockState } from '../types';
import { Block } from './block';
/**
 * BlockExplorer provides query and analysis capabilities for a Block.
 * It allows efficient searching and state calculation without modifying the block.
 */
export declare class BlockExplorer {
    private readonly _block;
    constructor(block: Block);
    /**
     * Get a concept by name
     */
    getConcept(concept: Concept): Concept | undefined;
    /**
     * Get a concept by name string
     */
    getConceptByName(name: string): Concept | undefined;
    /**
     * Get a pair by its concepts
     */
    getPair(pair: Pair): Pair | undefined;
    /**
     * Get a data entry by its pair
     */
    getData(data: Data): Data | undefined;
    /**
     * Get all concepts in the block
     */
    getConcepts(): readonly Concept[];
    /**
     * Get all pairs in the block
     */
    getPairs(): readonly Pair[];
    /**
     * Get all data entries in the chain
     */
    getChain(): readonly Data[];
    /**
     * Get all pairs involving a specific concept
     */
    getConceptPairs(concept: Concept): readonly Pair[];
    /**
     * Get all data entries involving a specific concept
     */
    getConceptData(concept: Concept): readonly Data[];
    /**
     * Get all data entries for a specific pair
     */
    getPairData(pair: Pair): readonly Data[];
    /**
     * Calculate the current state of a pair based on the chain
     * Returns the most recent value for the pair, or null if not found
     */
    calculateCurrentPairState(pair: Pair): boolean | null;
    /**
     * Calculate the current state of the entire block
     */
    calculateBlockState(): BlockState;
    /**
     * Find all concepts that are related to a given concept
     */
    getRelatedConcepts(concept: Concept): readonly Concept[];
    /**
     * Check if two concepts are directly related
     */
    areConceptsRelated(conceptA: Concept, conceptB: Concept): boolean;
    /**
     * Get the relationship value between two concepts
     */
    getRelationshipValue(conceptA: Concept, conceptB: Concept): boolean | null;
    /**
     * Find all concepts that have a specific relationship value with another concept
     */
    findConceptsWithValue(concept: Concept, value: boolean): readonly Concept[];
    /**
     * Get statistics about the block
     */
    getStats(): {
        conceptCount: number;
        pairCount: number;
        dataCount: number;
        averageRelationsPerConcept: number;
    };
}
//# sourceMappingURL=block-explorer.d.ts.map