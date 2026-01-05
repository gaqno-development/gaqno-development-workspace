import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterSheet } from './CharacterSheet';
import { RpgCharacter } from '../types/rpg.types';

const mockCharacter: RpgCharacter = {
  id: 'char-1',
  sessionId: 'session-1',
  playerId: 'player-1',
  name: 'Test Character',
  attributes: {
    strength: 18,
    dexterity: 14,
    constitution: 16,
  },
  resources: {
    hp: 100,
    mp: 50,
  },
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockOnUpdate = vi.fn();

describe('CharacterSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with data', () => {
    render(
      <CharacterSheet
        character={mockCharacter}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Test Character')).toBeInTheDocument();
    expect(screen.getByText(/strength/i)).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('should allow inline editing of attributes when editable', async () => {
    const user = userEvent.setup();
    render(
      <CharacterSheet
        character={mockCharacter}
        onUpdate={mockOnUpdate}
        editable={true}
      />
    );

    const strengthRow = screen.getByText(/strength/i).closest('div');
    if (strengthRow) {
      await user.click(strengthRow);
      
      const input = screen.getByDisplayValue('18');
      expect(input).toBeInTheDocument();
      
      await user.clear(input);
      await user.type(input, '20');
      await user.tab();
      
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    }
  });

  it('should allow inline editing of resources when editable', async () => {
    const user = userEvent.setup();
    render(
      <CharacterSheet
        character={mockCharacter}
        onUpdate={mockOnUpdate}
        editable={true}
      />
    );

    const hpRow = screen.getByText(/hp/i).closest('div');
    if (hpRow) {
      await user.click(hpRow);
      
      const input = screen.getByDisplayValue('100');
      expect(input).toBeInTheDocument();
      
      await user.clear(input);
      await user.type(input, '120');
      await user.tab();
      
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    }
  });

  it('should show save button when editable and changes made', async () => {
    const user = userEvent.setup();
    render(
      <CharacterSheet
        character={mockCharacter}
        onUpdate={mockOnUpdate}
        editable={true}
      />
    );

    const strengthRow = screen.getByText(/strength/i).closest('div');
    if (strengthRow) {
      await user.click(strengthRow);
      
      const input = screen.getByDisplayValue('18');
      await user.clear(input);
      await user.type(input, '20');
      await user.tab();
      
      await waitFor(() => {
        const saveButton = screen.queryByText(/salvar/i);
        expect(saveButton).toBeInTheDocument();
      });
    }
  });

  it('should show loading state when saving', async () => {
    mockOnUpdate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const user = userEvent.setup();
    render(
      <CharacterSheet
        character={mockCharacter}
        onUpdate={mockOnUpdate}
        editable={true}
      />
    );

    const strengthRow = screen.getByText(/strength/i).closest('div');
    if (strengthRow) {
      await user.click(strengthRow);
      
      const input = screen.getByDisplayValue('18');
      await user.clear(input);
      await user.type(input, '20');
      await user.tab();
      
      await waitFor(() => {
        const saveButton = screen.getByText(/salvar/i);
        expect(saveButton).toBeInTheDocument();
      });
      
      const saveButton = screen.getByText(/salvar/i);
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /salvar/i })).toBeDisabled();
      });
    }
  });
});

