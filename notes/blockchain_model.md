# Blockchain Data Model: Block and Mining Inference

## Data Representation

- **true/false** → **t/f**
- **Concepts** are identified by block ID and concept ID (e.g., `1:a` = Block 1, Concept A)

## Block 1

### Concepts

```
1:a 1:b 1:c 1:d 1:e
Block Concepts: [Human, Duck, Eye, Beak, Intelligent]
```

### Pairs and Relationships

```
1:0  1:1  1:2  1:3  1:4  1:5
```

**Block Pairs:**

```javascript
[
  [1:a, 1:c],  // Human-Eye
  [1:a, 1:b],  // Human-Duck
  [1:b, 1:c],  // Duck-Eye
  [1:b, 1:d],  // Duck-Beak
  [1:a, 1:e],  // Human-Intelligent
  [1:b, 1:e]   // Duck-Intelligent
]
```

**Chain (Relationships):**

```javascript
[
  [1:0, t],  // Human has Eye
  [1:1, f],  // Human is not Duck
  [1:2, t],  // Duck has Eye
  [1:3, t],  // Duck has Beak
  [1:4, f]   // Human is not Intelligent
]
```

## Mining Process

### Miner Node: Block 1

**Concepts:** `1:a 1:b 1:c 1:d 1:e`
**Block Concepts:** `[Human, Duck, Eye, Beak, Intelligent]`

**Pairs:** `1:0 1:1 1:2 1:3 1:4 1:5 1:6 1:7`

**Block Pairs:**

```javascript
[
  [1:a, 1:c],  // Human-Eye
  [1:a, 1:b],  // Human-Duck
  [1:b, 1:c],  // Duck-Eye
  [1:b, 1:d],  // Duck-Beak
  [1:a, 1:e],  // Human-Intelligent
  [1:b, 1:e],  // Duck-Intelligent
  [1:a, 1:c],  // ❌ DUPLICATE - REMOVED
  [1:a, 1:d]   // ✅ NEW - Human-Beak
]
```

**Chain:**

```javascript
[
  [1:0, t],   // Human has Eye
  [1:1, f],   // Human is not Duck
  [1:2, t],   // Duck has Eye
  [1:3, t],   // Duck has Beak
  [1:4, f],   // Human is not Intelligent
  [1:6, f],   // ❌ REMOVED - explicit definition exists
  [1:7, f]    // ✅ STAYS - Human is not Beak (inferred)
]
```

## Block 2

### Concepts

```
2:a
Block Concepts: [Car]
```

### Pairs

```
2:0
Block Pairs: [[2:a, 1:c]]  // Car-Eye
```

**Chain:**

```javascript
[
  [2:0, f],  // Car does not have Eye
  [1:4, t],  // Human is Intelligent (updated)
  [1:5, f]   // Duck is not Intelligent
]
```

## Current State: Archive Node

### Combined Concepts

```
1:a 1:b 1:c 1:d 1:e 2:a
Block Concepts: [Human, Duck, Eye, Beak, Intelligent, Car]
```

### Combined Pairs

```
1:0 1:1 1:2 1:3 1:4 1:5 1:7 2:0
```

**Block Pairs:**

```javascript
[
  [1:a, 1:c],  // Human-Eye
  [1:a, 1:b],  // Human-Duck
  [1:b, 1:c],  // Duck-Eye
  [1:b, 1:d],  // Duck-Beak
  [1:a, 1:e],  // Human-Intelligent
  [1:b, 1:e],  // Duck-Intelligent
  [1:a, 1:d],  // Human-Beak (inferred)
  [2:a, 1:c]   // Car-Eye
]
```

**Final Chain:**

```javascript
[
  [1:0, t],   // Human has Eye
  [1:1, f],   // Human is not Duck
  [1:2, t],   // Duck has Eye
  [1:3, t],   // Duck has Beak
  [1:4, f],   // Human is not Intelligent
  [1:7, f],   // Human is not Beak (inferred)
  [2:0, f],   // Car does not have Eye
  [1:4, t],   // Human is Intelligent (updated)
  [1:5, f]    // Duck is not Intelligent
]
```

## Key Concepts

1. **Block Structure**: Each block contains concepts, pairs, and a chain of relationships
2. **Mining Process**: Miners validate and infer new relationships
3. **Duplicate Prevention**: Explicit definitions take precedence over inferred ones
4. **Cross-Block References**: Blocks can reference concepts from other blocks
5. **Archive Node**: Maintains the complete state across all blocks
