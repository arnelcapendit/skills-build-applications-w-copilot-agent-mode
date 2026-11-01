import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title?: string; focus?: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then((response) => {
        if (!active) return;
        setSuggestions(response.suggestions ?? []);
        setLoading(false);
      })
      .catch((fetchError: Error) => {
        if (!active) return;
        setError(fetchError.message);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      isLoading={loading}
      error={error}
      empty={suggestions.length === 0}
      emptyMessage="workout suggestions"
    >
      <ul className="list-group list-group-flush">
        {suggestions.map((suggestion, index) => (
          <li key={`${suggestion.title ?? 'workout'}-${index}`} className="list-group-item">
            <strong>{suggestion.title ?? 'Workout'}</strong>
            {suggestion.focus ? ` • ${suggestion.focus}` : ''}
            {suggestion.reason ? <div>{suggestion.reason}</div> : null}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
