
// hardcoded seed data for testing and development purposes to test main logic of the app without any llm

// or use can test out the functionality of the app without wasting llm api key to understand how it works

import { Decision } from './types';

export const seedDecision: Decision = {
  
  id: 'seed-decision-1',
  title: 'Choose a team lunch venue',
  description: 'Pick a spot for the team lunch that works for everyone.',
  createdAt: new Date().toISOString(),
  options: [
    {
      id: 'opt-terrace-kitchen',
      name: 'Terrace Kitchen',
      attributes: {
        price: 28,
        location: 'Uptown',
        dietaryTags: ['vegetarian', 'vegan', 'gluten-free'],
        outdoor: true,
        distanceMinutes: 20,
      },
    },
    {
      id: 'opt-pizza-place',
      name: 'Pizza Place',
      attributes: {
        price: 15,
        location: 'Downtown',
        dietaryTags: ['vegetarian'],
        outdoor: false,
        distanceMinutes: 8,
      },
    },
    {
      id: 'opt-sushi-bar',
      name: 'Sushi Bar',
      attributes: {
        price: 42,
        location: 'Downtown',
        dietaryTags: ['gluten-free'],
        outdoor: false,
        distanceMinutes: 10,
      },
    },
  ],
  participants: [
    {
      id: 'part-amina',
      name: 'Amina',
      constraints: [
        {
          id: 'c1',
          participantId: 'part-amina',
          label: 'Budget under $30',
          attribute: 'price',
          type: 'hard',
          operator: 'lessThanOrEqual',
          value: 30,
        },
        {
          id: 'c2',
          participantId: 'part-amina',
          label: 'Must have vegetarian option',
          attribute: 'dietaryTags',
          type: 'hard',
          operator: 'includes',
          value: 'vegetarian',
        },
      ],
    },
    {
      id: 'part-daniyal',
      name: 'Daniyal',
      constraints: [
        {
          id: 'c3',
          participantId: 'part-daniyal',
          label: 'Prefers outdoor seating',
          attribute: 'outdoor',
          type: 'soft',
          operator: 'equals',
          value: true,
          weight: 4,
        },
        {
          id: 'c4',
          participantId: 'part-daniyal',
          label: 'Prefers closer venues',
          attribute: 'distanceMinutes',
          type: 'soft',
          operator: 'lessThanOrEqual',
          value: 15,
          weight: 2,
        },
      ],
    },
  ],
};