import React, { useEffect } from 'react';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { X, ChevronRight } from 'lucide-react';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface MasterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export const MasterPanel: React.FC<MasterPanelProps> = ({
  isOpen,
  onToggle,
  children,
  className,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          'fixed top-0 right-0 h-full bg-background border-l shadow-xl z-50 transition-transform duration-300 ease-in-out',
          'flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          'w-full md:w-[400px] lg:w-[450px]',
          className
        )}
      >
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h2 className="text-lg font-semibold">Master Dashboard</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="min-h-[44px] min-w-[44px]"
            aria-label="Fechar painel"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </div>
      {!isOpen && (
        <Button
          variant="outline"
          size="icon"
          onClick={onToggle}
          className={cn(
            'fixed right-4 top-20 z-40 min-h-[44px] min-w-[44px] shadow-lg',
            'transition-all duration-300',
            'bg-background hover:bg-accent',
            'hidden md:flex'
          )}
          aria-label="Abrir Master Dashboard"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </>
  );
};

