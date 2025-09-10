import { Concept, HookMap, Block } from 'concept-lang';
import { Data } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class FilePlugin {
  readonly config = {
    name: 'file',
    version: '1.0.0',
    description:
      'File operations plugin - read files into concepts and write concepts to files',
    main: 'dist/index.js',
  };

  initialize?(): void | Promise<void> {}
  setBlock?(_block: any): void {}
  cleanup?(): void | Promise<void> {}

  registerListeners(): Map<string, any> {
    return new Map();
  }

  getHooks(
    block?: Block
  ): Record<
    string,
    (params: Concept[], block?: Concept[]) => Concept[] | void
  > {
    return createFilePlugin(() => block || new Block());
  }
}

export const createFilePlugin = (getBlock: () => Block): HookMap => ({
  /**
   * File operations plugin
   * Usage:
   *   file read <filename> as <conceptName>
   *   file write <conceptName> to <filename>
   */
  file: (params: Concept[]): Concept[] | void => {
    if (params.length < 2) {
      throw new Error('Usage: file <command> [args...]\nCommands: read, write');
    }

    // Skip the first "file" token and get the command
    const command = params[1]?.name;
    const block = getBlock();

    switch (command) {
      case 'read':
        return handleRead(params.slice(2), block);
      case 'write':
        return handleWrite(params.slice(2), block);
      default:
        throw new Error(
          `Unknown file command: ${command}\nAvailable commands: read, write`
        );
    }
  },
});

// Helper functions
function handleRead(params: Concept[], block: Block): Concept[] | void {
  if (params.length < 3) {
    throw new Error('Usage: file read <filename> as <conceptName>');
  }

  const filename = params[0]?.name;
  const conceptName = params[2]?.name;

  if (!filename || !conceptName) {
    throw new Error(
      'Invalid parameters: filename and conceptName are required'
    );
  }

  try {
    const filePath = path.resolve(filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Create the main concept with file content and metadata as nested block
    const fileConcept: Concept = {
      name: conceptName,
      block: [
        { name: content },
        {
          name: 'filename',
          block: [{ name: 'is' }, { name: filename }],
        },
        {
          name: 'type',
          block: [{ name: 'is' }, { name: 'file' }],
        },
        {
          name: 'size',
          block: [{ name: 'is' }, { name: content.length.toString() }],
        },
        {
          name: 'extension',
          block: [{ name: 'is' }, { name: path.extname(filename) }],
        },
      ],
    };

    block.addConcept(fileConcept);

    // Add the actual values as concepts
    block.addConcept({ name: filename });
    block.addConcept({ name: 'file' });
    block.addConcept({ name: content.length.toString() });
    block.addConcept({ name: path.extname(filename) });

    // Create relationships to connect the main concept to its metadata properties using 'has'
    block.addPair({
      conceptA: { name: conceptName },
      conceptB: { name: 'filename' },
    });
    block.addData({
      pair: { conceptA: { name: conceptName }, conceptB: { name: 'filename' } },
      value: true,
      relationshipType: 'has',
    } as Data);

    block.addPair({
      conceptA: { name: conceptName },
      conceptB: { name: 'type' },
    });
    block.addData({
      pair: { conceptA: { name: conceptName }, conceptB: { name: 'type' } },
      value: true,
      relationshipType: 'has',
    } as Data);

    block.addPair({
      conceptA: { name: conceptName },
      conceptB: { name: 'size' },
    });
    block.addData({
      pair: { conceptA: { name: conceptName }, conceptB: { name: 'size' } },
      value: true,
      relationshipType: 'has',
    } as Data);

    block.addPair({
      conceptA: { name: conceptName },
      conceptB: { name: 'extension' },
    });
    block.addData({
      pair: {
        conceptA: { name: conceptName },
        conceptB: { name: 'extension' },
      },
      value: true,
      relationshipType: 'has',
    } as Data);

    // Create relationships to connect the metadata properties to their values
    block.addPair({
      conceptA: { name: 'filename' },
      conceptB: { name: filename },
    });
    block.addData({
      pair: { conceptA: { name: 'filename' }, conceptB: { name: filename } },
      value: true,
      relationshipType: 'is',
    } as Data);

    block.addPair({ conceptA: { name: 'type' }, conceptB: { name: 'file' } });
    block.addData({
      pair: { conceptA: { name: 'type' }, conceptB: { name: 'file' } },
      value: true,
      relationshipType: 'is',
    } as Data);

    block.addPair({
      conceptA: { name: 'size' },
      conceptB: { name: content.length.toString() },
    });
    block.addData({
      pair: {
        conceptA: { name: 'size' },
        conceptB: { name: content.length.toString() },
      },
      value: true,
      relationshipType: 'is',
    } as Data);

    block.addPair({
      conceptA: { name: 'extension' },
      conceptB: { name: path.extname(filename) },
    });
    block.addData({
      pair: {
        conceptA: { name: 'extension' },
        conceptB: { name: path.extname(filename) },
      },
      value: true,
      relationshipType: 'is',
    } as Data);

    // Automatically create property instances
    const propertyInstances = ['filename', 'type', 'size', 'extension'];
    propertyInstances.forEach(prop => {
      const instanceName = `${prop}_of_${conceptName}`;
      block.addConcept({ name: instanceName });

      // Create relationship: instance is property
      block.addPair({
        conceptA: { name: instanceName },
        conceptB: { name: prop },
      });
      block.addData({
        pair: { conceptA: { name: instanceName }, conceptB: { name: prop } },
        value: true,
        relationshipType: 'is',
      } as Data);

      // Create relationship: main concept has instance
      block.addPair({
        conceptA: { name: conceptName },
        conceptB: { name: instanceName },
      });
      block.addData({
        pair: {
          conceptA: { name: conceptName },
          conceptB: { name: instanceName },
        },
        value: true,
        relationshipType: 'has',
      } as Data);
    });

    console.log(`✅ Read file "${filename}" into concept "${conceptName}"`);
    return [];
  } catch (error) {
    throw new Error(
      `Failed to read file "${filename}": ${(error as Error).message}`
    );
  }
}

function handleWrite(params: Concept[], block: Block): Concept[] | void {
  if (params.length < 3) {
    throw new Error('Usage: file write <conceptName> to <filename>');
  }

  const conceptName = params[0]?.name;
  const filename = params[2]?.name;

  if (!conceptName || !filename) {
    throw new Error(
      'Invalid parameters: conceptName and filename are required'
    );
  }

  try {
    const concept = block.concepts.find((c: Concept) => c.name === conceptName);
    if (!concept) {
      throw new Error(`Concept "${conceptName}" not found`);
    }

    // Serialize the concept to JSON
    const content = JSON.stringify(
      {
        name: concept.name,
        block: concept.block,
      },
      null,
      2
    );

    const filePath = path.resolve(filename);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Written concept "${conceptName}" to file "${filename}"`);
    return [];
  } catch (error) {
    throw new Error(
      `Failed to write concept "${conceptName}" to file "${filename}": ${(error as Error).message}`
    );
  }
}

export default FilePlugin;
