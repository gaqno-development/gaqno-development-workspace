import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@gaqno-dev/frontcore/components/ui';
import { 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  AlertCircle,
  Dice6
} from 'lucide-react';
import { NarratorResponse, Outcome } from '../types/rpg.types';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface NarrativeCardProps {
  narrative: NarratorResponse;
  index?: number;
  className?: string;
}

const outcomeConfig: Record<Outcome, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colors: {
    bg: string;
    border: string;
    text: string;
    icon: string;
    badge: string;
  };
  animation: {
    duration: number;
    delay: number;
  };
}> = {
  critical_success: {
    label: 'Sucesso Crítico',
    icon: Sparkles,
    colors: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      border: 'border-green-500',
      text: 'text-green-900 dark:text-green-100',
      icon: 'text-green-600 dark:text-green-400',
      badge: 'bg-green-600 text-white',
    },
    animation: {
      duration: 0.5,
      delay: 0,
    },
  },
  success: {
    label: 'Sucesso',
    icon: CheckCircle,
    colors: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-500',
      text: 'text-blue-900 dark:text-blue-100',
      icon: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-600 text-white',
    },
    animation: {
      duration: 0.4,
      delay: 0.1,
    },
  },
  partial: {
    label: 'Parcial',
    icon: AlertTriangle,
    colors: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      border: 'border-yellow-500',
      text: 'text-yellow-900 dark:text-yellow-100',
      icon: 'text-yellow-600 dark:text-yellow-400',
      badge: 'bg-yellow-600 text-white',
    },
    animation: {
      duration: 0.4,
      delay: 0.1,
    },
  },
  failure: {
    label: 'Falha',
    icon: XCircle,
    colors: {
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-500',
      text: 'text-orange-900 dark:text-orange-100',
      icon: 'text-orange-600 dark:text-orange-400',
      badge: 'bg-orange-600 text-white',
    },
    animation: {
      duration: 0.4,
      delay: 0.1,
    },
  },
  critical_failure: {
    label: 'Falha Crítica',
    icon: AlertCircle,
    colors: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-500',
      text: 'text-red-900 dark:text-red-100',
      icon: 'text-red-600 dark:text-red-400',
      badge: 'bg-red-600 text-white',
    },
    animation: {
      duration: 0.5,
      delay: 0,
    },
  },
};

export const NarrativeCard: React.FC<NarrativeCardProps> = ({
  narrative,
  index = 0,
  className,
}) => {
  const config = outcomeConfig[narrative.outcome];
  const Icon = config.icon;
  const narrativeText = narrative.narratives.find(n => n.level === narrative.outcome) 
    || narrative.narratives[0];
  const hasDiceRoll = narrative.dice.roll !== 0 || narrative.dice.natural !== 0;
  const displayText = narrativeText?.text || narrative.narratives?.[0]?.text || 'Narrativa não disponível';

  const animationVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: config.animation.duration,
        delay: config.animation.delay + (index * 0.05),
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const iconVariants = {
    hidden: {
      scale: 0,
      rotate: -180,
    },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        delay: config.animation.delay + 0.1,
        type: 'spring',
        stiffness: 200,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={animationVariants}
      className={className}
    >
      <Card
        className={cn(
          'border-2 transition-all hover:shadow-lg',
          config.colors.bg,
          config.colors.border,
          className
        )}
      >
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <motion.div
                variants={iconVariants}
                initial="hidden"
                animate="visible"
                className={cn(
                  'flex-shrink-0 p-2 rounded-lg',
                  config.colors.bg
                )}
              >
                <Icon className={cn('w-6 h-6', config.colors.icon)} />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide',
                      config.colors.badge
                    )}
                  >
                    {config.label}
                  </span>
                  
                  {hasDiceRoll && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Dice6 className={cn('w-3.5 h-3.5', config.colors.icon)} />
                      <span className={cn('font-mono', config.colors.text)}>
                        {narrative.dice.roll}
                        {narrative.dice.natural !== narrative.dice.roll && (
                          <span className="opacity-70">
                            {' '}({narrative.dice.natural})
                          </span>
                        )}
                        {narrative.dice.target && (
                          <span className="opacity-70">
                            {' '}/ {narrative.dice.target}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                
                <p className={cn('text-sm leading-relaxed', config.colors.text)}>
                  {displayText}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

