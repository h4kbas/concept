# Language Declaration

## Core Concepts

- **Concepts** are the atomic parts of the language
- The purpose of this language is to define and relate concepts and resolve them until the end depth
- The end is called **Terminal** which cannot be resolved more depth
- Concepts can interact with each other

## Terminal Types

### 1. Hooked Terminals

- If the interaction can be resolved, they are called **hooked terminals**
- These have built-in functionality and can be executed
- Examples: `div`, `print`, `say`

### 2. Loose Terminals

- If the interaction cannot be resolved, they are called **loose terminals**
- These require external processing or interpretation
- Examples: `is`, `isnt`, custom relationships

### 3. Pure Terminals

- If there is a single concept at the end depth, it is called **pure terminal**
- These are basic concept identifiers
- Examples: `Human`, `Duck`, `Eye`

## Language Structure

### Relationship Operators

- `is/isnt` are actually **loose terminals** which can either be:
  - **Hooked** and calculated by a parser (compiler or runtime)
  - **Loose** and require external interpretation

### Processing Flow

1. **Parse** concepts and relationships
2. **Identify** terminal types
3. **Resolve** hooked terminals immediately
4. **Queue** loose terminals for external processing
5. **Validate** pure terminals as concept identifiers

## Examples

### Hooked Terminal

```concept
div 10 5
=> 2
```

### Loose Terminal

```concept
Human is Duck
=> Requires external processing
```

### Pure Terminal

```concept
Human
=> Basic concept identifier
```

## Design Philosophy

The language is designed to be:

- **Extensible**: New hooked terminals can be added
- **Flexible**: Loose terminals allow for custom processing
- **Simple**: Pure terminals provide basic concept identification
- **Composable**: All terminal types can be combined in expressions
