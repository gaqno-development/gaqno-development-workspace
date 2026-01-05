import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-dev/frontcore/components/ui';
import { ScrollText, Loader2 } from 'lucide-react';
import { useDnd5eCategoryList, useDnd5eItem } from '../hooks/useDnd5e';
import { Dnd5eItemDetail } from '../components/wiki/item-detail';
import { Dnd5eItemCard } from '../components/wiki/Dnd5eItemCard';

export const RulesView: React.FC = () => {
  const [selectedRule, setSelectedRule] = useState<{ index: string } | null>(null);
  const { data: rulesList, isLoading } = useDnd5eCategoryList('rules');
  const { data: ruleDetail } = useDnd5eItem('rules', selectedRule?.index || null);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ScrollText className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Regras do Jogo</h1>
        </div>
        <p className="text-muted-foreground">
          Consulte as regras oficiais do D&D 5e
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : rulesList && rulesList.results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rulesList.results.map((rule) => (
            <Dnd5eItemCard
              key={rule.index}
              name={rule.name}
              index={rule.index}
              onViewDetails={() => setSelectedRule({ index: rule.index })}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma regra disponível</p>
          </CardContent>
        </Card>
      )}

      {selectedRule && (
        <Dnd5eItemDetail
          item={ruleDetail}
          isOpen={!!selectedRule}
          onClose={() => setSelectedRule(null)}
          category="rules"
        />
      )}
    </div>
  );
};

