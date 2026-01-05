import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MasterActionSender } from './MasterActionSender';

const mockConnectedUsers = [
  { userId: 'player-1', playerName: 'Jogador 1', mode: 'player' as const },
  { userId: 'player-2', playerName: 'Jogador 2', mode: 'player' as const },
];

const mockOnSendAction = vi.fn();

describe('MasterActionSender', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component', () => {
    render(
      <MasterActionSender
        connectedUsers={mockConnectedUsers}
        currentUserId="master-1"
        sessionId="test-session"
        onSendAction={mockOnSendAction}
      />
    );

    expect(screen.getByText(/Enviar Evento/i)).toBeInTheDocument();
  });

  it('should select event type', async () => {
    const user = userEvent.setup();
    render(
      <MasterActionSender
        connectedUsers={mockConnectedUsers}
        currentUserId="master-1"
        sessionId="test-session"
        onSendAction={mockOnSendAction}
      />
    );

    const eventTypeSelect = screen.getByLabelText(/Tipo de Evento/i) || screen.getByRole('combobox');
    await user.click(eventTypeSelect);
    await user.click(screen.getByText(/batalha/i));
  });

  it('should select target player', async () => {
    const user = userEvent.setup();
    render(
      <MasterActionSender
        connectedUsers={mockConnectedUsers}
        currentUserId="master-1"
        sessionId="test-session"
        onSendAction={mockOnSendAction}
      />
    );

    const playerSelect = screen.getAllByRole('combobox')[1] || screen.getByLabelText(/Jogador Alvo/i);
    await user.click(playerSelect);
    await user.click(screen.getByText('Jogador 1'));
  });

  it('should fill description', async () => {
    const user = userEvent.setup();
    render(
      <MasterActionSender
        connectedUsers={mockConnectedUsers}
        currentUserId="master-1"
        sessionId="test-session"
        onSendAction={mockOnSendAction}
      />
    );

    const descriptionInput = screen.getByPlaceholderText(/Descreva o evento/i) || screen.getByLabelText(/Descrição/i);
    await user.type(descriptionInput, 'Um goblin ataca!');
    
    expect(descriptionInput).toHaveValue('Um goblin ataca!');
  });

  it('should send event', async () => {
    const user = userEvent.setup();
    render(
      <MasterActionSender
        connectedUsers={mockConnectedUsers}
        currentUserId="master-1"
        sessionId="test-session"
        onSendAction={mockOnSendAction}
      />
    );

    const descriptionInput = screen.getByPlaceholderText(/Descreva o evento/i) || screen.getByLabelText(/Descrição/i);
    await user.type(descriptionInput, 'Um goblin ataca!');

    const submitButton = screen.getByText(/Enviar/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSendAction).toHaveBeenCalled();
    });
  });
});

