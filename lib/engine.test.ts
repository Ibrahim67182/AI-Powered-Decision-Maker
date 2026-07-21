import { describe, it, expect } from 'vitest';
import { calculateScores } from '@/lib/deterministicEngine';
import { Decision } from '@/lib/types';

// Shared helper to build a minimal, valid Decision for each test —
// keeps each test focused only on what it's actually checking.
function buildDecision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: 'test-decision',
    title: 'Test Decision',
    domain: 'food',
    createdAt: new Date().toISOString(),
    options: [],
    participants: [],
    ...overrides,
  };
}

describe('calculateScores — hard constraint case', () => {
  it('disqualifies an option that fails a hard constraint, and qualifies the one that passes', () => {
    const decision = buildDecision({
      options: [
        { id: 'opt-cheap', name: 'Cheap Place', attributes: { price: 15 } },
        { id: 'opt-expensive', name: 'Expensive Place', attributes: { price: 60 } },
      ],
      participants: [
        {
          id: 'part-1',
          name: 'Amina',
          constraints: [
            {
              id: 'c1',
              participantId: 'part-1',
              label: 'Budget under $30',
              attribute: 'price',
              type: 'hard',
              operator: 'lessThanOrEqual',
              value: 30,
            },
          ],
        },
      ],
    });

    const results = calculateScores(decision);

    const expensive = results.find(r => r.option.id === 'opt-expensive');
    const cheap = results.find(r => r.option.id === 'opt-cheap');

    expect(expensive?.disqualified).toBe(true);
    expect(expensive?.disqualifiedReasons.length).toBeGreaterThan(0);
    expect(cheap?.disqualified).toBe(false);
  });
});

describe('calculateScores — no-valid-option case', () => {
  it('marks every option as disqualified when none satisfy the hard constraints', () => {
    const decision = buildDecision({
      options: [
        { id: 'opt-a', name: 'Option A', attributes: { price: 50 } },
        { id: 'opt-b', name: 'Option B', attributes: { price: 80 } },
      ],
      participants: [
        {
          id: 'part-1',
          name: 'Amina',
          constraints: [
            {
              id: 'c1',
              participantId: 'part-1',
              label: 'Budget under $30',
              attribute: 'price',
              type: 'hard',
              operator: 'lessThanOrEqual',
              value: 30,
            },
          ],
        },
      ],
    });

    const results = calculateScores(decision);
    const qualified = results.filter(r => !r.disqualified);

    expect(qualified.length).toBe(0);
    expect(results.every(r => r.disqualified)).toBe(true);
    expect(results.every(r => r.disqualifiedReasons.length > 0)).toBe(true);
  });
});

describe('calculateScores — soft preference scoring', () => {
  it('scores a qualifying option higher when it matches more soft preferences', () => {
    const decision = buildDecision({
      options: [
        { id: 'opt-outdoor', name: 'Outdoor Spot', attributes: { price: 20, outdoor: true } },
        { id: 'opt-indoor', name: 'Indoor Spot', attributes: { price: 20, outdoor: false } },
      ],
      participants: [
        {
          id: 'part-1',
          name: 'Daniyal',
          constraints: [
            {
              id: 'c1',
              participantId: 'part-1',
              label: 'Prefers outdoor',
              attribute: 'outdoor',
              type: 'soft',
              operator: 'equals',
              value: true,
              weight: 3,
            },
          ],
        },
      ],
    });

    const results = calculateScores(decision);
    const outdoor = results.find(r => r.option.id === 'opt-outdoor');
    const indoor = results.find(r => r.option.id === 'opt-indoor');

    expect(outdoor?.score).toBe(3);
    expect(indoor?.score).toBe(0);
    // sorted descending by score, so outdoor should come first
    expect(results[0].option.id).toBe('opt-outdoor');
  });
});