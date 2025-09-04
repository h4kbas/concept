import fs from 'fs';
import { Block, HookMap } from './index';
import { Concept } from './types';

const [_, __, ...args] = process.argv;
const [input, output] = args;

const text = fs.readFileSync(`${input || 'input'}.concept`, 'utf-8');

export const hookMap: HookMap = {
  is: (params: Concept[], _blockContent?: Concept[]) => {
    // Handle A is B pattern (3 params: A, is, B)
    if (params.length === 3 && params[1] && params[1].name === 'is') {
      const [a, _, b] = params;
      if (a && b) {
        block.addToChain(a, b, true);
        return params;
      }
    }
    // Handle is A B C pattern (4+ params: is, A, B, C...)
    else if (params.length >= 4 && params[0] && params[0].name === 'is') {
      const [_, a, b, ...c] = params;
      if (a && b) {
        const pairState = block.blockExplorer.calculateCurrentPairState({
          conceptA: a,
          conceptB: b,
        });
        return pairState === true ? c : [];
      }
    }
    // Handle D is is A B C pattern (5+ params: D, is, is, A, B, C...)
    else if (
      params.length >= 5 &&
      params[1] &&
      params[1].name === 'is' &&
      params[2] &&
      params[2].name === 'is'
    ) {
      const [a, _, __, ...b] = params;
      if (a && b.length > 0) {
        // Create a concept from the remaining parameters
        const concept = { name: b.map(c => c.name).join(' ') };
        block.addToChain(a, concept, true);
      }
      return params;
    }

    return params;
  },
  isnt: (params: Concept[]) => {
    if (params[0] && params[0].name !== 'isnt') {
      if (params.length < 3) {
        throw new Error('Isnt is used: A isnt B');
      }

      const [a, _, ...b] = params;
      if (a) {
        // D isnt is A B C
        const res = block.parseLine(b);
        if (res) {
          block.addToChain(a, res, false);
        }
      }
      return params;
    }
    // isnt A B C
    else {
      if (params.length < 4) {
        throw new Error('Isnt is used: isnt A B C');
      }
      const [_, a, b, ...c] = params;
      if (a && b) {
        const pairState = block.blockExplorer.calculateCurrentPairState({
          conceptA: a,
          conceptB: b,
        });
        return pairState === false ? c : [];
      }
      return [];
    }
  },
  say: (params: Concept[]) => {
    if (params.length < 2) {
      throw new Error('Say is used: say A');
    }
    const [_, ...a] = params;
    console.log(a.map(c => c.name).join(' '));
  },
};

const block = new Block({ hookMap });

const tokens = block.tokenize(text);
block.parse(tokens);

const result = block.serialize();

fs.writeFileSync(`${output || 'output'}.concept`, result, {
  encoding: 'utf-8',
  flag: 'w',
});
