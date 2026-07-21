'use client';

import { Decision } from '@/lib/types';
import { calculateScores, findConflicts } from '@/lib/deterministicEngine';
import OptionCard from './OptionCard';

interface Props {
  decision: Decision;
  onEditOption: (id: string) => void;
  onDeleteOption: (id: string) => void;
}

export default function RankingPanel({ decision, onEditOption, onDeleteOption }: Props) {
  if (decision.options.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-700 rounded-xl">
        Add options above to see a ranking here.
      </div>
    );
  }

  if (decision.participants.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-700 rounded-xl">
        Add participants with preferences to rank these options.
      </div>
    );
  }

  const scored = calculateScores(decision);
  const conflicts = findConflicts(decision);
  const qualified = scored.filter(s => !s.disqualified);
  const topPickId = qualified[0]?.option.id;

  return (
    <div className="space-y-4">
      {qualified.length === 0 && (
        <div className="text-center py-6 text-red-400 border border-red-900 bg-red-950/30 rounded-xl">
          No option satisfies every hard constraint. Review requirements below.
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="space-y-2">
          {conflicts.map((c, i) => (
            <div
              key={i}
              className={`text-sm rounded-lg px-3 py-2 border ${
                c.severity === 'critical'
                  ? 'border-red-800 bg-red-950/30 text-red-300'
                  : 'border-amber-800 bg-amber-950/20 text-amber-300'
              }`}
            >
              <span className="font-medium">
                {c.severity === 'critical' ? 'Conflict: ' : 'Trade-off: '}
              </span>
              {c.description}
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {scored.map(s => (
          <OptionCard
            key={s.option.id}
            scored={s}
            isTopPick={s.option.id === topPickId}
            onEdit={() => onEditOption(s.option.id)}
            onDelete={() => onDeleteOption(s.option.id)}
          />
        ))}
      </div>
    </div>
  );
}