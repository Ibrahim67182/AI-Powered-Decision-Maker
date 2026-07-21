'use client';

import { useState } from 'react';
import { Participant, Constraint, ConstraintType, Operator, Domain, DOMAIN_ATTRIBUTES } from '@/lib/types';

interface Props {
  initial: Participant;
  domain: Domain;
  onSave: (participant: Participant) => void;
  onCancel: () => void;
}

export default function ParticipantForm({ initial, domain, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial.name);
  const [constraints, setConstraints] = useState<Constraint[]>(initial.constraints);
  const schema = DOMAIN_ATTRIBUTES[domain];

  const addConstraint = () => {
    setConstraints([
      ...constraints,
      {
        id: crypto.randomUUID(),
        participantId: initial.id,
        label: '',
        attribute: schema[0].key,
        type: 'soft',
        operator: 'equals',
        value: '',
        weight: 1,
      },
    ]);
  };

  const updateConstraint = (id: string, patch: Partial<Constraint>) => {
    setConstraints(cs => cs.map(c => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeConstraint = (id: string) => setConstraints(cs => cs.filter(c => c.id !== id));

  const handleSave = () => onSave({ ...initial, name, constraints });

  const attrType = (key: string) => schema.find(a => a.key === key)?.type ?? 'string';

  return (
    <div className="border border-slate-200 bg-slate-50 rounded-2xl p-5 space-y-4 shadow-sm">
      <input
        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"
        placeholder="Participant name"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <div className="space-y-2">
        {/* Column headers */}
        <div className="grid grid-cols-7 gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
          <span className="col-span-2">Label</span>
          <span>Attribute</span>
          <span>Operator</span>
          <span>Value</span>
          <span>Type</span>
          <span></span>
        </div>

        {constraints.map(c => (
          <div key={c.id} className="grid grid-cols-7 gap-2 items-center bg-white border border-slate-200 p-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm group">
            <input
              className="col-span-2 bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
              placeholder="Label"
              value={c.label}
              onChange={e => updateConstraint(c.id, { label: e.target.value })}
            />
            <select
              className="bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-lg px-2 py-1.5 text-sm text-slate-900 focus:outline-none transition-all"
              value={c.attribute}
              onChange={e => updateConstraint(c.id, { attribute: e.target.value })}
            >
              {schema.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
            <select
              className="bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-lg px-2 py-1.5 text-sm text-slate-900 focus:outline-none transition-all"
              value={c.operator}
              onChange={e => updateConstraint(c.id, { operator: e.target.value as Operator })}
            >
              {['equals', 'notEquals', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'includes', 'excludes'].map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>

            {attrType(c.attribute) === 'boolean' ? (
              <select
                className="bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-lg px-2 py-1.5 text-sm text-slate-900 focus:outline-none transition-all"
                value={String(c.value)}
                onChange={e => updateConstraint(c.id, { value: e.target.value === 'true' })}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : attrType(c.attribute) === 'number' ? (
              <input
                className="bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
                type="number"
                placeholder="Value"
                value={String(c.value)}
                onChange={e => updateConstraint(c.id, { value: Number(e.target.value) })}
              />
            ) : (
              <input
                className="bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
                placeholder="Value"
                value={String(c.value)}
                onChange={e => updateConstraint(c.id, { value: e.target.value })}
              />
            )}

            <select
              className="bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-lg px-2 py-1.5 text-sm text-slate-900 focus:outline-none transition-all"
              value={c.type}
              onChange={e => updateConstraint(c.id, { type: e.target.value as ConstraintType })}
            >
              <option value="hard">hard</option>
              <option value="soft">soft</option>
            </select>
            <button onClick={() => removeConstraint(c.id)} className="text-rose-500 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-700">Remove</button>
          </div>
        ))}
        <button onClick={addConstraint} className="text-indigo-600 text-sm font-bold hover:text-indigo-800 transition-colors flex items-center gap-1 mt-2 px-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add constraint</button>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors font-medium">Cancel</button>
        <button onClick={handleSave} className="px-5 py-2 text-sm bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-violet-700 transition-all shadow-md active:scale-95">
          Save participant
        </button>
      </div>
    </div>
  );
}