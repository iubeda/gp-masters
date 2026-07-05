import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChampionshipTabs from './ChampionshipTabs';

describe('ChampionshipTabs Component', () => {
  const activeGP = {
    name: 'Jerez',
    practice_date: '2026-07-06',
    qualifying_date: '2026-07-07',
    race_date: '2026-07-08'
  };

  it('renders base tabs: Dashboard and Calendario', () => {
    render(
      <ChampionshipTabs
        activeTab="dashboard"
        onTabChange={vi.fn()}
        activeGP={activeGP}
        isMember={false}
        userRole="player"
        todayStr="2026-07-01"
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Calendario')).toBeInTheDocument();
    expect(screen.queryByText(/GP Activo/)).not.toBeInTheDocument();
  });

  it('shows GP Activo tab for a regular member if the practice date has arrived', () => {
    render(
      <ChampionshipTabs
        activeTab="dashboard"
        onTabChange={vi.fn()}
        activeGP={activeGP}
        isMember={true}
        userRole="player"
        todayStr="2026-07-07"
      />
    );

    expect(screen.getByText(/GP Activo: Jerez/)).toBeInTheDocument();
  });

  it('does NOT show GP Activo tab for a regular member if today is before the practice date', () => {
    render(
      <ChampionshipTabs
        activeTab="dashboard"
        onTabChange={vi.fn()}
        activeGP={activeGP}
        isMember={true}
        userRole="player"
        todayStr="2026-07-05"
      />
    );

    expect(screen.queryByText(/GP Activo/)).not.toBeInTheDocument();
  });

  it('shows GP Activo tab for an admin even if today is before the practice date', () => {
    render(
      <ChampionshipTabs
        activeTab="dashboard"
        onTabChange={vi.fn()}
        activeGP={activeGP}
        isMember={false}
        userRole="admin"
        todayStr="2026-07-05"
      />
    );

    expect(screen.getByText(/GP Activo: Jerez/)).toBeInTheDocument();
  });

  it('triggers onTabChange when tabs are clicked', () => {
    const handleTabChange = vi.fn();
    render(
      <ChampionshipTabs
        activeTab="dashboard"
        onTabChange={handleTabChange}
        activeGP={activeGP}
        isMember={true}
        userRole="player"
        todayStr="2026-07-07"
      />
    );

    fireEvent.click(screen.getByText('Calendario'));
    expect(handleTabChange).toHaveBeenCalledWith('calendar');
  });
});
