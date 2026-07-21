'use client';

import { useState, useEffect } from 'react';
import { Decision, Domain, DOMAIN_LABELS } from '@/lib/types';
import { createEmptyDecision, createEmptyOption, createEmptyParticipant } from '@/lib/decisionFactory';
import { seedDecisions } from '@/lib/seedData';
import {
  loadAllDecisions,
  saveDecisionToList,
  deleteDecisionFromList,
  getCurrentId,
  setCurrentId,
} from '@/lib/storage';
import RankingPanel from '@/components/RankingPanel';
import OptionForm from '@/components/OptionForm';
import ParticipantForm from '@/components/ParticipantForm';

export default function Home() {
  const [decision, setDecision] = useState<Decision>(seedDecisions[0]);
  const [allDecisions, setAllDecisions] = useState<Record<string, Decision>>({});
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // on mount: load everything saved, restore whichever decision was last active,
  // or fall back to the seed (and save the seed so it shows up in "your decisions" too)
  useEffect(() => {
    const saved = loadAllDecisions();
    const currentId = getCurrentId();

    if (Object.keys(saved).length === 0) {
      saveDecisionToList(seedDecisions[0]);
      setCurrentId(seedDecisions[0].id);
      setAllDecisions({ [seedDecisions[0].id]: seedDecisions[0] });
      setDecision(seedDecisions[0]);
    } else {
      setAllDecisions(saved);
      const active = currentId && saved[currentId] ? saved[currentId] : Object.values(saved)[0];
      setDecision(active);
      setCurrentId(active.id);
    }
    setHydrated(true);
  }, []);

  // persist current decision into the collection on every change
  useEffect(() => {
    if (!hydrated) return;
    saveDecisionToList(decision);
    setCurrentId(decision.id);
    setAllDecisions(prev => ({ ...prev, [decision.id]: decision }));
  }, [decision, hydrated]);

  const updateTitle = (title: string) => setDecision(prev => ({ ...prev, title }));

  const startNewDecision = (domain: Domain) => setDecision(createEmptyDecision(domain));

  const loadDecisionById = (id: string) => {
    const target = allDecisions[id];
    if (target) setDecision(target);
  };

  const deleteCurrentFromList = (id: string) => {
    deleteDecisionFromList(id);
    setAllDecisions(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (decision.id === id) {
      const remaining = Object.values(allDecisions).filter(d => d.id !== id);
      setDecision(remaining[0] ?? createEmptyDecision('food'));
    }
  };

  const addOption = () => {
    const opt = createEmptyOption();
    setDecision(prev => ({ ...prev, options: [...prev.options, opt] }));
    setEditingOptionId(opt.id);
  };
  const saveOption = (opt: Parameters<typeof OptionForm>[0]['initial']) => {
    setDecision(prev => ({
      ...prev,
      options: prev.options.map(o => (o.id === opt.id ? opt : o)),
    }));
    setEditingOptionId(null);
  };
  const deleteOption = (id: string) =>
    setDecision(prev => ({ ...prev, options: prev.options.filter(o => o.id !== id) }));

  const addParticipant = () => {
    const p = createEmptyParticipant();
    setDecision(prev => ({ ...prev, participants: [...prev.participants, p] }));
    setEditingParticipantId(p.id);
  };
  const saveParticipant = (p: Parameters<typeof ParticipantForm>[0]['initial']) => {
    setDecision(prev => ({
      ...prev,
      participants: prev.participants.map(x => (x.id === p.id ? p : x)),
    }));
    setEditingParticipantId(null);
  };
  const deleteParticipant = (id: string) =>
    setDecision(prev => ({ ...prev, participants: prev.participants.filter(p => p.id !== id) }));

  const editingOption = decision.options.find(o => o.id === editingOptionId);
  const editingParticipant = decision.participants.find(p => p.id === editingParticipantId);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6 max-w-5xl mx-auto space-y-8">

      <header className="flex items-center justify-between gap-4 flex-wrap">
        <input
          className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-amber-400 outline-none flex-1"
          value={decision.title}
          onChange={e => updateTitle(e.target.value)}
          placeholder="Untitled decision"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="text-sm bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-zinc-300"
            value={decision.id}
            onChange={e => loadDecisionById(e.target.value)}
          >
            {Object.values(allDecisions).map(d => (
              <option key={d.id} value={d.id}>
                {d.title || 'Untitled decision'}
              </option>
            ))}
          </select>

          <select
            className="text-sm bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-zinc-300"
            onChange={e => {
              const found = seedDecisions.find(d => d.id === e.target.value);
              if (found) setDecision(found);
              e.target.value = '';
            }}
            defaultValue=""
          >
            <option value="" disabled>Load example…</option>
            {seedDecisions.map(d => (
              <option key={d.id} value={d.id}>
                {DOMAIN_LABELS[d.domain]}: {d.title}
              </option>
            ))}
          </select>

          <select
            className="text-sm bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-zinc-300"
            onChange={e => {
              if (e.target.value) startNewDecision(e.target.value as Domain);
              e.target.value = '';
            }}
            defaultValue=""
          >
            <option value="" disabled>New decision…</option>
            <option value="event">Event</option>
            <option value="service">Service</option>
            <option value="food">Food Planning</option>
          </select>

          <button
            onClick={() => deleteCurrentFromList(decision.id)}
            className="text-sm text-zinc-400 hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Options <span className="text-sm text-zinc-500 font-normal">({DOMAIN_LABELS[decision.domain]})</span>
          </h2>
          <button onClick={addOption} className="text-sm bg-amber-400 text-zinc-900 px-3 py-1.5 rounded font-medium hover:bg-amber-300">
            + Add option
          </button>
        </div>

        {editingOption && (
          <div className="mb-3">
            <OptionForm
              initial={editingOption}
              domain={decision.domain}
              onSave={saveOption}
              onCancel={() => setEditingOptionId(null)}
            />
          </div>
        )}

        {decision.options.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-700 rounded-xl">
            No options yet — add at least one.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {decision.options.map(o => (
              <div key={o.id} className="rounded-xl border border-zinc-700 bg-zinc-800 p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-zinc-100">{o.name || 'Untitled option'}</h3>
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => setEditingOptionId(o.id)} className="text-zinc-400 hover:text-amber-400">Edit</button>
                    <button onClick={() => deleteOption(o.id)} className="text-zinc-400 hover:text-red-400">Delete</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                  {Object.entries(o.attributes).map(([key, value]) => (
                    <span key={key} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1">
                      {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Participants</h2>
          <button onClick={addParticipant} className="text-sm bg-amber-400 text-zinc-900 px-3 py-1.5 rounded font-medium hover:bg-amber-300">
            + Add participant
          </button>
        </div>
        {editingParticipant && (
          <div className="mb-3">
            <ParticipantForm
              initial={editingParticipant}
              domain={decision.domain}
              onSave={saveParticipant}
              onCancel={() => setEditingParticipantId(null)}
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {decision.participants.map(p => (
            <div key={p.id} className="text-sm bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 flex items-center gap-2">
              {p.name || 'Unnamed'} ({p.constraints.length} constraints)
              <button onClick={() => setEditingParticipantId(p.id)} className="text-amber-400 text-xs">edit</button>
              <button onClick={() => deleteParticipant(p.id)} className="text-red-400 text-xs">×</button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Ranking</h2>
        <RankingPanel decision={decision} onEditOption={setEditingOptionId} onDeleteOption={deleteOption} />
      </section>
    </main>
  );
}