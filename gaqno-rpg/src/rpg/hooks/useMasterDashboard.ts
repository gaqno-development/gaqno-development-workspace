import { useEffect, useState, useRef } from 'react';
import { useRpgSession } from './useRpgSessions';
import { useRpgCharacters, useUpdateRpgCharacter } from './useRpgCharacters';
import { useRpgHistory, useRpgActions, useRpgMemory } from './useRpgActions';
import { useRpgWebSocket } from './useRpgWebSocket';
import { useAuth } from '@gaqno-dev/frontcore/hooks';
import { ActionDot } from '../components/ActionDots';
import { DiceRollRequest, NarratorResponse } from '../types/rpg.types';

interface UseMasterDashboardOptions {
  sessionId: string | null;
  connectedUsers?: Array<{ userId: string; playerName?: string; mode: string; connectedAt: string }>;
  requestDiceRoll?: (data: {
    sessionId: string;
    requestedFor: string;
    formula: string;
    target?: number;
    context?: string;
  }) => void;
  submitAction?: (data: {
    sessionId: string;
    action: string;
    dice: {
      formula: string;
      roll: number;
      natural: number;
      target?: string;
    };
    context?: Record<string, any>;
  }) => void;
  isConnected?: boolean;
  onDiceRollRequested?: (request: any) => void;
}

export const useMasterDashboard = ({ 
  sessionId,
  connectedUsers: providedConnectedUsers,
  requestDiceRoll: providedRequestDiceRoll,
  submitAction: providedSubmitAction,
  isConnected: providedIsConnected,
  onDiceRollRequested: providedOnDiceRollRequested,
}: UseMasterDashboardOptions) => {
  const { user } = useAuth();
  const { data: session } = useRpgSession(sessionId);
  const { data: characters } = useRpgCharacters(sessionId);
  const { data: history } = useRpgHistory(sessionId);
  const { data: actions } = useRpgActions(sessionId);
  const { data: memory } = useRpgMemory(sessionId);
  const updateCharacter = useUpdateRpgCharacter();
  
  const [notes, setNotes] = useState('');
  const [actionDots, setActionDots] = useState<ActionDot[]>([]);
  const [pendingDiceRequests, setPendingDiceRequests] = useState<DiceRollRequest[]>([]);
  const [narrativeSearch, setNarrativeSearch] = useState('');
  const onDiceRollRequestedRef = useRef(providedOnDiceRollRequested);

  useEffect(() => {
    onDiceRollRequestedRef.current = providedOnDiceRollRequested;
  }, [providedOnDiceRollRequested]);

  const shouldCreateWebSocket = !providedConnectedUsers && !providedRequestDiceRoll && !providedSubmitAction;

  const webSocketHook = useRpgWebSocket({
    sessionId: shouldCreateWebSocket ? sessionId : null,
    userId: shouldCreateWebSocket ? (user?.id || null) : null,
    mode: 'master',
    onDiceRollRequested: (request: any) => {
      setPendingDiceRequests(prev => {
        const exists = prev.some(r => r.id === request.id);
        if (exists) return prev;
        return [...prev, request];
      });
      onDiceRollRequestedRef.current?.(request);
    },
    onDiceRollCompleted: (request: any) => {
      setPendingDiceRequests(prev => 
        prev.map(r => r.id === request.id ? { ...r, status: 'submitted' as const, result: request.result } : r)
      );
    },
    onActionResult: (data) => {
      console.log('[useMasterDashboard] Action result received:', data);
    },
  });

  const connectedUsers = providedConnectedUsers || webSocketHook.connectedUsers;
  const requestDiceRoll = providedRequestDiceRoll || webSocketHook.requestDiceRoll;
  const submitAction = providedSubmitAction || webSocketHook.submitAction;
  const isConnected = providedIsConnected !== undefined ? providedIsConnected : webSocketHook.isConnected;

  useEffect(() => {
    const savedNotes = localStorage.getItem(`rpg-notes-${sessionId}`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!characters || !session) return;

    const dots: ActionDot[] = [];

    characters.forEach((char) => {
      const hp = char.attributes?.hp || char.resources?.hp;
      if (hp && typeof hp === 'object' && 'current' in hp && 'max' in hp) {
        const hpPercentage = (hp.current / hp.max) * 100;
        if (hpPercentage < 25) {
          dots.push({
            id: `crisis-${char.id}`,
            type: 'crisis',
            title: `${char.name} - HP Crítico`,
            description: `${char.name} está com HP crítico (${hp.current}/${hp.max})`,
            priority: 'high',
            metadata: { characterId: char.id, hp: `${hp.current}/${hp.max}` },
          });
        }
      }
    });

    setActionDots(dots);
  }, [characters, session]);

  const playerStatusData = characters?.map((char) => ({
    id: char.id,
    name: char.name,
    hp: char.attributes?.hp || char.resources?.hp,
    resources: char.resources,
    statusEffects: char.metadata?.statusEffects || [],
  })) || [];

  const timelineEvents = history?.map((entry) => ({
    id: entry.id,
    timestamp: entry.timestamp,
    summary: entry.summary,
    type: 'narrative' as const,
  })) || [];

  const narratives = actions?.map(action => action.narrative).filter(Boolean) as NarratorResponse[] || [];
  
  const filteredNarratives = narratives.filter(narrative => {
    if (narrativeSearch) {
      const searchLower = narrativeSearch.toLowerCase();
      const narrativeText = narrative.narratives.find(n => n.level === narrative.outcome)?.text || '';
      if (!narrativeText.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  const handleDiceRequest = (request: Omit<DiceRollRequest, 'id' | 'status' | 'createdAt'>) => {
    if (!sessionId || !requestDiceRoll) {
      console.error('[useMasterDashboard] Cannot handle dice request: missing sessionId or requestDiceRoll', {
        sessionId,
        hasRequestDiceRoll: !!requestDiceRoll,
      });
      return;
    }
    
    if (!request.requestedFor) {
      console.error('[useMasterDashboard] Cannot handle dice request: missing requestedFor', request);
      return;
    }
    
    if (!request.formula || !request.formula.trim()) {
      console.error('[useMasterDashboard] Cannot handle dice request: missing formula', request);
      return;
    }
    
    const fullRequest: DiceRollRequest = {
      ...request,
      id: `dice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    console.log('[useMasterDashboard] Handling dice request:', {
      requestedFor: fullRequest.requestedFor,
      formula: fullRequest.formula,
      target: fullRequest.target,
      context: fullRequest.context,
      sessionId,
    });
    
    setPendingDiceRequests(prev => [...prev, fullRequest]);
    
    requestDiceRoll({
      sessionId,
      requestedFor: request.requestedFor,
      formula: request.formula,
      target: request.target,
      context: request.context,
    });
  };

  const handleUpdateCharacter = async (characterId: string, updates: { name?: string; attributes?: Record<string, any>; resources?: Record<string, any>; metadata?: Record<string, any> }) => {
    try {
      await updateCharacter.mutateAsync({
        id: characterId,
        ...updates
      });
    } catch (error) {
      console.error('Error updating character:', error);
    }
  };

  const handleSendAction = async (data: {
    type: 'battle' | 'item' | 'dice' | 'narrative';
    targetPlayerId?: string;
    action: string;
    dice?: {
      formula: string;
      target?: number;
    };
    context?: Record<string, any>;
  }) => {
    if (!sessionId || !submitAction) return;

    try {
      if (data.targetPlayerId && data.targetPlayerId !== 'all' && data.type === 'dice' && data.dice) {
        requestDiceRoll?.({
          sessionId,
          requestedFor: data.targetPlayerId,
          formula: data.dice.formula,
          target: data.dice.target,
          context: data.action,
        });
      } else {
        submitAction({
          sessionId,
          action: data.action,
          dice: data.dice ? {
            formula: data.dice.formula || '1d20',
            roll: 0,
            natural: 0,
            target: data.dice.target ? String(data.dice.target) : undefined,
          } : {
            formula: '1d20',
            roll: 0,
            natural: 0,
          },
          context: {
            ...data.context,
            eventType: data.type,
            targetPlayerId: data.targetPlayerId === 'all' ? undefined : data.targetPlayerId,
            masterEvent: true,
          },
        });
      }
    } catch (error) {
      console.error('Error sending action:', error);
    }
  };

  const handleSaveNotes = (newNotes: string) => {
    setNotes(newNotes);
    if (sessionId) {
      localStorage.setItem(`rpg-notes-${sessionId}`, newNotes);
    }
  };

  const handleExternalDiceRollRequest = (request: any) => {
    if (!shouldCreateWebSocket && providedOnDiceRollRequested) {
      setPendingDiceRequests(prev => {
        const exists = prev.some(r => r.id === request.id);
        if (exists) return prev;
        return [...prev, request];
      });
    }
  };

  useEffect(() => {
    if (!shouldCreateWebSocket && providedOnDiceRollRequested) {
      const handler = (request: any) => {
        handleExternalDiceRollRequest(request);
      };
      onDiceRollRequestedRef.current = handler;
    }
  }, [shouldCreateWebSocket, providedOnDiceRollRequested]);

  return {
    session,
    characters,
    history,
    actions,
    memory,
    connectedUsers,
    isConnected,
    notes,
    actionDots,
    pendingDiceRequests,
    narrativeSearch,
    setNarrativeSearch,
    playerStatusData,
    timelineEvents,
    filteredNarratives,
    handleDiceRequest,
    handleUpdateCharacter,
    handleSendAction,
    handleSaveNotes,
    user,
    handleExternalDiceRollRequest,
  };
};

