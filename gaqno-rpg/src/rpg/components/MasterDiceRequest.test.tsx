import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MasterDiceRequest } from './MasterDiceRequest';
import { DiceRollRequest } from '../types/rpg.types';

const mockConnectedUsers = [
  { userId: 'player-1', playerName: 'Jogador 1', mode: 'player' as const },
  { userId: 'player-2', playerName: 'Jogador 2', mode: 'player' as const },
  { userId: 'master-1', playerName: 'Mestre', mode: 'master' as const },
];

const mockOnRequestDice = vi.fn();

describe('MasterDiceRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component', () => {
    render(
      <MasterDiceRequest
        connectedUsers={mockConnectedUsers}
        currentUserId="master-1"
        sessionId="test-session"
        onRequestDice={mockOnRequestDice}
      />
    );

    expect(screen.getByText('Pedir Rolagem de Dados')).toBeInTheDocument();
  });

  it('should render player list', () => {
    render(
      <MasterDiceRequest
        connectedUsers={mockConnectedUsers}
        currentUserId="master-1"
        sessionId="test-session"
        onRequestDice={mockOnRequestDice}
      />
    );

    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);

    expect(screen.getByText('Jogador 1')).toBeInTheDocument();
    expect(screen.getByText('Jogador 2')).toBeInTheDocument();
  });

  it('should allow formula input', async () => {
    const user = userEvent.setup();
    render(
      <MasterDiceRequest
        connectedUsers={mockConnectedUsers}
        currentUserId="master-1"
        sessionId="test-session"
        onRequestDice={mockOnRequestDice}
      />
    );

    const formulaInput = screen.getByPlaceholderText('1d20+5');
    await user.clear(formulaInput);
    await user.type(formulaInput, '2d6+3');

    expect(formulaInput).toHaveValue('2d6+3');
  });

  it('should allow DC input', async () => {
    const user = userEvent.setup();
    render(
      <MasterDiceRequest
        connectedUsers={mockConnectedUsers}
        currentUserId="master-1"
        sessionId="test-session"
        onRequestDice={mockOnRequestDice}
      />
    );

    const dcInput = screen.getByPlaceholderText('15');
    await user.type(dcInput, '18');

    expect(dcInput).toHaveValue('18');
  });

  it('should send request on submit', async () => {
    const user = userEvent.setup();
    render(
      <MasterDiceRequest
        connectedUsers={mockConnectedUsers}
        currentUserId="master-1"
        sessionId="test-session"
        onRequestDice={mockOnRequestDice}
      />
    );

    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);
    await user.click(screen.getByText('Jogador 1'));

    const formulaInput = screen.getByPlaceholderText('1d20+5');
    await user.clear(formulaInput);
    await user.type(formulaInput, '1d20+5');

    const submitButton = screen.getByText('Pedir Rolagem');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnRequestDice).toHaveBeenCalledWith({
        sessionId: 'test-session',
        requestedBy: 'master-1',
        requestedFor: 'player-1',
        formula: '1d20+5',
        target: undefined,
        context: undefined,
      });
    });
  });

  it('should show pending requests', () => {
    const pendingRequests: DiceRollRequest[] = [
      {
        id: 'req-1',
        sessionId: 'test-session',
        requestedBy: 'master-1',
        requestedFor: 'player-1',
        formula: '1d20+5',
        target: 15,
        context: 'Test context',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ];

    render(
      <MasterDiceRequest
        connectedUsers={mockConnectedUsers}
        currentUserId="master-1"
        sessionId="test-session"
        onRequestDice={mockOnRequestDice}
        pendingRequests={pendingRequests}
      />
    );

    expect(screen.getByText('Pedidos Pendentes')).toBeInTheDocument();
    expect(screen.getByText('Jogador 1')).toBeInTheDocument();
    expect(screen.getByText(/1d20\+5/)).toBeInTheDocument();
  });
});

