import React, { useEffect, useRef } from 'react';
import { useMasterDashboard } from '../hooks/useMasterDashboard';
import { ActionDots } from './ActionDots';
import { SessionStats } from './dashboard/SessionStats';
import { PlayerStatus } from './dashboard/PlayerStatus';
import { QuickNotes } from './dashboard/QuickNotes';
import { NarrativeTimeline } from './dashboard/NarrativeTimeline';
import { MasterTabs } from './MasterTabs';
import { MasterDiceRequest } from './MasterDiceRequest';
import { ConnectedPlayersList } from './ConnectedPlayersList';
import { CharacterSheet } from './CharacterSheet';
import { NarrativeCard } from './NarrativeCard';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-dev/frontcore/components/ui';
import { ScrollArea } from '@gaqno-dev/frontcore/components/ui';
import { Input } from '@gaqno-dev/frontcore/components/ui';
import { Search } from 'lucide-react';

interface MasterDashboardContentProps {
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

export const MasterDashboardContent: React.FC<MasterDashboardContentProps> = ({ 
  sessionId,
  connectedUsers: providedConnectedUsers,
  requestDiceRoll: providedRequestDiceRoll,
  submitAction: providedSubmitAction,
  isConnected: providedIsConnected,
  onDiceRollRequested: providedOnDiceRollRequested,
}) => {
  const {
    session,
    characters,
    history,
    actions,
    memory,
    connectedUsers,
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
    handleSaveNotes,
    user,
    handleExternalDiceRollRequest,
  } = useMasterDashboard({ 
    sessionId,
    connectedUsers: providedConnectedUsers,
    requestDiceRoll: providedRequestDiceRoll,
    submitAction: providedSubmitAction,
    isConnected: providedIsConnected,
    onDiceRollRequested: providedOnDiceRollRequested,
  });

  const handleExternalDiceRollRequestRef = useRef(handleExternalDiceRollRequest);

  useEffect(() => {
    handleExternalDiceRollRequestRef.current = handleExternalDiceRollRequest;
  }, [handleExternalDiceRollRequest]);

  useEffect(() => {
    if (providedOnDiceRollRequested) {
      const handler = (request: any) => {
        handleExternalDiceRollRequestRef.current?.(request);
      };
      providedOnDiceRollRequested(handler);
    }
  }, [providedOnDiceRollRequested]);

  const tabContent = [
    <div key="overview" className="space-y-4">
      <SessionStats
        sessionName={session?.name || 'Sessão'}
        playerCount={characters?.length || 0}
        activeObjectives={0}
      />
      <div>
        <h2 className="text-xl font-bold high-contrast-text mb-4">Action Dots</h2>
        <ActionDots
          dots={actionDots}
          onDotClick={(dot) => {
            console.log('Action dot clicked:', dot);
          }}
        />
      </div>
      <PlayerStatus players={playerStatusData} />
    </div>,

    <div key="narratives" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>Narrativas</CardTitle>
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar narrativas..."
                  value={narrativeSearch}
                  onChange={(e) => setNarrativeSearch(e.target.value)}
                  className="pl-8 min-h-[44px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredNarratives.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma narrativa encontrada
                </p>
              ) : (
                filteredNarratives.map((narrative, index) => (
                  <NarrativeCard
                    key={index}
                    narrative={narrative}
                    index={index}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>,

    <div key="players" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Jogadores Conectados</CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectedPlayersList
            users={connectedUsers}
            currentUserId={user?.id || null}
            sessionId={sessionId}
            isOriginalCreator={session?.userId === user?.id}
            isMaster={true}
            masters={[]}
          />
        </CardContent>
      </Card>
      
      {characters && characters.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fichas de Personagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {characters.map((character) => (
                <CharacterSheet
                  key={character.id}
                  character={character}
                  editable={true}
                  onUpdate={(updates) => handleUpdateCharacter(character.id, updates)}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>,

    <div key="controls" className="space-y-4">
      <MasterDiceRequest
        connectedUsers={connectedUsers}
        currentUserId={user?.id || ''}
        sessionId={sessionId || ''}
        onRequestDice={handleDiceRequest}
        pendingRequests={pendingDiceRequests}
      />
      <QuickNotes
        notes={notes}
        onSave={handleSaveNotes}
      />
    </div>,

    <div key="world" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Memória da Sessão</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {memory && memory.length > 0 ? (
                memory.map((m) => (
                  <div key={m.id} className="p-3 border rounded-lg">
                    <div className="font-semibold text-sm">{m.key}</div>
                    <div className="text-sm text-muted-foreground mt-1">{m.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Tipo: {m.type}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma memória registrada
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <NarrativeTimeline events={timelineEvents} />
    </div>,
  ];

  return (
    <MasterTabs
      tabLabels={['Visão Geral', 'Narrativas', 'Jogadores', 'Controles', 'Mundo']}
      defaultTab="Visão Geral"
    >
      {tabContent}
    </MasterTabs>
  );
};

