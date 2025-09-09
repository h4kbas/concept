import { Concept, HookMap } from '../../types';
import { ConceptPlugin } from '../../types/plugin';
import { Block } from '../../core/block';

/**
 * Standard library plugin for common Concept language functionality
 */
export const createStdPlugin = (getBlock: () => Block): HookMap => ({
  say: (params: Concept[]): Concept[] | void => {
    if (params.length < 2) {
      throw new Error('Invalid "say" usage: say <message>');
    }

    // Add all concepts to the block
    params.forEach(concept => getBlock().addConcept(concept));

    // Extract the message (everything after 'say')
    const message = params
      .slice(1)
      .map(p => p.name)
      .join(' ');
    console.log(message);
    return [];
  },

  is: (params: Concept[]): Concept[] | void => {
    const block = getBlock();
    // Handle "A is B" relationships
    if (params.length === 3) {
      const [a, isToken, b] = params;
      if (a && isToken?.name === 'is' && b) {
        block.addToChain(a, b, true);
        return;
      }
    }

    // Handle incomplete relationships (just add concepts)
    if (params.length < 3) {
      params.forEach(concept => {
        block.addConcept(concept);
      });
      return;
    }

    // Handle "is <statement>" - evaluate whatever comes after 'is'
    if (params[0]?.name === 'is') {
      // Handle "is <statement>" - evaluate whatever comes after 'is'
      if (params.length < 2) {
        throw new Error('Invalid "is" usage: is <statement>');
      }

      // Extract everything after 'is' and evaluate it as a concept statement
      const statement = params.slice(1);

      // Check if this is a query (is A B) or (is A B action)
      if (statement.length >= 2) {
        const [a, relation, b] = statement;

        // Handle relationship queries: is A B
        if (relation?.name === 'is' && b && a) {
          // Check if the relationship exists (for future use if needed)
          block.chain.some(
            data =>
              data.pair.conceptA.name === a.name &&
              data.pair.conceptB.name === b.name &&
              data.value === true
          );

          // If there are more parameters after the relationship, execute them as a command
          if (statement.length > 3) {
            const actionParams = statement.slice(3);
            const actionCommand = actionParams[0];

            if (
              actionCommand &&
              block['_hookMap'] &&
              block['_hookMap'][actionCommand.name]
            ) {
              const hook = block['_hookMap'][actionCommand.name];
              if (hook) {
                // Execute the action with the relationship result
                const actionResult = hook(actionParams);
                return actionResult;
              }
            }
          }

          // If no action, just add the concepts (the query was processed)
          // Note: relationshipExists is available for future use if needed
          statement.forEach(concept => {
            block.addConcept(concept);
          });
          return;
        }

        // Handle negative relationship queries: isnt A B
        if (relation?.name === 'isnt' && b && a) {
          // Check if the negative relationship exists (for future use if needed)
          block.chain.some(
            data =>
              data.pair.conceptA.name === a.name &&
              data.pair.conceptB.name === b.name &&
              data.value === false
          );

          // If there are more parameters after the relationship, execute them as a command
          if (statement.length > 3) {
            const actionParams = statement.slice(3);
            const actionCommand = actionParams[0];

            if (
              actionCommand &&
              block['_hookMap'] &&
              block['_hookMap'][actionCommand.name]
            ) {
              const hook = block['_hookMap'][actionCommand.name];
              if (hook) {
                // Execute the action with the relationship result
                const actionResult = hook(actionParams);
                return actionResult;
              }
            }
          }

          // If no action, just add the concepts (the query was processed)
          // Note: relationshipExists is available for future use if needed
          statement.forEach(concept => {
            block.addConcept(concept);
          });
          return;
        }
      }

      // Check if the first concept is a command (has a hook)
      const firstConcept = statement[0];
      if (
        firstConcept &&
        block['_hookMap'] &&
        block['_hookMap'][firstConcept.name]
      ) {
        // Execute the command with the remaining parameters
        const hook = block['_hookMap'][firstConcept.name];
        if (hook) {
          return hook(statement);
        }
      }

      // Otherwise, just add the concepts
      statement.forEach(concept => {
        block.addConcept(concept);
      });
    }
  },

  isnt: (params: Concept[]): Concept[] | void => {
    const block = getBlock();
    // Handle "A isnt B" relationships
    if (params.length === 3) {
      const [a, isntToken, b] = params;
      if (a && isntToken?.name === 'isnt' && b) {
        block.addToChain(a, b, false);
        return;
      }
    }

    // Handle incomplete relationships (just add concepts)
    if (params.length < 3) {
      params.forEach(concept => {
        block.addConcept(concept);
      });
      return;
    }

    // Handle "isnt <statement>" - evaluate whatever comes after 'isnt'
    if (params[0]?.name === 'isnt') {
      // Handle "isnt <statement>" - evaluate whatever comes after 'isnt'
      if (params.length < 2) {
        throw new Error('Invalid "isnt" usage: isnt <statement>');
      }

      // Extract everything after 'isnt' and evaluate it as a concept statement
      const statement = params.slice(1);
      if (statement.length >= 2) {
        // If it looks like a relationship (A isnt B), create it
        const [a, relation, b] = statement;
        if (relation?.name === 'is' && b && a) {
          block.addToChain(a, b, true);
          return;
        }
        if (relation?.name === 'isnt' && b && a) {
          block.addToChain(a, b, false);
          return;
        }
      }

      // Check if the first concept is a command (has a hook)
      const firstConcept = statement[0];
      if (
        firstConcept &&
        block['_hookMap'] &&
        block['_hookMap'][firstConcept.name]
      ) {
        // Execute the command with the remaining parameters
        const hook = block['_hookMap'][firstConcept.name];
        if (hook) {
          return hook(statement);
        }
      }

      // Otherwise, just add the concepts
      statement.forEach(concept => {
        block.addConcept(concept);
      });
    }
  },

  inspect: (params: Concept[]): Concept[] | void => {
    const block = getBlock();
    if (params.length < 2) {
      throw new Error('Invalid "inspect" usage: inspect <concept_name>');
    }

    // Add all concepts to the block
    params.forEach(concept => block.addConcept(concept));

    const conceptName = params[1]?.name;
    if (!conceptName) {
      throw new Error('Invalid "inspect" usage: inspect <concept_name>');
    }
    const concept = block.getConcept(conceptName);
    if (!concept) {
      console.log(`❌ Concept '${conceptName}' not found`);
      return;
    }

    console.log(`\n=== Concept: \x1b[34m${conceptName}\x1b[0m ===`);

    // Check if this is a boxed concept
    if (concept.block && concept.block.length > 0) {
      console.log('\nBoxed Content:');
      concept.block.forEach(blockConcept => {
        console.log(`  - \x1b[32m${blockConcept.name}\x1b[0m`);
      });
    }

    // Get all relationships involving this concept
    const relationships = block.chain.filter(
      data =>
        data.pair.conceptA.name === conceptName ||
        data.pair.conceptB.name === conceptName
    );

    console.log(`Relationships: ${relationships.length}`);

    if (relationships.length > 0) {
      console.log('\nDirect Relationships:');
      relationships.forEach(data => {
        const relation = data.value ? 'is' : 'isnt';
        const relationColor = data.value ? '\x1b[32m' : '\x1b[31m'; // Green for 'is', red for 'isnt'
        if (data.pair.conceptA.name === conceptName) {
          console.log(
            `  \x1b[34m${conceptName}\x1b[0m ${relationColor}${relation}\x1b[0m \x1b[34m${data.pair.conceptB.name}\x1b[0m`
          );
        } else {
          console.log(
            `  \x1b[34m${data.pair.conceptA.name}\x1b[0m ${relationColor}${relation}\x1b[0m \x1b[34m${conceptName}\x1b[0m`
          );
        }
      });
    }

    // Get inferred relationships through the block explorer
    const allConcepts = block.concepts;
    const inferredRelationships: string[] = [];

    for (const otherConcept of allConcepts) {
      if (otherConcept.name === conceptName) continue;

      const pairState = block.blockExplorer.calculateCurrentPairState({
        conceptA: concept,
        conceptB: otherConcept,
      });

      if (pairState === true) {
        inferredRelationships.push(`${conceptName} is ${otherConcept.name}`);
      } else if (pairState === false) {
        inferredRelationships.push(`${conceptName} isnt ${otherConcept.name}`);
      }
    }

    if (inferredRelationships.length > 0) {
      console.log('\nInferred Relationships:');
      inferredRelationships.forEach(rel => {
        // Parse the relationship string to add colors
        const parts = rel.split(' ');
        if (parts.length === 3) {
          const [conceptA, relation, conceptB] = parts;
          const relationColor = relation === 'is' ? '\x1b[32m' : '\x1b[31m';
          console.log(
            `  \x1b[34m${conceptA}\x1b[0m ${relationColor}${relation}\x1b[0m \x1b[34m${conceptB}\x1b[0m \x1b[90m(inferred)\x1b[0m`
          );
        } else {
          console.log(`  ${rel} \x1b[90m(inferred)\x1b[0m`);
        }
      });
    }

    // Check if concept has any references
    const references = block.getReferences(conceptName);
    if (references.length > 0) {
      console.log('\nReferences:');
      references.forEach(ref => {
        console.log(`  -> ${ref}`);
      });
    }

    console.log('');
  },
});

/**
 * Standard library plugin implementation
 */
export class StdPlugin implements ConceptPlugin {
  readonly config = {
    name: 'std',
    version: '1.0.0',
    description: 'Standard library plugin with basic commands',
    main: 'index.js',
  };

  async initialize() {
    // No initialization needed
  }

  registerListeners() {
    // Return empty map since we use hooks instead of listeners
    return new Map();
  }

  getHooks(block?: Block) {
    // Return the hooks for the compiler
    return createStdPlugin(() => block || new Block());
  }
}

// Export as default for plugin loading
export default StdPlugin;
