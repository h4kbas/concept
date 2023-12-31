export interface Concept {
  name: string;
}

export interface Pair {
  conceptA: Concept;
  conceptB: Concept;
}

export interface Data {
  pair: Pair;
  value: boolean;
}

export interface HookMap {
  [fn: string]: (params: Concept[]) => Concept[] | void;
}

export class Block {
  concepts: Concept[];
  pairs: Pair[];
  chain: Data[];

  hookMap: HookMap;
  blockExplorer: BlockExplorer;

  constructor({ concepts = [], pairs = [], chain = [], hookMap = {} }) {
    this.concepts = concepts;
    this.pairs = pairs;
    this.chain = chain;
    this.hookMap = hookMap;
    this.blockExplorer = new BlockExplorer(this);
  }

  addConceptToChain(concept: Concept) {
    let c = this.concepts.find((c) => c.name === concept.name);
    if (!c) {
      c = concept;
      this.concepts.push(concept);
    }
    return c;
  }

  isPairAvailable(conceptA: Concept, conceptB: Concept) {
    return this.pairs.find(
      (p) =>
        p.conceptA.name === conceptA.name && p.conceptB.name === conceptB.name
    );
  }
  addPairToChain(conceptA: Concept, conceptB: Concept) {
    let pair = this.isPairAvailable(conceptA, conceptB);
    if (!pair) {
      this.addConceptToChain(conceptA);
      this.addConceptToChain(conceptB);
      pair = {
        conceptA,
        conceptB,
      };
      this.pairs.push(pair);
    }
    return pair;
  }

  addToChain(conceptA: Concept, conceptB: Concept, relation: boolean) {
    const pair = this.addPairToChain(conceptA, conceptB);
    const data: Data = {
      pair,
      value: relation,
    };
    this.chain.push(data);
  }

  inferMissingPairs() {
    this.pairs.forEach((pair, index) => {
      const { conceptA, conceptB } = pair;
      const dependentPair = this.pairs.find(
        (p) => conceptA.name === p.conceptB.name
      );
      if (dependentPair) {
        const isInferredPairAvailable = this.isPairAvailable(
          dependentPair.conceptA,
          conceptB
        );
        // Mela is Mela
        if (dependentPair.conceptA.name === conceptB.name) {
          return;
        }

        if (!isInferredPairAvailable) {
          // Mela is Elma
          const dependentPairState =
            this.blockExplorer.calculateCurrentPairState({
              conceptA: dependentPair.conceptA,
              conceptB: dependentPair.conceptB,
            });

          // Mela is red
          const inferredPairState =
            this.blockExplorer.calculateCurrentPairState({
              conceptA: dependentPair.conceptA,
              conceptB,
            });

          // Elma is red
          const currentPairState = this.blockExplorer.calculateCurrentPairState(
            {
              conceptA: dependentPair.conceptB,
              conceptB: conceptB,
            }
          );
          if (dependentPairState !== null && inferredPairState === null) {
            this.addToChain(
              dependentPair.conceptA,
              conceptB,
              currentPairState === true
                ? dependentPairState
                : !dependentPairState
            );
          }
        }
      }
    });
  }

  calculateHookResult(token: Concept, line: Concept[]) {
    const ret = this.hookMap[token.name](line);
    if (ret) {
      return this.parseLine(ret);
    }
  }

  parseLine(line: Concept[]): Concept | undefined {
    let ret;
    for (let token of line) {
      if (token.name in this.hookMap) {
        return this.calculateHookResult(token, line);
      } else {
        ret = this.addConceptToChain(token);
      }
    }
    return ret;
  }

  tokenize(raw: string): Concept[][] {
    return raw
      .trim()
      .split("\n")
      .map((line) =>
        line
          .trim()
          .split(" ")
          .map((str) => ({ name: str } as Concept))
          .filter((c) => c.name !== "")
      );
  }

  parse(tokens: Concept[][]) {
    tokens.forEach((line) => {
      this.parseLine(line);
      this.inferMissingPairs();
    });
  }

  serialize() {
    const ret: string[] = [];
    for (let def of this.chain) {
      def.value
        ? ret.push(`${def.pair.conceptA.name} is ${def.pair.conceptB.name}`)
        : ret.push(`${def.pair.conceptA.name} isnt ${def.pair.conceptB.name}`);
    }
    return ret.join("\n");
  }
}

export class BlockExplorer {
  block: Block;
  constructor(block: Block) {
    this.block = block;
  }

  getConcept(concept: Concept) {
    return this.block.concepts.find((c) => c.name === concept.name);
  }

  getPair(pair: Pair) {
    return this.block.pairs.find(
      (p) =>
        p.conceptA.name === pair.conceptA.name &&
        p.conceptB.name === pair.conceptB.name
    );
  }

  getData(data: Data) {
    return this.block.chain.find(
      (d) =>
        d.pair.conceptA.name === data.pair.conceptA.name &&
        d.pair.conceptB.name === data.pair.conceptB.name
    );
  }

  getConcepts() {
    return this.block.concepts;
  }

  getPairs() {
    return this.block.pairs;
  }

  getChain() {
    return this.block.chain;
  }

  getConceptPairs(concept: Concept) {
    return this.block.pairs.filter(
      (p) =>
        p.conceptA.name === concept.name || p.conceptB.name === concept.name
    );
  }

  getConceptData(concept: Concept) {
    return this.block.chain.filter(
      (d) =>
        d.pair.conceptA.name === concept.name ||
        d.pair.conceptB.name === concept.name
    );
  }

  getPairData(pair: Pair) {
    return this.block.chain.filter(
      (d) =>
        d.pair.conceptA.name === pair.conceptA.name &&
        d.pair.conceptB.name === pair.conceptB.name
    );
  }

  calculateCurrentPairState(pair: Pair) {
    return this.block.chain.reduce((acc, data) => {
      if (
        data.pair.conceptA.name === pair.conceptA.name &&
        data.pair.conceptB.name === pair.conceptB.name
      ) {
        acc = data.value;
      }
      return acc;
    }, null as any);
  }

  calculateBlockState() {
    return this.block.chain.reduce((acc, data) => {
      if (data.value !== undefined) {
        acc[data.pair.conceptA.name] = acc[data.pair.conceptA.name] || [];
        acc[data.pair.conceptA.name][data.pair.conceptB.name] = data.value;
      }
      return acc;
    }, {} as any);
  }
}
