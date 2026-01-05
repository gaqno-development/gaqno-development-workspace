import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRpgSession, useSessionMasters } from '../hooks/useRpgSessions';
import { useRpgCampaign } from '../hooks/useRpgCampaigns';
import { useRpgCharacters } from '../hooks/useRpgCharacters';
import { useRpgHistory, useRpgMemory, useRpgActions, useSubmitRpgAction } from '../hooks/useRpgActions';
import { useRpgWebSocket } from '../hooks/useRpgWebSocket';
import { ActionForm } from '../components/ActionForm';
import { AnimatedNarrative } from '../components/AnimatedNarrative';
import { AnimatedDice } from '../components/AnimatedDice';
import { AnimatedScene } from '../components/AnimatedScene';
import { MotionProvider } from '../components/MotionProvider';
import { CharacterSheet } from '../components/CharacterSheet';
import { ImageGallery } from '../components/ImageGallery';
import { ConnectedPlayersList } from '../components/ConnectedPlayersList';
import { PlayerNameDialog } from '../components/PlayerNameDialog';
import { GameBoard } from '../components/GameBoard';
import { PlayerDiceRequest } from '../components/PlayerDiceRequest';
import { MasterPanel } from '../components/MasterPanel';
import { MasterDashboardContent } from '../components/MasterDashboardContent';
import { useLocationContext } from '../hooks/useLocationContext';
import { DiceRollRequest, DiceResult } from '../types/rpg.types';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-dev/frontcore/components/ui';
import { ScrollArea, Button } from '@gaqno-dev/frontcore/components/ui';
import { ChevronLeft, Copy, Check, LayoutDashboard } from 'lucide-react';
import { SessionMode, NarratorResponse, RpgImage } from '../types/rpg.types';
import { useAuth } from '@gaqno-dev/frontcore/hooks';

export const SessionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<SessionMode>('player');
  const [currentNarrative, setCurrentNarrative] = useState<NarratorResponse | null>(null);
  const [narratives, setNarratives] = useState<NarratorResponse[]>([]);
  const [images, setImages] = useState<RpgImage[]>([]);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [roomCodeCopied, setRoomCodeCopied] = useState(false);
  const [currentDiceRequest, setCurrentDiceRequest] = useState<DiceRollRequest | null>(null);
  const [isMasterPanelOpen, setIsMasterPanelOpen] = useState(false);
  const masterDiceRollHandlerRef = useRef<((request: any) => void) | null>(null);

  const { data: session } = useRpgSession(id || null);
  const { data: masters, refetch: refetchMasters } = useSessionMasters(id || null);
  
  const isOriginalCreator = session?.userId === user?.id;
  const isMaster = user ? (isOriginalCreator || (masters?.some(m => m.userId === user.id) ?? false)) : false;
  
  useEffect(() => {
    if (session && user && !authLoading && id) {
      console.log('Session and user available, refetching masters for session:', id);
      refetchMasters();
    }
  }, [session, user, authLoading, id, refetchMasters]);
  
  useEffect(() => {
    console.log('SessionView Debug:', {
      sessionId: id,
      userId: user?.id,
      sessionUserId: session?.userId,
      isOriginalCreator,
      masters: masters?.map(m => ({ userId: m.userId, isOriginalCreator: m.isOriginalCreator })),
      mastersCount: masters?.length,
      isMaster,
      mode,
      hasUser: !!user,
      authLoading
    });
  }, [id, user?.id, session?.userId, isOriginalCreator, masters, isMaster, mode, user, authLoading]);
  
  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (session && user) {
      if (isMaster) {
        setMode('master');
        setIsMasterPanelOpen(true);
      } else {
        setMode('player');
        setIsMasterPanelOpen(false);
      }
    } else if (session && !user) {
      setMode('player');
      setIsMasterPanelOpen(false);
    }
  }, [session, user, isMaster, masters, authLoading]);
  
  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (session && user && isMaster && mode !== 'master') {
      setMode('master');
    }
  }, [session, user, isMaster, mode, authLoading]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (id && user && !isMaster) {
      const storedName = localStorage.getItem(`player-name-${id}`);
      if (storedName) {
        setPlayerName(storedName);
        setShowNameDialog(false);
      } else {
        setShowNameDialog(true);
      }
    } else if (isMaster || !user) {
      setShowNameDialog(false);
    }
  }, [id, user, isMaster, authLoading]);
  const { data: campaign } = useRpgCampaign(session?.campaignId || null);
  const { data: characters } = useRpgCharacters(id || null);
  const { data: history } = useRpgHistory(id || null);
  const { data: memory } = useRpgMemory(id || null);
  const { data: actions } = useRpgActions(id || null);
  const submitAction = useSubmitRpgAction();

  const effectiveMode = authLoading ? 'player' : (!user ? 'player' : (isMaster ? 'master' : mode));
  
  const { 
    submitAction: submitWebSocketAction, 
    isConnected, 
    connectedUsers,
    completeDiceRoll,
    requestDiceRoll: requestDiceRollWebSocket
  } = useRpgWebSocket({
    sessionId: id || null,
    userId: (authLoading || !user) ? null : (user?.id || null),
    playerName: playerName || undefined,
    mode: effectiveMode,
    onActionResult: (data) => {
      setCurrentNarrative(data.narratorResponse);
      if (data.narratorResponse.image_prompts && data.narratorResponse.image_prompts.length > 0) {
        // In a real implementation, we'd fetch the generated images
        // For now, we'll just show the prompts
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    onModeChanged: (newMode) => {
      if (newMode === 'master' || newMode === 'player') {
        setMode(newMode);
      }
    },
    onDiceRollRequested: (request: any) => {
      console.log('[SessionView] Dice roll requested:', {
        request,
        requestedFor: request.requestedFor,
        userId: user?.id,
        matches: request.requestedFor === user?.id,
        isMaster,
        effectiveMode,
        hasUser: !!user,
      });
      
      const isForCurrentUser = user?.id 
        ? request.requestedFor === user.id
        : request.requestedFor === 'anonymous' || !request.requestedFor;
      
      if (isForCurrentUser && !isMaster) {
        console.log('[SessionView] Setting current dice request for player');
        setCurrentDiceRequest({
          ...request,
          status: request.status || 'pending',
        });
      }
      
      if (isMaster && masterDiceRollHandlerRef.current) {
        masterDiceRollHandlerRef.current(request);
      }
    },
    onDiceRollCompleted: (request: any) => {
      if (request.requestedFor === user?.id) {
        setCurrentDiceRequest(null);
      }
    }
  });

  const handleSubmitAction = async (data: {
    action: string;
    dice: any;
    context?: Record<string, any>;
  }) => {
    if (effectiveMode === 'presentation') {
      return;
    }

    try {
      if (isConnected) {
        submitWebSocketAction({
          sessionId: id!,
          ...data
        });
      } else {
        const result = await submitAction.mutateAsync({
          sessionId: id!,
          ...data
        });
        setCurrentNarrative(result.narratorResponse);
      }
    } catch (error) {
      console.error('Error submitting action:', error);
    }
  };

  const handleDiceRollComplete = async (requestId: string, result: DiceResult) => {
    if (!id || !completeDiceRoll) return;
    
    completeDiceRoll({
      requestId,
      sessionId: id,
      result,
    });

    // Auto-submit the action with the dice result
    const actionText = currentDiceRequest?.context || 'Rolagem de dados solicitada pelo mestre';
    handleSubmitAction({
      action: actionText,
      dice: result,
      context: {
        location: '',
        npc: '',
        dice_request_id: requestId,
      }
    });
  };

  const canSubmitActions = effectiveMode !== 'presentation';
  const currentCharacter = characters?.find(c => c.playerId === user?.id);
  const locationContext = useLocationContext(id || null, currentNarrative);
  
  useEffect(() => {
    console.log('[SessionView] Narratives state:', narratives);
    console.log('[SessionView] Location context:', locationContext);
    console.log('[SessionView] Actions loaded:', actions);
    if (actions && actions.length > 0) {
      const narrativesFromActions = actions
        .map(action => {
          if (action.narrative && typeof action.narrative === 'object') {
            return action.narrative as NarratorResponse;
          }
          return null;
        })
        .filter((narrative): narrative is NarratorResponse => narrative !== null);
      
      console.log('[SessionView] Narratives extracted:', narrativesFromActions);
      if (narrativesFromActions.length > 0) {
        setNarratives(narrativesFromActions);
      }
    }
  }, [actions]);

  useEffect(() => {
    if (currentNarrative) {
      setNarratives(prev => {
        const exists = prev.some(n => 
          n.dice.roll === currentNarrative.dice.roll && 
          n.dice.natural === currentNarrative.dice.natural &&
          n.outcome === currentNarrative.outcome
        );
        if (exists) return prev;
        return [...prev, currentNarrative];
      });
    }
  }, [currentNarrative]);
  
  const latestImage = images.length > 0 ? images[images.length - 1]?.imageUrl : undefined;

  useEffect(() => {
    console.log('[SessionView] Connected users state:', connectedUsers);
    console.log('[SessionView] Current user:', { id: user?.id, isMaster, isOriginalCreator });
  }, [connectedUsers, user?.id, isMaster, isOriginalCreator]);

  const copyRoomCode = async () => {
    if (session?.roomCode) {
      await navigator.clipboard.writeText(session.roomCode);
      setRoomCodeCopied(true);
      setTimeout(() => setRoomCodeCopied(false), 2000);
    }
  };

  return (
    <MotionProvider mode={effectiveMode}>
      {showNameDialog && id && (
        <PlayerNameDialog
          sessionId={id}
          open={showNameDialog}
          onNameSubmit={(name) => {
            setPlayerName(name);
            setShowNameDialog(false);
          }}
        />
      )}
      {currentDiceRequest && (
        <PlayerDiceRequest
          request={{
            ...currentDiceRequest,
            status: currentDiceRequest.status || 'pending',
          }}
          onRollComplete={handleDiceRollComplete}
          onDismiss={() => setCurrentDiceRequest(null)}
        />
      )}
      <div className="flex flex-col h-full">
        <div className="border-b bg-background sticky top-0 z-10 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/rpg/sessions')}
              title="Voltar para sessões"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{session?.name || 'Carregando...'}</h1>
              {campaign && (
                <div className="text-sm text-muted-foreground mt-1">
                  Campanha: {campaign.name}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMaster && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMasterPanelOpen(!isMasterPanelOpen)}
                title={isMasterPanelOpen ? "Fechar Master Dashboard" : "Abrir Master Dashboard"}
                className="min-h-[44px]"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                {isMasterPanelOpen ? 'Fechar' : 'Master Dashboard'}
              </Button>
            )}
            {session?.roomCode && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                <span className="text-sm font-mono font-semibold">{session.roomCode}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyRoomCode}
                  title="Copiar código da sala"
                  className="h-6 w-6"
                >
                  {roomCodeCopied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Status: {session?.status} | WebSocket: {isConnected ? 'Conectado' : 'Desconectado'} | Jogadores: {connectedUsers.length}
        </div>
        </div>

        <div className="flex-1 overflow-auto p-6 relative">
          <div className={`grid grid-cols-1 ${isMasterPanelOpen ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6 transition-all duration-300`}>
            <div className={`${isMasterPanelOpen ? 'lg:col-span-1' : 'lg:col-span-2'} space-y-4 w-full`}>
              <GameBoard
                narratives={narratives}
                locationContext={locationContext}
                backgroundImageUrl={latestImage}
                mode={effectiveMode}
                className="w-full"
              >
                {canSubmitActions && !isMaster && (
                  <ActionForm
                    onSubmit={handleSubmitAction}
                    characterId={currentCharacter?.id}
                    disabled={!isConnected && submitAction.isPending}
                    mode={effectiveMode}
                  />
                )}
              </GameBoard>

              {history && history.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {history.map((entry) => (
                          <div key={entry.id} className="text-sm border-b pb-2">
                            <div className="font-semibold">{entry.summary}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Jogadores Conectados</CardTitle>
                </CardHeader>
                <CardContent>
                  <ConnectedPlayersList
                    users={connectedUsers}
                    currentUserId={user?.id || null}
                    sessionId={id || null}
                    isOriginalCreator={isOriginalCreator}
                    isMaster={isMaster}
                    masters={masters || []}
                  />
                </CardContent>
              </Card>

              {currentCharacter && (
                <CharacterSheet
                  character={currentCharacter}
                  editable={effectiveMode === 'master'}
                />
              )}

              {characters && characters.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Personagens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {characters.map((char) => (
                        <div key={char.id} className="text-sm">
                          {char.name}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Imagens Geradas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ImageGallery images={images} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
        {isMaster && (
          <MasterPanel
            isOpen={isMasterPanelOpen}
            onToggle={() => setIsMasterPanelOpen(!isMasterPanelOpen)}
          >
            <MasterDashboardContent 
              sessionId={id || null}
              connectedUsers={connectedUsers}
              requestDiceRoll={requestDiceRollWebSocket}
              submitAction={submitWebSocketAction}
              isConnected={isConnected}
              onDiceRollRequested={(handler: (request: any) => void) => {
                masterDiceRollHandlerRef.current = handler;
              }}
            />
          </MasterPanel>
        )}
      </div>
    </MotionProvider>
  );
};

