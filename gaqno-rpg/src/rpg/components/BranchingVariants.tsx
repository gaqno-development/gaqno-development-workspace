import React from 'react';
import { Card, CardContent } from '@gaqno-dev/frontcore/components/ui';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Check } from 'lucide-react';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface BranchingVariantsProps {
  variants: any[];
  onSelect: (variant: any, index: number) => void;
  selectedIndex?: number;
  formatContent?: (data: any) => string;
}

const defaultFormatContent = (data: any): string => {
  if (!data) return '';
  return JSON.stringify(data, null, 2);
};

export const BranchingVariants: React.FC<BranchingVariantsProps> = ({
  variants,
  onSelect,
  selectedIndex,
  formatContent = defaultFormatContent,
}) => {
  if (variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Variações Geradas</h3>
        <span className="text-sm text-muted-foreground">
          Escolha uma versão para continuar
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {variants.map((variant, idx) => {
          const isSelected = selectedIndex === idx;
          
          return (
            <Card
              key={idx}
              className={cn(
                'relative transition-all duration-200 cursor-pointer',
                'hover:shadow-lg hover:scale-[1.02]',
                isSelected && 'ring-2 ring-primary shadow-lg scale-[1.02]',
                'bg-background/80 backdrop-blur-sm border-border/50'
              )}
              onClick={() => onSelect(variant, idx)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Variação {idx + 1}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                <div className="bg-muted/50 p-3 rounded-lg max-h-[300px] overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono text-foreground/80">
                    {formatContent(variant)}
                  </pre>
                </div>

                <Button
                  className={cn(
                    'w-full',
                    isSelected && 'bg-primary text-primary-foreground'
                  )}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(variant, idx);
                  }}
                >
                  {isSelected ? 'Selecionado' : 'Usar esta versão'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

