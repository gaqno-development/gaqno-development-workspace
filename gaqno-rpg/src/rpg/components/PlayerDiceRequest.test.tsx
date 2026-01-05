import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerDiceRequest } from './PlayerDiceRequest';
import { DiceRollRequest } from '../types/rpg.types';

const mockRequest: DiceRollRequest = {
  id: 'req-1',
  sessionId: 'test-session',
  requestedBy: 'master-1',
  requestedFor: 'player-1',
  formula: '1d20+5',
  target: 15,
  context: 'Test perception check',
  status: 'pending',
  createdAt: new Date().toISOString(),
};

const mockOnRollComplete = vi.fn();
const mockOnDismiss = vi.fn();

describe('PlayerDiceRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when request received', () => {
    render(
      <PlayerDiceRequest
        request={mockRequest}
        onRollComplete={mockOnRollComplete}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText(/Rolagem de Dados/)).toBeInTheDocument();
    expect(screen.getByText('1d20+5')).toBeInTheDocument();
    expect(screen.getByText('Test perception check')).toBeInTheDocument();
  });

  it('should not render when request is null', () => {
    const { container } = render(
      <PlayerDiceRequest
        request={null}
        onRollComplete={mockOnRollComplete}
        onDismiss={mockOnDismiss}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should not render when request status is not pending', () => {
    const completedRequest = { ...mockRequest, status: 'submitted' as const };
    
    const { container } = render(
      <PlayerDiceRequest
        request={completedRequest}
        onRollComplete={mockOnRollComplete}
        onDismiss={mockOnDismiss}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should auto-roll dice when AnimatedDice completes', async () => {
    vi.useFakeTimers();
    
    render(
      <PlayerDiceRequest
        request={mockRequest}
        onRollComplete={mockOnRollComplete}
        onDismiss={mockOnDismiss}
      />
    );

    const diceComponent = screen.getByTestId('animated-dice') || screen.getByText(/Rolagem/);
    
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(mockOnRollComplete).toHaveBeenCalled();
    }, { timeout: 3000 });

    vi.useRealTimers();
  });
});

