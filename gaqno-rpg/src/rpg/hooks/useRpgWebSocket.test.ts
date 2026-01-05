import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRpgWebSocket } from './useRpgWebSocket';
import { io } from 'socket.io-client';

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  })),
}));

describe('useRpgWebSocket', () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
      connected: true,
    };
    (io as any).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should mock WebSocket connection', () => {
    const { result } = renderHook(() =>
      useRpgWebSocket({
        sessionId: 'test-session',
        userId: 'test-user',
        mode: 'player',
      })
    );

    expect(io).toHaveBeenCalled();
    expect(result.current).toBeDefined();
  });

  it('should test requestDiceRoll', async () => {
    const onDiceRollRequested = vi.fn();
    const { result } = renderHook(() =>
      useRpgWebSocket({
        sessionId: 'test-session',
        userId: 'master-user',
        mode: 'master',
        onDiceRollRequested,
      })
    );

    if (result.current.requestDiceRoll) {
      result.current.requestDiceRoll({
        requestedFor: 'player-user',
        formula: '1d20+5',
        target: 15,
      });

      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('request_dice_roll', expect.objectContaining({
          requestedFor: 'player-user',
          formula: '1d20+5',
          target: 15,
        }));
      });
    }
  });

  it('should test completeDiceRoll', async () => {
    const onDiceRollCompleted = vi.fn();
    const { result } = renderHook(() =>
      useRpgWebSocket({
        sessionId: 'test-session',
        userId: 'player-user',
        mode: 'player',
        onDiceRollCompleted,
      })
    );

    if (result.current.completeDiceRoll) {
      result.current.completeDiceRoll('req-1', {
        roll: 18,
        formula: '1d20+5',
        natural: 18,
        target: 15,
      });

      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('dice_roll_completed', expect.objectContaining({
          requestId: 'req-1',
          result: expect.objectContaining({
            roll: 18,
            formula: '1d20+5',
          }),
        }));
      });
    }
  });

  it('should test handlers of events', () => {
    const onDiceRollRequested = vi.fn();
    const onDiceRollCompleted = vi.fn();

    renderHook(() =>
      useRpgWebSocket({
        sessionId: 'test-session',
        userId: 'test-user',
        mode: 'player',
        onDiceRollRequested,
        onDiceRollCompleted,
      })
    );

    const diceRollRequestedHandler = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === 'dice_roll_requested'
    )?.[1];

    if (diceRollRequestedHandler) {
      diceRollRequestedHandler({ id: 'req-1', formula: '1d20' });
      expect(onDiceRollRequested).toHaveBeenCalled();
    }

    const diceRollCompletedHandler = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === 'dice_roll_completed'
    )?.[1];

    if (diceRollCompletedHandler) {
      diceRollCompletedHandler({ id: 'req-1', result: { roll: 18 } });
      expect(onDiceRollCompleted).toHaveBeenCalled();
    }
  });
});

