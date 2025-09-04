# How to Keep Data

## Concept Representation

### Basic Concepts

```
1 Human
3 Duck
5 Eye
7 Beak
```

## Relationship Structure

### Original Relations

```
Human: [*Eye, *Not Duck]
Duck:  [*Beak, *Eye]
```

### Flattened Structure

```
Human: [*Not Duck[*Not Eye, *Not Beak], *Eye]
```

## Data Storage Format

### Concept Mappings

```
3:[7, 5]  // Duck: [Beak, Eye]
4:[8, 6]  // Duck: [Beak, Eye] (alternative)
1:[5, 4]  // Human: [Eye, Not Duck]
2:[6, 3]  // Human: [Not Eye, Not Duck]
```

### Relationship Values

```
Duck:  [true, true]   // Duck has Beak and Eye
Human: [true, *Not Duck]  // Human has Eye, is not Duck
```

## Detailed Relationships

### Duck Properties

```
3,7 Duck +Beak   // Duck has Beak
3,5 Duck +Eye    // Duck has Eye
```

### Human Properties

```
|| 1,5 Human +Eye ||   // Human has Eye
|| 1,6 Human -Eye ||   // Human does not have Eye (conflict)
|| 1,8 Human -Beak ||  // Human does not have Beak
|| 1,4 Human -Duck ||  // Human is not Duck
```

## Data Structure Summary

The system stores:

1. **Concepts** with unique identifiers
2. **Relationships** between concepts with boolean values
3. **Flattened hierarchies** for efficient querying
4. **Conflict resolution** for contradictory relationships

---

**Key Points:**

- `+` indicates positive relationship (has, is)
- `-` indicates negative relationship (doesn't have, isn't)
- `*` indicates inferred or derived relationships
- `||` indicates explicit relationship definitions
