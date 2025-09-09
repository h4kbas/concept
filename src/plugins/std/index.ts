import { Concept, HookMap, Data } from '../../types';
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
              data.value === true &&
              data.relationshipType === 'is'
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

    // Handle "A is B" relationships
    if (params.length === 3) {
      const [a, isToken, b] = params;
      if (a && isToken?.name === 'is' && b) {
        // Add all concepts to the block
        params.forEach(concept => block.addConcept(concept));
        // Create the relationship
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
  },

  isnt: (params: Concept[]): Concept[] | void => {
    const block = getBlock();

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
          block.addToChain(a, b, true, 'is');
          return;
        }
        if (relation?.name === 'isnt' && b && a) {
          block.addToChain(a, b, false, 'isnt');
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

    // Handle "A isnt B" relationships
    if (params.length === 3) {
      const [a, isntToken, b] = params;
      if (a && isntToken?.name === 'isnt' && b) {
        // Add all concepts to the block
        params.forEach(concept => block.addConcept(concept));
        // Create the relationship
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
  },

  has: (params: Concept[]): Concept[] | void => {
    const block = getBlock();

    // Handle "has A B" query - check if A has B
    if (params.length >= 3 && params[0]?.name === 'has') {
      const [query, a, b] = params;
      if (query?.name === 'has' && a && b) {
        // Check if the relationship exists
        const hasRelationship = block.chain.find(
          data =>
            data.pair.conceptA.name === a.name &&
            data.pair.conceptB.name === b.name &&
            data.relationshipType === 'has' &&
            data.value === true
        );

        if (hasRelationship) {
          console.log(`✅ ${a.name} has ${b.name}`);
          return [];
        } else {
          console.log(`❌ ${a.name} does not have ${b.name}`);
          return [];
        }
      }
    }

    // Handle "A has B" relationship - creates a property relationship
    if (params.length >= 3 && params[1]?.name === 'has') {
      const [a, relation, b] = params;
      if (relation?.name === 'has' && b && a) {
        // Create the has relationship: A has B
        block.addToChain(a, b, true, 'has');

        // Add the property concept to the block so it can be referenced
        block.addConcept(b);

        // Automatically create property instance: property_of_object
        const propertyInstanceName = `${b.name}_of_${a.name}`;
        block.addConcept({ name: propertyInstanceName });

        // Create relationship: instance is property
        block.addPair({ conceptA: { name: propertyInstanceName }, conceptB: { name: b.name } });
        block.addData({ pair: { conceptA: { name: propertyInstanceName }, conceptB: { name: b.name } }, value: true, relationshipType: 'is' } as Data);

        // Create relationship: main concept has instance
        block.addPair({ conceptA: { name: a.name }, conceptB: { name: propertyInstanceName } });
        block.addData({ pair: { conceptA: { name: a.name }, conceptB: { name: propertyInstanceName } }, value: true, relationshipType: 'has' } as Data);

        return;
      }
    }

    // Handle "has <statement>" - evaluate whatever comes after 'has'
    if (params[0]?.name === 'has') {
      // Handle "has <statement>" - evaluate whatever comes after 'has'
      if (params.length < 2) {
        throw new Error('Invalid "has" usage: has <statement>');
      }

      // Extract everything after 'has' and evaluate it as a concept statement
      const statement = params.slice(1);
      if (statement.length >= 2) {
        // If it looks like a relationship (A has B), create it
        const [a, relation, b] = statement;
        if (relation?.name === 'has' && b && a) {
          block.addToChain(a, b, true, 'has');
          return;
        }
        if (relation?.name === 'is' && b && a) {
          block.addToChain(a, b, true, 'is');
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
      return;
    }

    // Handle incomplete relationships (just add concepts)
    if (params.length < 3) {
      params.forEach(concept => {
        block.addConcept(concept);
      });
      return;
    }
  },

  hasnt: (params: Concept[]): Concept[] | void => {
    const block = getBlock();

    // Handle "hasnt A B" query - check if A does not have B
    if (params.length >= 3 && params[0]?.name === 'hasnt') {
      const [query, a, b] = params;
      if (query?.name === 'hasnt' && a && b) {
        // Check if the relationship exists
        const hasRelationship = block.chain.find(
          data =>
            data.pair.conceptA.name === a.name &&
            data.pair.conceptB.name === b.name &&
            data.relationshipType === 'has' &&
            data.value === true
        );

        if (hasRelationship) {
          console.log(`❌ ${a.name} has ${b.name} (expected not to have)`);
          return [];
        } else {
          console.log(`✅ ${a.name} does not have ${b.name}`);
          return [];
        }
      }
    }

    // Handle "A hasnt B" relationship - creates a negative property relationship
    if (params.length >= 3 && params[1]?.name === 'hasnt') {
      const [a, relation, b] = params;
      if (relation?.name === 'hasnt' && b && a) {
        // Create the negative has relationship: A hasnt B
        block.addToChain(a, b, false, 'has');

        // Add the property concept to the block so it can be referenced
        block.addConcept(b);

        return;
      }
    }

    // Handle "hasnt <statement>" - evaluate whatever comes after 'hasnt'
    if (params[0]?.name === 'hasnt') {
      if (params.length < 2) {
        throw new Error('Invalid "hasnt" usage: hasnt <statement>');
      }

      // Extract everything after 'hasnt' and evaluate it as a concept statement
      const statement = params.slice(1);

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
      return;
    }

    // Handle incomplete relationships (just add concepts)
    if (params.length < 3) {
      params.forEach(concept => {
        block.addConcept(concept);
      });
      return;
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

    // Get all relationships involving this concept using the block explorer
    // This gives us the complete, deduplicated view of all relationships
    const allConcepts = block.concepts;
    const allRelationships: Array<{
      concept: string;
      relation: string;
      target: string;
      isInferred: boolean;
    }> = [];

    for (const otherConcept of allConcepts) {
      if (otherConcept.name === conceptName) continue;

      // Find the actual relationship data to get the relationship type
      const relationshipData = block.chain.find(
        data =>
          data.pair.conceptA.name === concept.name &&
          data.pair.conceptB.name === otherConcept.name
      );

      if (relationshipData) {
        allRelationships.push({
          concept: conceptName,
          relation: relationshipData.relationshipType || 'is',
          target: otherConcept.name,
          isInferred: false,
        });
      }
    }

    // Also check reverse relationships (where this concept is the target)
    for (const otherConcept of allConcepts) {
      if (otherConcept.name === conceptName) continue;

      // Find the actual relationship data to get the relationship type
      const relationshipData = block.chain.find(
        data =>
          data.pair.conceptA.name === otherConcept.name &&
          data.pair.conceptB.name === concept.name
      );

      if (relationshipData) {
        allRelationships.push({
          concept: otherConcept.name,
          relation: relationshipData.relationshipType || 'is',
          target: conceptName,
          isInferred: false,
        });
      }
    }

    console.log(`Relationships: ${allRelationships.length}`);

    if (allRelationships.length > 0) {
      console.log('\nRelationships:');
      allRelationships.forEach(rel => {
        let relationColor = '\x1b[32m'; // Default green
        if (rel.relation === 'isnt') {
          relationColor = '\x1b[31m'; // Red for 'isnt'
        } else if (rel.relation === 'has') {
          relationColor = '\x1b[33m'; // Yellow for 'has'
        }
        console.log(
          `  \x1b[34m${rel.concept}\x1b[0m ${relationColor}${rel.relation}\x1b[0m \x1b[34m${rel.target}\x1b[0m`
        );
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
