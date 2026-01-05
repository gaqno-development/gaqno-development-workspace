import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { NarratorResponse, RpgAction, SessionMode } from '../types/rpg.types';
import { useMotionStore } from '../store/motionStore';
import {
  processUIActions,
  processOutcome,
} from '../motion/eventToMotionMap';

const getViteEnv = (key: string, defaultValue: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  return defaultValue;
};

interface ConnectedUser {
  userId: string;
  playerName?: string;
  mode: SessionMode;
  connectedAt: string;
}

interface UseRpgWebSocketOptions {
  sessionId: string | null;
  userId: string | null;
  playerName?: string;
  mode: SessionMode;
  onActionResult?: (data: { action: RpgAction; narratorResponse: NarratorResponse; submittedBy: string }) => void;
  onError?: (error: { message: string }) => void;
  onUsersUpdate?: (users: ConnectedUser[]) => void;
  onModeChanged?: (mode: SessionMode) => void;
  onDiceRollRequested?: (request: any) => void;
  onDiceRollCompleted?: (request: any) => void;
}

export const useRpgWebSocket = ({
  sessionId,
  userId,
  playerName,
  mode,
  onActionResult,
  onError,
  onUsersUpdate,
  onModeChanged,
  onDiceRollRequested,
  onDiceRollCompleted
}: UseRpgWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const connectionParamsRef = useRef<{ sessionId: string | null; userId: string | null; mode: SessionMode } | null>(null);

  const connect = useCallback(() => {
    if (!sessionId) {
      return;
    }

    if (mode === 'master' && !userId) {
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnecting(true);
    const rpgServiceUrl = getViteEnv('VITE_RPG_SERVICE_URL', 'http://localhost:4007');
    const socket = io(`${rpgServiceUrl}/rpg`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      withCredentials: true,
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('WebSocket connected, joining session:', { sessionId, mode, userId });
      setIsConnected(true);
      setIsConnecting(false);
      reconnectAttempts.current = 0;

      socket.emit('join_session', {
        sessionId,
        userId: (mode === 'presentation' || mode === 'player') && !userId ? undefined : userId,
        playerName: (mode === 'presentation' || mode === 'player') && !userId ? undefined : playerName,
        mode
      });
      
      if (playerName && (mode === 'master' || (mode === 'player' && userId))) {
        lastPlayerNameRef.current = playerName;
      }
    });

    socket.on('joined_session', (data: { sessionId: string; mode: SessionMode }) => {
      console.log('[useRpgWebSocket] Successfully joined session:', data);
      setIsConnected(true);
      if (data.mode && data.mode !== mode && onModeChanged) {
        onModeChanged(data.mode);
      }
      setTimeout(() => {
        console.log('[useRpgWebSocket] Requesting users list after joining');
        socket.emit('request_users_list', { sessionId });
      }, 500);
    });

    socket.on('connected_users_list', (data: { users: ConnectedUser[] }) => {
      console.log('[useRpgWebSocket] Received connected users list:', data.users);
      setConnectedUsers(prev => {
        const uniqueUsers = new Map<string, ConnectedUser>();
        data.users.forEach(user => {
          const existing = uniqueUsers.get(user.userId);
          if (!existing) {
            uniqueUsers.set(user.userId, user);
          } else {
            const priorityOrder: SessionMode[] = ['master', 'player', 'presentation'];
            const existingPriority = priorityOrder.indexOf(existing.mode);
            const newPriority = priorityOrder.indexOf(user.mode);
            if (newPriority < existingPriority) {
              uniqueUsers.set(user.userId, user);
            } else {
              uniqueUsers.set(user.userId, existing);
            }
          }
        });
        const updated = Array.from(uniqueUsers.values());
        console.log('[useRpgWebSocket] Updated connected users:', updated);
        if (onUsersUpdate) {
          onUsersUpdate(updated);
        }
        return updated;
      });
    });

    socket.on('request_users_list', () => {
      if (sessionId) {
        socket.emit('request_users_list', { sessionId });
      }
    });

    socket.on('user_joined', (data: ConnectedUser) => {
      console.log('[useRpgWebSocket] User joined:', data);
      setConnectedUsers(prev => {
        const existingIndex = prev.findIndex(u => u.userId === data.userId);
        if (existingIndex >= 0) {
          const priorityOrder: SessionMode[] = ['master', 'player', 'presentation'];
          const existingPriority = priorityOrder.indexOf(prev[existingIndex].mode);
          const newPriority = priorityOrder.indexOf(data.mode);
          const updated = [...prev];
          if (newPriority < existingPriority) {
            updated[existingIndex] = data;
          }
          console.log('[useRpgWebSocket] Updated users after user_joined:', updated);
          if (onUsersUpdate) {
            onUsersUpdate(updated);
          }
          return updated;
        } else {
          const updated = [...prev, data];
          console.log('[useRpgWebSocket] Added new user, total users:', updated);
          if (onUsersUpdate) {
            onUsersUpdate(updated);
          }
          return updated;
        }
      });
    });

    socket.on('user_left', (data: { userId: string }) => {
      console.log('User left:', data.userId);
      setConnectedUsers(prev => {
        const updated = prev.filter(u => u.userId !== data.userId);
        if (onUsersUpdate) {
          onUsersUpdate(updated);
        }
        return updated;
      });
    });

    socket.on('user_mode_updated', (data: { userId: string; mode: SessionMode }) => {
      console.log('User mode updated:', data);
      setConnectedUsers(prev => {
        const updated = prev.map(u => 
          u.userId === data.userId ? { ...u, mode: data.mode } : u
        );
        if (onUsersUpdate) {
          onUsersUpdate(updated);
        }
        return updated;
      });
    });

    socket.on('mode_changed', (data: { mode: SessionMode }) => {
      console.log('Your mode changed:', data.mode);
      if (onModeChanged) {
        onModeChanged(data.mode);
      }
    });

    socket.on('action_result', (data) => {
      console.log('Received action_result:', data);
      // Dispara eventos de motion baseado no NarratorResponse
      const narratorResponse = data.narratorResponse as NarratorResponse;
      if (narratorResponse) {
        const { triggerEvent } = useMotionStore.getState();
        
        // Processa ui_actions
        const uiEvents = processUIActions(narratorResponse.ui_actions, mode);
        uiEvents.forEach((event) => {
          triggerEvent(event);
        });

        // Processa outcome
        const outcomeEvent = processOutcome(narratorResponse.outcome, mode);
        triggerEvent(outcomeEvent);

        // Processa image_prompts se houver
        if (narratorResponse.image_prompts && narratorResponse.image_prompts.length > 0) {
          triggerEvent({
            type: 'image.reveal',
            priority: 'média',
            mode,
          });
        }
      }

      if (onActionResult) {
        onActionResult(data);
      }
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (onError) {
        onError(error);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      setIsConnecting(false);
      
      if (reason === 'io client disconnect' || reason === 'transport close') {
        console.log('Client-initiated disconnect, not reconnecting');
        reconnectAttempts.current = 0;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        return;
      }
      
      if (reason === 'io server disconnect') {
        console.log('Server disconnected, attempting reconnect');
        socket.connect();
      } else if (reconnectAttempts.current < maxReconnectAttempts && sessionId) {
        reconnectAttempts.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`Scheduling reconnect attempt ${reconnectAttempts.current} in ${delay}ms`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (socketRef.current === socket && !socketRef.current.connected && sessionId) {
            connect();
          }
        }, delay);
      } else {
        console.log('Max reconnection attempts reached or no sessionId');
      }
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnecting(false);
      if (onError) {
        onError({ message: error.message || 'Failed to connect to WebSocket' });
      }
    });

    socket.on('dice_roll_requested', (data: any) => {
      console.log('[useRpgWebSocket] Dice roll requested:', data);
      if (onDiceRollRequested) {
        onDiceRollRequested(data);
      }
    });

    socket.on('dice_roll_completed', (data: any) => {
      console.log('[useRpgWebSocket] Dice roll completed:', data);
      if (onDiceRollCompleted) {
        onDiceRollCompleted(data);
      }
    });

    socketRef.current = socket;
  }, [sessionId, userId, playerName, mode, onActionResult, onError, onDiceRollRequested, onDiceRollCompleted]);

  const lastPlayerNameRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (socketRef.current?.connected && sessionId && playerName && (mode === 'player' || mode === 'master')) {
      if (lastPlayerNameRef.current !== playerName) {
        console.log('Updating player name:', playerName);
        socketRef.current.emit('update_player_name', {
          sessionId,
          playerName
        });
        lastPlayerNameRef.current = playerName;
      }
    } else if (!playerName) {
      lastPlayerNameRef.current = undefined;
    }
  }, [playerName, sessionId, mode]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.emit('leave_session', { sessionId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttempts.current = 0;
  }, [sessionId]);

  const submitAction = useCallback((data: {
    sessionId: string;
    characterId?: string;
    action: string;
    dice: {
      formula: string;
      roll: number;
      natural: number;
      target?: string;
    };
    context?: Record<string, any>;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('submit_action', {
        ...data,
        userId
      });
    }
  }, [userId]);

  useEffect(() => {
    const currentParams = { sessionId, userId, mode };
    const previousParams = connectionParamsRef.current;
    
    console.log('useRpgWebSocket effect:', { sessionId, userId, mode, isConnected, isConnecting });
    
    if (!sessionId) {
      console.log('No sessionId, skipping connection');
      if (socketRef.current) {
        disconnect();
      }
      connectionParamsRef.current = null;
      return;
    }

    if (previousParams && 
        previousParams.sessionId === sessionId && 
        previousParams.userId === userId && 
        previousParams.mode === mode &&
        socketRef.current?.connected) {
      console.log('Parameters unchanged and already connected, skipping');
      return;
    }

    connectionParamsRef.current = currentParams;

    const currentSocket = socketRef.current;
    if (currentSocket?.connected) {
      const sessionData = (currentSocket as any).sessionData;
      const currentMode = sessionData?.mode;
      const currentUserId = sessionData?.userId;
      
      if (currentMode === mode && ((mode === 'presentation' || (mode === 'player' && !userId)) || (userId && currentUserId === userId))) {
        console.log('Already connected with correct mode and userId, skipping reconnection');
        return;
      }
      
      console.log('Mode or userId changed, disconnecting before reconnect...', { currentMode, mode, currentUserId, userId });
      currentSocket.disconnect();
      socketRef.current = null;
    }

    if (isConnecting) {
      console.log('Already connecting, skipping');
      return;
    }

    if (mode === 'presentation' || (mode === 'player' && !userId)) {
      console.log(`Connecting in ${mode} mode${!userId ? ' (anonymous)' : ''}`);
      connect();
      return () => {
        console.log('Cleaning up WebSocket connection on unmount');
        disconnect();
      };
    }

    if (mode === 'master' && !userId) {
      console.log('Cannot connect: master mode requires userId but userId is missing', { mode, userId });
      if (socketRef.current) {
        disconnect();
      }
      return;
    }

    console.log('Connecting with userId:', userId, 'mode:', mode);
    connect();
    
    return () => {
      console.log('Cleaning up WebSocket connection on unmount');
      disconnect();
    };
  }, [sessionId, userId, playerName, mode]);

  const requestDiceRoll = useCallback((data: {
    sessionId: string;
    requestedFor: string;
    formula: string;
    target?: number;
    context?: string;
  }) => {
    if (!socketRef.current?.connected) {
      console.error('[useRpgWebSocket] Cannot request dice roll: socket not connected');
      return;
    }
    console.log('[useRpgWebSocket] Requesting dice roll:', data);
    socketRef.current.emit('request_dice_roll', data);
  }, []);

  const completeDiceRoll = useCallback((data: {
    requestId: string;
    sessionId: string;
    result: {
      roll: number;
      formula: string;
      natural: number;
      target?: number;
    };
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('dice_roll_completed', data);
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    submitAction,
    disconnect,
    reconnect: connect,
    connectedUsers,
    requestDiceRoll,
    completeDiceRoll
  };
};

