import { Decision } from './types';

const DECISIONS_KEY = 'decision-room-decisions'; // map of id -> Decision
const CURRENT_KEY = 'decision-room-current-id';   // which decision is active

export function loadAllDecisions(): Record<string, Decision> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(DECISIONS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Decision>) : {};
  } catch {
    return {};
  }
}

export function saveDecisionToList(decision: Decision): void {
  if (typeof window === 'undefined') return;
  try {
    const all = loadAllDecisions();
    all[decision.id] = decision;
    localStorage.setItem(DECISIONS_KEY, JSON.stringify(all));
  } catch {
    // storage unavailable — app still works in-memory
  }
}

export function deleteDecisionFromList(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const all = loadAllDecisions();
    delete all[id];
    localStorage.setItem(DECISIONS_KEY, JSON.stringify(all));
  } catch {}
}

export function getCurrentId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_KEY);
}

export function setCurrentId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_KEY, id);
}