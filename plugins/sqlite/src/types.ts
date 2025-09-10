// Local types for SQLite plugin compatibility
export interface Data {
  readonly pair: { conceptA: Concept; conceptB: Concept };
  readonly value: boolean;
  readonly relationshipType?: string;
}

export interface Concept {
  readonly name: string;
}

export interface Pair {
  readonly conceptA: Concept;
  readonly conceptB: Concept;
}
