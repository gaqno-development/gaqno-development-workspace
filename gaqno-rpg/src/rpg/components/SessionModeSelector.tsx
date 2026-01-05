import React from 'react';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Monitor, Crown, User } from 'lucide-react';
import { SessionMode } from '../types/rpg.types';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface SessionModeSelectorProps {
  mode: SessionMode;
  onModeChange: (mode: SessionMode) => void;
  disabled?: boolean;
}

const modeConfig: Record<SessionMode, { label: string; icon: React.ComponentType; description: string }> = {
  presentation: {
    label: 'Apresentação',
    icon: Monitor,
    description: 'Modo somente leitura para projeção'
  },
  master: {
    label: 'Mestre',
    icon: Crown,
    description: 'Controle total da sessão'
  },
  player: {
    label: 'Jogador',
    icon: User,
    description: 'Participar como jogador'
  }
};

export const SessionModeSelector: React.FC<SessionModeSelectorProps> = ({
  mode,
  onModeChange,
  disabled = false
}) => {
  return (
    <div className="flex gap-2">
      {(Object.keys(modeConfig) as SessionMode[]).map((m) => {
        const config = modeConfig[m];
        const Icon = config.icon;
        const isActive = mode === m;

        return (
          <Button
            key={m}
            variant={isActive ? 'default' : 'outline'}
            onClick={() => !disabled && onModeChange(m)}
            disabled={disabled}
            className={cn('flex flex-col items-center gap-1 h-auto py-2 px-4')}
            title={config.description}
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs">{config.label}</span>
          </Button>
        );
      })}
    </div>
  );
};

