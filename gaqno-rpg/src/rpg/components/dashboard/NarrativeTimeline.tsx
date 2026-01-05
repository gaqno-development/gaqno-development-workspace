import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { ScrollArea } from '@gaqno-dev/frontcore/components/ui';
import { Clock } from 'lucide-react';

interface TimelineEvent {
  id: string;
  timestamp: string;
  summary: string;
  type?: 'action' | 'narrative' | 'combat' | 'dialogue';
}

interface NarrativeTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export const NarrativeTimeline: React.FC<NarrativeTimelineProps> = ({
  events,
  className,
}) => {
  if (events.length === 0) {
    return (
      <GlassCard variant="light" className={className}>
        <p className="text-sm high-contrast-text-muted text-center py-4">
          Nenhum evento registrado ainda
        </p>
      </GlassCard>
    );
  }

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <GlassCard variant="light" className={className}>
      <h3 className="text-lg font-bold high-contrast-text mb-4">Linha do Tempo</h3>
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {events.map((event, idx) => (
            <div key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary" />
                {idx < events.length - 1 && (
                  <div className="w-px h-full bg-white/10 mt-1" />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs high-contrast-text-muted">
                    {formatTime(event.timestamp)}
                  </span>
                  {event.type && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary-foreground">
                      {event.type}
                    </span>
                  )}
                </div>
                <p className="text-sm text-readable-sm high-contrast-text">
                  {event.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </GlassCard>
  );
};

