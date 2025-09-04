# Concept Language

A concept-based language system for semantic data management with inference capabilities. This system allows you to define relationships between concepts and automatically infer missing relationships based on logical rules.

## Features

- **Concept Management**: Define and manage concepts and their relationships
- **Automatic Inference**: Automatically infer missing relationships based on logical rules
- **Hook System**: Extensible hook system for custom functionality
- **CLI Interface**: Command-line interface for compilation and analysis
- **TypeScript Support**: Full TypeScript support with type safety
- **Comprehensive Testing**: Extensive test suite with high coverage

## Installation

```bash
npm install
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format

# Clean build artifacts
npm run clean
```

## Usage

### CLI Usage

```bash
# Compile a concept file
npx concept compile input.concept -o output.concept

# Run a concept file
npx concept run input.concept

# Analyze a concept file
npx concept analyze input.concept

# Legacy usage (backward compatibility)
npx concept input.concept output.concept
```

### Programmatic Usage

```typescript
import { Compiler, Block, Concept } from 'concept-lang';

// Create a compiler
const compiler = new Compiler();

// Compile a concept source
const source = `
  A is B
  B is C
  C is D
`;

const result = compiler.compile(source);
console.log(result);
// Output:
// A is B
// B is C
// C is D
// A is C
// A is D
// B is D

// Or get the block state for more detailed analysis
const block = compiler.compileToState(source);
console.log(block.concepts); // All concepts
console.log(block.chain); // All relationships
console.log(block.blockExplorer.getStats()); // Statistics
```

## Language Syntax

### Basic Relationships

```
# Positive relationship
A is B

# Negative relationship
A isnt B
```

### Conditional Execution

```
# If A is B, execute the following
is A B say yes
isnt A B say no

# If A is B, execute C is D
is A B C is D
```

### Output

```
# Print to console
say hello world
```

## Examples

### Basic Example

```concept
Elma is red
Elma is food
Elma isnt blue
Elma isnt great

Mela is Elma

# These will output based on the relationships above
is Elma great say yes elma great
is Mela great say yes mela great
isnt Elma great say no elma great
isnt Mela great say no mela great

is Mela red say yes mela red
isnt Mela red say no mela red
```

### Complex Inference

```concept
A is B
B is C
C is D
D is E

# The system will automatically infer:
# A is C, A is D, A is E
# B is D, B is E
# C is E
```

## API Reference

### Block

The core data structure that manages concepts, relationships, and inference.

```typescript
class Block {
  // Properties
  concepts: readonly Concept[];
  pairs: readonly Pair[];
  chain: readonly Data[];
  blockExplorer: BlockExplorer;

  // Methods
  addConcept(concept: Concept): Concept;
  hasConcept(concept: Concept): boolean;
  getConcept(name: string): Concept | undefined;
  addPair(conceptA: Concept, conceptB: Concept): Pair;
  isPairAvailable(conceptA: Concept, conceptB: Concept): boolean;
  addToChain(conceptA: Concept, conceptB: Concept, relation: boolean): void;
  inferMissingPairs(): void;
  tokenize(raw: string): Concept[][];
  parse(tokens: Concept[][]): void;
  serialize(): string;
  getState(): BlockState;
}
```

### BlockExplorer

Provides query and analysis capabilities for a Block.

```typescript
class BlockExplorer {
  // Query methods
  getConcept(concept: Concept): Concept | undefined;
  getConceptByName(name: string): Concept | undefined;
  getPair(pair: Pair): Pair | undefined;
  getData(data: Data): Data | undefined;
  getConcepts(): readonly Concept[];
  getPairs(): readonly Pair[];
  getChain(): readonly Data[];

  // Analysis methods
  calculateCurrentPairState(pair: Pair): boolean | null;
  calculateBlockState(): BlockState;
  getRelatedConcepts(concept: Concept): readonly Concept[];
  areConceptsRelated(conceptA: Concept, conceptB: Concept): boolean;
  getRelationshipValue(conceptA: Concept, conceptB: Concept): boolean | null;
  findConceptsWithValue(concept: Concept, value: boolean): readonly Concept[];
  getStats(): BlockStats;
}
```

### Compiler

Compiles Concept language source code.

```typescript
class Compiler {
  constructor(hookMap?: HookMap);

  // Properties
  block: Block;

  // Methods
  compile(source: string): string;
  compileToState(source: string): Block;
  reset(): void;
}
```

## Type Definitions

```typescript
interface Concept {
  readonly name: string;
}

interface Pair {
  readonly conceptA: Concept;
  readonly conceptB: Concept;
}

interface Data {
  readonly pair: Pair;
  readonly value: boolean;
}

interface HookMap {
  readonly [fn: string]: (params: Concept[]) => Concept[] | void;
}

interface BlockState {
  readonly [conceptA: string]: {
    readonly [conceptB: string]: boolean;
  };
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for your changes
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Changelog

### 1.0.0

- Initial release
- Core Block and BlockExplorer functionality
- Compiler with built-in hooks
- CLI interface
- Comprehensive test suite
- TypeScript support
