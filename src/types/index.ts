/**
 * Core types for the Concept language system
 */

export interface Concept {
  readonly name: string;
}

export interface Pair {
  readonly conceptA: Concept;
  readonly conceptB: Concept;
}

export interface Data {
  readonly pair: Pair;
  readonly value: boolean;
}

export interface HookMap {
  readonly [fn: string]: (
    params: Concept[],
    block?: Concept[]
  ) => Concept[] | void;
}

export interface BlockConfig {
  readonly concepts?: Concept[];
  readonly pairs?: Pair[];
  readonly chain?: Data[];
  readonly hookMap?: HookMap;
}

export interface BlockState {
  readonly [conceptA: string]: {
    readonly [conceptB: string]: boolean;
  };
}

export interface ConceptQuery {
  readonly concept: Concept;
  readonly includeInferred?: boolean;
}

export interface PairQuery {
  readonly conceptA: Concept;
  readonly conceptB: Concept;
  readonly includeInferred?: boolean;
}
