import { describe, it, expect } from 'vitest';
import { recommendationSchema } from '@/lib/recommendationSchema';

describe('recommendationSchema — malformed AI response handling', () => {
  it('rejects a response missing required fields', () => {
    const malformed = {
      recommendedOptionId: 'opt-1',
      explanation: 'This is fine',
      // missing tradeoffs, unresolvedQuestions, supportingFacts
    };

    const result = recommendationSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });

  it('rejects a response with wrong field types', () => {
    const malformed = {
      recommendedOptionId: 'opt-1',
      explanation: 'This is fine',
      tradeoffs: 'should be an array, not a string', // wrong type
      unresolvedQuestions: [],
      supportingFacts: [],
    };

    const result = recommendationSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });

  it('rejects a response that is not even an object (e.g. raw text/markdown)', () => {
    const malformed = "Sure! I recommend Terrace Kitchen because it's great.";

    const result = recommendationSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });

  it('accepts a properly-shaped response', () => {
    const valid = {
      recommendedOptionId: 'opt-1',
      explanation: 'Best fit for budget and preferences.',
      tradeoffs: ['Slightly farther away'],
      unresolvedQuestions: [],
      supportingFacts: ['Within budget', 'Matches dietary needs'],
    };

    const result = recommendationSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});