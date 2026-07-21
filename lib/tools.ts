
// functions that Wraps the deterministic engine functions as LLM-callable tools.
// The LLM never computes rankings itself but it can only call these tools
// and reason over their real, deterministic results

import { Decision } from './types';
import { getOptions, getConstraints, calculateScores, findConflicts } from './deterministicEngine';


// These are sent to the LLM so it knows what tools exist and what arguments they take
// None of these tools take arguments from the model, they all operate on the current decision


export const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'getOptions',
      description:
        'Retrieve all options in the current decision, including their id, name, and attributes. Use this to see what choices are available before making a recommendation.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getConstraints',
      description:
        'Retrieve all participant constraints and preferences for the current decision, including which are hard (disqualifying) vs soft (scored preferences), and which participant each belongs to.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'calculateScores',
      description:
        'Run the deterministic ranking engine on the current decision. Returns every option with its disqualification status and reasons (if it failed a hard constraint), its numeric score, and which soft preferences it matched. This is the authoritative ranking — use it before recommending anything.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'findConflicts',
      description:
        'Identify contradictory constraints between different participants on the current decision (e.g. one wants a low price, another has no budget limit but wants a premium option). Returns each conflict with a severity: "critical" (both sides are hard constraints, meaning no option may satisfy both) or "moderate" (involves a soft preference, i.e. a trade-off).',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
] as const;

// Tool name type, derived from the schema above

export type ToolName = (typeof toolDefinitions)[number]['function']['name'];



//  given a tool name and the current decision, run the real function
// The model requests a tool by name and this is the only place that actually executes
// deterministic engine logic, No LLM generated code or values are ever evaluated here


export function runTool(toolName: string, decision: Decision) {

  switch (toolName as ToolName) {
    case 'getOptions':
      return getOptions(decision);
    case 'getConstraints':
      return getConstraints(decision);
    case 'calculateScores':
      return calculateScores(decision);
    case 'findConflicts':
      return findConflicts(decision);
    default:
      throw new Error(`Unknown tool requested: ${toolName}`);
  }
  
}