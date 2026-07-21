'use client';

import { Decision } from '@/lib/types';
import { calculateScores, findConflicts } from '@/lib/deterministicEngine';
import OptionCard from './OptionCard';

interface Props {
  decision: Decision;
}

export default function RankingPanel({ decision }: Props) {
  if (decision.options.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
        Add options above to see a ranking here.
      </div>
    );
  }

  if (decision.participants.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
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
        <div className="text-center py-6 text-rose-600 border-2 border-dashed border-rose-200 bg-rose-50 rounded-xl font-medium">
          No option satisfies every hard constraint. Review requirements below.
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="space-y-2">
          {conflicts.map((c, i) => (
            <div
              key={i}
              className={`text-sm rounded-xl px-4 py-3 border-l-4 shadow-sm ${
                c.severity === 'critical'
                  ? 'border-l-rose-500 border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-l-amber-500 border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              <span className="font-bold">
                {c.severity === 'critical' ? 'Conflict: ' : 'Trade-off: '}
              </span>
              {c.description}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {scored.map(s => (
          <OptionCard
            key={s.option.id}
            scored={s}
            isTopPick={s.option.id === topPickId}
          />
        ))}
      </div>
    </div>
  );
}