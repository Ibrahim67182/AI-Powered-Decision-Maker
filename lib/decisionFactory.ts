
// functions for user to create their own manual decision, options and participiants without seeded or hardcocded data


import { Decision, Option, Participant , Domain} from './types';


// Helper function to create a blank manual decision for user 

export function createEmptyDecision(domain: Domain): Decision {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    domain,
    options: [],
    participants: [],
    createdAt: new Date().toISOString(),
  };
}

// Helper function to create a blank manual options inside decision for user 

export function createEmptyOption(): Option {
  return {
    id: crypto.randomUUID(),
    name: '',
    attributes: {},
  };
}

// Helper function to create a blank manual participants inside decision for user

export function createEmptyParticipant(): Participant {
  return {
    id: crypto.randomUUID(),
    name: '',
    constraints: [],
  };
}