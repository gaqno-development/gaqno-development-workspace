import React from 'react';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'light' | 'heavy';
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'default',
  onClick,
}) => {
  const variantClasses = {
    default: 'glass-card',
    light: 'glass-card-light',
    heavy: 'glass-card-heavy',
  };

  return (
    <div
      className={cn(
        variantClasses[variant],
        'rounded-lg p-4 transition-all duration-300',
        onClick && 'cursor-pointer hover:shadow-xl hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

