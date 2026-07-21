
// hardcoded seed data for testing and development purposes to test main logic of the app without any llm

// or use can test out the functionality of the app without wasting llm api key to understand how it works

import { Decision } from './types';

export const seedFood: Decision = {
  id: 'seed-food',
  title: 'Choose a team lunch venue',
  description: 'Pick a spot for the team lunch that works for everyone.',
  domain: 'food',
  createdAt: new Date().toISOString(),
  options: [
    {
      id: 'opt-terrace-kitchen',
      name: 'Terrace Kitchen',
      attributes: { price: 28, cuisine: 'Continental', dietaryTags: ['vegetarian', 'vegan', 'gluten-free'], outdoor: true, distanceMinutes: 20 },
    },
    {
      id: 'opt-pizza-place',
      name: 'Pizza Place',
      attributes: { price: 15, cuisine: 'Italian', dietaryTags: ['vegetarian'], outdoor: false, distanceMinutes: 8 },
    },
    {
      id: 'opt-sushi-bar',
      name: 'Sushi Bar',
      attributes: { price: 42, cuisine: 'Japanese', dietaryTags: ['gluten-free'], outdoor: false, distanceMinutes: 10 },
    },
  ],
  participants: [
    {
      id: 'part-amina',
      name: 'Amina',
      constraints: [
        { id: 'c1', participantId: 'part-amina', label: 'Budget under $30', attribute: 'price', type: 'hard', operator: 'lessThanOrEqual', value: 30 },
        { id: 'c2', participantId: 'part-amina', label: 'Must have vegetarian option', attribute: 'dietaryTags', type: 'hard', operator: 'includes', value: 'vegetarian' },
      ],
    },
    {
      id: 'part-daniyal',
      name: 'Daniyal',
      constraints: [
        { id: 'c3', participantId: 'part-daniyal', label: 'Prefers outdoor seating', attribute: 'outdoor', type: 'soft', operator: 'equals', value: true, weight: 4 },
        { id: 'c4', participantId: 'part-daniyal', label: 'Prefers closer venues', attribute: 'distanceMinutes', type: 'soft', operator: 'lessThanOrEqual', value: 15, weight: 2 },
      ],
    },
  ],
};

export const seedEvent: Decision = {
  id: 'seed-event',
  title: 'Choose a venue for the company offsite',
  description: 'Pick the best venue for a 40-person team offsite.',
  domain: 'event',
  createdAt: new Date().toISOString(),
  options: [
    {
      id: 'opt-lakeside-hall',
      name: 'Lakeside Hall',
      attributes: { cost: 1800, venueType: 'Banquet Hall', capacity: 60, indoor: true, distanceMinutes: 35, amenities: ['parking', 'AV equipment', 'catering'] },
    },
    {
      id: 'opt-rooftop-garden',
      name: 'Rooftop Garden',
      attributes: { cost: 1200, venueType: 'Outdoor Space', capacity: 50, indoor: false, distanceMinutes: 15, amenities: ['catering'] },
    },
    {
      id: 'opt-conference-center',
      name: 'City Conference Center',
      attributes: { cost: 2500, venueType: 'Conference Center', capacity: 100, indoor: true, distanceMinutes: 10, amenities: ['parking', 'AV equipment', 'wifi', 'catering'] },
    },
  ],
  participants: [
    {
      id: 'part-organizer',
      name: 'Organizer',
      constraints: [
        { id: 'e1', participantId: 'part-organizer', label: 'Budget under $2000', attribute: 'cost', type: 'hard', operator: 'lessThanOrEqual', value: 2000 },
        { id: 'e2', participantId: 'part-organizer', label: 'Must fit 40+ people', attribute: 'capacity', type: 'hard', operator: 'greaterThanOrEqual', value: 40 },
      ],
    },
    {
      id: 'part-team-lead',
      name: 'Team Lead',
      constraints: [
        { id: 'e3', participantId: 'part-team-lead', label: 'Prefers close venue', attribute: 'distanceMinutes', type: 'soft', operator: 'lessThanOrEqual', value: 20, weight: 3 },
        { id: 'e4', participantId: 'part-team-lead', label: 'Wants AV equipment', attribute: 'amenities', type: 'soft', operator: 'includes', value: 'AV equipment', weight: 2 },
      ],
    },
  ],
};

export const seedService: Decision = {
  id: 'seed-service',
  title: 'Choose a freelance web design agency',
  description: 'Pick a service provider to redesign the company website.',
  domain: 'service',
  createdAt: new Date().toISOString(),
  options: [
    {
      id: 'opt-pixel-studio',
      name: 'Pixel Studio',
      attributes: { price: 3500, rating: 4.8, turnaroundDays: 21, remote: true, certifications: ['Webflow Certified'] },
    },
    {
      id: 'opt-designhaus',
      name: 'DesignHaus',
      attributes: { price: 5000, rating: 4.9, turnaroundDays: 14, remote: true, certifications: ['Webflow Certified', 'Google Partner'] },
    },
    {
      id: 'opt-local-freelancer',
      name: 'Local Freelancer',
      attributes: { price: 1800, rating: 4.2, turnaroundDays: 30, remote: false, certifications: [] },
    },
  ],
  participants: [
    {
      id: 'part-founder',
      name: 'Founder',
      constraints: [
        { id: 's1', participantId: 'part-founder', label: 'Budget under $4000', attribute: 'price', type: 'hard', operator: 'lessThanOrEqual', value: 4000 },
        { id: 's2', participantId: 'part-founder', label: 'Rating at least 4.5', attribute: 'rating', type: 'hard', operator: 'greaterThanOrEqual', value: 4.5 },
      ],
    },
    {
      id: 'part-marketing',
      name: 'Marketing Lead',
      constraints: [
        { id: 's3', participantId: 'part-marketing', label: 'Prefers fast turnaround', attribute: 'turnaroundDays', type: 'soft', operator: 'lessThanOrEqual', value: 21, weight: 3 },
        { id: 's4', participantId: 'part-marketing', label: 'Prefers remote-friendly', attribute: 'remote', type: 'soft', operator: 'equals', value: true, weight: 1 },
      ],
    },
  ],
};

export const seedDecisions = [seedFood, seedEvent, seedService];


