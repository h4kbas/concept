import {
  ConceptPlugin,
  PluginManager,
  ConceptEvent,
  ConceptEventType,
  ConceptListener,
} from '../types/plugin';
import { Block } from './block';
import * as path from 'path';
import * as fs from 'fs';

export class ConceptPluginManager implements PluginManager {
  private plugins: Map<string, ConceptPlugin> = new Map();
  private listeners: Map<ConceptEventType, Set<ConceptListener>> = new Map();
  private block: Block;

  constructor(block: Block) {
    this.block = block;
    this.initializeEventTypes();
  }

  private initializeEventTypes(): void {
    const eventTypes: ConceptEventType[] = [
      'concept:added',
      'concept:updated',
      'pair:added',
      'pair:updated',
      'data:added',
      'data:updated',
      'inference:completed',
      'block:state:changed',
    ];

    eventTypes.forEach(eventType => {
      this.listeners.set(eventType, new Set());
    });
  }

  async loadPlugin(pathOrName: string): Promise<ConceptPlugin> {
    try {
      let pluginPath: string;

      // Check if it's a local path
      if (
        path.isAbsolute(pathOrName) ||
        pathOrName.startsWith('./') ||
        pathOrName.startsWith('../')
      ) {
        pluginPath = path.resolve(pathOrName);
      } else {
        // Try to resolve as npm package
        pluginPath = require.resolve(pathOrName);
      }

      // Load the plugin
      const pluginModule = require(pluginPath);
      const PluginClass = pluginModule.default || pluginModule;

      if (!PluginClass || typeof PluginClass !== 'function') {
        throw new Error(
          `Invalid plugin at ${pluginPath}: must export a ConceptPlugin class`
        );
      }

      // Instantiate the plugin
      const plugin: ConceptPlugin = new PluginClass();

      if (!plugin || typeof plugin !== 'object') {
        throw new Error(
          `Invalid plugin at ${pluginPath}: must export a ConceptPlugin object`
        );
      }

      if (!plugin.config || !plugin.config.name) {
        throw new Error(
          `Plugin at ${pluginPath} must have a valid config with name`
        );
      }

      if (typeof plugin.registerListeners !== 'function') {
        throw new Error(
          `Plugin ${plugin.config.name} must implement registerListeners method`
        );
      }

      // Initialize plugin if method exists
      if (plugin.initialize) {
        await plugin.initialize();
      }

      // Set block instance for concept execution
      if (plugin.setBlock) {
        plugin.setBlock(this.block);
      }

      // Register plugin listeners
      const pluginListeners = plugin.registerListeners();
      for (const [eventType, listener] of pluginListeners) {
        this.registerListener(eventType, listener);
      }

      // Store plugin
      this.plugins.set(plugin.config.name, plugin);

      console.log(
        `✅ Loaded plugin: ${plugin.config.name} v${plugin.config.version}`
      );
      return plugin;
    } catch (error) {
      console.error(`❌ Failed to load plugin ${pathOrName}:`, error);
      throw error;
    }
  }

  async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} is not loaded`);
    }

    // Cleanup plugin if method exists
    if (plugin.cleanup) {
      await plugin.cleanup();
    }

    // Remove plugin listeners
    const pluginListeners = plugin.registerListeners();
    for (const [eventType, listener] of pluginListeners) {
      this.unregisterListener(eventType, listener);
    }

    // Remove plugin
    this.plugins.delete(name);
    console.log(`✅ Unloaded plugin: ${name}`);
  }

  getLoadedPlugins(): ConceptPlugin[] {
    return Array.from(this.plugins.values());
  }

  getLoadedPluginNames(): string[] {
    return Array.from(this.plugins.keys());
  }

  registerListener(
    eventType: ConceptEventType,
    listener: ConceptListener
  ): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.add(listener);
    }
  }

  unregisterListener(
    eventType: ConceptEventType,
    listener: ConceptListener
  ): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  async emitEvent(event: ConceptEvent): Promise<void> {
    const listeners = this.listeners.get(event.type);
    if (listeners && listeners.size > 0) {
      const promises = Array.from(listeners).map(async listener => {
        try {
          await listener(event);
        } catch (error) {
          console.error(`Error in plugin listener for ${event.type}:`, error);
        }
      });

      await Promise.all(promises);
    }
  }

  getListeners(eventType: ConceptEventType): ConceptListener[] {
    const listeners = this.listeners.get(eventType);
    return listeners ? Array.from(listeners) : [];
  }

  /**
   * Get all plugin hooks
   */
  getAllPluginHooks(): Record<string, (params: any[]) => any[] | void> {
    const hooks: Record<string, (params: any[]) => any[] | void> = {};

    for (const [name, plugin] of this.plugins) {
      if (plugin.getHooks) {
        const pluginHooks = plugin.getHooks();
        Object.entries(pluginHooks).forEach(([hookName, hookFn]) => {
          hooks[`${name}:${hookName}`] = hookFn;
        });
      }
    }

    return hooks;
  }

  /**
   * Create a plugin configuration file template
   */
  static createPluginTemplate(
    pluginName: string,
    outputDir: string = './plugins'
  ): void {
    const template = `import { ConceptPlugin, PluginConfig, ConceptEvent, ConceptEventType, ConceptListener } from 'concept-lang';

const config: PluginConfig = {
  name: '${pluginName}',
  version: '1.0.0',
  description: 'A concept language plugin',
  author: 'Your Name',
  license: 'MIT',
  main: 'index.js',
  conceptListeners: ['concept:added', 'data:added']
};

class ${pluginName}Plugin implements ConceptPlugin {
  readonly config = config;

  async initialize(): Promise<void> {
    console.log(\`Initializing \${this.config.name} plugin\`);
  }

  async cleanup(): Promise<void> {
    console.log(\`Cleaning up \${this.config.name} plugin\`);
  }

  registerListeners(): Map<ConceptEventType, ConceptListener> {
    const listeners = new Map<ConceptEventType, ConceptListener>();
    
    // Example: Listen to concept additions
    listeners.set('concept:added', (event: ConceptEvent) => {
      console.log('New concept added:', event.data);
    });
    
    // Example: Listen to data additions
    listeners.set('data:added', (event: ConceptEvent) => {
      console.log('New data added:', event.data);
    });
    
    return listeners;
  }


  getHooks() {
    return {
      // Example hook that processes 'hello' commands
      hello: (params: any[]) => {
        console.log('Hello hook triggered with params:', params);
        return params;
      }
    };
  }
}

export default ${pluginName}Plugin;
`;

    const pluginDir = path.resolve(outputDir, pluginName);
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }

    const filePath = path.join(pluginDir, 'index.ts');
    fs.writeFileSync(filePath, template);

    // Create package.json for the plugin
    const packageJson = {
      name: pluginName,
      version: '1.0.0',
      description: 'A concept language plugin',
      main: 'index.js',
      types: 'index.d.ts',
      dependencies: {
        'concept-lang': '^1.0.0',
      },
      scripts: {
        build: 'tsc',
        dev: 'tsc --watch',
      },
    };

    fs.writeFileSync(
      path.join(pluginDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    console.log(`✅ Created plugin template at: ${filePath}`);
  }
}
