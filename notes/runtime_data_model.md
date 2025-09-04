# Runtime Data Model

## Data Structures

### Pure Terminal

```typescript
// A
interface PureTerminal {
  concept: string;
}
```

**Description**: Basic concept identifier without any processing.

### Expression

```typescript
// A is B
interface Expression {
  concepts: Concept[];
}
```

**Description**: Array of concepts that form a relationship or expression.

### Hooked Terminal

```typescript
// div 10 5
interface HookedTerminal {
  terminal: Map<string, Function>;
}
```

**Description**: Terminal with built-in functionality that can be executed immediately.

### Loose Terminal

```typescript
// print 10
interface LooseTerminal {
  terminal: PureTerminal;
}
```

**Description**: Terminal that requires external processing or interpretation.

## Runtime Processing

### 1. Pure Terminal Processing

- Direct concept identification
- No computation required
- Used as building blocks for other terminals

### 2. Expression Processing

- Parse concept arrays
- Identify relationship patterns
- Apply inference rules

### 3. Hooked Terminal Processing

- Execute built-in functions
- Return computed results
- Examples: arithmetic, string operations

### 4. Loose Terminal Processing

- Queue for external processing
- Require interpreter or compiler
- Examples: custom functions, I/O operations

## Memory Layout

```
┌─────────────────┐
│   Pure Terminal │ ← Basic concepts
├─────────────────┤
│   Expression    │ ← Concept relationships
├─────────────────┤
│ Hooked Terminal │ ← Executable functions
├─────────────────┤
│ Loose Terminal  │ ← External processing
└─────────────────┘
```

## Type Hierarchy

```
Terminal
├── PureTerminal
├── Expression
├── HookedTerminal
└── LooseTerminal
```

## Examples

### Pure Terminal

```concept
Human
```

### Expression

```concept
Human is Duck
```

### Hooked Terminal

```concept
div 10 5
=> 2
```

### Loose Terminal

```concept
print "Hello"
=> Requires external processing
```
