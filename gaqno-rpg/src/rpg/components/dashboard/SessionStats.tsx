import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Clock, Users, Target } from 'lucide-react';

interface SessionStatsProps {
  sessionName: string;
  duration?: number;
  playerCount: number;
  activeObjectives?: number;
  className?: string;
}

export const SessionStats: React.FC<SessionStatsProps> = ({
  sessionName,
  duration,
  playerCount,
  activeObjectives = 0,
  className,
}) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <GlassCard variant="light" className={className}>
      <h3 className="text-lg font-bold high-contrast-text mb-4">{sessionName}</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-xs high-contrast-text-muted">Duração</div>
            <div className="text-sm font-semibold high-contrast-text">
              {duration ? formatDuration(duration) : '--'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-green-400" />
          <div>
            <div className="text-xs high-contrast-text-muted">Jogadores</div>
            <div className="text-sm font-semibold high-contrast-text">{playerCount}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-yellow-400" />
          <div>
            <div className="text-xs high-contrast-text-muted">Objetivos</div>
            <div className="text-sm font-semibold high-contrast-text">{activeObjectives}</div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

