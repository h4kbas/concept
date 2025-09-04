# Concept Language Reference System Design

## Core Reference Concepts

### 1. Simple References (On-Demand Resolution)

```
a is b
```

When `a` is referenced, it resolves to `b` on-demand.

### 2. Block References (Anonymous Concepts)

```
a is
    b is c
    d is e
```

When `a` is referenced, the entire block is resolved on-demand.

### 3. Nested References (On-Demand Chain Resolution)

```
a is b
b is c
c is d
```

Chains of references that resolve recursively on-demand.

## Reference Resolution API

### Internal API Methods

The `Block` class should provide these methods for plugins:

```typescript
// Resolve a reference (works for both simple and block references)
resolveReference(conceptName: string): any

// Check if a concept is a reference
isReference(conceptName: string): boolean

// Get all references for a concept
getReferences(conceptName: string): string[]

// Resolve with custom resolver
resolveWithResolver(conceptName: string, resolver: (ref: string) => any): any
```

### Plugin Integration

Plugins can use the reference system:

```typescript
// In plugin hooks
const resolvedValue = this.block.resolveReference('user_name');
const blockData = this.block.resolveReference('user_config'); // Same method for blocks
```

## Reference Types

### 1. Direct References (On-Demand)

```
user_name is Alice
```

- `user_name` resolves to `Alice` when referenced

### 2. Block References (Anonymous Concepts, On-Demand)

```
user_config is
    name is Alice
    email is alice@example.com
    role is admin
```

- `user_config` resolves to the entire block (anonymous concept) when referenced
- Individual properties can be accessed: `user_config.name` → `Alice`

### 3. Chained References (On-Demand)

```
base_url is https://api.example.com
users_endpoint is base_url/users
```

- `users_endpoint` resolves to `https://api.example.com/users` when referenced

### 4. Conditional References

```
environment is production
api_url is
    if environment is production
        https://api.example.com
    else
        https://api.dev.example.com
```

## Implementation Strategy

### 1. Parser Updates

- Detect `is` relationships
- Store reference mappings
- Handle block references

### 2. Block Class Updates

- Add reference resolution methods
- Implement lazy evaluation
- Support nested resolution

### 3. Plugin Integration

- Expose resolution API to plugins
- Allow custom resolvers
- Support reference chains

## Examples

### Database Plugin with References

```concept
# Define references
db_config is
    host is localhost
    port is 5432
    database is myapp

# Use references in operations
db connect
    host is db_config.host
    port is db_config.port
    database is db_config.database
```

### HTTP Plugin with References

```concept
# Define API configuration
api_base is https://api.example.com
users_endpoint is api_base/v1/users

# Use references
http endpoint GET users_endpoint
    return users
    filter active
```

### File Plugin with References

```concept
# Define paths
data_dir is ./data
config_file is data_dir/config.json
log_file is data_dir/app.log

# Use references
file write config_file
    content is {"port": 3000}
file write log_file
    content is Application started
```

## On-Demand Resolution Benefits

1. **Lazy Evaluation**: References are resolved only when actually used
2. **Performance**: No unnecessary computation until needed
3. **Memory Efficiency**: References stored as pointers, not resolved values
4. **Dynamic Updates**: References can be updated without re-resolving all dependents
5. **Plugin Control**: Plugins decide when and how to resolve references
6. **Circular Reference Safety**: Can detect and handle circular references gracefully

## General Benefits

1. **DRY Principle**: Define once, use everywhere
2. **Configuration Management**: Centralized configuration
3. **Environment Support**: Easy environment switching
4. **Plugin Flexibility**: Plugins can resolve references as needed
5. **Nested Resolution**: Support for complex reference chains
