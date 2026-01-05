import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRpgSession } from '../hooks/useRpgSessions';
import { useRpgCharacters, useUpdateRpgCharacter } from '../hooks/useRpgCharacters';
import { useRpgHistory, useRpgActions, useRpgMemory } from '../hooks/useRpgActions';
import { useRpgWebSocket } from '../hooks/useRpgWebSocket';
import { useAuth } from '@gaqno-dev/frontcore/hooks';
import { ActionDots, ActionDot } from '../components/ActionDots';
import { SessionStats } from '../components/dashboard/SessionStats';
import { PlayerStatus } from '../components/dashboard/PlayerStatus';
import { QuickNotes } from '../components/dashboard/QuickNotes';
import { NarrativeTimeline } from '../components/dashboard/NarrativeTimeline';
import { MasterTabs } from '../components/MasterTabs';
import { MasterDiceRequest } from '../components/MasterDiceRequest';
import { ConnectedPlayersList } from '../components/ConnectedPlayersList';
import { CharacterSheet } from '../components/CharacterSheet';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-dev/frontcore/components/ui';
import { ScrollArea } from '@gaqno-dev/frontcore/components/ui';
import { Input } from '@gaqno-dev/frontcore/components/ui';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { DiceRollRequest, NarratorResponse, RpgCharacter } from '../types/rpg.types';
import '../styles/glassmorphism.css';
import '../styles/typography.css';

export const MasterDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: session } = useRpgSession(id || null);
  const { data: characters } = useRpgCharacters(id || null);
  const { data: history } = useRpgHistory(id || null);
  const { data: actions } = useRpgActions(id || null);
  const { data: memory } = useRpgMemory(id || null);
  const updateCharacter = useUpdateRpgCharacter();
  const [notes, setNotes] = useState('');
  const [actionDots, setActionDots] = useState<ActionDot[]>([]);
  const [pendingDiceRequests, setPendingDiceRequests] = useState<DiceRollRequest[]>([]);
  const [narrativeSearch, setNarrativeSearch] = useState('');
  const [narrativeFilter, setNarrativeFilter] = useState<string>('all');

  const { 
    connectedUsers, 
    requestDiceRoll,
    submitAction,
    isConnected 
  } = useRpgWebSocket({
    sessionId: id || null,
    userId: user?.id || null,
    mode: 'master',
    onDiceRollRequested: (request: any) => {
      setPendingDiceRequests(prev => [...prev, request]);
    },
    onDiceRollCompleted: (request: any) => {
      setPendingDiceRequests(prev => 
        prev.map(r => r.id === request.id ? { ...r, status: 'submitted' as const, result: request.result } : r)
      );
    },
    onActionResult: (data) => {
      console.log('[MasterDashboard] Action result received:', data);
    },
  });

  useEffect(() => {
    const savedNotes = localStorage.getItem(`rpg-notes-${id}`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [id]);

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
    if (!id || !requestDiceRoll) return;
    
    const fullRequest: DiceRollRequest = {
      ...request,
      id: `dice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    setPendingDiceRequests(prev => [...prev, fullRequest]);
    requestDiceRoll({
      sessionId: id,
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

  const tabContent = [
    // Tab 1: Visão Geral
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

    // Tab 2: Narrativas
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
                filteredNarratives.map((narrative, index) => {
                  const narrativeText = narrative.narratives.find(n => n.level === narrative.outcome);
                  return (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold uppercase">
                              {narrative.outcome.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Dado: {narrative.dice.roll} (Natural: {narrative.dice.natural})
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">
                            {narrativeText?.text || 'Narrativa não disponível'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>,

    // Tab 3: Jogadores
    <div key="players" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Jogadores Conectados</CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectedPlayersList
            users={connectedUsers}
            currentUserId={user?.id || null}
            sessionId={id || null}
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

    // Tab 4: Controles do Mestre
    <div key="controls" className="space-y-4">
      <MasterDiceRequest
        connectedUsers={connectedUsers}
        currentUserId={user?.id || ''}
        sessionId={id || ''}
        onRequestDice={handleDiceRequest}
        pendingRequests={pendingDiceRequests}
      />
      <QuickNotes
        notes={notes}
        onSave={(newNotes) => {
          setNotes(newNotes);
          localStorage.setItem(`rpg-notes-${id}`, newNotes);
        }}
      />
    </div>,

    // Tab 5: Mundo
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/rpg/sessions/${id}`)}
            className="min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Sessão
          </Button>
          <div className="text-sm text-muted-foreground">
            WebSocket: {isConnected ? 'Conectado' : 'Desconectado'}
          </div>
        </div>
        
        <MasterTabs
          tabLabels={['Visão Geral', 'Narrativas', 'Jogadores', 'Controles', 'Mundo']}
          defaultTab="Visão Geral"
        >
          {tabContent}
        </MasterTabs>
      </div>
    </div>
  );
};
