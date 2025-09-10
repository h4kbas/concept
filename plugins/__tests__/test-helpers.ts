import { Block } from '../../src/core/block';
import { Concept, Data } from '../../src/types';

// SQLite plugin compatible Block interface
interface SqliteBlock {
  concepts: Concept[];
  chain: Data[];
  addConcept(concept: Concept): Concept;
  addPair(pair: { conceptA: Concept; conceptB: Concept }): any;
  addData(data: Data): void;
}

/**
 * Test helper for creating mock blocks and testing plugin functionality
 */
export class PluginTestHelper {
  private block: Block;
  private sqliteBlock: SqliteBlock;

  constructor() {
    this.block = new Block();
    this.sqliteBlock = {
      concepts: [],
      chain: [],
      addConcept: (concept: Concept) => {
        this.sqliteBlock.concepts.push(concept);
        return concept;
      },
      addPair: (_pair: { conceptA: Concept; conceptB: Concept }) => {
        // Mock implementation
        return {};
      },
      addData: (data: Data) => {
        this.sqliteBlock.chain.push(data);
      },
    };
  }

  /**
   * Add a concept to the test block
   */
  addConcept(name: string): void {
    this.block.addConcept({ name });
    this.sqliteBlock.addConcept({ name });
  }

  /**
   * Add a relationship to the test block
   */
  addRelationship(
    conceptA: string,
    conceptB: string,
    relationshipType: string = 'is'
  ): void {
    this.block.addPair({
      conceptA: { name: conceptA },
      conceptB: { name: conceptB },
    });
    this.block.addData({
      pair: { conceptA: { name: conceptA }, conceptB: { name: conceptB } },
      value: true,
      relationshipType,
    });

    // Also add to SQLite block
    this.sqliteBlock.addPair({
      conceptA: { name: conceptA },
      conceptB: { name: conceptB },
    });
    this.sqliteBlock.addData({
      pair: { conceptA: { name: conceptA }, conceptB: { name: conceptB } },
      value: true,
      relationshipType,
    });
  }

  /**
   * Create a concept with properties for testing
   */
  createConceptWithProperties(
    conceptName: string,
    properties: Record<string, any>
  ): void {
    this.addConcept(conceptName);

    // Add property types
    Object.keys(properties).forEach(prop => {
      this.addConcept(prop);
      this.addRelationship(conceptName, prop, 'has');
    });

    // Add property instances with values
    Object.entries(properties).forEach(([prop, value]) => {
      const instanceName = `${prop}_of_${conceptName}`;
      this.addConcept(instanceName);
      this.addConcept(value.toString());

      this.addRelationship(conceptName, instanceName, 'has');
      this.addRelationship(instanceName, prop, 'is');
      this.addRelationship(instanceName, value.toString(), 'is');
    });
  }

  /**
   * Get the current block
   */
  getBlock(): Block {
    return this.block;
  }

  getFileBlock(): any {
    // Return a mock Block that matches the concept-lang package interface
    return {
      concepts: this.block.concepts,
      chain: this.block.chain,
      addConcept: (concept: Concept) => {
        this.block.addConcept(concept);
        return concept;
      },
      addPair: (pair: { conceptA: Concept; conceptB: Concept }) => {
        this.block.addPair(pair);
        return {};
      },
      addData: (data: Data) => {
        this.block.addData(data);
      },
      getConcept: (name: string) => {
        return this.block.concepts.find(c => c.name === name);
      },
      getConcepts: () => this.block.concepts,
      getRelationships: () => this.block.chain,
    };
  }

  /**
   * Get the SQLite-compatible block
   */
  getSqliteBlock(): SqliteBlock {
    return this.sqliteBlock;
  }

  /**
   * Reset the block for a new test
   */
  reset(): void {
    this.block = new Block();
    this.sqliteBlock = {
      concepts: [],
      chain: [],
      addConcept: (concept: Concept) => {
        this.sqliteBlock.concepts.push(concept);
        return concept;
      },
      addPair: (_pair: { conceptA: Concept; conceptB: Concept }) => {
        // Mock implementation
        return {};
      },
      addData: (data: Data) => {
        this.sqliteBlock.chain.push(data);
      },
    };
  }

  /**
   * Get all concepts in the block
   */
  getConcepts(): readonly Concept[] {
    return this.block.concepts;
  }

  /**
   * Get all relationships in the block
   */
  getRelationships(): readonly Data[] {
    return this.block.chain;
  }

  /**
   * Find a concept by name
   */
  findConcept(name: string): Concept | undefined {
    return this.block.concepts.find(c => c.name === name);
  }

  /**
   * Find relationships for a concept
   */
  findRelationships(conceptName: string): Data[] {
    return this.block.chain.filter(
      data =>
        data.pair.conceptA.name === conceptName ||
        data.pair.conceptB.name === conceptName
    );
  }

  /**
   * Check if a relationship exists
   */
  hasRelationship(
    conceptA: string,
    conceptB: string,
    relationshipType?: string
  ): boolean {
    return this.block.chain.some(
      data =>
        data.pair.conceptA.name === conceptA &&
        data.pair.conceptB.name === conceptB &&
        (!relationshipType || data.relationshipType === relationshipType) &&
        data.value === true
    );
  }
}

/**
 * Mock database for testing SQLite operations
 */
export class MockDatabase {
  private tables: Map<string, any[]> = new Map();
  private lastId: number = 0;

  run(_sql: string, _params: any[] = []): { lastID: number; changes: number } {
    const changes = 1; // Mock changes
    this.lastId++;
    return { lastID: this.lastId, changes };
  }

  all(sql: string, _params: any[] = []): any[] {
    // Mock query results
    if (sql.includes('SELECT * FROM product')) {
      return [
        { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics' },
        { id: 2, name: 'Book', price: 19.99, category: 'Education' },
      ];
    }
    if (sql.includes('SELECT * FROM user')) {
      return [{ id: 1, name: 'John', email: 'john@example.com', age: '30' }];
    }
    if (sql.includes('COUNT(*)')) {
      return [{ user_count: 2 }];
    }
    return [];
  }

  exec(sql: string): void {
    // Mock table creation
    if (sql.includes('CREATE TABLE')) {
      const tableName = sql.match(/CREATE TABLE.*?"(\w+)"/)?.[1];
      if (tableName) {
        this.tables.set(tableName, []);
      }
    }
  }

  close(): void {
    // Mock close
  }

  prepare(sql: string): any {
    return {
      run: (params: any[]) => this.run(sql, params),
      all: (params: any[]) => this.all(sql, params),
    };
  }
}
