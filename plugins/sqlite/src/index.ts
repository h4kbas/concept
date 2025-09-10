import * as sqlite3 from 'sqlite3';
import * as path from 'path';

// Local type definitions to avoid import issues
interface Concept {
  readonly name: string;
}

interface Data {
  readonly pair: { conceptA: Concept; conceptB: Concept };
  readonly value: boolean;
  readonly relationshipType?: string;
}

interface HookMap {
  [key: string]: (params: Concept[]) => Concept[] | void;
}

interface Block {
  concepts: Concept[];
  chain: Data[];
  addConcept(concept: Concept): Concept;
  addPair(pair: { conceptA: Concept; conceptB: Concept }): any;
  addData(data: Data): void;
}

let currentBlock: Block | null = null;
let db: sqlite3.Database | null = null;

const getBlock = (): Block => {
  if (!currentBlock) {
    throw new Error('Block not initialized');
  }
  return currentBlock;
};

const getDatabase = (): sqlite3.Database => {
  if (!db) {
    throw new Error(
      'Database not initialized. Use "sqlite open <filename>" first.'
    );
  }
  return db;
};

const conceptToSqlType = (concept: Concept): string => {
  const name = concept.name.toLowerCase();

  // Check for common data types
  if (name.includes('int') || name.includes('number') || name.includes('id')) {
    return 'INTEGER';
  }
  if (
    name.includes('float') ||
    name.includes('decimal') ||
    name.includes('price')
  ) {
    return 'REAL';
  }
  if (name.includes('bool') || name.includes('flag')) {
    return 'INTEGER'; // SQLite doesn't have boolean, use INTEGER
  }
  if (name.includes('date') || name.includes('time')) {
    return 'TEXT'; // Store as ISO string
  }
  if (name.includes('json') || name.includes('data')) {
    return 'TEXT'; // Store as JSON string
  }

  // Default to TEXT for most concepts
  return 'TEXT';
};

const createTableFromConcept = (conceptName: string, block: Block): string => {
  const concept = block.concepts.find(c => c.name === conceptName);
  if (!concept) {
    throw new Error(`Concept "${conceptName}" not found`);
  }

  // Find all properties of this concept (only property types, not instances)
  const properties = block.chain
    .filter(
      data =>
        data.pair.conceptA.name === conceptName &&
        data.relationshipType === 'has' &&
        data.value === true &&
        !data.pair.conceptB.name.includes('_of_') // Exclude property instances
    )
    .map(data => data.pair.conceptB.name);

  if (properties.length === 0) {
    throw new Error(
      `Concept "${conceptName}" has no properties to create table from`
    );
  }

  // Create table schema
  const columns = properties.map(prop => {
    const sqlType = conceptToSqlType({ name: prop });
    return `"${prop}" ${sqlType}`;
  });

  // Add id column as primary key
  const idColumn = '"id" INTEGER PRIMARY KEY AUTOINCREMENT';
  const allColumns = [idColumn, ...columns];

  return `CREATE TABLE IF NOT EXISTS "${conceptName}" (${allColumns.join(', ')})`;
};

const conceptToRowData = (
  conceptName: string,
  block: Block
): Record<string, any> => {
  const rowData: Record<string, any> = {};

  // Find all property instances for this concept
  const propertyInstances = block.chain
    .filter(
      data =>
        data.pair.conceptA.name === conceptName &&
        data.relationshipType === 'has' &&
        data.value === true &&
        data.pair.conceptB.name.includes('_of_')
    )
    .map(data => data.pair.conceptB.name);

  for (const instance of propertyInstances) {
    // Find the value of this property instance (look for actual values, not property types)
    const valueData = block.chain.find(
      data =>
        data.pair.conceptA.name === instance &&
        (data.relationshipType === 'is' ||
          data.relationshipType === undefined) &&
        data.value === true &&
        data.pair.conceptB.name !== instance.split('_of_')[0] // Not the property type itself
    );

    if (valueData) {
      const propertyName = instance.replace(`_of_${conceptName}`, '');
      rowData[propertyName] = valueData.pair.conceptB.name;
    }
  }

  return rowData;
};

const sqliteHooks: HookMap = {
  sqlite: (params: Concept[]): Concept[] | void => {
    const block = getBlock();

    if (params.length < 2) {
      throw new Error(
        'SQLite command required. Available: open, close, create, insert, select, update, delete, query'
      );
    }

    const command = params[1]?.name.toLowerCase();
    const args = params.slice(2);

    switch (command) {
      case 'open':
        if (args.length < 1) {
          throw new Error('Usage: sqlite open <database_file>');
        }
        const dbPath = path.resolve(args[0]?.name || '');
        db = new sqlite3.Database(dbPath);
        console.log(`✅ Opened SQLite database: ${dbPath}`);
        return;

      case 'close':
        if (db) {
          db.close();
          db = null;
          console.log('✅ Closed SQLite database');
        }
        return;

      case 'create':
        if (args.length < 1) {
          throw new Error('Usage: sqlite create <concept_name>');
        }
        const createTableSQL = createTableFromConcept(
          args[0]?.name || '',
          block
        );
        const createDb = getDatabase();

        createDb.run(createTableSQL, err => {
          if (err) {
            console.error(`❌ Error creating table: ${err.message}`);
          } else {
            console.log(`✅ Created table "${args[0]?.name || ''}"`);
          }
        });
        return;

      case 'insert':
        if (args.length < 1) {
          throw new Error('Usage: sqlite insert <concept_name>');
        }
        const insertData = conceptToRowData(args[0]?.name || '', block);
        const insertDb = getDatabase();

        const insertColumns = Object.keys(insertData);
        const insertValues = Object.values(insertData);

        if (insertColumns.length === 0) {
          console.log('❌ No data to insert - concept has no property values');
          return;
        }

        const placeholders = insertColumns.map(() => '?').join(', ');
        const insertSQL = `INSERT INTO "${args[0]?.name || ''}" (${insertColumns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;

        insertDb.run(insertSQL, insertValues, function (err) {
          if (err) {
            console.error(`❌ Error inserting row: ${err.message}`);
          } else {
            console.log(`✅ Inserted row with ID: ${this.lastID}`);
          }
        });
        return;

      case 'select':
        if (args.length < 1) {
          throw new Error('Usage: sqlite select <concept_name> [WHERE clause]');
        }
        const selectDb = getDatabase();
        const whereClause =
          args.length > 1
            ? ` WHERE ${args
                .slice(1)
                .map(a => a.name)
                .join(' ')}`
            : '';
        const selectSQL = `SELECT * FROM "${args[0]?.name || ''}"${whereClause}`;

        selectDb.all(selectSQL, [], (err, rows) => {
          if (err) {
            console.error(`❌ Error selecting rows: ${err.message}`);
          } else {
            console.log(`✅ Found ${rows.length} rows:`);
            rows.forEach((row, index) => {
              console.log(`  Row ${index + 1}:`, row);
            });

            // Create concepts for the query results
            if (rows.length > 0) {
              const queryResultName = `${args[0]?.name || ''}_query_result`;
              block.addConcept({ name: queryResultName });

              // Add metadata about the query
              block.addConcept({ name: 'query_sql' });
              block.addConcept({ name: 'row_count' });
              block.addConcept({ name: 'table_name' });

              block.addPair({
                conceptA: { name: queryResultName },
                conceptB: { name: 'query_sql' },
              });
              block.addData({
                pair: {
                  conceptA: { name: queryResultName },
                  conceptB: { name: 'query_sql' },
                },
                value: true,
                relationshipType: 'has',
              });
              block.addPair({
                conceptA: { name: 'query_sql' },
                conceptB: { name: selectSQL },
              });
              block.addData({
                pair: {
                  conceptA: { name: 'query_sql' },
                  conceptB: { name: selectSQL },
                },
                value: true,
                relationshipType: 'is',
              });

              block.addPair({
                conceptA: { name: queryResultName },
                conceptB: { name: 'row_count' },
              });
              block.addData({
                pair: {
                  conceptA: { name: queryResultName },
                  conceptB: { name: 'row_count' },
                },
                value: true,
                relationshipType: 'has',
              });
              block.addPair({
                conceptA: { name: 'row_count' },
                conceptB: { name: rows.length.toString() },
              });
              block.addData({
                pair: {
                  conceptA: { name: 'row_count' },
                  conceptB: { name: rows.length.toString() },
                },
                value: true,
                relationshipType: 'is',
              });

              block.addPair({
                conceptA: { name: queryResultName },
                conceptB: { name: 'table_name' },
              });
              block.addData({
                pair: {
                  conceptA: { name: queryResultName },
                  conceptB: { name: 'table_name' },
                },
                value: true,
                relationshipType: 'has',
              });
              block.addPair({
                conceptA: { name: 'table_name' },
                conceptB: { name: args[0]?.name || '' },
              });
              block.addData({
                pair: {
                  conceptA: { name: 'table_name' },
                  conceptB: { name: args[0]?.name || '' },
                },
                value: true,
                relationshipType: 'is',
              });

              // Create concepts for each row
              rows.forEach((row, index) => {
                const rowName = `row_${index + 1}_of_${queryResultName}`;
                block.addConcept({ name: rowName });

                // Add this row to the query result
                block.addPair({
                  conceptA: { name: queryResultName },
                  conceptB: { name: rowName },
                });
                block.addData({
                  pair: {
                    conceptA: { name: queryResultName },
                    conceptB: { name: rowName },
                  },
                  value: true,
                  relationshipType: 'has',
                });

                // Add each column as a property of the row
                Object.entries(row as Record<string, any>).forEach(
                  ([column, value]) => {
                    const columnName = `${column}_of_${rowName}`;
                    block.addConcept({ name: columnName });

                    block.addPair({
                      conceptA: { name: rowName },
                      conceptB: { name: columnName },
                    });
                    block.addData({
                      pair: {
                        conceptA: { name: rowName },
                        conceptB: { name: columnName },
                      },
                      value: true,
                      relationshipType: 'has',
                    });

                    block.addPair({
                      conceptA: { name: columnName },
                      conceptB: { name: column },
                    });
                    block.addData({
                      pair: {
                        conceptA: { name: columnName },
                        conceptB: { name: column },
                      },
                      value: true,
                      relationshipType: 'is',
                    });

                    block.addPair({
                      conceptA: { name: columnName },
                      conceptB: { name: value?.toString() || 'null' },
                    });
                    block.addData({
                      pair: {
                        conceptA: { name: columnName },
                        conceptB: { name: value?.toString() || 'null' },
                      },
                      value: true,
                      relationshipType: 'is',
                    });
                  }
                );
              });
            }
          }
        });
        return;

      case 'update':
        if (args.length < 3) {
          throw new Error(
            'Usage: sqlite update <concept_name> SET <column=value> WHERE <condition>'
          );
        }
        const updateDb = getDatabase();
        const updateSQL = `UPDATE "${args[0]?.name || ''}" SET ${args
          .slice(1)
          .map(a => a.name)
          .join(' ')}`;

        updateDb.run(updateSQL, [], function (err) {
          if (err) {
            console.error(`❌ Error updating rows: ${err.message}`);
          } else {
            console.log(`✅ Updated ${this.changes} rows`);
          }
        });
        return;

      case 'delete':
        if (args.length < 2) {
          throw new Error(
            'Usage: sqlite delete <concept_name> WHERE <condition>'
          );
        }
        const deleteDb = getDatabase();
        const deleteSQL = `DELETE FROM "${args[0]?.name || ''}" WHERE ${args
          .slice(1)
          .map(a => a.name)
          .join(' ')}`;

        deleteDb.run(deleteSQL, [], function (err) {
          if (err) {
            console.error(`❌ Error deleting rows: ${err.message}`);
          } else {
            console.log(`✅ Deleted ${this.changes} rows`);
          }
        });
        return;

      case 'query':
        if (args.length < 1) {
          throw new Error('Usage: sqlite query <sql_statement>');
        }
        const queryDb = getDatabase();
        const querySQL = args.map(a => a.name).join(' ');

        queryDb.all(querySQL, [], (err, rows) => {
          if (err) {
            console.error(`❌ Error executing query: ${err.message}`);
          } else {
            console.log(`✅ Query result (${rows.length} rows):`);
            rows.forEach((row, index) => {
              console.log(`  Row ${index + 1}:`, row);
            });

            // Create concepts for the query results
            if (rows.length > 0) {
              const queryResultName = 'sql_query_result';
              block.addConcept({ name: queryResultName });

              // Add metadata about the query
              block.addConcept({ name: 'query_sql' });
              block.addConcept({ name: 'row_count' });

              block.addPair({
                conceptA: { name: queryResultName },
                conceptB: { name: 'query_sql' },
              });
              block.addData({
                pair: {
                  conceptA: { name: queryResultName },
                  conceptB: { name: 'query_sql' },
                },
                value: true,
                relationshipType: 'has',
              });
              block.addPair({
                conceptA: { name: 'query_sql' },
                conceptB: { name: querySQL },
              });
              block.addData({
                pair: {
                  conceptA: { name: 'query_sql' },
                  conceptB: { name: querySQL },
                },
                value: true,
                relationshipType: 'is',
              });

              block.addPair({
                conceptA: { name: queryResultName },
                conceptB: { name: 'row_count' },
              });
              block.addData({
                pair: {
                  conceptA: { name: queryResultName },
                  conceptB: { name: 'row_count' },
                },
                value: true,
                relationshipType: 'has',
              });
              block.addPair({
                conceptA: { name: 'row_count' },
                conceptB: { name: rows.length.toString() },
              });
              block.addData({
                pair: {
                  conceptA: { name: 'row_count' },
                  conceptB: { name: rows.length.toString() },
                },
                value: true,
                relationshipType: 'is',
              });

              // Create concepts for each row
              rows.forEach((row, index) => {
                const rowName = `row_${index + 1}_of_${queryResultName}`;
                block.addConcept({ name: rowName });

                // Add this row to the query result
                block.addPair({
                  conceptA: { name: queryResultName },
                  conceptB: { name: rowName },
                });
                block.addData({
                  pair: {
                    conceptA: { name: queryResultName },
                    conceptB: { name: rowName },
                  },
                  value: true,
                  relationshipType: 'has',
                });

                // Add each column as a property of the row
                Object.entries(row as Record<string, any>).forEach(
                  ([column, value]) => {
                    const columnName = `${column}_of_${rowName}`;
                    block.addConcept({ name: columnName });

                    block.addPair({
                      conceptA: { name: rowName },
                      conceptB: { name: columnName },
                    });
                    block.addData({
                      pair: {
                        conceptA: { name: rowName },
                        conceptB: { name: columnName },
                      },
                      value: true,
                      relationshipType: 'has',
                    });

                    block.addPair({
                      conceptA: { name: columnName },
                      conceptB: { name: column },
                    });
                    block.addData({
                      pair: {
                        conceptA: { name: columnName },
                        conceptB: { name: column },
                      },
                      value: true,
                      relationshipType: 'is',
                    });

                    block.addPair({
                      conceptA: { name: columnName },
                      conceptB: { name: value?.toString() || 'null' },
                    });
                    block.addData({
                      pair: {
                        conceptA: { name: columnName },
                        conceptB: { name: value?.toString() || 'null' },
                      },
                      value: true,
                      relationshipType: 'is',
                    });
                  }
                );
              });
            }
          }
        });
        return;

      default:
        throw new Error(
          `Unknown SQLite command: ${command}. Available: open, close, create, insert, select, update, delete, query`
        );
    }
  },
};

// SQLite Plugin Class
class SqlitePlugin {
  config = {
    name: 'sqlite',
    version: '3.0.0',
    description: 'SQLite database operations plugin',
    main: 'index.js',
  };

  initialize?(): void | Promise<void> {}
  setBlock?(_block: any): void {}
  cleanup?(): void | Promise<void> {
    if (db) {
      db.close();
      db = null;
    }
  }

  registerListeners(): Map<string, any> {
    return new Map();
  }

  getHooks(
    block?: Block
  ): Record<
    string,
    (params: Concept[], block?: Concept[]) => Concept[] | void
  > {
    if (block) {
      currentBlock = block;
    }
    return createSqlitePlugin(
      () =>
        currentBlock ||
        ({
          concepts: [],
          chain: [],
          addConcept: (concept: Concept) => concept,
          addPair: (pair: { conceptA: Concept; conceptB: Concept }) => pair,
          addData: (_data: Data) => {},
        } as Block)
    );
  }
}

export const createSqlitePlugin = (_getBlock: () => Block): HookMap => {
  return sqliteHooks;
};

export default SqlitePlugin;
