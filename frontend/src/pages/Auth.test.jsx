import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Auth from './Auth';

const mockLogin = vi.fn();

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe('Auth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders login tab by default with email and password inputs', () => {
    render(<MemoryRouter><Auth showToast={vi.fn()} /></MemoryRouter>);

    expect(screen.getByRole('button', { name: /^sign in$/i })).toHaveClass('text-red-500');
    expect(screen.getByPlaceholderText(/player@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/ManagerName/i)).not.toBeInTheDocument();
  });

  it('switches to register tab when clicking register', () => {
    render(<MemoryRouter><Auth showToast={vi.fn()} /></MemoryRouter>);

    const registerTab = screen.getByRole('button', { name: /^register$/i });
    fireEvent.click(registerTab);

    expect(registerTab).toHaveClass('text-red-500');
    expect(screen.getByPlaceholderText(/ManagerName/i)).toBeInTheDocument();
  });

  it('triggers showToast error if fields are missing on submit', async () => {
    const mockShowToast = vi.fn();
    render(<MemoryRouter><Auth showToast={mockShowToast} /></MemoryRouter>);

    // Submit the form directly to bypass HTML5 validation blocks in JSDOM
    const submitBtn = screen.getByRole('button', { name: /sign in manager/i });
    const form = submitBtn.closest('form');
    fireEvent.submit(form);

    expect(mockShowToast).toHaveBeenCalledWith('Please fill in all fields', 'error');
  });

  it('performs successful login call and sets context', async () => {
    const mockShowToast = vi.fn();

    // Mock successful login fetch response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'fake-jwt-token',
        user: { email: 'manager@motogp.com', username: 'testuser', role: 'player' }
      })
    });

    render(<MemoryRouter><Auth showToast={mockShowToast} /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText(/player@example.com/i), {
      target: { value: 'manager@motogp.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'password123' }
    });

    const submitBtn = screen.getByRole('button', { name: /sign in manager/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
      expect(mockLogin).toHaveBeenCalledWith(expect.any(Object));
      expect(mockShowToast).toHaveBeenCalledWith('Welcome back to GP Masters Manager!', 'success');
    });
  });

  it('handles backend error message on failed login', async () => {
    const mockShowToast = vi.fn();

    // Mock error response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' })
    });

    render(<MemoryRouter><Auth showToast={mockShowToast} /></MemoryRouter>);

    fireEvent.change(screen.getByPlaceholderText(/player@example.com/i), {
      target: { value: 'manager@motogp.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'wrongpassword' }
    });

    const submitBtn = screen.getByRole('button', { name: /sign in manager/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Invalid credentials', 'error');
    });
  });
});
