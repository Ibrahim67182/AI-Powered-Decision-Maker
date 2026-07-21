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
import AssistantPanel from '@/components/AssistantPnael';


export default function Home() {
  const [decision, setDecision] = useState<Decision>(seedDecisions[0]);
  const [allDecisions, setAllDecisions] = useState<Record<string, Decision>>({});
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [expandedParticipants, setExpandedParticipants] = useState<Set<string>>(new Set());
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

  const toggleParticipantExpanded = (id: string) => {
    setExpandedParticipants(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const editingOption = decision.options.find(o => o.id === editingOptionId);
  const editingParticipant = decision.participants.find(p => p.id === editingParticipantId);

  return (
    <main className="min-h-screen relative bg-slate-50 text-slate-900 p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Background accents */}
      <div className="fixed inset-0 -z-10 bg-slate-50">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-100 rounded-full blur-[100px] opacity-60 pointer-events-none" />
      </div>

      {/* 1. Global Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          <select
            className="text-base font-bold bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none cursor-pointer shadow-sm"
            value={decision.id}
            onChange={e => loadDecisionById(e.target.value)}
          >
            {Object.values(allDecisions).map(d => (
              <option key={d.id} value={d.id}>
                {d.title || 'Untitled decision'}
              </option>
            ))}
          </select>
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent hidden sm:block">
          AI Powered Decision Room
        </h1>
      </div>

      {/* 2. The Examples Box */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            Interactive Examples
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Demo of how the decision engine works. Click an example below to load a pre-filled decision and see the AI in action!
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {seedDecisions.map(d => (
            <button 
              key={d.id} 
              onClick={() => setDecision(d)}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-medium transition-colors border border-indigo-100 flex items-center gap-2"
            >
              <span className="text-indigo-400 text-xs uppercase font-bold">{DOMAIN_LABELS[d.domain]}</span>
              {d.title}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Create Decision Box */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-2xl shadow-md border border-indigo-500 p-6 space-y-4 relative overflow-hidden">
        <div className="absolute -top-4 -right-4 opacity-10 pointer-events-none">
           <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"/></svg>
        </div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold">Start a New Decision</h2>
          <p className="text-indigo-100 text-sm mt-1 font-medium">Select a domain to create a blank canvas.</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <button onClick={() => startNewDecision('event')} className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl font-bold transition-colors shadow-sm">Event</button>
            <button onClick={() => startNewDecision('service')} className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl font-bold transition-colors shadow-sm">Service</button>
            <button onClick={() => startNewDecision('food')} className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl font-bold transition-colors shadow-sm">Food Planning</button>
          </div>
        </div>
      </section>

      {/* 4. The Active Decision Workspace (Single Large Box) */}
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-12">
        
        {/* Name Edit & Delete */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Decision</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                {DOMAIN_LABELS[decision.domain]}
              </span>
            </div>
            <input
              className="text-3xl md:text-4xl font-extrabold bg-transparent border-b-2 border-transparent hover:border-slate-200 focus:border-indigo-500 outline-none w-full transition-colors pb-1 placeholder:text-slate-300 text-slate-900"
              value={decision.title}
              onChange={e => updateTitle(e.target.value)}
              placeholder="Untitled decision"
            />
          </div>
          <button
            onClick={() => deleteCurrentFromList(decision.id)}
            className="text-sm text-rose-600 bg-rose-50 hover:bg-rose-100 px-5 py-2.5 rounded-xl transition-colors font-bold border border-rose-100 whitespace-nowrap"
          >
            Delete Decision
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">1. Options</h2>
            <button onClick={addOption} className="text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-colors shadow-sm">
              + Add option
            </button>
          </div>
          {editingOption && (
            <OptionForm
              initial={editingOption}
              domain={decision.domain}
              onSave={saveOption}
              onCancel={() => setEditingOptionId(null)}
            />
          )}
          {decision.options.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
              No options yet — add at least one to get started.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {decision.options.map(o => (
                <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 hover:border-slate-300 shadow-sm transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg text-slate-900">{o.name || 'Untitled option'}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                      {Object.entries(o.attributes).map(([key, value]) => (
                        <span key={key} className="bg-slate-50 border border-slate-200 rounded-full px-3 py-1 font-medium">
                          <span className="text-slate-400 mr-1">{key}:</span> 
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 text-sm font-bold opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingOptionId(o.id)} className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-colors">Edit</button>
                    <button onClick={() => deleteOption(o.id)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-colors">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">2. Participants & Constraints</h2>
            <button onClick={addParticipant} className="text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-colors shadow-sm">
              + Add participant
            </button>
          </div>
          {editingParticipant && (
            <ParticipantForm
              initial={editingParticipant}
              domain={decision.domain}
              onSave={saveParticipant}
              onCancel={() => setEditingParticipantId(null)}
            />
          )}
          <div className="flex flex-col gap-3">
            {decision.participants.map(p => (
              <div key={p.id} className="text-sm bg-slate-50 border border-slate-200 rounded-2xl flex flex-col shadow-sm group overflow-hidden">
                <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleParticipantExpanded(p.id)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <svg className={`w-5 h-5 transition-transform ${expandedParticipants.has(p.id) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <span className="font-bold text-slate-800 text-lg">{p.name || 'Unnamed'}</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full">{p.constraints.length} constraints</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingParticipantId(p.id)} className="text-slate-600 hover:text-slate-900 font-bold transition-colors px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100">Edit</button>
                    <button onClick={() => deleteParticipant(p.id)} className="text-rose-500 hover:text-rose-700 font-bold transition-colors px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-rose-50">Delete</button>
                  </div>
                </div>
                {expandedParticipants.has(p.id) && p.constraints.length > 0 && (
                  <div className="px-5 pb-4 pt-2 border-t border-slate-200 bg-white">
                    <ul className="space-y-2">
                      {p.constraints.map(c => (
                        <li key={c.id} className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-700">{c.label || 'Unnamed rule'}:</span>
                          <span className="text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            {c.attribute} {c.operator} {String(c.value)}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded uppercase text-[9px] font-bold ${c.type === 'hard' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {c.type}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {decision.participants.length === 0 && !editingParticipant && (
              <div className="text-sm text-slate-400 font-medium py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">No participants added.</div>
            )}
          </div>
        </div>

        {/* Ranking */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900">3. Ranking Results</h2>
          <RankingPanel decision={decision} />
        </div>

        {/* AI Assistant */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-3">
            <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            4. AI Assistant
          </h2>
          <AssistantPanel decision={decision} />
        </div>

      </section>
    </main>
  );
}