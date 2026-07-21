import { Decision } from './types';
import { getOptions, getConstraints, calculateScores, findConflicts } from './deterministicEngine';
import { Recommendation } from './recommendationSchema';

interface TraceEntry {
  tool: string;
  status: 'success' | 'error';
  error?: string;
}

// for running a mock assistant that simulates the decision-making process without using an AI model or wasting api keys

export function runMockAssistant(decision: Decision): { recommendation: Recommendation; trace: TraceEntry[] } {
  const trace: TraceEntry[] = [];

  getOptions(decision);
  trace.push({ tool: 'getOptions', status: 'success' });

  getConstraints(decision);
  trace.push({ tool: 'getConstraints', status: 'success' });

  const scored = calculateScores(decision);
  trace.push({ tool: 'calculateScores', status: 'success' });

  const conflicts = findConflicts(decision);
  trace.push({ tool: 'findConflicts', status: 'success' });

  const qualified = scored.filter(s => !s.disqualified);
  const top = qualified[0];

  if (!top) {
    return {
      recommendation: {
        recommendedOptionId: '',
        explanation:
          'No option satisfies every hard constraint. Every option was disqualified by at least one requirement.',
        tradeoffs: [],
        unresolvedQuestions: scored.flatMap(s => s.disqualifiedReasons),
        supportingFacts: [],
      },
      trace,
    };
  }

  const runnerUp = qualified[1];

  const recommendation: Recommendation = {
    recommendedOptionId: top.option.id,
    explanation: `${top.option.name} best fits the group's requirements: it satisfies every hard constraint and scored highest (${top.score}) on the group's soft preferences${
      top.matchedPreferences.length ? `, matching: ${top.matchedPreferences.join(', ')}` : ''
    }.`,
    tradeoffs: runnerUp
      ? [`${runnerUp.option.name} was the next-best option with a score of ${runnerUp.score}, but ranked lower on group preferences.`]
      : [],
    unresolvedQuestions: conflicts.map(c => c.description),
    supportingFacts: [
      ...top.matchedPreferences.map(p => `${top.option.name} matches preference: ${p}`),
      `${top.option.name} passed all hard constraints from every participant.`,
    ],
  };

  return { recommendation, trace };
}