import fs from "fs";
import { Block, BlockExplorer, HookMap } from "./concept";

const text = fs.readFileSync("input.concept", "utf-8");

export const hookMap: HookMap = {
  is: (params) => {
    if (params[0].name !== "is") {
      if (params.length < 3) {
        throw new Error("Is is used: A is B");
      }

      const [a, _, ...b] = params;
      // D is is A B C
      const res = block.parseLine(b);
      if (res) {
        block.addToChain(a, res, true);
      }
    }
    // is A B C
    else {
      if (params.length < 4) {
        throw new Error("Is is used: is A B C");
      }
      const [_, a, b, ...c] = params;
      const pairState = blockExplorer.calculateCurrentPairState({
        conceptA: a,
        conceptB: b,
      });
      console.log(pairState ? c : []);
      return pairState ? c : [];
    }
  },
  isnt: (params) => {
    if (params.length !== 3) {
      throw new Error("Is isnt used: A is B");
    }
    const [a, _, b] = params;

    block.addToChain(a, b, false);
  },
};

const block = new Block({ hookMap });
const blockExplorer = new BlockExplorer(block);

const tokens = block.tokenize(text);
block.parse(tokens);

const result = block.serialize();

fs.writeFileSync("test.json", JSON.stringify(block, undefined, 2), {
  encoding: "utf-8",
  flag: "w",
});

fs.writeFileSync("output.concept", result, {
  encoding: "utf-8",
  flag: "w",
});
