# Terminals

## Pure Terminals

Basic concept identifiers without any processing:

```
A
B
C
```

**Characteristics:**

- Single concept identifiers
- No computation required
- Used as building blocks for expressions

## Hooked Terminals

Terminals with built-in functionality that can be executed immediately:

### Arithmetic Example

```concept
div 10 5
=>
2
```

### Integration with Concepts

```concept
div 10 5 is A
=>
2 is A
```

### Reverse Integration

```concept
A is div 10 5
=>
A is 2
```

**Characteristics:**

- Have built-in functions
- Execute immediately
- Return computed results
- Can be integrated into expressions

## Loose Terminals

Terminals that require external processing or interpretation:

### Basic Relationships

```concept
A is B
B is div 10 5
print B

=>
A is B        // loose terminal
B is 2        // loose terminal
print B       // loose terminal
```

### Inference Example

```concept
A is B
B isnt C

=>
A is B        // explicit relationship
B isnt C      // explicit relationship
A isnt C      // inferred relationship
```

**Characteristics:**

- Require external processing
- Cannot be executed immediately
- Need interpreter or compiler
- Support inference and relationship resolution

## Terminal Processing Flow

### 1. Parse Input

- Identify terminal types
- Extract concepts and operators

### 2. Process Hooked Terminals

- Execute built-in functions
- Replace with computed results

### 3. Process Loose Terminals

- Queue for external processing
- Apply inference rules
- Resolve relationships

### 4. Validate Results

- Check for consistency
- Apply conflict resolution
- Generate final output

## Examples by Category

### Pure Terminals

```concept
Human
Duck
Eye
Beak
```

### Hooked Terminals

```concept
add 5 3        // => 8
multiply 4 2   // => 8
say "Hello"    // => prints "Hello"
```

### Loose Terminals

```concept
Human is Duck
Duck has Beak
Human isnt Duck
```

## Design Benefits

1. **Modularity**: Each terminal type has a specific purpose
2. **Extensibility**: New hooked terminals can be added easily
3. **Flexibility**: Loose terminals allow for custom processing
4. **Efficiency**: Hooked terminals execute immediately
5. **Power**: Loose terminals enable complex inference
