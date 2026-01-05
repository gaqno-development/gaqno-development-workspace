import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Heart, Shield, Zap } from 'lucide-react';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface PlayerStatusData {
  id: string;
  name: string;
  hp?: { current: number; max: number };
  resources?: Record<string, { current: number; max: number }>;
  statusEffects?: string[];
}

interface PlayerStatusProps {
  players: PlayerStatusData[];
  className?: string;
}

export const PlayerStatus: React.FC<PlayerStatusProps> = ({
  players,
  className,
}) => {
  if (players.length === 0) {
    return (
      <GlassCard variant="light" className={className}>
        <p className="text-sm high-contrast-text-muted text-center py-4">
          Nenhum jogador na sessão
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="light" className={className}>
      <h3 className="text-lg font-bold high-contrast-text mb-4">Status dos Jogadores</h3>
      <div className="space-y-3">
        {players.map((player) => {
          const hpPercentage = player.hp ? (player.hp.current / player.hp.max) * 100 : 100;
          const isCritical = hpPercentage < 25;

          return (
            <div key={player.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm high-contrast-text">{player.name}</span>
                {player.hp && (
                  <span className={cn(
                    'text-xs font-medium',
                    isCritical ? 'text-red-400' : 'high-contrast-text-muted'
                  )}>
                    {player.hp.current}/{player.hp.max} HP
                  </span>
                )}
              </div>
              {player.hp && (
                <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      isCritical ? 'bg-red-500' : hpPercentage < 50 ? 'bg-yellow-500' : 'bg-green-500'
                    )}
                    style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
                  />
                </div>
              )}
              {player.resources && Object.entries(player.resources).length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(player.resources).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-1 text-xs high-contrast-text-muted">
                      <Zap className="w-3 h-3" />
                      <span>{key}: {value.current}/{value.max}</span>
                    </div>
                  ))}
                </div>
              )}
              {player.statusEffects && player.statusEffects.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {player.statusEffects.map((effect) => (
                    <span
                      key={effect}
                      className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                    >
                      {effect}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

