# Concept Language Design

## Core Syntax Principles

### 1. Tabbed Block Syntax

Tabbed blocks create anonymous concepts that can be named with `is`:

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

### 2. Plugin Command Syntax

Plugins use the tabbed block syntax for data operations:

```concept
# Database operations
db insert users
    name is Alice
    email is alice@example.com
    role is admin

db update users
    where name is Alice
    set email is alice.updated@example.com

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

### 3. Concept Definitions

Concepts can be defined with relationships:

```concept
# Simple relationships
user is person
admin is user
order is transaction

# Complex relationships with blocks
user_profile is
    name is string
    email is string
    age is number
    preferences is object
```

### 4. Conditional Logic

Use `where` and `if` for conditions:

```concept
# Database conditions
db select users
    where role is admin
    and status is active

# Conditional execution
if user_role is admin
    show admin_panel
else
    show user_panel
```

### 5. Plugin Configuration

Configuration uses the same syntax:

```concept
# HTTP configuration
http config
    port is 3000
    host is localhost
    cors is true

# Database configuration
db config
    path is ./database
    autocommit is true
    indexing is true
```

## Language Grammar

### Basic Structure

```
<command> <target> [<block>]
```

### Block Structure

```
<name> is
    <property> is <value>
    <property> is <value>
    ...
```

### Conditional Structure

```
<command> <target>
    where <condition>
    and <condition>
    ...
```

### Plugin Command Structure

```
<plugin> <action> <target> [<block>]
```

## Examples

### Database Operations

```concept
# Create table
db create users

# Insert data
db insert users
    name is Alice
    email is alice@example.com
    role is admin

# Query data
db select users
    where role is admin
    and status is active

# Update data
db update users
    where name is Alice
    set email is alice.updated@example.com

# Delete data
db delete users
    where role is guest
```

### HTTP Operations

```concept
# Configure server
http config
    port is 3000
    host is localhost
    cors is true

# Register endpoint
http endpoint GET /api/users
    return users
    filter active
    sort by name

# Start server
http start
```

### File Operations

```concept
# Write file
file write data.txt
    content is Hello World
    encoding is utf-8

# Read file
file read config.json
    parse as json

# List directory
file list ./data
    filter *.json
    recursive is true
```

### Data Management

```concept
# Show statistics
data stats

# Create snapshot
data snapshot save
    name is before_changes
    description is Initial state

# Load snapshot
data snapshot load
    name is before_changes
```

## Benefits

1. **Consistent Syntax**: Same pattern throughout the language
2. **Readable**: Natural language flow
3. **Extensible**: Easy to add new plugins and commands
4. **Composable**: Blocks can be nested and combined
5. **Type Safe**: Clear data structure definitions
