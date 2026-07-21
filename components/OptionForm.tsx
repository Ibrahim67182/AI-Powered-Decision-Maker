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
    <div className="border border-slate-200 bg-slate-50 rounded-2xl p-5 space-y-4 shadow-sm">
      <input
        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"
        placeholder="Option name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        {schema.map(attr => (
          <div key={attr.key} className={attr.type === 'tags' ? 'col-span-2' : ''}>
            {attr.type === 'boolean' ? (
              <label className="flex items-center gap-3 text-slate-700 text-sm bg-white border border-slate-200 rounded-xl px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                <input
                  type="checkbox"
                  checked={values[attr.key]}
                  onChange={e => updateValue(attr.key, e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                {attr.label}
              </label>
            ) : (
              <input
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"
                type={attr.type === 'number' ? 'number' : 'text'}
                placeholder={attr.type === 'tags' ? `${attr.label} (comma separated)` : attr.label}
                value={values[attr.key]}
                onChange={e => updateValue(attr.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors font-medium">Cancel</button>
        <button onClick={handleSave} className="px-5 py-2 text-sm bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-violet-700 transition-all shadow-md active:scale-95">
          Save option
        </button>
      </div>
    </div>
  );
}