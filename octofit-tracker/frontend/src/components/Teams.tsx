import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = { name?: string; mascot?: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ teams: TeamRecord[] }>('/api/teams')
      .then((response) => {
        if (!active) return;
        setTeams(response.teams ?? []);
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
      title="Teams"
      description="Manage teams and members."
      isLoading={loading}
      error={error}
      empty={teams.length === 0}
      emptyMessage="teams"
    >
      <ul className="list-group list-group-flush">
        {teams.map((team, index) => (
          <li key={`${team.name ?? 'team'}-${index}`} className="list-group-item">
            <strong>{team.name ?? 'Team'}</strong> • {team.mascot ?? 'Mascot'} • {team.members?.length ?? 0} members
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
