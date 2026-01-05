import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@gaqno-dev/frontcore/components/ui';
import { ScrollArea } from '@gaqno-dev/frontcore/components/ui';
import { NarratorResponse } from '../types/rpg.types';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface NarrativeFlowProps {
  narratives: NarratorResponse[];
  className?: string;
}

const outcomeColors: Record<string, string> = {
  critical_success: 'border-green-500 bg-green-50 dark:bg-green-950/20',
  success: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
  partial: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
  failure: 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
  critical_failure: 'border-red-500 bg-red-50 dark:bg-red-950/20',
};

const outcomeLabels: Record<string, string> = {
  critical_success: 'Sucesso Crítico',
  success: 'Sucesso',
  partial: 'Parcial',
  failure: 'Falha',
  critical_failure: 'Falha Crítica',
};

export const NarrativeFlow: React.FC<NarrativeFlowProps> = ({
  narratives,
  className,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: endRef.current.offsetTop,
        behavior: 'smooth',
      });
    }
  }, [narratives]);

  if (narratives.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full min-h-[400px]', className)}>
        <p className="text-muted-foreground">Aguardando narrativas...</p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn('h-full min-h-[400px]', className)} ref={scrollRef}>
      <div className="space-y-4 p-4">
        <AnimatePresence initial={false}>
          {narratives.map((narrative, index) => {
            const narrativeText = narrative.narratives.find(
              (n) => n.level === narrative.outcome
            ) || narrative.narratives[0]; // Fallback para primeira narrativa se não encontrar pelo outcome
            const outcomeColor = outcomeColors[narrative.outcome] || outcomeColors.success;
            const outcomeLabel = outcomeLabels[narrative.outcome] || narrative.outcome;

            // Se ainda não tiver texto, usar uma mensagem padrão baseada no outcome
            const displayText = narrativeText?.text || 
              (narrative.outcome === 'critical_failure' ? 'A ação falhou completamente, resultando em consequências desastrosas.' :
               narrative.outcome === 'failure' ? 'A ação não foi bem-sucedida.' :
               narrative.outcome === 'partial' ? 'A ação teve sucesso parcial.' :
               narrative.outcome === 'success' ? 'A ação foi bem-sucedida.' :
               narrative.outcome === 'critical_success' ? 'A ação foi um sucesso extraordinário!' :
               'A ação foi executada.');

            return (
              <motion.div
                key={`${narrative.outcome}-${index}-${narrative.dice.roll}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={cn('transition-all', outcomeColor)}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          {outcomeLabel}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Dado: {narrative.dice.roll} (Natural: {narrative.dice.natural})
                        </span>
                      </div>
                      
                      <p className="text-base leading-relaxed">
                        {displayText}
                      </p>

                      {(narrative.mechanics.xp_gain || narrative.mechanics.hp_change) && (
                        <div className="flex gap-4 text-sm text-muted-foreground pt-2 border-t">
                          {narrative.mechanics.xp_gain && (
                            <span>XP: +{narrative.mechanics.xp_gain}</span>
                          )}
                          {narrative.mechanics.hp_change && (
                            <span>
                              HP: {narrative.mechanics.hp_change > 0 ? '+' : ''}
                              {narrative.mechanics.hp_change}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                {index === narratives.length - 1 && <div ref={endRef} />}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
};

