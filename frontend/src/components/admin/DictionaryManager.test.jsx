import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DictionaryManager from './DictionaryManager';
import { useAuth } from '../../context/AuthContext';

// Mock the AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('DictionaryManager Component', () => {
  const mockApiFetch = vi.fn();
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      apiFetch: mockApiFetch,
      user: { role: 'admin' },
    });
  });

  it('renders loading state initially', () => {
    mockApiFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<DictionaryManager type="pilots" showToast={mockShowToast} />);
    expect(screen.getByText(/Cargando pilotos/i)).toBeInTheDocument();
  });

  it('fetches and renders pilots correctly', async () => {
    const mockPilots = [
      { id: 1, name: 'Pilot A', talent: 90, consistency: 80, aggressiveness: 70, experience: 85, fitness: 95 },
    ];
    mockApiFetch.mockResolvedValueOnce(mockPilots);

    render(<DictionaryManager type="pilots" showToast={mockShowToast} />);

    await waitFor(() => {
      expect(screen.queryByText(/Cargando pilotos/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Pilot A')).toBeInTheDocument();
    expect(screen.getByText('Diccionario de Pilotos')).toBeInTheDocument();
  });

  it('toggles the add form when button is clicked', async () => {
    mockApiFetch.mockResolvedValueOnce([]); // Empty list

    render(<DictionaryManager type="pilots" showToast={mockShowToast} />);

    await waitFor(() => {
      expect(screen.getByText('Diccionario de Pilotos')).toBeInTheDocument();
    });

    const addButton = screen.getByText(/Añadir Nuevo/i);
    fireEvent.click(addButton);

    expect(screen.getByText('Nuevo Piloto')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Introduce nombre')).toBeInTheDocument();

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Nuevo Piloto')).not.toBeInTheDocument();
  });

  it('submits a new record successfully', async () => {
    mockApiFetch.mockResolvedValueOnce([]); // Initial fetch
    
    const newPilotResponse = { id: 2, name: 'New Pilot', talent: 80, consistency: 80, aggressiveness: 80, experience: 80, fitness: 80 };
    mockApiFetch.mockResolvedValueOnce(newPilotResponse); // Post response

    render(<DictionaryManager type="pilots" showToast={mockShowToast} />);

    await waitFor(() => {
      expect(screen.getByText('Diccionario de Pilotos')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Añadir Nuevo/i));

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Introduce nombre'), { target: { value: 'New Pilot' } });
    fireEvent.change(screen.getByPlaceholderText('Introduce talento'), { target: { value: '80' } });
    fireEvent.change(screen.getByPlaceholderText('Introduce consistencia'), { target: { value: '80' } });
    fireEvent.change(screen.getByPlaceholderText('Introduce agresividad'), { target: { value: '80' } });
    fireEvent.change(screen.getByPlaceholderText('Introduce experiencia'), { target: { value: '80' } });
    fireEvent.change(screen.getByPlaceholderText('Introduce forma física'), { target: { value: '80' } });

    fireEvent.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/api/admin/dictionaries/pilots', expect.objectContaining({
        method: 'POST',
      }));
    });

    expect(mockShowToast).toHaveBeenCalledWith('Registro añadido correctamente.', 'success');
    expect(screen.getByText('New Pilot')).toBeInTheDocument();
  });

  it('handles API errors when fetching', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<DictionaryManager type="pilots" showToast={mockShowToast} />);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Network error', 'error');
    });
  });
});
