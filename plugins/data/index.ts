import {
  ConceptPlugin,
  PluginConfig,
  ConceptEvent,
  ConceptEventType,
  ConceptListener,
} from 'concept-lang';
import * as fs from 'fs';
import * as path from 'path';

const config: PluginConfig = {
  name: 'data',
  version: '1.0.0',
  description: 'Data recording and management plugin for concept events',
  author: 'Concept Lang Team',
  license: 'MIT',
  main: 'index.js',
  conceptListeners: ['concept:added', 'data:added', 'inference:completed'],
};

class DataPlugin implements ConceptPlugin {
  readonly config = config;
  private conceptData: {
    concepts: any[];
    pairs: any[];
    chain: any[];
    state: any;
  } = {
    concepts: [],
    pairs: [],
    chain: [],
    state: {},
  };
  private block: any = null; // Will be set by setBlock method
  private snapshotsDir: string = './concept-snapshots';

  setBlock(block: any): void {
    this.block = block;
  }

  async initialize(): Promise<void> {
    console.log(`📊 Initializing ${this.config.name} plugin`);
    this.ensureSnapshotsDirectory();
    console.log(`📝 Data plugin ready to record concept events`);
  }

  async cleanup(): Promise<void> {
    console.log(`🧹 Data plugin cleaned up`);
  }

  registerListeners(): Map<ConceptEventType, ConceptListener> {
    const listeners = new Map<ConceptEventType, ConceptListener>();

    // Listen to concept additions
    listeners.set('concept:added', (event: ConceptEvent) => {
      this.conceptData.concepts.push(event.data);
      console.log(
        `📝 Data Plugin: Concept added: ${JSON.stringify(event.data)}`
      );
    });

    // Listen to data additions
    listeners.set('data:added', (event: ConceptEvent) => {
      this.conceptData.chain.push(event.data);
      console.log(
        `📊 Data Plugin: Relationship added: ${JSON.stringify(event.data)}`
      );
    });

    // Listen to inference completion
    listeners.set('inference:completed', (event: ConceptEvent) => {
      this.conceptData = {
        concepts: event.data.concepts || [],
        pairs: event.data.pairs || [],
        chain: event.data.chain || [],
        state: this.conceptData.state,
      };
      console.log(`🧠 Data Plugin: Inference completed, data updated`);
    });

    return listeners;
  }

  getHooks() {
    return {
      // Hook that processes 'data' commands
      data: (params: any[], block?: any[]) => {
        const action = params[0];
        switch (action) {
          case 'stats':
            this.showStats();
            break;
          case 'list':
            this.listData(params[1]);
            break;
          case 'clear':
            this.clearData();
            break;
          case 'snapshot':
            this.handleSnapshot(params[1], params[2]);
            break;
          default:
            console.log('Available data actions: stats, list, clear, snapshot');
        }
        return params;
      },
    };
  }

  private showStats(): void {
    console.log(`📊 Data Statistics:`);
    console.log(`  Concepts: ${this.conceptData.concepts.length}`);
    console.log(`  Relationships: ${this.conceptData.chain.length}`);
    console.log(`  Pairs: ${this.conceptData.pairs.length}`);
  }

  private listData(type: string): void {
    switch (type) {
      case 'concepts':
        console.log('📝 Concepts:', this.conceptData.concepts);
        break;
      case 'relationships':
        console.log('📊 Relationships:', this.conceptData.chain);
        break;
      case 'pairs':
        console.log('🔗 Pairs:', this.conceptData.pairs);
        break;
      default:
        console.log('Available types: concepts, relationships, pairs');
    }
  }

  private clearData(): void {
    this.conceptData = {
      concepts: [],
      pairs: [],
      chain: [],
      state: {},
    };
    console.log('🧹 Data cleared');
  }

  private ensureSnapshotsDirectory(): void {
    if (!fs.existsSync(this.snapshotsDir)) {
      fs.mkdirSync(this.snapshotsDir, { recursive: true });
    }
  }

  private handleSnapshot(action: string, name?: string): void {
    switch (action) {
      case 'save':
        this.saveSnapshot(name);
        break;
      case 'load':
        this.loadSnapshot(name);
        break;
      case 'list':
        this.listSnapshots();
        break;
      case 'delete':
        this.deleteSnapshot(name);
        break;
      default:
        console.log('Available snapshot actions: save, load, list, delete');
        console.log(
          'Usage: data snapshot save <name> | data snapshot load <name> | data snapshot list | data snapshot delete <name>'
        );
    }
  }

  private saveSnapshot(name?: string): void {
    const snapshotName =
      name || `snapshot-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const snapshotPath = path.join(this.snapshotsDir, `${snapshotName}.json`);

    const snapshot = {
      timestamp: new Date().toISOString(),
      data: this.conceptData,
      version: this.config.version,
    };

    try {
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
      console.log(`📸 Snapshot saved: ${snapshotName}`);
      console.log(`📁 Location: ${snapshotPath}`);
    } catch (error) {
      console.error(`❌ Failed to save snapshot: ${error}`);
    }
  }

  private loadSnapshot(name?: string): void {
    if (!name) {
      console.log('❌ Snapshot name required for loading');
      return;
    }

    const snapshotPath = path.join(this.snapshotsDir, `${name}.json`);

    try {
      if (!fs.existsSync(snapshotPath)) {
        console.log(`❌ Snapshot not found: ${name}`);
        return;
      }

      const snapshotData = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
      this.conceptData = snapshotData.data;

      console.log(`📸 Snapshot loaded: ${name}`);
      console.log(`📅 Created: ${snapshotData.timestamp}`);
      console.log(
        `📊 Data: ${this.conceptData.concepts.length} concepts, ${this.conceptData.chain.length} relationships`
      );
    } catch (error) {
      console.error(`❌ Failed to load snapshot: ${error}`);
    }
  }

  private listSnapshots(): void {
    try {
      const files = fs.readdirSync(this.snapshotsDir);
      const snapshots = files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const name = file.replace('.json', '');
          const filePath = path.join(this.snapshotsDir, file);
          const stats = fs.statSync(filePath);
          return {
            name,
            created: stats.birthtime.toISOString(),
            size: stats.size,
          };
        })
        .sort(
          (a, b) =>
            new Date(b.created).getTime() - new Date(a.created).getTime()
        );

      if (snapshots.length === 0) {
        console.log('📸 No snapshots found');
        return;
      }

      console.log('📸 Available snapshots:');
      snapshots.forEach(snapshot => {
        console.log(
          `  📁 ${snapshot.name} (${snapshot.size} bytes) - ${snapshot.created}`
        );
      });
    } catch (error) {
      console.error(`❌ Failed to list snapshots: ${error}`);
    }
  }

  private deleteSnapshot(name?: string): void {
    if (!name) {
      console.log('❌ Snapshot name required for deletion');
      return;
    }

    const snapshotPath = path.join(this.snapshotsDir, `${name}.json`);

    try {
      if (!fs.existsSync(snapshotPath)) {
        console.log(`❌ Snapshot not found: ${name}`);
        return;
      }

      fs.unlinkSync(snapshotPath);
      console.log(`🗑️ Snapshot deleted: ${name}`);
    } catch (error) {
      console.error(`❌ Failed to delete snapshot: ${error}`);
    }
  }

  // Getter for other plugins to access data
  getConceptData() {
    return this.conceptData;
  }
}

export default DataPlugin;
