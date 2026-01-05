import React from 'react';
import { Badge, Button, Card, CardContent, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@gaqno-dev/frontcore/components/ui';
import { ChevronDown, Link2, Loader2, Sparkles, Table } from 'lucide-react';
import { useDnd5eSpecialEndpoint } from '../../../../../hooks/useDnd5e';
import { getCategoryFromUrl } from '../../helpers';

interface SpecialEndpointRendererProps {
  category: string;
  index: string;
  endpoint: string;
  label: string;
  onItemClick?: (category: string, index: string) => void;
}

export const SpecialEndpointRenderer: React.FC<SpecialEndpointRendererProps> = ({
  category,
  index,
  endpoint,
  label,
  onItemClick,
}) => {
  const { data, isLoading, error } = useDnd5eSpecialEndpoint(category, index, endpoint);

  if (isLoading) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando {label}...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/20">
        <CardContent className="p-4">
          <p className="text-sm text-destructive">Erro ao carregar {label}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  if (endpoint === 'levels' && Array.isArray(data)) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Table className="w-4 h-4" />
            {label}
          </h4>
          <div className="space-y-2 max-h-96 overflow-auto">
            {data.map((level: any, idx: number) => (
              <Collapsible key={idx} className="border rounded-md p-2">
                <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 rounded p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Nível {level.level || idx + 1}</Badge>
                    {level.class && <span className="text-sm">{level.class.name}</span>}
                  </div>
                  <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2 space-y-2">
                  {level.features && level.features.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1">Características:</p>
                      <div className="flex flex-wrap gap-1">
                        {level.features.map((feature: any, fIdx: number) => (
                          <Badge key={fIdx} variant="outline" className="text-xs">
                            {feature.name || feature.index}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {level.class_specific && (
                    <div>
                      <p className="text-xs font-semibold mb-1">Específico da Classe:</p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(level.class_specific, null, 2)}
                      </pre>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (endpoint === 'spells' && data.results && Array.isArray(data.results)) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {label}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-auto">
            {data.results.map((spell: any, idx: number) => {
              const spellUrlInfo = spell.url ? getCategoryFromUrl(spell.url) : null;
              const spellIndex = spell.url ? spell.url.split('/').pop() : null;
              
              return (
                <Button
                  key={idx}
                  variant="outline"
                  className="justify-start h-auto p-2"
                  onClick={() => {
                    if (spellUrlInfo && spellIndex && onItemClick) {
                      onItemClick(spellUrlInfo, spellIndex);
                    }
                  }}
                >
                  <div className="text-left">
                    <p className="text-sm font-medium">{spell.name}</p>
                    {spell.level !== undefined && (
                      <p className="text-xs text-muted-foreground">Nível {spell.level}</p>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          {label}
        </h4>
        <Collapsible className="group">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium mb-2 hover:text-foreground">
            <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            Ver dados (JSON)
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-60">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

