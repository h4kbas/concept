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
  name: 'file',
  version: '1.0.0',
  description:
    'File system API plugin - exposes full file system functionality to concept files',
  author: 'Concept Lang Team',
  license: 'MIT',
  main: 'index.js',
  conceptListeners: [],
};

interface FileSystemConfig {
  basePath: string;
  encoding: BufferEncoding;
  createDirs: boolean;
}

class FileSystemPlugin implements ConceptPlugin {
  readonly config = config;
  private fsConfig: FileSystemConfig = {
    basePath: './',
    encoding: 'utf-8',
    createDirs: true,
  };
  private block: any = null; // Will be set by setBlock method

  setBlock(block: any): void {
    this.block = block;
  }

  async initialize(): Promise<void> {
    console.log(`📁 Initializing ${this.config.name} plugin`);
    this.ensureBaseDirectory();
    console.log(`📁 File system API ready for concept files to use`);
  }

  async cleanup(): Promise<void> {
    console.log(`🧹 File system plugin cleaned up`);
  }

  registerListeners(): Map<ConceptEventType, ConceptListener> {
    // File system plugin only provides API, no listeners
    return new Map<ConceptEventType, ConceptListener>();
  }

  getHooks() {
    return {
      // Hook that processes 'file' commands
      file: (params: any[], block?: any[]) => {
        const action = params[1]?.name || params[0]?.name;
        switch (action) {
          // File Operations
          case 'read':
            this.readFile(params[2]?.name || params[1]?.name);
            break;
          case 'write':
            this.writeFile(
              params[2]?.name || params[1]?.name,
              params[3]?.name || params[2]?.name,
              block
            );
            break;
          case 'append':
            this.appendFile(
              params[2]?.name || params[1]?.name,
              params[3]?.name || params[2]?.name
            );
            break;
          case 'copy':
            this.copyFile(
              params[2]?.name || params[1]?.name,
              params[3]?.name || params[2]?.name
            );
            break;
          case 'move':
            this.moveFile(
              params[2]?.name || params[1]?.name,
              params[3]?.name || params[2]?.name
            );
            break;
          case 'delete':
            this.deleteFile(params[2]?.name || params[1]?.name);
            break;
          case 'exists':
            this.fileExists(params[2]?.name || params[1]?.name);
            break;
          case 'info':
            this.getFileInfo(params[2]?.name || params[1]?.name);
            break;

          // Directory Operations
          case 'mkdir':
            this.createDirectory(params[2]?.name || params[1]?.name);
            break;
          case 'rmdir':
            this.removeDirectory(params[2]?.name || params[1]?.name);
            break;
          case 'list':
            this.listDirectory(
              params[2]?.name || params[1]?.name,
              params[3]?.name || params[2]?.name
            );
            break;
          case 'tree':
            this.showDirectoryTree(params[2]?.name || params[1]?.name);
            break;

          // Search Operations
          case 'search':
            this.searchFiles(
              params[2]?.name || params[1]?.name,
              params[3]?.name || params[2]?.name
            );
            break;
          case 'find':
            this.findFiles(
              params[2]?.name || params[1]?.name,
              params[3]?.name || params[2]?.name
            );
            break;
          case 'grep':
            this.grepFiles(
              params[2]?.name || params[1]?.name,
              params[3]?.name || params[2]?.name
            );
            break;

          // Configuration
          case 'config':
            this.updateConfig(
              params[2]?.name || params[1]?.name,
              params[3]?.name || params[2]?.name
            );
            break;
          case 'stats':
            this.showStats();
            break;

          // Utility Functions
          case 'backup':
            this.createBackup(
              params[2]?.name || params[1]?.name,
              params[3]?.name || params[2]?.name
            );
            break;
          case 'restore':
            this.restoreBackup(params[2]?.name || params[1]?.name);
            break;

          default:
            this.showHelp();
        }
        return params;
      },
    };
  }

  private ensureBaseDirectory(): void {
    if (!fs.existsSync(this.fsConfig.basePath)) {
      fs.mkdirSync(this.fsConfig.basePath, { recursive: true });
    }
  }

  private getFullPath(filePath: string): string {
    return path.resolve(this.fsConfig.basePath, filePath);
  }

  // File Operations
  private readFile(filePath: string): void {
    try {
      const fullPath = this.getFullPath(filePath);

      if (!fs.existsSync(fullPath)) {
        console.log(`❌ File '${filePath}' does not exist`);
        return;
      }

      const content = fs.readFileSync(fullPath, {
        encoding: this.fsConfig.encoding,
      });
      console.log(`📖 Content of '${filePath}':`);
      console.log(content);
    } catch (error) {
      console.error(`❌ Failed to read file '${filePath}':`, error);
    }
  }

  private writeFile(filePath: string, data: any, block?: any[]): void {
    try {
      const fullPath = this.getFullPath(filePath);
      const dir = path.dirname(fullPath);

      if (this.fsConfig.createDirs && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let content = '';
      let encoding = this.fsConfig.encoding;

      // Handle tabbed block content
      if (block && block.length > 0) {
        content = this.parseBlockContent(block);
      } else if (typeof data === 'string') {
        // Parse concept syntax: content is Hello World encoding is utf-8
        const parts = data.trim().split(/\s+/);
        for (let i = 0; i < parts.length; i += 3) {
          if (i + 2 < parts.length && parts[i + 1] === 'is') {
            const key = parts[i];
            const value = parts[i + 2];

            if (key === 'content') {
              content = value;
            } else if (key === 'encoding') {
              encoding = value as BufferEncoding;
            }
          }
        }
      } else {
        content = JSON.stringify(data, null, 2);
      }

      fs.writeFileSync(fullPath, content, { encoding });
      console.log(`✅ File '${filePath}' written successfully`);
    } catch (error) {
      console.error(`❌ Failed to write file '${filePath}':`, error);
    }
  }

  private appendFile(filePath: string, data: any): void {
    try {
      const fullPath = this.getFullPath(filePath);
      const dir = path.dirname(fullPath);

      if (this.fsConfig.createDirs && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let content = '';
      let encoding = this.fsConfig.encoding;

      if (typeof data === 'string') {
        // Parse concept syntax: content is Hello World encoding is utf-8
        const parts = data.trim().split(/\s+/);
        for (let i = 0; i < parts.length; i += 3) {
          if (i + 2 < parts.length && parts[i + 1] === 'is') {
            const key = parts[i];
            const value = parts[i + 2];

            if (key === 'content') {
              content = value;
            } else if (key === 'encoding') {
              encoding = value as BufferEncoding;
            }
          }
        }
      } else {
        content = JSON.stringify(data, null, 2);
      }

      fs.appendFileSync(fullPath, content, { encoding });
      console.log(`✅ Content appended to '${filePath}'`);
    } catch (error) {
      console.error(`❌ Failed to append to file '${filePath}':`, error);
    }
  }

  private copyFile(sourcePath: string, destPath: string): void {
    try {
      const fullSourcePath = this.getFullPath(sourcePath);
      const fullDestPath = this.getFullPath(destPath);
      const destDir = path.dirname(fullDestPath);

      if (!fs.existsSync(fullSourcePath)) {
        console.log(`❌ Source file '${sourcePath}' does not exist`);
        return;
      }

      if (this.fsConfig.createDirs && !fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      fs.copyFileSync(fullSourcePath, fullDestPath);
      console.log(`✅ File copied from '${sourcePath}' to '${destPath}'`);
    } catch (error) {
      console.error(`❌ Failed to copy file:`, error);
    }
  }

  private moveFile(sourcePath: string, destPath: string): void {
    try {
      const fullSourcePath = this.getFullPath(sourcePath);
      const fullDestPath = this.getFullPath(destPath);
      const destDir = path.dirname(fullDestPath);

      if (!fs.existsSync(fullSourcePath)) {
        console.log(`❌ Source file '${sourcePath}' does not exist`);
        return;
      }

      if (this.fsConfig.createDirs && !fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      fs.renameSync(fullSourcePath, fullDestPath);
      console.log(`✅ File moved from '${sourcePath}' to '${destPath}'`);
    } catch (error) {
      console.error(`❌ Failed to move file:`, error);
    }
  }

  private deleteFile(filePath: string): void {
    try {
      const fullPath = this.getFullPath(filePath);

      if (!fs.existsSync(fullPath)) {
        console.log(`❌ File '${filePath}' does not exist`);
        return;
      }

      fs.unlinkSync(fullPath);
      console.log(`✅ File '${filePath}' deleted`);
    } catch (error) {
      console.error(`❌ Failed to delete file '${filePath}':`, error);
    }
  }

  private fileExists(filePath: string): void {
    const fullPath = this.getFullPath(filePath);
    const exists = fs.existsSync(fullPath);
    console.log(`📁 File '${filePath}' exists: ${exists}`);
  }

  private getFileInfo(filePath: string): void {
    try {
      const fullPath = this.getFullPath(filePath);

      if (!fs.existsSync(fullPath)) {
        console.log(`❌ File '${filePath}' does not exist`);
        return;
      }

      const stats = fs.statSync(fullPath);
      console.log(`📁 File info for '${filePath}':`);
      console.log(`  Size: ${stats.size} bytes`);
      console.log(`  Created: ${stats.birthtime}`);
      console.log(`  Modified: ${stats.mtime}`);
      console.log(`  Is Directory: ${stats.isDirectory()}`);
      console.log(`  Is File: ${stats.isFile()}`);
    } catch (error) {
      console.error(`❌ Failed to get file info for '${filePath}':`, error);
    }
  }

  // Directory Operations
  private createDirectory(dirPath: string): void {
    try {
      const fullPath = this.getFullPath(dirPath);

      if (fs.existsSync(fullPath)) {
        console.log(`❌ Directory '${dirPath}' already exists`);
        return;
      }

      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Directory '${dirPath}' created`);
    } catch (error) {
      console.error(`❌ Failed to create directory '${dirPath}':`, error);
    }
  }

  private removeDirectory(dirPath: string): void {
    try {
      const fullPath = this.getFullPath(dirPath);

      if (!fs.existsSync(fullPath)) {
        console.log(`❌ Directory '${dirPath}' does not exist`);
        return;
      }

      fs.rmdirSync(fullPath, { recursive: true });
      console.log(`✅ Directory '${dirPath}' removed`);
    } catch (error) {
      console.error(`❌ Failed to remove directory '${dirPath}':`, error);
    }
  }

  private listDirectory(dirPath: string, options?: any): void {
    try {
      const fullPath = this.getFullPath(dirPath);

      if (!fs.existsSync(fullPath)) {
        console.log(`❌ Directory '${dirPath}' does not exist`);
        return;
      }

      const files = fs.readdirSync(fullPath);
      const recursive = options?.recursive === true;
      const filter = options?.filter;

      let results = files;

      if (filter) {
        const regex = new RegExp(filter);
        results = files.filter(file => regex.test(file));
      }

      if (recursive) {
        const allFiles: string[] = [];
        const scanDir = (dir: string, prefix: string = '') => {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const itemPath = path.join(dir, item);
            const stats = fs.statSync(itemPath);
            const relativePath = path.relative(fullPath, itemPath);

            if (stats.isDirectory()) {
              allFiles.push(`${prefix}${item}/`);
              scanDir(itemPath, `${prefix}${item}/`);
            } else {
              allFiles.push(`${prefix}${item}`);
            }
          }
        };
        scanDir(fullPath);
        results = allFiles;
      }

      console.log(`📁 Contents of '${dirPath}':`);
      results.forEach(file => console.log(`  ${file}`));
    } catch (error) {
      console.error(`❌ Failed to list directory '${dirPath}':`, error);
    }
  }

  private showDirectoryTree(dirPath: string): void {
    try {
      const fullPath = this.getFullPath(dirPath);

      if (!fs.existsSync(fullPath)) {
        console.log(`❌ Directory '${dirPath}' does not exist`);
        return;
      }

      const buildTree = (
        dir: string,
        prefix: string = '',
        isLast: boolean = true
      ): void => {
        const items = fs.readdirSync(dir);
        const dirs = items.filter(item =>
          fs.statSync(path.join(dir, item)).isDirectory()
        );
        const files = items.filter(item =>
          fs.statSync(path.join(dir, item)).isFile()
        );

        const allItems = [...dirs, ...files];

        allItems.forEach((item, index) => {
          const isLastItem = index === allItems.length - 1;
          const connector = isLastItem ? '└── ' : '├── ';
          const itemPath = path.join(dir, item);
          const stats = fs.statSync(itemPath);

          console.log(`${prefix}${connector}${item}`);

          if (stats.isDirectory()) {
            const newPrefix = prefix + (isLastItem ? '    ' : '│   ');
            buildTree(itemPath, newPrefix, isLastItem);
          }
        });
      };

      console.log(`🌳 Directory tree for '${dirPath}':`);
      console.log(dirPath);
      buildTree(fullPath);
    } catch (error) {
      console.error(
        `❌ Failed to show directory tree for '${dirPath}':`,
        error
      );
    }
  }

  // Search Operations
  private searchFiles(searchPath: string, options?: any): void {
    try {
      const fullPath = this.getFullPath(searchPath);

      if (!fs.existsSync(fullPath)) {
        console.log(`❌ Path '${searchPath}' does not exist`);
        return;
      }

      const pattern = options?.pattern || '.*';
      const recursive = options?.recursive !== false;
      const regex = new RegExp(pattern, 'i');

      const findFiles = (dir: string): string[] => {
        const files: string[] = [];
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const itemPath = path.join(dir, item);
          const stats = fs.statSync(itemPath);

          if (stats.isDirectory() && recursive) {
            files.push(...findFiles(itemPath));
          } else if (stats.isFile() && regex.test(item)) {
            files.push(path.relative(fullPath, itemPath));
          }
        }

        return files;
      };

      const results = findFiles(fullPath);
      console.log(`🔍 Found ${results.length} files matching '${pattern}':`);
      results.forEach(file => console.log(`  ${file}`));
    } catch (error) {
      console.error(`❌ Failed to search files:`, error);
    }
  }

  private findFiles(searchPath: string, options?: any): void {
    this.searchFiles(searchPath, options);
  }

  private grepFiles(searchPath: string, options?: any): void {
    try {
      const fullPath = this.getFullPath(searchPath);

      if (!fs.existsSync(fullPath)) {
        console.log(`❌ Path '${searchPath}' does not exist`);
        return;
      }

      const pattern = options?.pattern || '';
      const recursive = options?.recursive !== false;
      const regex = new RegExp(pattern, 'i');

      const searchInFiles = (dir: string): void => {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const itemPath = path.join(dir, item);
          const stats = fs.statSync(itemPath);

          if (stats.isDirectory() && recursive) {
            searchInFiles(itemPath);
          } else if (stats.isFile()) {
            try {
              const content = fs.readFileSync(itemPath, 'utf-8');
              const lines = content.split('\n');

              lines.forEach((line, index) => {
                if (regex.test(line)) {
                  const relativePath = path.relative(fullPath, itemPath);
                  console.log(`${relativePath}:${index + 1}: ${line.trim()}`);
                }
              });
            } catch (error) {
              // Skip files that can't be read as text
            }
          }
        }
      };

      console.log(`🔍 Searching for '${pattern}' in files:`);
      searchInFiles(fullPath);
    } catch (error) {
      console.error(`❌ Failed to grep files:`, error);
    }
  }

  // Configuration
  private updateConfig(key: string, value: string): void {
    switch (key) {
      case 'basepath':
        this.fsConfig.basePath = value;
        this.ensureBaseDirectory();
        console.log(`🔧 Base path set to ${this.fsConfig.basePath}`);
        break;
      case 'encoding':
        this.fsConfig.encoding = value as BufferEncoding;
        console.log(`🔧 Encoding set to ${this.fsConfig.encoding}`);
        break;
      case 'createdirs':
        this.fsConfig.createDirs = value === 'true';
        console.log(`🔧 Create directories set to ${this.fsConfig.createDirs}`);
        break;
      default:
        console.log(`❌ Unknown config key: ${key}`);
    }
  }

  private showStats(): void {
    try {
      const fullPath = this.getFullPath('.');
      const stats = fs.statSync(fullPath);

      console.log(`📁 File System Statistics:`);
      console.log(`  Base path: ${this.fsConfig.basePath}`);
      console.log(`  Encoding: ${this.fsConfig.encoding}`);
      console.log(`  Create directories: ${this.fsConfig.createDirs}`);
      console.log(`  Base directory exists: ${fs.existsSync(fullPath)}`);
    } catch (error) {
      console.error('❌ Failed to show stats:', error);
    }
  }

  // Utility Functions
  private createBackup(sourcePath: string, backupPath?: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalBackupPath = backupPath || `backup-${timestamp}`;

    try {
      const fullSourcePath = this.getFullPath(sourcePath);
      const fullBackupPath = this.getFullPath(finalBackupPath);

      if (!fs.existsSync(fullSourcePath)) {
        console.log(`❌ Source '${sourcePath}' does not exist`);
        return;
      }

      const stats = fs.statSync(fullSourcePath);
      if (stats.isDirectory()) {
        // Copy directory recursively
        this.copyDirectory(fullSourcePath, fullBackupPath);
      } else {
        // Copy file
        fs.copyFileSync(fullSourcePath, fullBackupPath);
      }

      console.log(`💾 Backup created: ${sourcePath} -> ${finalBackupPath}`);
    } catch (error) {
      console.error(`❌ Failed to create backup:`, error);
    }
  }

  private copyDirectory(source: string, dest: string): void {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(source);
    for (const item of items) {
      const sourcePath = path.join(source, item);
      const destPath = path.join(dest, item);
      const stats = fs.statSync(sourcePath);

      if (stats.isDirectory()) {
        this.copyDirectory(sourcePath, destPath);
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }

  private restoreBackup(backupPath: string): void {
    console.log(`📸 Restoring from backup: ${backupPath}`);
    // Implementation would restore from backup
  }

  private showHelp(): void {
    console.log(`
📁 File System Plugin - Available Commands:

File Operations:
  file read <path>                     - Read file content
  file write <path> <data>             - Write file content
  file append <path> <data>            - Append to file
  file copy <source> <dest>            - Copy file
  file move <source> <dest>            - Move file
  file delete <path>                   - Delete file
  file exists <path>                   - Check if file exists
  file info <path>                     - Get file information

Directory Operations:
  file mkdir <path>                    - Create directory
  file rmdir <path>                    - Remove directory
  file list <path> [options]           - List directory contents
  file tree <path>                     - Show directory tree

Search Operations:
  file search <path> [options]         - Search for files
  file find <path> [options]           - Find files (alias for search)
  file grep <path> [options]           - Search content in files

Configuration:
  file config <key> <value>            - Set configuration
  file stats                           - Show file system statistics

Utilities:
  file backup <source> [dest]          - Create backup
  file restore <backup>                - Restore from backup
    `);
  }

  private parseBlockContent(block: any[]): string {
    // Convert block content to string
    // Block is a flat array of concepts: [concept1, concept2, concept3, ...]
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < block.length; i++) {
      const concept = block[i];
      if (concept && concept.name) {
        if (currentLine) {
          currentLine += ' ';
        }
        currentLine += concept.name;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.join('\n');
  }
}

export default FileSystemPlugin;
