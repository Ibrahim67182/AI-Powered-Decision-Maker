
// core functions to handle deterministic engine decision operations

import { Decision , Constraint, Option} from './types';



// Function to retrieve all the options data from a decision

// AI assistant invoke this function to get the access of all the options while ranking a decision

export function getOptions(decision: Decision) {

return decision.options; 

}




// Function to retrieve all the participants constraints and preferences data from a decision

// AI assistant invoke this function to get the access of all the participants data while making a decision



export function getConstraints(decision: Decision){

return decision.participants.flatMap(p=>p.constraints.map(c=>({...c, participantName: p.name})));


}




// helper function to evaluate the contraints 

// checking logic should be to match constraint atrribute with options attributes values using the constraint operator

function evaluateConstraint(option: Option , constraint: Constraint): boolean {

   const actual = option.attributes[constraint.attribute];
   const expected = constraint.value;

  switch (constraint.operator) {

    case 'equals': 
        return actual === expected;
    case 'notEquals': 
        return actual !== expected;
    case 'lessThan': 
        return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
    case 'lessThanOrEqual': 
        return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
    case 'greaterThan': 
        return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
    case 'greaterThanOrEqual':
        return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
    case 'includes': 
        return Array.isArray(actual) && actual.includes(expected as string);
    case 'excludes': 
        return Array.isArray(actual) && !actual.includes(expected as string);
    default: 
        return false;
  
  }


}



// type definition to represent the scored option with its disqualification status, reasons, score, and matched preferences

interface ScoredOption {
  option: Option;
  disqualified: boolean;
  disqualifiedReasons: string[];   // which hard constraints failed, and whose
  score: number;                    // sum of matched soft-constraint weights
  matchedPreferences: string[];     // which soft constraints it satisfied
}




// function to filter out the hard constraints and score rest of the soft preferences from the decision data
export function calculateScores(decision: Decision): ScoredOption[] {

// first of all filter out the hard contraints from the participants and then score the preferences

const allConstraints = getConstraints(decision);

return decision.options.map(option => {

    const hardConstraints = allConstraints.filter(c => c.type === 'hard');
    const softConstraints = allConstraints.filter(c => c.type === 'soft');

    const failedHard = hardConstraints.filter(c => !evaluateConstraint(option, c));  // filtering the failed hard constraints for the ooption
    const disqualified = failedHard.length > 0;

    let score = 0;
    const matchedPreferences: string[] = [];

    if (!disqualified) {
      for (const c of softConstraints) {
        if (evaluateConstraint(option, c)) {
          score += c.weight ?? 1;                   // calculating each score in loop along with the matched preferences
          matchedPreferences.push(c.label);
        }
      }
    }

    return {
      option,
      disqualified,
      disqualifiedReasons: failedHard.map(c => `${c.participantName}: ${c.label}`),
      score,
      matchedPreferences,
    };
  }).sort((a, b) => Number(a.disqualified) - Number(b.disqualified) || b.score - a.score);  // this sorting helps to put the disqualified options last
      
  // and higher scores options order in ascending order of their scores for the qualified options

}





// deifning the conflict type definition to represent the conflicts between the participants constraints and preferences in a decision

interface Conflict {
  attribute: string;
  description: string;
  participantsInvolved: string[];
  severity: 'critical' | 'moderate';  // critical = hard vs hard, moderate = involves at least one soft constraint

}



// function to find conflicts between the participants constraints and preferences in a decision
export function findConflicts(decision: Decision): Conflict[] {

  const allConstraints = getConstraints(decision);

  const conflicts: Conflict[] = [];

  // Create a Map where each key is an attribute name (e.g. "price", "outdoor")
  // and each value is the list of constraints (from any participant) about that attribute
  const byAttribute = new Map<string, typeof allConstraints>();

  for (const c of allConstraints) {
  
    if (!byAttribute.has(c.attribute)) byAttribute.set(c.attribute, []);
  
    byAttribute.get(c.attribute)!.push(c);
  
  }

  // pointing out the conflicts between constraints of different participants for the same attribute and different values
  for (const [attribute, constraints] of byAttribute) {

    for (let i = 0; i < constraints.length; i++) {

      for (let j = i + 1; j < constraints.length; j++) {

        const a = constraints[i], b = constraints[j];

        if (a.participantId !== b.participantId && a.value !== b.value) {

          // if both constraints are hard, this is critical
          // it likely means no single option can satisfy both participants at once
         
          const bothHard = a.type === 'hard' && b.type === 'hard';

          conflicts.push({
            attribute,
            description: `${a.participantName} wants ${attribute} ${a.operator} ${a.value}, but ${b.participantName} wants ${attribute} ${b.operator} ${b.value}`,
            participantsInvolved: [a.participantName, b.participantName],
            severity: bothHard ? 'critical' : 'moderate',
          });
        }
      }
    }
  }

  return conflicts;
}