import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName?: string; totalPoints?: number; rank?: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((response) => {
        if (!active) return;
        setLeaderboard(response.leaderboard ?? []);
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
      title="Leaderboard"
      description="Compare team point totals."
      isLoading={loading}
      error={error}
      empty={leaderboard.length === 0}
      emptyMessage="leaderboard"
    >
      <ol className="mb-0 ps-3">
        {leaderboard.map((entry, index) => (
          <li key={`${entry.teamName ?? 'team'}-${index}`}>
            {entry.teamName ?? 'Team'} — {entry.totalPoints ?? 0} points (rank {entry.rank ?? index + 1})
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
