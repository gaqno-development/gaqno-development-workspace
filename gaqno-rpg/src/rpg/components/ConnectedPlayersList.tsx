import React, { useEffect } from 'react';
import { Crown, User, Monitor, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { SessionMode } from '../types/rpg.types';
import { usePromoteToMaster, useDemoteFromMaster, useRenounceMaster } from '../hooks/useRpgSessions';

interface ConnectedUser {
  userId: string;
  playerName?: string;
  mode: SessionMode;
  connectedAt: string;
}

interface ConnectedPlayersListProps {
  users: ConnectedUser[];
  currentUserId?: string | null;
  sessionId: string | null;
  isOriginalCreator?: boolean;
  isMaster?: boolean;
  masters?: Array<{ userId: string; isOriginalCreator: boolean }>;
}

const modeConfig: Record<SessionMode, { label: string; icon: React.ComponentType; color: string }> = {
  presentation: {
    label: 'Apresentação',
    icon: Monitor,
    color: 'text-muted-foreground'
  },
  master: {
    label: 'Mestre',
    icon: Crown,
    color: 'text-yellow-600'
  },
  player: {
    label: 'Jogador',
    icon: User,
    color: 'text-blue-600'
  }
};

export const ConnectedPlayersList: React.FC<ConnectedPlayersListProps> = ({
  users,
  currentUserId,
  sessionId,
  isOriginalCreator = false,
  isMaster = false,
  masters = []
}) => {
  const promoteToMaster = usePromoteToMaster();
  const demoteFromMaster = useDemoteFromMaster();
  const renounceMaster = useRenounceMaster();

  const isUserMaster = (userId: string) => {
    return masters.some(m => m.userId === userId);
  };

  const handlePromote = async (userId: string) => {
    if (!sessionId) return;
    try {
      await promoteToMaster.mutateAsync({ sessionId, userId });
    } catch (error) {
      console.error('Error promoting to master:', error);
    }
  };

  const handleDemote = async (userId: string) => {
    if (!sessionId) return;
    try {
      await demoteFromMaster.mutateAsync({ sessionId, userId });
    } catch (error) {
      console.error('Error demoting from master:', error);
    }
  };

  const handleRenounce = async () => {
    if (!sessionId) return;
    try {
      await renounceMaster.mutateAsync(sessionId);
    } catch (error) {
      console.error('Error renouncing master:', error);
    }
  };

  useEffect(() => {
    console.log('[ConnectedPlayersList] Received users:', users);
    console.log('[ConnectedPlayersList] Props:', { currentUserId, isOriginalCreator, isMaster, masters });
  }, [users, currentUserId, isOriginalCreator, isMaster, masters]);

  const uniqueUsers = React.useMemo(() => {
    const userMap = new Map<string, ConnectedUser>();
    users.forEach(user => {
      const existing = userMap.get(user.userId);
      if (!existing) {
        userMap.set(user.userId, user);
      } else {
        const priorityOrder: SessionMode[] = ['master', 'player', 'presentation'];
        const existingPriority = priorityOrder.indexOf(existing.mode);
        const newPriority = priorityOrder.indexOf(user.mode);
        if (newPriority < existingPriority) {
          userMap.set(user.userId, user);
        } else {
          userMap.set(user.userId, existing);
        }
      }
    });
    const result = Array.from(userMap.values());
    console.log('[ConnectedPlayersList] Unique users after deduplication:', result);
    return result;
  }, [users]);

  if (users.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Nenhum jogador conectado
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {uniqueUsers.map((user) => {
        const config = modeConfig[user.mode];
        const Icon = config.icon;
        const isCurrentUser = user.userId === currentUserId;
        const userIsMaster = isUserMaster(user.userId);
        const hasOtherMaster = masters && masters.some(m => m.userId !== user.userId && !m.isOriginalCreator);
        const canPromote = isOriginalCreator && !userIsMaster && user.userId !== currentUserId && user.mode !== 'presentation' && !hasOtherMaster;
        const canDemote = isOriginalCreator && userIsMaster && !masters.find(m => m.userId === user.userId)?.isOriginalCreator && user.userId !== currentUserId;
        const canRenounce = isMaster && isCurrentUser && !isOriginalCreator;

        return (
          <div
            key={user.userId}
            className={`flex items-center gap-2 p-2 rounded-md border ${
              isCurrentUser ? 'bg-muted' : 'bg-background'
            }`}
          >
            <div className={`relative ${config.color}`}>
              <Icon className="w-4 h-4" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {user.playerName || (user.userId === 'anonymous' ? 'Anônimo' : user.userId)}
                {isCurrentUser && (
                  <span className="ml-2 text-xs text-muted-foreground">(Você)</span>
                )}
                {userIsMaster && (
                  <Crown className="w-3 h-3 inline ml-1 text-yellow-500" />
                )}
              </div>
              <div className="text-xs text-muted-foreground">{config.label}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              {canPromote && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePromote(user.userId)}
                  disabled={promoteToMaster.isPending}
                  className="h-6 w-6 p-0"
                  title="Promover a Mestre"
                >
                  <ArrowUp className="w-3 h-3" />
                </Button>
              )}
              {canDemote && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDemote(user.userId)}
                  disabled={demoteFromMaster.isPending}
                  className="h-6 w-6 p-0"
                  title="Rebaixar de Mestre"
                >
                  <ArrowDown className="w-3 h-3" />
                </Button>
              )}
              {canRenounce && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRenounce}
                  disabled={renounceMaster.isPending}
                  className="h-6 px-2 text-xs"
                  title="Renunciar Mestria"
                >
                  Renunciar
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

