'use client';

import { useState } from 'react';
import { Option, Domain, DOMAIN_ATTRIBUTES } from '@/lib/types';

interface Props {
  initial: Option;
  domain: Domain;
  onSave: (option: Option) => void;
  onCancel: () => void;
}

export default function OptionForm({ initial, domain, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial.name);
  const schema = DOMAIN_ATTRIBUTES[domain];

  const [values, setValues] = useState<Record<string, any>>(() => {
    const initVals: Record<string, any> = {};
    for (const attr of schema) {
      const existing = initial.attributes[attr.key];
      if (attr.type === 'tags') initVals[attr.key] = Array.isArray(existing) ? existing.join(', ') : '';
      else if (attr.type === 'boolean') initVals[attr.key] = Boolean(existing);
      else initVals[attr.key] = existing ?? '';
    }
    return initVals;
  });

  const updateValue = (key: string, val: any) => setValues(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    const attributes: Option['attributes'] = {};
    for (const attr of schema) {
      const raw = values[attr.key];
      if (attr.type === 'number') attributes[attr.key] = Number(raw) || 0;
      else if (attr.type === 'boolean') attributes[attr.key] = Boolean(raw);
      else if (attr.type === 'tags') attributes[attr.key] = String(raw).split(',').map((t: string) => t.trim()).filter(Boolean);
      else attributes[attr.key] = String(raw);
    }
    onSave({ ...initial, name, attributes });
  };

  return (
    <div className="border border-zinc-700 bg-zinc-800 rounded-xl p-4 space-y-3">
      <input
        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-zinc-100"
        placeholder="Option name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        {schema.map(attr => (
          <div key={attr.key} className={attr.type === 'tags' ? 'col-span-2' : ''}>
            {attr.type === 'boolean' ? (
              <label className="flex items-center gap-2 text-zinc-300 text-sm bg-zinc-900 border border-zinc-700 rounded px-3 py-2">
                <input
                  type="checkbox"
                  checked={values[attr.key]}
                  onChange={e => updateValue(attr.key, e.target.checked)}
                />
                {attr.label}
              </label>
            ) : (
              <input
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-zinc-100"
                type={attr.type === 'number' ? 'number' : 'text'}
                placeholder={attr.type === 'tags' ? `${attr.label} (comma separated)` : attr.label}
                value={values[attr.key]}
                onChange={e => updateValue(attr.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
        <button onClick={handleSave} className="px-3 py-1.5 text-sm bg-amber-400 text-zinc-900 rounded font-medium hover:bg-amber-300">
          Save option
        </button>
      </div>
    </div>
  );
}