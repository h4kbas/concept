# Concept Language

A powerful, expressive language for defining concepts, relationships, and data operations using natural syntax.

## Core Features

### Tabbed Block Syntax

The language uses indented blocks to define structured data and operations:

```concept
# Anonymous concept block
    name is Alice
    age is 30
    role is admin

# Named concept block
user_data is
    name is Alice
    age is 30
    role is admin
```

### Plugin System

Extend functionality with plugins that follow the same syntax:

```concept
# Database operations
db insert users
    name is Alice
    email is alice@example.com
    role is admin

# HTTP operations
http endpoint GET /api/users
    return users
    filter active
    sort by name

# File operations
file write data.txt
    content is Hello World
    encoding is utf-8
```

## Available Plugins

### Database Plugin (`db`)

Complete database operations with concept syntax:

```concept
# Create tables with column definitions
db create users
    name is string
    email is string
    role is string
    active is boolean

db create products
    name is string
    price is number
    category is string
    in_stock is boolean

# Insert data
db insert users
    name is Alice
    email is alice@example.com
    role is admin

# Query data
db select users
    where role is admin

# Update data
db update users
    where name is Alice
    set email is alice.updated@example.com

# Delete data
db delete users
    where role is guest
```

### HTTP Plugin (`http`)

Build web APIs with natural syntax:

```concept
# Configure server
http config
    port is 3000
    host is localhost
    cors is true

# Register endpoints
http endpoint GET /api/users
    return users
    filter active
    sort by name

# Start server
http start
```

### File Plugin (`file`)

File system operations:

```concept
# Write files
file write data.txt
    content is Hello World
    encoding is utf-8

# Read files
file read config.json
    parse as json

# List directories
file list ./
    filter *.txt
    recursive is true
```

### Data Plugin (`data`)

Data management and snapshots:

```concept
# Show statistics
data stats

# Create snapshots
data snapshot save
    name is before_changes
    description is Initial state

# Load snapshots
data snapshot load
    name is before_changes
```

## Installation

```bash
npm install concept-lang
```

## Usage

```bash
# Run a concept file
concept run example.concept

# Run with plugins
concept run example.concept --plugins ./plugins/

# Watch mode
concept run example.concept --watch
```

## Examples

See the `examples/` directory for comprehensive examples:

- `comprehensive.concept` - All plugins working together
- `plugins/db/examples/db.concept` - Database operations
- `plugins/http/examples/http.concept` - HTTP API setup
- `plugins/file/examples/file.concept` - File operations
- `plugins/data/examples/data.concept` - Data management

## Language Design

The concept language is designed to be:

- **Natural**: Reads like English
- **Consistent**: Same syntax patterns throughout
- **Extensible**: Easy to add new plugins
- **Composable**: Blocks can be nested and combined
- **Type Safe**: Clear data structure definitions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
