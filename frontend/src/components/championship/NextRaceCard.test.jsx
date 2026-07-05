import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NextRaceCard from './NextRaceCard';

describe('NextRaceCard Component', () => {
  const activeGP = {
    order: 1,
    name: 'Jerez',
    distance: 4423,
    curves_right: 8,
    curves_left: 5,
    practice_date: '2026-07-06',
    qualifying_date: '2026-07-07',
    race_date: '2026-07-08'
  };

  it('renders upcoming GP details correctly', () => {
    render(
      <NextRaceCard
        activeGP={activeGP}
        hasCircuits={true}
        isMember={true}
        userRole="player"
        todayStr="2026-07-01"
        isCreator={false}
        onSimulate={vi.fn()}
      />
    );

    expect(screen.getByText('Jerez')).toBeInTheDocument();
    expect(screen.getByText('GP #1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Simular este circuito/i })).not.toBeInTheDocument();
  });

  it('renders simulation button for members once practice date arrives', () => {
    const handleSimulate = vi.fn();
    render(
      <NextRaceCard
        activeGP={activeGP}
        hasCircuits={true}
        isMember={true}
        userRole="player"
        todayStr="2026-07-07"
        isCreator={false}
        onSimulate={handleSimulate}
      />
    );

    const button = screen.getByRole('button', { name: /Simular este circuito/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleSimulate).toHaveBeenCalledTimes(1);
  });

  it('renders simulation button for admin even if practice date is in the future', () => {
    const handleSimulate = vi.fn();
    render(
      <NextRaceCard
        activeGP={activeGP}
        hasCircuits={true}
        isMember={false}
        userRole="admin"
        todayStr="2026-07-01"
        isCreator={false}
        onSimulate={handleSimulate}
      />
    );

    const button = screen.getByRole('button', { name: /Simular este circuito/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleSimulate).toHaveBeenCalledTimes(1);
  });
});
