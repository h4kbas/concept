import {
  ConceptPlugin,
  PluginConfig,
  ConceptEvent,
  ConceptEventType,
  ConceptListener,
} from '../../dist/types/plugin';
import { Concept } from '../../dist/types';
import * as express from 'express';
import * as cors from 'cors';

const config: PluginConfig = {
  name: 'http-endpoints-plugin',
  version: '1.0.0',
  description:
    'A plugin that provides HTTP endpoints for concept data interaction',
  author: 'Concept Lang Team',
  license: 'MIT',
  main: 'index.js',
  conceptListeners: [],
};

interface HttpServerConfig {
  port: number;
  host: string;
  enableCors: boolean;
}

class HttpEndpointsPlugin implements ConceptPlugin {
  readonly config = config;
  private app: express.Application;
  private server: any;
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
  private httpConfig: HttpServerConfig = {
    port: 3000,
    host: 'localhost',
    enableCors: true,
  };
  private customEndpoints: Map<string, string> = new Map();
  private block: any = null; // Will be set by setBlock method

  constructor() {
    this.app = express.default();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setBlock(block: any): void {
    this.block = block;
  }

  async initialize(): Promise<void> {
    console.log(`🌐 Initializing ${this.config.name} plugin`);
    console.log(
      `📡 HTTP server will be available at http://${this.httpConfig.host}:${this.httpConfig.port}`
    );
  }

  async cleanup(): Promise<void> {
    // Don't stop the server during cleanup - let it keep running
    if (this.server) {
      console.log(
        `🔄 HTTP server will continue running at http://${this.httpConfig.host}:${this.httpConfig.port}`
      );
      console.log(`🔄 Press Ctrl+C to stop the server manually`);
    }
  }

  registerListeners(): Map<ConceptEventType, ConceptListener> {
    // HTTP plugin only provides API, no listeners
    return new Map<ConceptEventType, ConceptListener>();
  }

  getHooks() {
    return {
      // Hook that processes 'http' commands
      http: (params: any[], block?: any[]) => {
        // Handle both "http action" and "http:action" syntax
        let action = params[1]?.name || params[0]?.name;
        let remainingParams = params.slice(2);

        // If first param contains colon, split it
        if (action && typeof action === 'string' && action.includes(':')) {
          const [pluginName, actionName] = action.split(':');
          action = actionName;
        }

        switch (action) {
          case 'start':
            this.startServer();
            break;
          case 'stop':
            this.stopServer();
            break;
          case 'status':
            this.showStatus();
            break;
          case 'endpoint':
            this.registerCustomEndpoint(
              remainingParams[0]?.name || remainingParams[0],
              remainingParams[1]?.name || remainingParams[1],
              block
            );
            break;
          case 'config':
            this.updateConfig(remainingParams[0], remainingParams[1]);
            break;
          default:
            console.log(
              'Available HTTP actions: start, stop, status, endpoint, config'
            );
        }
        return params;
      },
    };
  }

  private setupMiddleware(): void {
    this.app.use(express.default.json());
    this.app.use(express.default.urlencoded({ extended: true }));

    if (this.httpConfig.enableCors) {
      this.app.use(cors.default());
    }
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        plugin: this.config.name,
        version: this.config.version,
        timestamp: new Date().toISOString(),
      });
    });

    // Get all concepts
    this.app.get('/api/concepts', (req, res) => {
      res.json({
        concepts: this.conceptData.concepts,
        count: this.conceptData.concepts.length,
      });
    });

    // Get all relationships
    this.app.get('/api/relationships', (req, res) => {
      res.json({
        relationships: this.conceptData.chain,
        count: this.conceptData.chain.length,
      });
    });

    // Get concept state
    this.app.get('/api/state', (req, res) => {
      res.json({
        state: this.conceptData.state,
        concepts: this.conceptData.concepts.length,
        relationships: this.conceptData.chain.length,
      });
    });

    // Add a new concept via POST
    this.app.post('/api/concepts', (req, res) => {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Concept name is required' });
      }

      const concept = { name };
      this.conceptData.concepts.push(concept);

      res.status(201).json({
        message: 'Concept added successfully',
        concept,
      });
    });

    // Add a new relationship via POST
    this.app.post('/api/relationships', (req, res) => {
      const { conceptA, conceptB, value } = req.body;
      if (!conceptA || !conceptB || value === undefined) {
        return res.status(400).json({
          error: 'conceptA, conceptB, and value are required',
        });
      }

      const relationship = {
        pair: { conceptA: { name: conceptA }, conceptB: { name: conceptB } },
        value: Boolean(value),
      };
      this.conceptData.chain.push(relationship);

      res.status(201).json({
        message: 'Relationship added successfully',
        relationship,
      });
    });

    // Query relationships
    this.app.get('/api/query', (req, res) => {
      const { conceptA, conceptB } = req.query;

      if (!conceptA || !conceptB) {
        return res.status(400).json({
          error: 'Both conceptA and conceptB query parameters are required',
        });
      }

      const relationship = this.conceptData.chain.find(
        rel =>
          rel.pair.conceptA.name === conceptA &&
          rel.pair.conceptB.name === conceptB
      );

      if (relationship) {
        res.json({
          found: true,
          relationship: {
            conceptA: relationship.pair.conceptA.name,
            conceptB: relationship.pair.conceptB.name,
            value: relationship.value,
          },
        });
      } else {
        res.json({
          found: false,
          message: `No relationship found between ${conceptA} and ${conceptB}`,
        });
      }
    });

    // Get statistics
    this.app.get('/api/stats', (req, res) => {
      const stats = {
        concepts: this.conceptData.concepts.length,
        relationships: this.conceptData.chain.length,
        pairs: this.conceptData.pairs.length,
        positiveRelationships: this.conceptData.chain.filter(rel => rel.value)
          .length,
        negativeRelationships: this.conceptData.chain.filter(rel => !rel.value)
          .length,
      };

      res.json(stats);
    });

    // WebSocket-like endpoint for real-time updates (using Server-Sent Events)
    this.app.get('/api/stream', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      const sendUpdate = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Send initial data
      sendUpdate({
        type: 'initial',
        data: this.conceptData,
      });

      // Keep connection alive
      const keepAlive = setInterval(() => {
        res.write('data: {"type":"ping"}\n\n');
      }, 30000);

      req.on('close', () => {
        clearInterval(keepAlive);
      });
    });

    // Error handling
    this.app.use((err: any, req: any, res: any, next: any) => {
      console.error('HTTP Plugin Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  private startServer(): void {
    if (this.server) {
      console.log('⚠️  HTTP server is already running');
      return;
    }

    this.server = this.app.listen(
      this.httpConfig.port,
      this.httpConfig.host,
      () => {
        console.log(
          `🌐 HTTP server started at http://${this.httpConfig.host}:${this.httpConfig.port}`
        );
        console.log(`📋 Available endpoints:`);
        console.log(`   GET  /health - Health check`);
        console.log(`   GET  /api/concepts - Get all concepts`);
        console.log(`   POST /api/concepts - Add new concept`);
        console.log(`   GET  /api/relationships - Get all relationships`);
        console.log(`   POST /api/relationships - Add new relationship`);
        console.log(
          `   GET  /api/query?conceptA=X&conceptB=Y - Query relationship`
        );
        console.log(`   GET  /api/state - Get current state`);
        console.log(`   GET  /api/stats - Get statistics`);
        console.log(`   GET  /api/stream - Real-time updates (SSE)`);
        console.log(
          `🔄 Server is running and will stay alive. Press Ctrl+C to stop.`
        );
        console.log(`🌐 You can now make HTTP requests to the server!`);

        // Keep the process alive
        process.on('SIGINT', () => {
          console.log('\n🛑 Shutting down HTTP server...');
          this.stopServer();
          process.exit(0);
        });

        // Keep the process alive indefinitely
        setInterval(() => {
          // Keep alive - do nothing
        }, 1000);
      }
    );
  }

  private stopServer(): void {
    if (!this.server) {
      console.log('⚠️  HTTP server is not running');
      return;
    }

    this.server.close(() => {
      console.log('🛑 HTTP server stopped');
      this.server = null;
    });
  }

  private showStatus(): void {
    if (this.server) {
      console.log(
        `🌐 HTTP server is running at http://${this.httpConfig.host}:${this.httpConfig.port}`
      );
      console.log(
        `📊 Current data: ${this.conceptData.concepts.length} concepts, ${this.conceptData.chain.length} relationships`
      );
      console.log(`🔗 Custom endpoints: ${this.customEndpoints.size}`);
      for (const [endpoint, method] of this.customEndpoints) {
        console.log(`   ${method} ${endpoint}`);
      }
    } else {
      console.log('⚠️  HTTP server is not running');
    }
  }

  private configureServer(port?: string, host?: string): void {
    if (port) {
      this.httpConfig.port = parseInt(port, 10) || 3000;
    }
    if (host) {
      this.httpConfig.host = host;
    }
    console.log(
      `⚙️  HTTP server configured: ${this.httpConfig.host}:${this.httpConfig.port}`
    );
  }

  private registerCustomEndpoint(
    method: string,
    path: string,
    block?: any[]
  ): void {
    if (!method || !path) {
      console.log('❌ Endpoint registration requires method and path');
      return;
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const endpointKey = `${method.toUpperCase()} ${normalizedPath}`;

    this.customEndpoints.set(normalizedPath, method.toUpperCase());

    // Store endpoint logic if block is provided
    if (block && block.length > 0) {
      const endpointLogic = this.parseBlockContent(block);
      this.customEndpoints.set(`${endpointKey}_logic`, endpointLogic);
    }

    // Register the endpoint with Express
    const expressMethod = method.toLowerCase() as keyof express.Application;
    if (
      this.app[expressMethod] &&
      typeof this.app[expressMethod] === 'function'
    ) {
      (this.app[expressMethod] as Function)(
        normalizedPath,
        (req: express.Request, res: express.Response) => {
          this.handleEndpointRequest(endpointKey, req, res);
        }
      );
      console.log(`🔗 Registered custom endpoint: ${endpointKey}`);
    } else {
      console.log(`❌ Invalid HTTP method: ${method}`);
    }
  }

  private handleEndpointRequest(
    endpointKey: string,
    req: express.Request,
    res: express.Response
  ): void {
    try {
      // Look for concept-defined logic for this endpoint
      const endpointPath = endpointKey.split(' ')[1]; // Extract path from "METHOD /path"
      const endpointLogic = this.findEndpointLogic(endpointPath);

      if (endpointLogic) {
        // Execute the concept-defined logic
        this.executeEndpointLogic(endpointLogic, req, res);
      } else {
        // Fallback to simple concept data response
        res.json({
          endpoint: endpointKey,
          method: req.method,
          path: req.path,
          query: req.query,
          conceptData: {
            concepts: this.conceptData.concepts,
            relationships: this.conceptData.chain,
            pairs: this.conceptData.pairs,
            stats: {
              concepts: this.conceptData.concepts.length,
              relationships: this.conceptData.chain.length,
              pairs: this.conceptData.pairs.length,
            },
          },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`❌ Error handling endpoint ${endpointKey}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private findEndpointLogic(endpointPath: string): Concept[] | null {
    // Look for labeled blocks that match the endpoint path
    if (this.block && this.block.getLabeledBlock) {
      return this.block.getLabeledBlock(endpointPath);
    }
    return null;
  }

  private executeEndpointLogic(
    logic: Concept[],
    req: express.Request,
    res: express.Response
  ): void {
    try {
      // Execute the concept-defined logic using the block's execution API
      const result = this.executeConceptBlock(logic);

      // Process the result and return appropriate response
      const response = this.processConceptResult(result, req);
      res.json(response);
    } catch (error) {
      console.error('Error executing concept logic:', error);
      res.status(500).json({
        error: 'Failed to execute concept logic',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private executeConceptBlock(concepts: Concept[]): any {
    // Use the block's executeConceptBlock method if available
    if (this.block && this.block.executeConceptBlock) {
      return this.block.executeConceptBlock(concepts);
    }

    // Fallback to local execution
    const actions: string[] = [];
    const data: any = {};

    // Group concepts into lines
    const lines = this.groupConceptsIntoLines(concepts);

    for (const line of lines) {
      const action = line.map(c => c.name).join(' ');
      actions.push(action);

      // Simulate concept processing
      if (line[0]) {
        data[line[0].name] = {
          name: line[0].name,
          action: action,
          processed: true,
        };
      }
    }

    return { actions, data };
  }

  private groupConceptsIntoLines(concepts: Concept[]): Concept[][] {
    const lines: Concept[][] = [];
    let currentLine: Concept[] = [];

    for (const concept of concepts) {
      if (concept.name === 'say') {
        // 'say' ends a line
        if (currentLine.length > 0) {
          currentLine.push(concept);
          lines.push([...currentLine]);
          currentLine = [];
        }
      } else {
        currentLine.push(concept);
      }
    }

    // Add any remaining concepts as a line
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  }

  private processConceptResult(result: any, req: express.Request): any {
    // Process the concept execution result into a meaningful HTTP response
    const { actions, data } = result;

    return {
      endpoint: req.path,
      method: req.method,
      query: req.query,
      conceptActions: actions,
      conceptData: data,
      timestamp: new Date().toISOString(),
      message: `Executed ${actions.length} concept actions`,
    };
  }

  private updateConfig(key: string, value: string): void {
    switch (key) {
      case 'port':
        this.httpConfig.port = parseInt(value) || 3000;
        console.log(`🔧 HTTP port set to ${this.httpConfig.port}`);
        break;
      case 'host':
        this.httpConfig.host = value || 'localhost';
        console.log(`🔧 HTTP host set to ${this.httpConfig.host}`);
        break;
      case 'cors':
        this.httpConfig.enableCors = value === 'true' || value === 'true';
        console.log(
          `🔧 CORS ${this.httpConfig.enableCors ? 'enabled' : 'disabled'}`
        );
        break;
      default:
        console.log(`❌ Unknown config key: ${key}`);
    }
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

export default HttpEndpointsPlugin;
