import { ConceptRunner, RunnerConfig, ConceptEvent } from '../types/plugin';
import { ConceptPluginManager } from './plugin-manager';
import { Compiler } from './compiler';
import { Block } from './block';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';

export class ConceptRunnerImpl implements ConceptRunner {
  private pluginManager: ConceptPluginManager;
  private compiler: Compiler;
  private block: Block;
  private config: RunnerConfig | null = null;
  private watcher: chokidar.FSWatcher | null = null;
  private isRunning = false;

  constructor() {
    this.block = new Block();
    this.pluginManager = new ConceptPluginManager(this.block);
    // Don't create compiler here - it will be created in initialize()
    this.compiler = null as any;
  }

  async initialize(config: RunnerConfig): Promise<void> {
    this.config = config;

    console.log('🚀 Initializing Concept Runner...');

    // Load std plugin by default
    try {
      await this.pluginManager.loadPlugin('./dist/plugins/std/index.js');
    } catch (error) {
      console.error('Failed to load std plugin:', error);
      if (config.logLevel === 'debug') {
        console.error(error);
      }
    }

    console.log(`📦 Loading ${config.plugins.length} additional plugins...`);

    // Load all additional plugins
    for (const pluginPath of config.plugins) {
      try {
        await this.pluginManager.loadPlugin(pluginPath);
      } catch (error) {
        console.error(`Failed to load plugin ${pluginPath}:`, error);
        if (config.logLevel === 'debug') {
          console.error(error);
        }
      }
    }

    // Set up block event listeners
    this.setupBlockEventListeners();

    // Integrate plugin hooks with compiler
    this.integratePluginHooks();

    console.log('✅ Concept Runner initialized successfully');
  }

  private setupBlockEventListeners(): void {
    // Override block methods to emit events
    const originalAddConcept = this.block.addConcept.bind(this.block);
    const originalAddPair = this.block.addPair.bind(this.block);
    const originalAddData = this.block.addData.bind(this.block);

    this.block.addConcept = concept => {
      const result = originalAddConcept(concept);
      this.emitEvent({
        type: 'concept:added',
        timestamp: new Date(),
        data: { concept },
      });
      return result;
    };

    this.block.addPair = (conceptAOrPair: any, conceptB?: any) => {
      const result = originalAddPair(conceptAOrPair, conceptB);
      this.emitEvent({
        type: 'pair:added',
        timestamp: new Date(),
        data: { pair: result },
      });
      return result;
    };

    this.block.addData = (pairOrData: any, value?: any) => {
      originalAddData(pairOrData, value);
      const data =
        value !== undefined ? { pair: pairOrData, value } : pairOrData;

      this.emitEvent({
        type: 'data:added',
        timestamp: new Date(),
        data: { data },
      });
    };
  }

  private integratePluginHooks(): void {
    // Get all loaded plugins
    const plugins = this.pluginManager.getLoadedPlugins();

    // Collect all plugin hooks
    const pluginHooks: any = {};
    for (const plugin of plugins) {
      if (plugin.getHooks) {
        const hooks = plugin.getHooks(this.block);
        Object.assign(pluginHooks, hooks);
      }
    }

    // Create a new compiler with plugin hooks integrated
    const { createDefaultHookMap } = require('./compiler');
    const defaultHooks = createDefaultHookMap(() => this.block);
    const combinedHooks = { ...defaultHooks, ...pluginHooks };

    // Create compiler with the existing block and combined hooks
    this.compiler = new Compiler(combinedHooks, this.block);
  }

  async runFile(filePath: string): Promise<string> {
    if (!this.config) {
      throw new Error('Runner not initialized. Call initialize() first.');
    }

    const fullPath = path.resolve(filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }

    console.log(`📄 Running concept file: ${fullPath}`);

    try {
      // Read and compile the file
      const source = fs.readFileSync(fullPath, 'utf-8');
      const result = this.compiler.compile(source);

      // Emit inference completed event
      await this.emitEvent({
        type: 'inference:completed',
        timestamp: new Date(),
        data: {
          concepts: Array.from(this.block.concepts),
          pairs: Array.from(this.block.pairs),
          chain: Array.from(this.block.chain),
        },
      });

      // Emit block state changed event
      await this.emitEvent({
        type: 'block:state:changed',
        timestamp: new Date(),
        data: { state: this.block.getState() },
      });

      // Write output if specified
      if (this.config.outputDir) {
        const outputDir = path.resolve(this.config.outputDir);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputFile = path.join(
          outputDir,
          path.basename(filePath, '.concept') + '.output.concept'
        );
        fs.writeFileSync(outputFile, result);
        console.log(`📝 Output written to: ${outputFile}`);
      }

      console.log('✅ File execution completed successfully');
      return result;
    } catch (error) {
      console.error(`❌ Error running file ${fullPath}:`, error);
      throw error;
    }
  }

  async watchDirectory(dirPath: string): Promise<void> {
    if (!this.config) {
      throw new Error('Runner not initialized. Call initialize() first.');
    }

    const fullPath = path.resolve(dirPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Directory not found: ${fullPath}`);
    }

    console.log(`👀 Watching directory: ${fullPath}`);

    this.watcher = chokidar.watch(fullPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on('add', async filePath => {
      if (filePath.endsWith('.concept')) {
        console.log(`📄 New concept file detected: ${filePath}`);
        try {
          await this.runFile(filePath);
        } catch (error) {
          console.error(`Error processing new file ${filePath}:`, error);
        }
      }
    });

    this.watcher.on('change', async filePath => {
      if (filePath.endsWith('.concept')) {
        console.log(`📝 Concept file changed: ${filePath}`);
        try {
          await this.runFile(filePath);
        } catch (error) {
          console.error(`Error processing changed file ${filePath}:`, error);
        }
      }
    });

    this.isRunning = true;
    console.log('✅ Directory watcher started. Press Ctrl+C to stop.');
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping Concept Runner...');

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    // Unload all plugins
    const plugins = this.pluginManager.getLoadedPlugins();
    for (const plugin of plugins) {
      try {
        await this.pluginManager.unloadPlugin(plugin.config.name);
      } catch (error) {
        console.error(`Error unloading plugin ${plugin.config.name}:`, error);
      }
    }

    this.isRunning = false;
    console.log('✅ Concept Runner stopped');
  }

  getPluginManager(): ConceptPluginManager {
    return this.pluginManager;
  }

  private async emitEvent(event: ConceptEvent): Promise<void> {
    if (this.config?.logLevel === 'debug') {
      console.log(`🔔 Emitting event: ${event.type}`, event.data);
    }

    await this.pluginManager.emitEvent(event);
  }

  /**
   * Get runner status
   */
  getStatus(): {
    isRunning: boolean;
    loadedPlugins: string[];
    config: RunnerConfig | null;
  } {
    return {
      isRunning: this.isRunning,
      loadedPlugins: this.pluginManager
        .getLoadedPlugins()
        .map(p => p.config.name),
      config: this.config,
    };
  }

  /**
   * Reload a specific plugin
   */
  async reloadPlugin(pluginName: string): Promise<void> {
    if (!this.config) {
      throw new Error('Runner not initialized');
    }

    const pluginPath = this.config.plugins.find(p => p.includes(pluginName));
    if (!pluginPath) {
      throw new Error(`Plugin ${pluginName} not found in configuration`);
    }

    try {
      await this.pluginManager.unloadPlugin(pluginName);
      await this.pluginManager.loadPlugin(pluginPath);
      console.log(`✅ Reloaded plugin: ${pluginName}`);
    } catch (error) {
      console.error(`❌ Failed to reload plugin ${pluginName}:`, error);
      throw error;
    }
  }

  getLoadedPlugins(): string[] {
    return this.pluginManager.getLoadedPluginNames();
  }

  getCompiler(): Compiler {
    return this.compiler;
  }

  /**
   * Get the block instance
   */
  getBlock(): Block {
    return this.block;
  }
}
