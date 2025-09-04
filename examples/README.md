# Concept Language Examples

This directory contains examples demonstrating the Concept Language system and its plugins.

## Current Status

### ✅ Working Features

1. **Core Concept Language**
   - Basic concept relationships (`a is b`)
   - Concept inference and chaining
   - Tabbed block syntax for structured data
   - REPL mode for interactive testing

2. **Database Plugin (`db`)**
   - Table creation with column definitions using tabbed blocks
   - Data insertion with type conversion
   - Data querying and selection
   - Database statistics and management
   - Schema validation

3. **Plugin System**
   - Plugin loading and management
   - Hook integration with core compiler
   - Event-driven architecture

### 🔧 Partially Working

1. **File Plugin (`file`)**
   - TypeScript compilation issues
   - Plugin export structure needs fixing

2. **HTTP Plugin (`http`)**
   - Express import issues
   - TypeScript compilation errors

### 📁 Example Files

- `working-demo.concept` - Shows current working capabilities
- `simple-task-app.concept` - Database operations demo
- `task-manager-app.concept` - Comprehensive app example (requires all plugins)

## Running Examples

### Basic Examples (No Plugins)

```bash
node dist/cli.js run examples/working-demo.concept
```

### With Database Plugin

```bash
node dist/cli.js run examples/simple-task-app.concept --plugins $(pwd)/plugins/db/index.js
```

### Interactive REPL

```bash
node dist/cli.js repl
```

## Key Features Demonstrated

### Tabbed Block Syntax

```concept
db create users
    name is string
    email is string
    role is string

db insert users
    name is Alice
    email is alice@example.com
    role is admin
```

### Concept Relationships

```concept
app is task_manager
version is 1.0.0
description is A simple task management system
```

### Database Operations

```concept
db describe users
db select users where role is admin
db stats
```

## Next Steps

1. Fix TypeScript compilation issues in file and http plugins
2. Update compiled JavaScript files with latest changes
3. Test comprehensive multi-plugin examples
4. Add more real-world application examples
