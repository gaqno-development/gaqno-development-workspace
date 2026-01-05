import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-dev/frontcore/components/ui';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Input } from '@gaqno-dev/frontcore/components/ui';
import { Label } from '@gaqno-dev/frontcore/components/ui';
import { Textarea } from '@gaqno-dev/frontcore/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@gaqno-dev/frontcore/components/ui';
import { ScrollArea } from '@gaqno-dev/frontcore/components/ui';
import { DiceRollRequest } from '../types/rpg.types';
import { Send, Clock } from 'lucide-react';

interface ConnectedUser {
  userId: string;
  playerName?: string;
  mode: 'presentation' | 'master' | 'player';
}

interface MasterDiceRequestProps {
  connectedUsers: ConnectedUser[];
  currentUserId: string;
  sessionId: string;
  onRequestDice: (request: Omit<DiceRollRequest, 'id' | 'status' | 'createdAt'>) => void;
  pendingRequests?: DiceRollRequest[];
}

export const MasterDiceRequest: React.FC<MasterDiceRequestProps> = ({
  connectedUsers,
  currentUserId,
  sessionId,
  onRequestDice,
  pendingRequests = [],
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [formula, setFormula] = useState('1d20');
  const [target, setTarget] = useState('');
  const [context, setContext] = useState('');

  const players = connectedUsers.filter(
    user => user.userId !== currentUserId && user.mode !== 'presentation'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlayer) {
      console.error('[MasterDiceRequest] No player selected');
      return;
    }
    
    if (!formula || !formula.trim()) {
      console.error('[MasterDiceRequest] No formula provided');
      return;
    }

    const selectedPlayerData = players.find(p => p.userId === selectedPlayer);
    if (!selectedPlayerData) {
      console.error('[MasterDiceRequest] Selected player not found in available players:', {
        selectedPlayer,
        availablePlayers: players.map(p => ({ userId: p.userId, name: p.playerName }))
      });
      return;
    }

    const requestData = {
      sessionId,
      requestedBy: currentUserId,
      requestedFor: selectedPlayer,
      formula: formula.trim(),
      target: target ? Number(target) : undefined,
      context: context?.trim() || undefined,
    };
    
    console.log('[MasterDiceRequest] Submitting dice roll request:', {
      ...requestData,
      playerName: selectedPlayerData.playerName || selectedPlayerData.userId,
    });
    console.log('[MasterDiceRequest] Validation:', {
      hasSelectedPlayer: !!selectedPlayer,
      hasFormula: !!formula,
      playerExists: !!selectedPlayerData,
      requestedFor: requestData.requestedFor,
    });

    onRequestDice(requestData);

    setSelectedPlayer('');
    setFormula('1d20');
    setTarget('');
    setContext('');
  };

  const pendingForPlayer = (playerId: string) => {
    return pendingRequests.filter(r => r.requestedFor === playerId && r.status === 'pending');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pedir Rolagem de Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="player">Jogador *</Label>
              {players.length === 0 ? (
                <div className="p-3 border border-dashed rounded-lg text-sm text-muted-foreground text-center">
                  Nenhum jogador conectado
                </div>
              ) : (
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger id="player" className="min-h-[44px]">
                    <SelectValue placeholder="Selecione um jogador" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player) => (
                      <SelectItem 
                        key={player.userId} 
                        value={player.userId}
                        className="min-h-[44px]"
                      >
                        {player.playerName || player.userId}
                        {pendingForPlayer(player.userId).length > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({pendingForPlayer(player.userId).length} pendente)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="formula">Fórmula</Label>
                <Input
                  id="formula"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  placeholder="1d20+5"
                  className="min-h-[44px]"
                />
              </div>
              <div>
                <Label htmlFor="target">DC (opcional)</Label>
                <Input
                  id="target"
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="15"
                  className="min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="context">Contexto (opcional)</Label>
              <Textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Teste de percepção para detectar armadilhas..."
                rows={2}
                className="min-h-[80px]"
              />
            </div>

            <Button
              type="submit"
              disabled={!selectedPlayer || !formula}
              className="w-full min-h-[44px]"
            >
              <Send className="w-4 h-4 mr-2" />
              Pedir Rolagem
            </Button>
          </form>
        </CardContent>
      </Card>

      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-3 border rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {players.find(p => p.userId === request.requestedFor)?.playerName || request.requestedFor}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {request.formula} {request.target && `(DC: ${request.target})`}
                      </div>
                      {request.context && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {request.context}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {request.status === 'pending' ? 'Pendente' : 
                         request.status === 'rolled' ? 'Rolado' : 'Submetido'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

