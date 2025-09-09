import { HookMap } from '../types';
import { Block } from './block';

/**
 * Create default hook map - no default hooks, all commands are in plugins
 */
export const createDefaultHookMap = (_getBlock: () => Block): HookMap => ({
  // No default hooks - all commands are now in plugins
});

/**
 * Compiler class for processing Concept language files
 */
export class Compiler {
  private readonly _block: Block;

  constructor(hookMap?: HookMap, block?: Block) {
    this._block = block || new Block();
    const actualHookMap = hookMap || createDefaultHookMap(() => this._block);
    // Update the block with the hook map
    this._block['_hookMap'] = actualHookMap;
  }

  /**
   * Get the underlying block instance
   */
  get block(): Block {
    return this._block;
  }

  /**
   * Compile a Concept language source string
   */
  compile(source: string): string {
    const tokens = this._block.tokenize(source);
    this._block.parse(tokens);
    return this._block.serialize();
  }

  /**
   * Compile a Concept language source string and return the block state
   */
  compileToState(source: string): Block {
    const tokens = this._block.tokenize(source);
    this._block.parse(tokens);
    return this._block;
  }

  /**
   * Reset the compiler state
   */
  reset(): void {
    // Clear the existing block's data
    this._block['_concepts'].clear();
    this._block['_pairs'].clear();
    this._block['_chain'].length = 0;
  }
}
