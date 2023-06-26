import fs from "fs";
import { Block, Concept, HookMap } from "./concept";

const [_, __, ...args] = process.argv;
const [input, output, lib] = args;

const text = fs.readFileSync(`${input || "input"}.concept`, "utf-8");

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
      const pairState = block.blockExplorer.calculateCurrentPairState({
        conceptA: a,
        conceptB: b,
      });
      return pairState === true ? c : [];
    }
  },
  isnt: (params) => {
    if (params[0].name !== "isnt") {
      if (params.length < 3) {
        throw new Error("Isnt is used: A isnt B");
      }

      const [a, _, ...b] = params;
      // D isnt is A B C
      const res = block.parseLine(b);
      if (res) {
        block.addToChain(a, res, false);
      }
    }
    // isnt A B C
    else {
      if (params.length < 4) {
        throw new Error("Isnt is used: isnt A B C");
      }
      const [_, a, b, ...c] = params;
      const pairState = block.blockExplorer.calculateCurrentPairState({
        conceptA: a,
        conceptB: b,
      });
      return pairState === false ? c : [];
    }
  },
  say: (params) => {
    if (params.length < 2) {
      throw new Error("Say is used: say A");
    }
    const [_, ...a] = params;
    console.log(a.map((c) => c.name).join(" "));
  },
};

const block = new Block({ hookMap });

if (lib) {
  const libText = lib
    ? fs.readFileSync(`${lib || "input"}.lib.concept`, "utf-8")
    : "";

  const libTokens = block.tokenize(libText);
  block.concepts.push(
    ...libTokens.map<Concept>((line) => ({
      name: line[0].name,
      uuid: line[2].name,
    }))
  );
}
const tokens = block.tokenize(text);
block.parse(tokens);

const result = block.serialize();
const conceptLib = block.serializeConceptLib();

fs.writeFileSync(`${output || "output"}.concept`, result, {
  encoding: "utf-8",
  flag: "w",
});

fs.writeFileSync(`${output || "output"}.lib.concept`, conceptLib, {
  encoding: "utf-8",
  flag: "w",
});
