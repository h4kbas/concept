#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import { Compiler } from '../core/compiler';
import { Concept, Data } from '../types';

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
  .description('Run a Concept language file and display output')
  .argument('<input>', 'Input .concept file')
  .option('--no-infer', 'Disable automatic inference')
  .action((input: string, options: { infer: boolean }) => {
    try {
      const inputPath = resolve(input);

      if (!existsSync(inputPath)) {
        console.error(`Error: Input file '${inputPath}' does not exist`);
        process.exit(1);
      }

      const source = readFileSync(inputPath, 'utf-8');
      const compiler = new Compiler();

      if (!options.infer) {
        compiler.block['inferMissingPairs'] = () => {};
      }

      compiler.compile(source);
      console.log('Execution completed successfully');
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
