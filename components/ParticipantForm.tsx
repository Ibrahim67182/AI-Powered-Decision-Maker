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
    <div className="border border-zinc-700 bg-zinc-800 rounded-xl p-4 space-y-3">
      <input
        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-zinc-100"
        placeholder="Participant name"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <div className="space-y-2">
        {/* Column headers */}
        <div className="grid grid-cols-7 gap-1 text-xs text-zinc-500 px-2">
          <span className="col-span-2">Label</span>
          <span>Attribute</span>
          <span>Operator</span>
          <span>Value</span>
          <span>Type</span>
          <span></span>
        </div>

        {constraints.map(c => (
          <div key={c.id} className="grid grid-cols-7 gap-1 items-center bg-zinc-900 p-2 rounded">
            <input
              className="col-span-2 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100"
              placeholder="Label"
              value={c.label}
              onChange={e => updateConstraint(c.id, { label: e.target.value })}
            />
            <select
              className="bg-zinc-800 border border-zinc-700 rounded px-1 py-1 text-sm text-zinc-100"
              value={c.attribute}
              onChange={e => updateConstraint(c.id, { attribute: e.target.value })}
            >
              {schema.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
            <select
              className="bg-zinc-800 border border-zinc-700 rounded px-1 py-1 text-sm text-zinc-100"
              value={c.operator}
              onChange={e => updateConstraint(c.id, { operator: e.target.value as Operator })}
            >
              {['equals', 'notEquals', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'includes', 'excludes'].map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>

            {attrType(c.attribute) === 'boolean' ? (
              <select
                className="bg-zinc-800 border border-zinc-700 rounded px-1 py-1 text-sm text-zinc-100"
                value={String(c.value)}
                onChange={e => updateConstraint(c.id, { value: e.target.value === 'true' })}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : attrType(c.attribute) === 'number' ? (
              <input
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100"
                type="number"
                placeholder="Value"
                value={String(c.value)}
                onChange={e => updateConstraint(c.id, { value: Number(e.target.value) })}
              />
            ) : (
              <input
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100"
                placeholder="Value"
                value={String(c.value)}
                onChange={e => updateConstraint(c.id, { value: e.target.value })}
              />
            )}

            <select
              className="bg-zinc-800 border border-zinc-700 rounded px-1 py-1 text-sm text-zinc-100"
              value={c.type}
              onChange={e => updateConstraint(c.id, { type: e.target.value as ConstraintType })}
            >
              <option value="hard">hard</option>
              <option value="soft">soft</option>
            </select>
            <button onClick={() => removeConstraint(c.id)} className="text-red-400 text-xs">Remove</button>
          </div>
        ))}
        <button onClick={addConstraint} className="text-amber-400 text-sm hover:text-amber-300">+ Add constraint</button>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
        <button onClick={handleSave} className="px-3 py-1.5 text-sm bg-amber-400 text-zinc-900 rounded font-medium hover:bg-amber-300">
          Save participant
        </button>
      </div>
    </div>
  );
}