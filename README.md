# Concept

A semantic language and network system for defining concepts, their relationships, and building knowledge graphs that can be used across various domains. Concept combines schema, relationships, and data in a unified format with automatic inference capabilities.

## Use Cases

As there is no concentrated aim to develop this project, some ways to use can be listed:

- **Knowledge Playground**: A playground to place complicated definitions and relationships, process and understand them
- **Unified Data Format**: A data format that has schema, relationships and data together
- **Rapid Prototyping**: A powerful tool to prototype various products such as applications and information related products
- **Semantic Modeling**: Build and explore semantic networks with automatic relationship inference

## What is Concept?

Concept is a declarative language that allows you to express relationships between entities in a natural, readable way. Here are some examples of how the concept language looks:

```concept
apple is fruit
lettuce isnt fruit

friend is
  name is Alice
  age is 30

  name is Sam
  age is 22
is student

123 is number
integer is number
```

Essentially, the language is a list of words (concepts) written side by side and line by line, with indentation creating hierarchical structures (boxed concepts).

## Core Language Features

### Concepts

Basic building blocks of the language. `'apple'`, `'is'` and `'fruit'` are all concepts.

### Boxed Concepts

Indented content creates boxed concepts that can contain other concepts. `'name is Alice age is 30'` is a boxed concept that groups related information together.

### Hooked Concepts

Some concepts have special meaning in specific environments. The standard library provides hooked concepts like `'is'`, `'isnt'` and `'say'` that have built-in logic.

These hooked concepts can produce various effects in the program and interact with external systems. They serve as the bridge between the concept language and:

- **Internal systems**: The interpreter and compiler
- **External systems**: Databases, file systems, APIs, etc.

### Relationships

The core of Concept is its relationship system. Relationships are expressed using four main operators:

- **`is`**: Creates a positive type/value relationship (A is B)
- **`isnt`**: Creates a negative type/value relationship (A isnt B)
- **`has`**: Creates a property ownership relationship (A has B)
- **`hasnt`**: Creates a negative property ownership relationship (A hasnt B)

Relationships are:

- **Directional**: A is B is different from B is A
- **Non-exclusive**: Multiple relationships can coexist (A can be both B and not C)
- **Queryable**: You can query the current state of any relationship
- **Inferable**: The system can infer new relationships from existing ones (except for `has` relationships)

#### Relationship Types

- **Type/Value Relationships (`is`/`isnt`)**: Used for classification and values, with transitive inference
- **Property Relationships (`has`/`hasnt`)**: Used for object properties, without transitive inference

### Plugins

Plugins extend the language by hooking different concepts in different environments, enabling the language to perform various tasks beyond basic relationship modeling.

## Getting Started

### Installation

```bash
npm install -g concept-lang
```

### Basic Usage

```bash
# Compile a concept file
concept compile input.concept -o output.concept

# Run a concept file
concept run input.concept

# Start interactive REPL
concept repl

# Analyze a concept file
concept analyze input.concept
```

### Interactive REPL

The Concept language includes a powerful REPL for interactive development:

```bash
concept repl
```

The REPL supports:

- Real-time concept evaluation
- Block-based input (indented content)
- State inspection and debugging
- Plugin management
- Automatic inference

## Advanced Features

### Automatic Inference

The system automatically infers relationships between concepts based on existing knowledge, creating a more complete semantic network. The inference engine uses transitive logic to discover new relationships:

```concept
# Given these relationships:
a is b
b is c

# The system automatically infers:
a is c
```

The inference works by:

1. **Transitive Relationships**: If A is B and B is C, then A is C
2. **Negative Inference**: If A is B and B isnt C, then A isnt C
3. **Chain Analysis**: The system analyzes relationship chains to find missing connections
4. **Real-time Updates**: Inference happens automatically as you add new relationships

You can disable inference using the `--no-infer` flag if needed.

### Plugin System

Extend functionality with custom plugins:

```bash
# Create a new plugin
concept create-plugin my-plugin

# List available plugins
concept list-plugins

# Run with plugins
concept run input.concept --plugins my-plugin
```

### File Watching

Monitor concept files for changes and automatically recompile:

```bash
concept run input.concept --watch
```

## Examples

### Simple Relationships

```concept
cat is animal
dog is animal
mammal is animal
cat is mammal
dog is mammal
```

### Complex Data Structures

```concept
user is
  name is John
  age is 25
  email is john@example.com
  role is admin
```

### Property Relationships

```concept
# Create objects with properties
apple has color
apple has size
banana has color
banana hasnt taste

# Access property instances directly
color_of_apple is green
size_of_apple is medium
color_of_banana is yellow
size_of_banana is large

# Query property relationships
has apple color
hasnt apple weight
has banana color
hasnt banana taste
```

### Interactive Commands

```concept
say Hello World
say The user is John
```

### Relationship Examples

#### Basic Relationships

```concept
# Positive relationships
cat is animal
dog is animal
mammal is animal

# Negative relationships
cat isnt vegetable
dog isnt plant
```

#### Transitive Inference

```concept
# Given these relationships:
cat is mammal
mammal is animal

# The system automatically infers:
cat is animal

# Even with complex chains:
a is b
b is c
c is d
# Infers: a is d
```

#### Multiple Relationships

```concept
# Both relationships can coexist
apple is fruit
apple isnt fruit

# The system maintains both relationships
# This allows for complex, nuanced semantic modeling
```

#### Querying Relationships

You can query relationships using various syntax patterns and inspect them in the REPL:

```concept
# Query type/value relationships
is cat mammal
is mammal animal
is cat animal  # This will show true due to inference

# Query negative type/value relationships
isnt cat vegetable
isnt mammal plant

# Query property relationships
has apple color
has apple size
hasnt apple weight

# Query negative property relationships
hasnt banana taste
hasnt car roof

# Combine queries with actions
is cat mammal say Cats are mammals
is cat animal say Cats are animals too
isnt cat vegetable say Cats are definitely not vegetables
has apple color say Apples have color
hasnt apple weight say Apples don't have weight
```

## Plugins

Plugins can hook different concepts in different environments and can enable language perform various tasks.

### File Plugin

The file plugin demonstrates integration with the `has` relationship system:

```concept
# Read a file and create a concept with metadata
file read package.json as packageInfo

# Access file metadata properties
filename_of_packageInfo
type_of_packageInfo
size_of_packageInfo
extension_of_packageInfo

# Query file properties
has packageInfo filename
has packageInfo type
hasnt packageInfo author
```

The file plugin automatically creates property instances for file metadata, allowing you to work with file information as first-class concepts in the language.
