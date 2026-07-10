import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CircuitHeader from './CircuitHeader';

describe('CircuitHeader Component', () => {
  const mockCircuit = {
    name: 'Jerez',
    country: 'Spain',
    laps: 12,
    distance: 4.4,
    image_url: '/jerez.jpg',
    curves_right: 5,
    curves_left: 8
  };

  it('renders normally without global bypass badge', () => {
    render(
      <CircuitHeader
        circuit={mockCircuit}
        sessionLabel="Carrera"
        currentWeather="Soleado"
        isGlobalBypass={false}
      />
    );

    expect(screen.getByText(/Carrera/i)).toBeInTheDocument();
    expect(screen.getByText('Jerez')).toBeInTheDocument();
    expect(screen.queryByText(/Horarios Abiertos/i)).not.toBeInTheDocument();
  });

  it('renders global bypass badge when isGlobalBypass is true', () => {
    render(
      <CircuitHeader
        circuit={mockCircuit}
        sessionLabel="Entrenamientos Libres"
        currentWeather="Lluvia"
        isGlobalBypass={true}
      />
    );

    expect(screen.getByText(/Entrenamientos Libres/i)).toBeInTheDocument();
    expect(screen.getByText('Jerez')).toBeInTheDocument();
    
    // Check for the bypass badge text
    expect(screen.getByText(/Horarios Abiertos/i)).toBeInTheDocument();
  });
});
