# Concept Language

A concept-based language system for semantic data management with inference capabilities. Using natural, human-readable syntax. Write code that reads like English and think in concepts, not syntax.

## What is Concept Language?

Concept Language is a paradigm that focuses on **what you want to achieve** rather than **how to achieve it**. Instead of writing complex code with brackets, semicolons, and technical jargon, you describe your ideas using natural language patterns.

### Core Philosophy

- **Concepts are atomic** - The fundamental building blocks of your program
- **Relationships define meaning** - How concepts connect and interact
- **Natural syntax** - Code that reads like English
- **Plugin architecture** - Extend functionality with purpose-built modules

## How It Works

### 1. Simple Relationships

Define concepts and their relationships using natural syntax:

```concept
# Basic relationships
app is task_manager
version is 1.0.0
description is A simple task management system

# Concept definitions
user is person
admin is user
order is transaction
```

### 2. Structured Data with Tabbed Blocks

Create complex data structures using indentation:

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

### 3. Plugin System

Extend functionality with plugins that follow the same syntax:

```concept
# Database operations
db create users
    name is string
    email is string
    role is string

db insert users
    name is Alice
    email is alice@example.com
    role is admin

# HTTP API endpoints
http endpoint GET /api/users
    return users
    filter active
    sort by name

# File operations
file write data.txt
    content is Hello World
    encoding is utf-8
```

## Language Features

### Basic Syntax

#### **Concept Relationships**
```concept
# Simple relationships
Alice is a person
Alice is 30 years old
Alice works at Acme Corp
```

#### **Conditional Logic**
```concept
# Natural conditional statements
is user role admin
    show admin_panel
    grant full_permissions

is user age greater_than 18
    allow access
    show adult_content
```

#### **Tabbed Blocks**
```concept
# Structured data
user_profile is
    personal_info is
        name is Alice Johnson
        age is 30
        email is alice@example.com
    work_info is
        company is Acme Corp
        position is Senior Developer
```

### Plugin System

The language comes with built-in plugins for common operations:

#### **Database Plugin (`db`)**
```concept
# Create tables
db create users
    name is string
    email is string
    role is string
    active is boolean

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
```

#### **HTTP Plugin (`http`)**
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

#### **File Plugin (`file`)**
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

#### **DateTime Plugin (`datetime`)**
```concept
# Get current time
datetime now iso
datetime now unix
datetime now local

# Format dates
datetime format 2024-01-01
    format is YYYY-MM-DD
    locale is en-US

# Time arithmetic
datetime add 1 hour
    to 2024-01-01T10:00:00Z

datetime subtract 30 minutes
    from 2024-01-01T10:00:00Z
```

## Real-World Example: Task Manager

Here's a complete task management application:

```concept
# Database Setup
db create tasks
    id is string
    title is string
    description is string
    status is string
    priority is string
    created_at is string

db create users
    id is string
    username is string
    email is string
    role is string

# Add some tasks
db insert tasks
    id is task-001
    title is Design new feature
    description is Create wireframes and mockups
    status is in_progress
    priority is high
    created_at is 2024-01-04T10:00:00Z

# Set up the API
http endpoint GET /api/tasks
    return tasks
    filter by status
    sort by priority

http endpoint POST /api/tasks
    validate title is required
    validate description is required
    create new task
    return task details

# Start the server
http start
```

## What Makes It Different?

### 🎨 **Natural Syntax**
- No brackets, semicolons, or complex punctuation
- Reads like documentation
- Self-documenting code

### 🧩 **Conceptual Thinking**
- Model real-world relationships
- Think in terms of "what is" rather than "how to"
- Focus on the problem, not the programming

### 🔧 **Plugin Architecture**
- Purpose-built modules for common operations
- Consistent syntax across all plugins
- Easy to extend with new functionality

### 🌐 **Universal Understanding**
- Non-programmers can read and understand the code
- Business logic is clear and obvious
- Perfect for documentation and communication

## Getting Started

### Installation
```bash
npm install -g concept-lang
```

### Your First Concept File
Create a file called `hello.concept`:
```concept
# Say hello to the world
say Hello World

# Define a person
person is
    name is Alice
    age is 30
    greeting is Hello, I am Alice

# Use the person
say person greeting
```

### Run It
```bash
concept run hello.concept
```

### Run with Plugins
```bash
concept run hello.concept --plugins ./plugins/db/index.js --plugins ./plugins/http/index.js
```

## Use Cases

### 📊 **Data Modeling**
- Define complex data structures naturally
- Model business relationships
- Create self-documenting schemas

### 🌐 **Web Development**
- Build APIs that describe themselves
- Create readable server logic
- Focus on business rules, not technical details

### 📝 **Documentation**
- Write executable documentation
- Create living specifications
- Bridge the gap between ideas and code

### 🤖 **Rapid Prototyping**
- Quickly model ideas and relationships
- Test concepts before implementation
- Create working prototypes fast

## Examples

Check out the `examples/` directory for:
- `working-demo.concept` - Basic capabilities demonstration
- `task-manager-fixed.concept` - Complete application example
- `plugins/*/examples/` - Plugin-specific examples

## Philosophy

Concept Language is built on the belief that **programming should be about expressing ideas, not fighting syntax**.

- **Clarity over cleverness**
- **Readability over performance** (initially)
- **Understanding over memorization**
- **Ideas over implementation details**

## Contributing

We're building something new and exciting! Help us shape the future of programming:

1. Try the language and share feedback
2. Create examples and tutorials
3. Build plugins and extensions
4. Help us improve the syntax and features

## License

MIT License - see LICENSE file for details

---

**Ready to think in concepts?** Start with the examples and see how natural programming can be.
