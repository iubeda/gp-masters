import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StandingsTable from './StandingsTable';

describe('StandingsTable Component - Expulsar logic', () => {
  const championshipBase = {
    created_by: 'creator@test.com',
    team_count: 3,
    circuits: [{ status: 'scheduled' }]
  };

  const adminUser = { email: 'admin@test.com', role: 'admin' };
  const creatorUser = { email: 'creator@test.com', role: 'player' };

  const teamsBase = [
    {
      id: 1,
      team_name: 'Creator Team',
      user_email: 'creator@test.com',
      owner_name: 'Creator',
      pilot_name: 'Pilot 1',
      motorcycle_name: 'Moto 1',
      total_points: 0,
      races_completed: 0,
      is_kicked: false
    },
    {
      id: 2,
      team_name: 'Normal Team',
      user_email: 'normal@test.com',
      owner_name: 'Normal',
      pilot_name: 'Pilot 2',
      motorcycle_name: 'Moto 2',
      total_points: 0,
      races_completed: 0,
      is_kicked: false
    },
    {
      id: 3,
      team_name: 'Raced Team',
      user_email: 'raced@test.com',
      owner_name: 'Raced',
      pilot_name: 'Pilot 3',
      motorcycle_name: 'Moto 3',
      total_points: 25,
      races_completed: 1, // Has raced!
      is_kicked: false
    }
  ];

  it('renders correctly and shows Expulsar only for eligible teams when logged in as Creator', () => {
    const onKickMock = vi.fn();
    render(
      <StandingsTable
        teams={teamsBase}
        user={creatorUser}
        isCreator={true}
        championship={championshipBase}
        onKick={onKickMock}
      />
    );

    const kickButtons = screen.getAllByText('Expulsar');
    expect(kickButtons).toHaveLength(1); // Only for "Normal Team"

    // Click the button to ensure it fires correctly
    fireEvent.click(kickButtons[0]);
    expect(onKickMock).toHaveBeenCalledWith(teamsBase[1]); // Normal Team
  });

  it('renders correctly and shows Expulsar only for eligible teams when logged in as Admin', () => {
    render(
      <StandingsTable
        teams={teamsBase}
        user={adminUser}
        isCreator={false}
        championship={championshipBase}
        onKick={vi.fn()}
      />
    );

    const kickButtons = screen.getAllByText('Expulsar');
    // Admin should NOT see it for Creator Team, NOT for Raced Team, NOT for themselves.
    // They should only see it for Normal Team.
    expect(kickButtons).toHaveLength(1);
  });

  it('does NOT show Expulsar button once the championship has started (unless Admin)', () => {
    const startedChampionship = { ...championshipBase, circuits: [{ status: 'completed' }] };
    
    // Creator view - championship started
    const { unmount } = render(
      <StandingsTable
        teams={teamsBase}
        user={creatorUser}
        isCreator={true}
        championship={startedChampionship}
        onKick={vi.fn()}
      />
    );
    expect(screen.queryByText('Expulsar')).not.toBeInTheDocument();
    unmount();

    // Admin view - championship started (Admin can still kick, but only normal teams that haven't raced)
    render(
      <StandingsTable
        teams={teamsBase}
        user={adminUser}
        isCreator={false}
        championship={startedChampionship}
        onKick={vi.fn()}
      />
    );
    const kickButtons = screen.getAllByText('Expulsar');
    expect(kickButtons).toHaveLength(1);
  });
});
