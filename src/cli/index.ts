#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import { Compiler } from '../core/compiler';
import { ConceptRunnerImpl } from '../core/concept-runner';
import { Concept, Data } from '../types';
import { RunnerConfig } from '../types/plugin';

const program = new Command();

program
  .name('concept')
  .description('Concept language compiler and runtime')
  .version('1.0.0');

program
  .command('compile')
  .description('Compile a Concept language file')
  .argument('<input>', 'Input .concept file')
  .option(
    '-o, --output <file>',
    'Output file (default: input with .out extension)'
  )
  .option('--no-infer', 'Disable automatic inference')
  .action((input: string, options: { output?: string; infer: boolean }) => {
    try {
      const inputPath = resolve(input);

      if (!existsSync(inputPath)) {
        console.error(`Error: Input file '${inputPath}' does not exist`);
        process.exit(1);
      }

      if (extname(inputPath) !== '.concept') {
        console.error(`Error: Input file must have .concept extension`);
        process.exit(1);
      }

      const source = readFileSync(inputPath, 'utf-8');
      const compiler = new Compiler();

      if (!options.infer) {
        // Disable inference by overriding the method
        compiler.block['inferMissingPairs'] = () => {};
      }

      const result = compiler.compile(source);

      const outputPath =
        options.output || inputPath.replace('.concept', '.out.concept');
      writeFileSync(outputPath, result, 'utf-8');

      console.log(`Compiled successfully: ${inputPath} -> ${outputPath}`);
    } catch (error) {
      console.error(
        `Compilation error: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

program
  .command('run')
  .description('Run a Concept language file with optional plugins')
  .argument('<input>', 'Input .concept file')
  .option('--no-infer', 'Disable automatic inference')
  .option('-p, --plugins <plugins...>', 'Plugin paths or names to load')
  .option('-c, --config <file>', 'Configuration file path')
  .option('-w, --watch', 'Watch for file changes')
  .option('--output-dir <dir>', 'Output directory for generated files')
  .option('--log-level <level>', 'Log level (debug, info, warn, error)', 'info')
  .action(async (input: string, options: any) => {
    try {
      const inputPath = resolve(input);

      if (!existsSync(inputPath)) {
        console.error(`Error: Input file '${inputPath}' does not exist`);
        process.exit(1);
      }

      // If no plugins specified, use simple compiler
      if (!options.plugins && !options.config && !options.watch) {
        const source = readFileSync(inputPath, 'utf-8');
        const compiler = new Compiler();

        if (!options.infer) {
          compiler.block['inferMissingPairs'] = () => {};
        }

        compiler.compile(source);
        console.log('Execution completed successfully');
        return;
      }

      // Use plugin runner for advanced features
      const runner = new ConceptRunnerImpl();

      // Load configuration
      let config: RunnerConfig;
      if (options.config) {
        const configPath = resolve(options.config);
        if (!existsSync(configPath)) {
          console.error(`Error: Config file '${configPath}' does not exist`);
          process.exit(1);
        }
        const configData = JSON.parse(readFileSync(configPath, 'utf-8'));
        config = {
          plugins: configData.plugins || [],
          watchMode: options.watch || false,
          autoReload: true,
          logLevel: options.logLevel || 'info',
          outputDir: options.outputDir || './output',
        };
      } else {
        config = {
          plugins: options.plugins || [],
          watchMode: options.watch || false,
          autoReload: true,
          logLevel: options.logLevel || 'info',
          outputDir: options.outputDir || './output',
        };
      }

      // Initialize runner
      await runner.initialize(config);

      if (options.watch) {
        // Watch directory mode
        const dirPath = resolve(inputPath, '..');
        await runner.watchDirectory(dirPath);

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
          console.log('\n🛑 Shutting down...');
          await runner.stop();
          process.exit(0);
        });
      } else {
        // Single file mode
        await runner.runFile(inputPath);
        await runner.stop();
      }
    } catch (error) {
      console.error(
        `Execution error: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze a Concept language file and show statistics')
  .argument('<input>', 'Input .concept file')
  .action((input: string) => {
    try {
      const inputPath = resolve(input);

      if (!existsSync(inputPath)) {
        console.error(`Error: Input file '${inputPath}' does not exist`);
        process.exit(1);
      }

      const source = readFileSync(inputPath, 'utf-8');
      const compiler = new Compiler();
      const block = compiler.compileToState(source);
      const stats = block.blockExplorer.getStats();

      console.log('\n=== Concept File Analysis ===');
      console.log(`Concepts: ${stats.conceptCount}`);
      console.log(`Pairs: ${stats.pairCount}`);
      console.log(`Relations: ${stats.dataCount}`);
      console.log(
        `Avg relations per concept: ${stats.averageRelationsPerConcept.toFixed(2)}`
      );

      console.log('\n=== Concepts ===');
      block.concepts.forEach((concept: Concept) => {
        console.log(`- ${concept.name}`);
      });

      console.log('\n=== Relationships ===');
      block.chain.forEach((data: Data) => {
        const relation = data.value ? 'is' : 'isnt';
        console.log(
          `${data.pair.conceptA.name} ${relation} ${data.pair.conceptB.name}`
        );
      });
    } catch (error) {
      console.error(
        `Analysis error: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

program
  .command('create-plugin')
  .description('Create a new plugin template')
  .argument('<name>', 'Plugin name')
  .option('-d, --dir <directory>', 'Output directory', './plugins')
  .action((name: string, options: { dir: string }) => {
    try {
      const { ConceptPluginManager } = require('../core/plugin-manager');
      ConceptPluginManager.createPluginTemplate(name, options.dir);
      console.log(`✅ Plugin template created: ${name}`);
      console.log(`📁 Location: ${resolve(options.dir, name)}`);
      console.log('\nNext steps:');
      console.log('1. cd into the plugin directory');
      console.log('2. npm install');
      console.log('3. npm run build');
      console.log(
        '4. Use the plugin with: concept run --plugins ./path/to/plugin your-file.concept'
      );
    } catch (error) {
      console.error(
        `Plugin creation error: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

program
  .command('list-plugins')
  .description('List available plugins')
  .option('-d, --dir <directory>', 'Plugin directory to scan', './plugins')
  .action((options: { dir: string }) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const pluginDir = resolve(options.dir);

      if (!existsSync(pluginDir)) {
        console.log('No plugins directory found');
        return;
      }

      const plugins = fs
        .readdirSync(pluginDir, { withFileTypes: true })
        .filter((dirent: any) => dirent.isDirectory())
        .map((dirent: any) => dirent.name);

      if (plugins.length === 0) {
        console.log('No plugins found');
        return;
      }

      console.log('Available plugins:');
      plugins.forEach((plugin: string) => {
        const pluginPath = path.join(pluginDir, plugin);
        const packageJsonPath = path.join(pluginPath, 'package.json');

        if (existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(
            readFileSync(packageJsonPath, 'utf-8')
          );
          console.log(`  📦 ${plugin} v${packageJson.version || 'unknown'}`);
          if (packageJson.description) {
            console.log(`     ${packageJson.description}`);
          }
        } else {
          console.log(`  📦 ${plugin} (no package.json)`);
        }
      });
    } catch (error) {
      console.error(
        `Plugin listing error: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

program
  .command('repl')
  .description('Start an interactive REPL for testing concepts')
  .option('-p, --plugins <plugins...>', 'Plugin paths or names to load')
  .option('--no-infer', 'Disable automatic inference')
  .action(async (options: { plugins?: string[]; infer: boolean }) => {
    try {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'concept> ',
      });

      // Create a persistent compiler instance
      const compiler = new Compiler();

      // Load plugins if specified
      let runner: ConceptRunnerImpl | null = null;
      if (options.plugins && options.plugins.length > 0) {
        runner = new ConceptRunnerImpl();
        const config: RunnerConfig = {
          plugins: options.plugins,
          watchMode: false,
          autoReload: false,
          logLevel: 'info',
          outputDir: './repl-output',
        };
        await runner.initialize(config);
      }

      if (!options.infer) {
        compiler.block['inferMissingPairs'] = () => {};
      }

      console.log('🚀 Concept Language REPL');
      console.log('Type concept statements and press Enter to execute them.');
      console.log('Commands:');
      console.log('  .help     - Show this help');
      console.log('  .clear    - Clear the current state');
      console.log('  .state    - Show current state');
      console.log('  .plugins  - Show loaded plugins');
      console.log('  .quit     - Exit the REPL');
      console.log('');

      rl.prompt();

      rl.on('line', async (input: string) => {
        const trimmed = input.trim();

        if (trimmed === '.quit' || trimmed === '.exit') {
          console.log('👋 Goodbye!');
          if (runner) {
            await runner.stop();
          }
          rl.close();
          return;
        }

        if (trimmed === '.help') {
          console.log('Commands:');
          console.log('  .help     - Show this help');
          console.log('  .clear    - Clear the current state');
          console.log('  .state    - Show current state');
          console.log('  .plugins  - Show loaded plugins');
          console.log('  .quit     - Exit the REPL');
          console.log('');
          rl.prompt();
          return;
        }

        if (trimmed === '.clear') {
          // Reset the compiler state
          const newCompiler = new Compiler();
          if (!options.infer) {
            newCompiler.block['inferMissingPairs'] = () => {};
          }
          // Replace the current compiler
          Object.assign(compiler, newCompiler);
          console.log('✅ State cleared');
          rl.prompt();
          return;
        }

        if (trimmed === '.state') {
          const concepts = compiler.block.concepts;
          const chain = compiler.block.chain;

          console.log('\n=== Current State ===');
          console.log(`Concepts: ${concepts.length}`);
          console.log(`Relationships: ${chain.length}`);

          if (concepts.length > 0) {
            console.log('\nConcepts:');
            concepts.forEach((concept: Concept) => {
              console.log(`  - ${concept.name}`);
            });
          }

          if (chain.length > 0) {
            console.log('\nRelationships:');
            chain.forEach((data: Data) => {
              const relation = data.value ? 'is' : 'isnt';
              console.log(
                `  ${data.pair.conceptA.name} ${relation} ${data.pair.conceptB.name}`
              );
            });
          }
          console.log('');
          rl.prompt();
          return;
        }

        if (trimmed === '.plugins') {
          if (runner) {
            const plugins = runner.getLoadedPlugins();
            console.log('\n=== Loaded Plugins ===');
            if (plugins.length === 0) {
              console.log('No plugins loaded');
            } else {
              plugins.forEach((plugin: string) => {
                console.log(`  - ${plugin}`);
              });
            }
          } else {
            console.log('No plugins loaded');
          }
          console.log('');
          rl.prompt();
          return;
        }

        if (trimmed === '') {
          rl.prompt();
          return;
        }

        try {
          // Execute the concept statement
          if (runner) {
            // Use runner for plugin support
            const tempFile = './temp-repl.concept';
            writeFileSync(tempFile, trimmed, 'utf-8');
            await runner.runFile(tempFile);
            // Clean up temp file
            if (existsSync(tempFile)) {
              require('fs').unlinkSync(tempFile);
            }
          } else {
            // Use simple compiler
            compiler.compile(trimmed);
          }
        } catch (error) {
          console.error(
            `❌ Error: ${error instanceof Error ? error.message : String(error)}`
          );
        }

        rl.prompt();
      });

      rl.on('close', async () => {
        if (runner) {
          await runner.stop();
        }
        process.exit(0);
      });
    } catch (error) {
      console.error(
        `REPL error: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

// Default command (backward compatibility)
program
  .argument('[input]', 'Input file (default: input.concept)')
  .argument('[output]', 'Output file (default: output.concept)')
  .action((input = 'input.concept', output = 'output.concept') => {
    try {
      const inputPath = resolve(input);
      const outputPath = resolve(output);

      if (!existsSync(inputPath)) {
        console.error(`Error: Input file '${inputPath}' does not exist`);
        process.exit(1);
      }

      const source = readFileSync(inputPath, 'utf-8');
      const compiler = new Compiler();
      const result = compiler.compile(source);

      writeFileSync(outputPath, result, 'utf-8');
      console.log(`Compiled: ${inputPath} -> ${outputPath}`);
    } catch (error) {
      console.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

program.parse();
