import { Concept, HookMap } from '../types';
import { Block } from './block';

/**
 * Built-in hook functions for the Concept language
 */
export const createDefaultHookMap = (getBlock: () => Block): HookMap => ({
  is: (params: Concept[]): Concept[] | void => {
    const block = getBlock();
    if (params[0]?.name !== 'is') {
      if (params.length < 3) {
        throw new Error('Invalid "is" usage: A is B');
      }

      const [a, , ...b] = params;
      if (!a) {
        throw new Error('Invalid "is" usage: A is B');
      }
      // For "A is B", we just add the relationship directly
      if (b.length === 1 && b[0]) {
        block.addToChain(a, b[0], true);
      }
    } else {
      if (params.length < 4) {
        throw new Error('Invalid "is" usage: is A B C');
      }
      const [, a, b, ...c] = params;
      if (!a || !b) {
        throw new Error('Invalid "is" usage: is A B C');
      }
      const pairState = block.blockExplorer.calculateCurrentPairState({
        conceptA: a,
        conceptB: b,
      });
      return pairState === true ? c : [];
    }
  },

  isnt: (params: Concept[]): Concept[] | void => {
    const block = getBlock();
    if (params[0]?.name !== 'isnt') {
      if (params.length < 3) {
        throw new Error('Invalid "isnt" usage: A isnt B');
      }

      const [a, , ...b] = params;
      if (!a) {
        throw new Error('Invalid "isnt" usage: A isnt B');
      }
      // For "A isnt B", we just add the relationship directly
      if (b.length === 1 && b[0]) {
        block.addToChain(a, b[0], false);
      }
    } else {
      if (params.length < 4) {
        throw new Error('Invalid "isnt" usage: isnt A B C');
      }
      const [, a, b, ...c] = params;
      if (!a || !b) {
        throw new Error('Invalid "isnt" usage: isnt A B C');
      }
      const pairState = block.blockExplorer.calculateCurrentPairState({
        conceptA: a,
        conceptB: b,
      });
      return pairState === false ? c : [];
    }
  },

  say: (params: Concept[]): void => {
    if (params.length < 2) {
      throw new Error('Invalid "say" usage: say A');
    }
    const [, ...a] = params;
    console.log(a.map(c => c.name).join(' '));
  },
});

/**
 * Compiler class for processing Concept language files
 */
export class Compiler {
  private readonly _block: Block;

  constructor(hookMap?: HookMap) {
    this._block = new Block();
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
