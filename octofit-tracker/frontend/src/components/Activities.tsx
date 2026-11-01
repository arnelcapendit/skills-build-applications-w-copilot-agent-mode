import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = { type?: string; minutes?: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ activities: ActivityRecord[] }>('/api/activities')
      .then((response) => {
        if (!active) return;
        setActivities(response.activities ?? []);
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
      title="Activities"
      description="Track student activity minutes and points."
      isLoading={loading}
      error={error}
      empty={activities.length === 0}
      emptyMessage="activities"
    >
      <ul className="list-group list-group-flush">
        {activities.map((activity, index) => (
          <li key={`${activity.type ?? 'activity'}-${index}`} className="list-group-item">
            {activity.type ?? 'Activity'} • {activity.minutes ?? 0} minutes • {activity.points ?? 0} points
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
