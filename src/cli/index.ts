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
  .version('2.0.0');

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
  .option('--disable-std', 'Disable standard library plugin')
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

      // Always use plugin runner to get std plugin functionality
      // Use plugin runner for all features
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

        // Determine which plugins to load
        let plugins: string[] = configData.plugins || [];

        // Load std plugin by default unless --disable-std is specified
        if (
          !options.disableStd &&
          !plugins.includes('./dist/plugins/std/index.js')
        ) {
          plugins.unshift('./dist/plugins/std/index.js'); // Add std plugin first
        }

        config = {
          plugins: plugins,
          watchMode: options.watch || false,
          autoReload: true,
          logLevel: options.logLevel || 'info',
          outputDir: options.outputDir || './output',
        };
      } else {
        // Determine which plugins to load
        let plugins: string[] = [];

        // Load std plugin by default unless --disable-std is specified
        if (!options.disableStd) {
          plugins.push('./dist/plugins/std/index.js');
        }

        // Add any additional plugins specified
        if (options.plugins) {
          plugins.push(...options.plugins);
        }

        config = {
          plugins: plugins,
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

// Blocks are native to the language - any command can have a block
// We use Shift+Enter to enable block mode for any command

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

      // Enable raw mode for keypress detection
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
      }
      process.stdin.resume();

      // Load plugins if specified
      const runner = new ConceptRunnerImpl();
      const allPlugins = [...(options.plugins || [])];

      // Load std plugin by default for REPL
      if (!allPlugins.includes('./dist/plugins/std/index.js')) {
        allPlugins.unshift('./dist/plugins/std/index.js');
      }

      const config: RunnerConfig = {
        plugins: allPlugins,
        watchMode: false,
        autoReload: false,
        logLevel: 'info',
        outputDir: './repl-output',
      };
      await runner.initialize(config);

      // Use the runner's compiler which has all the hooks
      const compiler = runner.getCompiler();

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
      console.log(
        '💡 Blocks are native to the language - any command can have a block'
      );
      console.log('   - Type any command and press Enter to execute normally');
      console.log(
        '   - Add indented content on the next line to create a block'
      );
      console.log(
        '   - Press Enter on empty line to finish and execute the block'
      );
      console.log(
        '   Examples: "user is", "db create users", "file write data.txt", "inspect apple"'
      );
      console.log('');

      // Multi-line input handling for native blocks
      let currentInput = '';
      let inBlock = false;
      let lastCommand = '';

      rl.prompt();

      rl.on('line', async (input: string) => {
        const trimmed = input.trim();

        // Handle special commands
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
          console.log(
            '💡 Blocks are native to the language - any command can have a block'
          );
          console.log(
            '   - Type any command and press Enter to execute normally'
          );
          console.log(
            '   - Add indented content on the next line to create a block'
          );
          console.log(
            '   - Press Enter on empty line to finish and execute the block'
          );
          console.log(
            '   Examples: "user is", "db create users", "file write data.txt", "inspect apple"'
          );
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
          // Reset block state
          currentInput = '';
          inBlock = false;
          lastCommand = '';
          rl.setPrompt('concept> ');
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
              // Color code concepts - blue for regular concepts, green for boxed concepts
              if (concept.block && concept.block.length > 0) {
                console.log(
                  `  - \x1b[32m${concept.name}\x1b[0m \x1b[90m(boxed)\x1b[0m`
                );
              } else {
                console.log(`  - \x1b[34m${concept.name}\x1b[0m`);
              }
            });
          }

          if (chain.length > 0) {
            console.log('\nRelationships:');
            chain.forEach((data: Data) => {
              const relation = data.value ? 'is' : 'isnt';
              const relationColor = data.value ? '\x1b[32m' : '\x1b[31m'; // Green for 'is', red for 'isnt'
              console.log(
                `  \x1b[34m${data.pair.conceptA.name}\x1b[0m ${relationColor}${relation}\x1b[0m \x1b[34m${data.pair.conceptB.name}\x1b[0m`
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

        // Handle multi-line input for native blocks
        if (trimmed === '') {
          if (inBlock && currentInput.trim() !== '') {
            // End of block - process the accumulated input
            try {
              // Use the compiler directly instead of creating temporary files
              compiler.compile(currentInput);
            } catch (error) {
              console.error(
                `❌ Error: ${error instanceof Error ? error.message : String(error)}`
              );
            }
            currentInput = '';
            inBlock = false;
            rl.setPrompt('concept> ');
          } else if (lastCommand && !inBlock) {
            // Command that could have a block but no indented content - process it now
            try {
              compiler.compile(lastCommand);
            } catch (error) {
              console.error(
                `❌ Error: ${error instanceof Error ? error.message : String(error)}`
              );
            }
            lastCommand = '';
          }
          rl.prompt();
          return;
        }

        // If we're in a block, add this line
        if (inBlock) {
          currentInput += '\n' + input;
          rl.prompt();
          return;
        }

        // Check if this is an indented line (should be part of a block)
        const indent = input.length - input.trimStart().length;
        if (!inBlock && indent > 0 && trimmed !== '') {
          // This is an indented line - process it as a standalone boxed concept
          if (lastCommand) {
            // If there's a last command, treat it as a command with a block
            currentInput = lastCommand + '\n' + input;
            inBlock = true;
            console.log('DEBUG: Created block, currentInput:', currentInput);
            rl.prompt();
            return;
          } else {
            // Standalone indented content - process it directly
            try {
              compiler.compile(input);
            } catch (error) {
              console.error(
                `❌ Error: ${error instanceof Error ? error.message : String(error)}`
              );
            }
            rl.prompt();
            return;
          }
        }

        // Process any pending blocks first
        if (inBlock && currentInput.trim() !== '') {
          // We were in block mode but now have a non-indented command - process the block
          try {
            compiler.compile(currentInput);
          } catch (error) {
            console.error(
              `❌ Error: ${error instanceof Error ? error.message : String(error)}`
            );
          }
          currentInput = '';
          inBlock = false;
          lastCommand = '';
        }

        // Process single-line commands normally
        if (!inBlock && trimmed !== '') {
          // First, process any pending block if we have one
          if (currentInput.trim() !== '') {
            try {
              compiler.compile(currentInput);
            } catch (error) {
              console.error(
                `❌ Error: ${error instanceof Error ? error.message : String(error)}`
              );
            }
            currentInput = '';
            lastCommand = '';
          }

          // Store the last command for potential block usage
          lastCommand = trimmed;

          // Check if this command could have a block (ends with certain keywords)
          const couldHaveBlock =
            trimmed.endsWith(' is') ||
            trimmed.endsWith(' create') ||
            trimmed.endsWith(' write') ||
            trimmed.endsWith(' read') ||
            trimmed.endsWith(' update') ||
            trimmed.endsWith(' delete') ||
            trimmed.endsWith(' say') ||
            trimmed.endsWith(' print') ||
            trimmed.endsWith(' echo');

          if (couldHaveBlock) {
            // Don't process immediately - wait to see if next line is indented
            rl.prompt();
            return;
          } else {
            // Process immediately for commands that don't typically have blocks
            try {
              compiler.compile(trimmed);
            } catch (error) {
              console.error(
                `❌ Error: ${error instanceof Error ? error.message : String(error)}`
              );
            }
            rl.prompt();
            return;
          }
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
