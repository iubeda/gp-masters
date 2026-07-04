import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Toast from './Toast';

describe('Toast Component', () => {
  it('should render the message correctly', () => {
    render(<Toast message="Test toast message" onClose={() => {}} />);
    expect(screen.getByText('Test toast message')).toBeInTheDocument();
  });

  it('should trigger onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<Toast message="Test toast message" onClose={handleClose} />);
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should auto-close after duration', () => {
    vi.useFakeTimers();
    const handleClose = vi.fn();
    
    render(<Toast message="Auto close" onClose={handleClose} duration={3000} />);
    
    expect(handleClose).not.toHaveBeenCalled();
    
    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(handleClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('should apply correct styles and icons based on type', () => {
    const { container: successContainer } = render(
      <Toast message="Success toast" type="success" onClose={() => {}} />
    );
    expect(successContainer.firstChild).toHaveClass('border-emerald-800');

    const { container: errorContainer } = render(
      <Toast message="Error toast" type="error" onClose={() => {}} />
    );
    expect(errorContainer.firstChild).toHaveClass('border-red-800');
  });
});
