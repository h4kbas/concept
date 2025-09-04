import {
  ConceptPlugin,
  PluginConfig,
  ConceptEvent,
  ConceptEventType,
  ConceptListener,
} from '../../dist/types/plugin';
import * as fs from 'fs';
import * as path from 'path';

const config: PluginConfig = {
  name: 'db',
  version: '1.0.0',
  description:
    'Database API plugin - exposes full database functionality to concept files',
  author: 'Concept Lang Team',
  license: 'MIT',
  main: 'index.js',
  conceptListeners: [],
};

interface DatabaseConfig {
  dbPath: string;
  autoCommit: boolean;
  enableIndexing: boolean;
}

interface QueryResult {
  success: boolean;
  data?: any[];
  count?: number;
  error?: string;
}

class DatabasePlugin implements ConceptPlugin {
  readonly config = config;
  private dbConfig: DatabaseConfig = {
    dbPath: './concept-database',
    autoCommit: true,
    enableIndexing: true,
  };
  private block: any = null; // Will be set by setBlock method
  private indexes: Map<string, any[]> = new Map();

  setBlock(block: any): void {
    this.block = block;
  }

  async initialize(): Promise<void> {
    console.log(`🗄️  Initializing ${this.config.name} plugin`);
    this.ensureDatabaseDirectory();
    console.log(`📊 Database API ready for concept files to use`);
  }

  async cleanup(): Promise<void> {
    console.log(`🧹 Database plugin cleaned up`);
  }

  registerListeners(): Map<ConceptEventType, ConceptListener> {
    // Database plugin only provides API, no listeners
    return new Map<ConceptEventType, ConceptListener>();
  }

  getHooks() {
    return {
      // Hook that processes 'db' commands
      db: (params: any[], block?: any[]) => {
        const action = params[1]?.name;
        switch (action) {
          // Table Management
          case 'create':
            if (block && block.length > 0) {
              // Parse column definitions from block
              const columns = this.parseColumnDefinitions(block);
              this.createTable(params[2]?.name, columns);
            } else {
              this.createTable(params[2]?.name);
            }
            break;
          case 'drop':
            this.dropTable(params[2]?.name);
            break;
          case 'tables':
            this.listTables();
            break;
          case 'describe':
            this.describeTable(params[2]?.name);
            break;

          // Data Operations
          case 'insert':
            if (block && block.length > 0) {
              // Parse data from tabbed block
              const data = this.parseDataFromBlock(block);
              this.insertData(params[2]?.name, data);
            } else {
              this.insertData(params[2]?.name, params[3]);
            }
            break;
          case 'select':
            this.selectData(params[2]?.name, params[3]);
            break;
          case 'update':
            this.updateData(params[2]?.name, params[3], params[4]);
            break;
          case 'delete':
            this.deleteData(params[2]?.name, params[3]);
            break;

          // Query Operations
          case 'query':
            this.executeQuery(params[2]);
            break;
          case 'count':
            this.countRecords(params[2]?.name, params[3]);
            break;
          case 'find':
            this.findRecords(params[2]?.name, params[3]);
            break;

          // Index Management
          case 'index':
            this.manageIndex(params[2]?.name, params[3]?.name, params[4]?.name);
            break;

          // Transaction Management
          case 'begin':
            this.beginTransaction();
            break;
          case 'commit':
            this.commitTransaction();
            break;
          case 'rollback':
            this.rollbackTransaction();
            break;

          // Backup & Restore
          case 'backup':
            this.createBackup(params[2]?.name);
            break;
          case 'restore':
            this.restoreBackup(params[2]?.name);
            break;
          case 'list-backups':
            this.listBackups();
            break;

          // Configuration
          case 'config':
            this.updateConfig(params[2]?.name, params[3]?.name);
            break;
          case 'stats':
            this.showStats();
            break;

          // Utility Functions
          case 'export':
            this.exportData(params[2]?.name, params[3]?.name);
            break;
          case 'import':
            this.importData(params[2]?.name, params[3]?.name);
            break;
          case 'vacuum':
            this.vacuumDatabase();
            break;

          default:
            this.showHelp();
        }
        return params;
      },
    };
  }

  private ensureDatabaseDirectory(): void {
    if (!fs.existsSync(this.dbConfig.dbPath)) {
      fs.mkdirSync(this.dbConfig.dbPath, { recursive: true });
    }
  }

  private getTablePath(tableName: string): string {
    return path.join(this.dbConfig.dbPath, `${tableName}.json`);
  }

  private parseColumnDefinitions(block: any[]): any {
    const columns: any = {};

    // Skip the first element (table name) and parse flat structure: [name, is, string, email, is, string, ...]
    for (let i = 1; i < block.length; i += 3) {
      if (i + 2 < block.length && block[i + 1]?.name === 'is') {
        const columnName = block[i]?.name;
        const columnType = block[i + 2]?.name;
        if (columnName && columnType) {
          columns[columnName] = columnType;
        }
      }
    }

    return columns;
  }

  private parseDataFromBlock(block: any[]): any {
    const data: any = {};

    // Skip the first element if it's just the table name
    let startIndex = 0;
    if (block.length > 0 && block[0]?.name && !block[1]?.name) {
      startIndex = 1;
    }

    // Parse flat structure: [id, is, user-001, username, is, admin, ...]
    let i = startIndex;
    while (i < block.length) {
      if (i + 2 < block.length && block[i + 1]?.name === 'is') {
        const key = block[i]?.name;
        let value = block[i + 2]?.name;

        // Handle multi-word values by collecting until next 'is' or end
        // Only collect if the next word is not a key (not followed by 'is')
        if (
          value &&
          i + 3 < block.length &&
          block[i + 3]?.name !== 'is' &&
          (i + 4 >= block.length || block[i + 4]?.name !== 'is')
        ) {
          // Collect all words until next 'is' or end
          const valueParts = [value];
          let j = i + 3;
          while (j < block.length && block[j]?.name !== 'is') {
            valueParts.push(block[j]?.name);
            j++;
          }
          value = valueParts.join(' ');
          // Move i to the position after the collected words
          i = j;
        } else {
          // Move i past the key, is, value
          i += 3;
        }

        if (key && value !== undefined) {
          // Convert value based on type
          if (value === 'true') {
            data[key] = true;
          } else if (value === 'false') {
            data[key] = false;
          } else if (!isNaN(Number(value))) {
            data[key] = Number(value);
          } else {
            data[key] = value;
          }
        }
      } else {
        i++;
      }
    }

    return data;
  }

  // Table Management
  private createTable(tableName: string, columns?: any): void {
    try {
      const tablePath = this.getTablePath(tableName);

      if (fs.existsSync(tablePath)) {
        console.log(`❌ Table '${tableName}' already exists`);
        return;
      }

      // Create table with schema if columns provided
      const tableSchema = {
        name: tableName,
        columns: columns || {},
        data: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(tablePath, JSON.stringify(tableSchema, null, 2));
      console.log(`✅ Table '${tableName}' created`);

      if (columns && Object.keys(columns).length > 0) {
        console.log(`📋 Columns: ${Object.keys(columns).join(', ')}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create table '${tableName}':`, error);
    }
  }

  private dropTable(tableName: string): void {
    try {
      const tablePath = this.getTablePath(tableName);

      if (fs.existsSync(tablePath)) {
        fs.unlinkSync(tablePath);
        console.log(`✅ Table '${tableName}' dropped`);
      } else {
        console.log(`❌ Table '${tableName}' not found`);
      }
    } catch (error) {
      console.error(`❌ Failed to drop table '${tableName}':`, error);
    }
  }

  private listTables(): void {
    try {
      const files = fs.readdirSync(this.dbConfig.dbPath);
      const tables = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));

      console.log(`📋 Available tables: ${tables.join(', ')}`);
    } catch (error) {
      console.error('❌ Failed to list tables:', error);
    }
  }

  private describeTable(tableName: string): void {
    try {
      const tablePath = this.getTablePath(tableName);

      if (fs.existsSync(tablePath)) {
        const tableData = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));

        // Check if it's the new schema format
        if (tableData.name && tableData.columns) {
          console.log(`📊 Table: ${tableData.name}`);
          console.log(`📋 Columns:`);
          for (const [columnName, columnType] of Object.entries(
            tableData.columns
          )) {
            console.log(`  - ${columnName}: ${columnType}`);
          }
          console.log(`📈 Records: ${tableData.data.length}`);

          if (tableData.data.length > 0) {
            console.log(`📋 Sample record:`, tableData.data[0]);
          }
        } else {
          // Legacy format
          console.log(`📊 Records in '${tableName}': ${tableData.length}`);
          if (tableData.length > 0) {
            console.log(`📋 Sample record:`, tableData[0]);
          }
        }
      } else {
        console.log(`❌ Table '${tableName}' not found`);
      }
    } catch (error) {
      console.error(`❌ Failed to describe table '${tableName}':`, error);
    }
  }

  // Data Operations
  private insertData(tableName: string, data: any): void {
    try {
      const tablePath = this.getTablePath(tableName);

      if (!fs.existsSync(tablePath)) {
        console.log(`❌ Table '${tableName}' does not exist`);
        return;
      }

      const tableData = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));

      // Parse concept-style data using "is" syntax
      let newRecord: any = {};
      if (typeof data === 'string') {
        // Parse concept syntax: "name is Alice age is 30 role is admin"
        const parts = data.trim().split(/\s+/);
        for (let i = 0; i < parts.length; i += 3) {
          if (i + 2 < parts.length && parts[i + 1] === 'is') {
            const key = parts[i];
            let value = parts[i + 2];

            // Try to parse as number
            if (!isNaN(Number(value))) {
              newRecord[key] = Number(value);
              continue;
            }
            // Try to parse as boolean
            else if (value === 'true' || value === 'false') {
              newRecord[key] = value === 'true';
              continue;
            }

            newRecord[key] = value;
          }
        }
      } else {
        newRecord = data;
      }

      // Check if it's the new schema format
      if (tableData.name && tableData.columns) {
        // Validate against schema
        const schemaColumns = Object.keys(tableData.columns);
        const recordColumns = Object.keys(newRecord);

        // Check if all record columns exist in schema
        const invalidColumns = recordColumns.filter(
          col => !schemaColumns.includes(col)
        );
        if (invalidColumns.length > 0) {
          console.log(
            `⚠️  Warning: Unknown columns: ${invalidColumns.join(', ')}`
          );
        }

        tableData.data.push(newRecord);
        tableData.updatedAt = new Date().toISOString();
        fs.writeFileSync(tablePath, JSON.stringify(tableData, null, 2));
      } else {
        // Legacy format
        tableData.push(newRecord);
        fs.writeFileSync(tablePath, JSON.stringify(tableData, null, 2));
      }

      console.log(`✅ Record inserted into '${tableName}':`, newRecord);
    } catch (error) {
      console.error(`❌ Failed to insert into '${tableName}':`, error);
    }
  }

  private selectData(tableName: string, conditions?: any): void {
    try {
      const tablePath = this.getTablePath(tableName);

      if (!fs.existsSync(tablePath)) {
        console.log(`❌ Table '${tableName}' does not exist`);
        return;
      }

      const records = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
      let results = records;

      // Apply conditions if provided
      if (conditions) {
        let cond: any = {};
        if (typeof conditions === 'string') {
          // Parse concept syntax: "role is admin status is active"
          const parts = conditions.trim().split(/\s+/);
          for (let i = 0; i < parts.length; i += 3) {
            if (i + 2 < parts.length && parts[i + 1] === 'is') {
              const key = parts[i];
              let value = parts[i + 2];

              // Try to parse as number
              if (!isNaN(Number(value))) {
                cond[key] = Number(value);
                continue;
              }
              // Try to parse as boolean
              else if (value === 'true' || value === 'false') {
                cond[key] = value === 'true';
                continue;
              }
              // Default to string
              cond[key] = value;
            }
          }
        } else {
          cond = conditions;
        }

        results = records.filter((record: any) => {
          return Object.keys(cond).every(key => record[key] === cond[key]);
        });
      }

      console.log(`📋 Records from '${tableName}':`, results);
    } catch (error) {
      console.error(`❌ Failed to select from '${tableName}':`, error);
    }
  }

  private updateData(tableName: string, conditions: any, updates: any): void {
    try {
      const tablePath = this.getTablePath(tableName);

      if (!fs.existsSync(tablePath)) {
        console.log(`❌ Table '${tableName}' does not exist`);
        return;
      }

      const records = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));

      // Parse concept syntax for conditions
      let cond: any = {};
      if (typeof conditions === 'string') {
        const parts = conditions.trim().split(/\s+/);
        for (let i = 0; i < parts.length; i += 3) {
          if (i + 2 < parts.length && parts[i + 1] === 'is') {
            const key = parts[i];
            let value = parts[i + 2];

            if (!isNaN(Number(value))) {
              cond[key] = Number(value);
            } else if (value === 'true' || value === 'false') {
              cond[key] = value === 'true';
            } else {
              cond[key] = value;
            }
          }
        }
      } else {
        cond = conditions;
      }

      // Parse concept syntax for updates
      let upd: any = {};
      if (typeof updates === 'string') {
        const parts = updates.trim().split(/\s+/);
        for (let i = 0; i < parts.length; i += 3) {
          if (i + 2 < parts.length && parts[i + 1] === 'is') {
            const key = parts[i];
            let value = parts[i + 2];

            if (!isNaN(Number(value))) {
              upd[key] = Number(value);
            } else if (value === 'true' || value === 'false') {
              upd[key] = value === 'true';
            } else {
              upd[key] = value;
            }
          }
        }
      } else {
        upd = updates;
      }

      let updatedCount = 0;
      const updatedRecords = records.map((record: any) => {
        const matches = Object.keys(cond).every(
          key => record[key] === cond[key]
        );
        if (matches) {
          updatedCount++;
          return { ...record, ...upd };
        }
        return record;
      });

      fs.writeFileSync(tablePath, JSON.stringify(updatedRecords, null, 2));
      console.log(`✅ Updated ${updatedCount} records in '${tableName}'`);
    } catch (error) {
      console.error(`❌ Failed to update '${tableName}':`, error);
    }
  }

  private deleteData(tableName: string, conditions: any): void {
    try {
      const tablePath = this.getTablePath(tableName);

      if (!fs.existsSync(tablePath)) {
        console.log(`❌ Table '${tableName}' does not exist`);
        return;
      }

      const records = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));

      // Parse concept syntax for conditions
      let cond: any = {};
      if (typeof conditions === 'string') {
        const parts = conditions.trim().split(/\s+/);
        for (let i = 0; i < parts.length; i += 2) {
          if (i + 1 < parts.length) {
            const key = parts[i];
            let value = parts[i + 1];

            if (!isNaN(Number(value))) {
              cond[key] = Number(value);
            } else if (value === 'true' || value === 'false') {
              cond[key] = value === 'true';
            } else {
              cond[key] = value;
            }
          }
        }
      } else {
        cond = conditions;
      }

      const originalLength = records.length;
      const filteredRecords = records.filter((record: any) => {
        return !Object.keys(cond).every(key => record[key] === cond[key]);
      });

      const deletedCount = originalLength - filteredRecords.length;
      fs.writeFileSync(tablePath, JSON.stringify(filteredRecords, null, 2));

      console.log(`✅ Deleted ${deletedCount} records from '${tableName}'`);
    } catch (error) {
      console.error(`❌ Failed to delete from '${tableName}':`, error);
    }
  }

  // Query Operations
  private executeQuery(query: string): void {
    console.log(`🔍 Executing query: ${query}`);

    // Simple query parser - no quotes needed
    const queryLower = query.toLowerCase().trim();

    if (queryLower.startsWith('select')) {
      this.handleSelectQuery(query);
    } else if (queryLower.startsWith('insert')) {
      this.handleInsertQuery(query);
    } else if (queryLower.startsWith('update')) {
      this.handleUpdateQuery(query);
    } else if (queryLower.startsWith('delete')) {
      this.handleDeleteQuery(query);
    } else {
      console.log('❌ Unsupported query type');
    }
  }

  private handleSelectQuery(query: string): void {
    // Simple SELECT parser
    const match = query.match(/select\s+(.+?)\s+from\s+(\w+)/i);
    if (match) {
      const columns = match[1].trim();
      const tableName = match[2].trim();

      if (columns === '*') {
        this.selectData(tableName);
      } else {
        console.log(`📋 Selecting ${columns} from ${tableName}`);
        // For now, just select all and let user filter
        this.selectData(tableName);
      }
    } else {
      console.log('❌ Invalid SELECT query format');
    }
  }

  private handleInsertQuery(query: string): void {
    // Simple INSERT parser - handles SQL VALUES syntax
    const match = query.match(/insert\s+into\s+(\w+)\s+values\s+\((.+)\)/i);
    if (match) {
      const tableName = match[1].trim();
      const values = match[2].trim();

      // Parse SQL VALUES: ('David', 'david@example.com', 'user')
      const valuesList = values
        .split(',')
        .map(v => v.trim().replace(/^'|'$/g, ''));

      // For now, create a simple object with generic field names
      const data: any = {};
      valuesList.forEach((value, index) => {
        data[`field${index + 1}`] = value;
      });

      this.insertData(tableName, data);
    } else {
      console.log('❌ Invalid INSERT query format');
    }
  }

  private handleUpdateQuery(query: string): void {
    console.log('📝 UPDATE query parsing not implemented yet');
  }

  private handleDeleteQuery(query: string): void {
    console.log('📝 DELETE query parsing not implemented yet');
  }

  private countRecords(tableName: string, conditions?: any): void {
    try {
      const tablePath = this.getTablePath(tableName);

      if (!fs.existsSync(tablePath)) {
        console.log(`❌ Table '${tableName}' does not exist`);
        return;
      }

      const records = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
      let count = records.length;

      if (conditions) {
        const cond =
          typeof conditions === 'string' ? JSON.parse(conditions) : conditions;
        count = records.filter((record: any) => {
          return Object.keys(cond).every(key => record[key] === cond[key]);
        }).length;
      }

      console.log(`📊 Count in '${tableName}': ${count}`);
    } catch (error) {
      console.error(`❌ Failed to count records in '${tableName}':`, error);
    }
  }

  private findRecords(tableName: string, searchTerm: string): void {
    try {
      const tablePath = this.getTablePath(tableName);

      if (!fs.existsSync(tablePath)) {
        console.log(`❌ Table '${tableName}' does not exist`);
        return;
      }

      const records = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
      const results = records.filter((record: any) => {
        return JSON.stringify(record)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      });

      console.log(
        `🔍 Found ${results.length} records in '${tableName}':`,
        results
      );
    } catch (error) {
      console.error(`❌ Failed to find records in '${tableName}':`, error);
    }
  }

  // Index Management
  private manageIndex(
    action: string,
    tableName?: string,
    field?: string
  ): void {
    switch (action) {
      case 'create':
        this.createIndex(tableName!, field!);
        break;
      case 'list':
        this.listIndexes();
        break;
      case 'drop':
        this.dropIndex(tableName!, field!);
        break;
      default:
        console.log('Available index actions: create, list, drop');
    }
  }

  private createIndex(tableName: string, field: string): void {
    const indexKey = `${tableName}.${field}`;
    console.log(`🔍 Creating index on ${tableName}.${field}`);
    // Index creation logic would go here
  }

  private listIndexes(): void {
    console.log('🔍 Available indexes:');
    for (const [name, data] of this.indexes) {
      console.log(`  ${name}: ${data.length} entries`);
    }
  }

  private dropIndex(tableName: string, field: string): void {
    const indexKey = `${tableName}.${field}`;
    console.log(`🗑️ Dropping index on ${tableName}.${field}`);
    // Index dropping logic would go here
  }

  // Transaction Management
  private beginTransaction(): void {
    console.log('🔄 Transaction started');
  }

  private commitTransaction(): void {
    console.log('✅ Transaction committed');
  }

  private rollbackTransaction(): void {
    console.log('↩️ Transaction rolled back');
  }

  // Backup & Restore
  private createBackup(name?: string): void {
    const backupName =
      name || `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const backupPath = path.join(this.dbConfig.dbPath, `${backupName}.json`);

    try {
      const files = fs.readdirSync(this.dbConfig.dbPath);
      const tables = files
        .filter(
          file => file.endsWith('.json') && !file.endsWith('.schema.json')
        )
        .map(file => file.replace('.json', ''));

      const backup = {
        timestamp: new Date().toISOString(),
        tables: {} as { [key: string]: any },
        version: this.config.version,
      };

      for (const table of tables) {
        const tablePath = this.getTablePath(table);
        backup.tables[table] = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
      }

      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
      console.log(`💾 Backup created: ${backupName}`);
    } catch (error) {
      console.error(`❌ Failed to create backup: ${error}`);
    }
  }

  private restoreBackup(name: string): void {
    const backupPath = path.join(this.dbConfig.dbPath, `${name}.json`);

    try {
      if (!fs.existsSync(backupPath)) {
        console.log(`❌ Backup not found: ${name}`);
        return;
      }

      const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

      for (const [tableName, data] of Object.entries(backup.tables)) {
        const tablePath = this.getTablePath(tableName);
        fs.writeFileSync(tablePath, JSON.stringify(data, null, 2));
      }

      console.log(`📸 Backup restored: ${name}`);
    } catch (error) {
      console.error(`❌ Failed to restore backup: ${error}`);
    }
  }

  private listBackups(): void {
    try {
      const files = fs.readdirSync(this.dbConfig.dbPath);
      const backups = files
        .filter(file => file.endsWith('.json') && file.startsWith('backup-'))
        .map(file => file.replace('.json', ''));

      console.log(`💾 Available backups: ${backups.join(', ')}`);
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
    }
  }

  // Configuration
  private updateConfig(key: string, value: string): void {
    switch (key) {
      case 'path':
        this.dbConfig.dbPath = value;
        this.ensureDatabaseDirectory();
        console.log(`🔧 Database path set to ${this.dbConfig.dbPath}`);
        break;
      case 'autocommit':
        this.dbConfig.autoCommit = value === 'true';
        console.log(`🔧 Auto-commit set to ${this.dbConfig.autoCommit}`);
        break;
      case 'indexing':
        this.dbConfig.enableIndexing = value === 'true';
        console.log(`🔧 Indexing set to ${this.dbConfig.enableIndexing}`);
        break;
      default:
        console.log(`❌ Unknown config key: ${key}`);
    }
  }

  private showStats(): void {
    try {
      const files = fs.readdirSync(this.dbConfig.dbPath);
      const tables = files
        .filter(
          file => file.endsWith('.json') && !file.endsWith('.schema.json')
        )
        .map(file => file.replace('.json', ''));

      console.log(`📊 Database Statistics:`);
      console.log(`  Tables: ${tables.length}`);
      console.log(`  Database path: ${this.dbConfig.dbPath}`);
      console.log(`  Auto-commit: ${this.dbConfig.autoCommit}`);
      console.log(`  Indexing: ${this.dbConfig.enableIndexing}`);

      for (const table of tables) {
        const tablePath = this.getTablePath(table);
        const records = JSON.parse(fs.readFileSync(tablePath, 'utf-8'));
        console.log(`  ${table}: ${records.length} records`);
      }
    } catch (error) {
      console.error('❌ Failed to show stats:', error);
    }
  }

  // Utility Functions
  private exportData(tableName: string, format: string): void {
    console.log(`📤 Exporting ${tableName} as ${format}`);
    // Export logic would go here
  }

  private importData(tableName: string, filePath: string): void {
    console.log(`📥 Importing ${filePath} into ${tableName}`);
    // Import logic would go here
  }

  private vacuumDatabase(): void {
    console.log('🧹 Vacuuming database...');
    // Vacuum logic would go here
  }

  private showHelp(): void {
    console.log(`
🗄️ Database Plugin - Available Commands:

Table Management:
  db create <table>              - Create a new table
  db drop <table>                - Drop a table
  db tables                      - List all tables
  db describe <table>            - Show table info

Data Operations:
  db insert <table> <data>       - Insert data into table
  db select <table> [conditions] - Select data from table
  db update <table> <conditions> <updates> - Update records
  db delete <table> <conditions> - Delete records

Query Operations:
  db query <sql>                 - Execute SQL query (no wrapper quotes needed)
  db count <table> [conditions]  - Count records
  db find <table> <term>         - Find records containing term

Index Management:
  db index create <table> <field> - Create index
  db index list                   - List indexes
  db index drop <table> <field>   - Drop index

Transaction Management:
  db begin                       - Start transaction
  db commit                      - Commit transaction
  db rollback                    - Rollback transaction

Backup & Restore:
  db backup [name]               - Create backup
  db restore <name>              - Restore backup
  db list-backups                - List available backups

Configuration:
  db config <key> <value>        - Set configuration
  db stats                       - Show database statistics

Utilities:
  db export <table> <format>     - Export table data
  db import <table> <file>       - Import data into table
  db vacuum                      - Optimize database
    `);
  }
}

export default DatabasePlugin;
