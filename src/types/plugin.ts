import { Concept, Pair, Data, BlockState } from './index';

/**
 * Event types that can be listened to by plugins
 */
export type ConceptEventType =
  | 'concept:added'
  | 'concept:updated'
  | 'pair:added'
  | 'pair:updated'
  | 'data:added'
  | 'data:updated'
  | 'inference:completed'
  | 'block:state:changed';

/**
 * Event data structure for concept events
 */
export interface ConceptEvent {
  type: ConceptEventType;
  timestamp: Date;
  data: ConceptEventData;
}

/**
 * Event data payload for different event types
 */
export type ConceptEventData =
  | { concept: Concept }
  | { pair: Pair }
  | { data: Data }
  | { state: BlockState }
  | { concepts: Concept[]; pairs: Pair[]; chain: Data[] };

/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  main: string;
  conceptListeners?: string[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

/**
 * Concept listener function type
 */
export type ConceptListener = (event: ConceptEvent) => void | Promise<void>;

/**
 * Plugin interface that external packages must implement
 */
export interface ConceptPlugin {
  /**
   * Plugin metadata
   */
  readonly config: PluginConfig;

  /**
   * Initialize the plugin
   */
  initialize?(): void | Promise<void>;

  /**
   * Set the block instance for concept execution
   */
  setBlock?(block: any): void;

  /**
   * Cleanup when plugin is unloaded
   */
  cleanup?(): void | Promise<void>;

  /**
   * Register concept listeners
   */
  registerListeners(): Map<ConceptEventType, ConceptListener>;

  /**
   * Get plugin-specific hooks for the compiler
   */
  getHooks?(
    block?: any
  ): Record<string, (params: Concept[], block?: Concept[]) => Concept[] | void>;
}

/**
 * Plugin manager interface
 */
export interface PluginManager {
  /**
   * Load a plugin from a path or package name
   */
  loadPlugin(pathOrName: string): Promise<ConceptPlugin>;

  /**
   * Unload a plugin
   */
  unloadPlugin(name: string): Promise<void>;

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): ConceptPlugin[];

  /**
   * Register a concept listener
   */
  registerListener(
    eventType: ConceptEventType,
    listener: ConceptListener
  ): void;

  /**
   * Unregister a concept listener
   */
  unregisterListener(
    eventType: ConceptEventType,
    listener: ConceptListener
  ): void;

  /**
   * Emit an event to all registered listeners
   */
  emitEvent(event: ConceptEvent): Promise<void>;

  /**
   * Get all listeners for a specific event type
   */
  getListeners(eventType: ConceptEventType): ConceptListener[];
}

/**
 * Runner configuration interface
 */
export interface RunnerConfig {
  plugins: string[];
  watchMode?: boolean;
  autoReload?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  outputDir?: string;
}

/**
 * Runner interface for executing concept files with plugins
 */
export interface ConceptRunner {
  /**
   * Load configuration and plugins
   */
  initialize(config: RunnerConfig): Promise<void>;

  /**
   * Run a concept file with all loaded plugins
   */
  runFile(filePath: string): Promise<string>;

  /**
   * Watch a directory for changes and run files
   */
  watchDirectory(dirPath: string): Promise<void>;

  /**
   * Stop the runner and cleanup
   */
  stop(): Promise<void>;

  /**
   * Get the plugin manager instance
   */
  getPluginManager(): PluginManager;
}
