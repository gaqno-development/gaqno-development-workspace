import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-dev/frontcore/components/ui';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Input } from '@gaqno-dev/frontcore/components/ui';
import { Label } from '@gaqno-dev/frontcore/components/ui';
import { Textarea } from '@gaqno-dev/frontcore/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@gaqno-dev/frontcore/components/ui';
import { ScrollArea } from '@gaqno-dev/frontcore/components/ui';
import { Send, Sword, Package, Dice1, MessageSquare } from 'lucide-react';

interface ConnectedUser {
  userId: string;
  playerName?: string;
  mode: 'presentation' | 'master' | 'player';
}

interface MasterActionSenderProps {
  connectedUsers: ConnectedUser[];
  currentUserId: string;
  sessionId: string;
  onSendAction: (data: {
    type: 'battle' | 'item' | 'dice' | 'narrative';
    targetPlayerId?: string;
    action: string;
    dice?: {
      formula: string;
      target?: number;
    };
    context?: Record<string, any>;
  }) => void;
}

const actionTypes = [
  { value: 'battle', label: 'Batalha', icon: Sword },
  { value: 'item', label: 'Item', icon: Package },
  { value: 'dice', label: 'Rolagem', icon: Dice1 },
  { value: 'narrative', label: 'Narrativa', icon: MessageSquare },
] as const;

export const MasterActionSender: React.FC<MasterActionSenderProps> = ({
  connectedUsers,
  currentUserId,
  sessionId,
  onSendAction,
}) => {
  const [actionType, setActionType] = useState<'battle' | 'item' | 'dice' | 'narrative'>('narrative');
  const [targetPlayer, setTargetPlayer] = useState<string>('all');
  const [action, setAction] = useState('');
  const [formula, setFormula] = useState('1d20');
  const [target, setTarget] = useState('');
  const [context, setContext] = useState('');

  const players = connectedUsers.filter(
    user => user.userId !== currentUserId && user.mode !== 'presentation'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!action.trim()) return;

    const actionData: any = {
      type: actionType,
      action: action.trim(),
      context: context ? { description: context } : undefined,
    };

    if (targetPlayer !== 'all') {
      actionData.targetPlayerId = targetPlayer;
    }

    if (actionType === 'dice' || actionType === 'battle') {
      actionData.dice = {
        formula: formula || '1d20',
        target: target ? Number(target) : undefined,
      };
    }

    onSendAction(actionData);

    // Reset form
    setAction('');
    setFormula('1d20');
    setTarget('');
    setContext('');
  };

  const ActionIcon = actionTypes.find(t => t.value === actionType)?.icon || MessageSquare;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActionIcon className="w-5 h-5" />
          Enviar Evento para Jogadores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="actionType">Tipo de Evento</Label>
            <Select value={actionType} onValueChange={(value: any) => setActionType(value)}>
              <SelectTrigger id="actionType" className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value} className="min-h-[44px]">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {players.length > 0 && (
            <div>
              <Label htmlFor="targetPlayer">Jogador Alvo</Label>
              <Select value={targetPlayer} onValueChange={setTargetPlayer}>
                <SelectTrigger id="targetPlayer" className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="min-h-[44px]">
                    Todos os Jogadores
                  </SelectItem>
                  {players.map((player) => (
                    <SelectItem 
                      key={player.userId} 
                      value={player.userId}
                      className="min-h-[44px]"
                    >
                      {player.playerName || player.userId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="action">Ação/Descrição</Label>
            <Textarea
              id="action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder={
                actionType === 'battle' ? 'Descreva o evento de batalha...' :
                actionType === 'item' ? 'Descreva o item encontrado...' :
                actionType === 'dice' ? 'Descreva o que está sendo testado...' :
                'Descreva a narrativa/evento...'
              }
              rows={3}
              className="min-h-[100px]"
            />
          </div>

          {(actionType === 'dice' || actionType === 'battle') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="formula">Fórmula do Dado</Label>
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
          )}

          <div>
            <Label htmlFor="context">Contexto Adicional (opcional)</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Informações adicionais sobre o evento..."
              rows={2}
              className="min-h-[80px]"
            />
          </div>

          <Button
            type="submit"
            disabled={!action.trim()}
            className="w-full min-h-[44px]"
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar Evento
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

