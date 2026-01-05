import React from 'react';
import { Badge, Card, CardContent } from '@gaqno-dev/frontcore/components/ui';
import { ReferencedItem } from '../ReferencedItem';

interface EquipmentOptionsRendererProps {
  options: any[];
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}

export const EquipmentOptionsRenderer: React.FC<EquipmentOptionsRendererProps> = ({
  options,
  onItemClick,
  resolvedData,
}) => {
  if (!options || options.length === 0) return null;
  
  const renderOption = (opt: any, optIdx: number): React.ReactNode => {
    if (opt.option_type === 'counted_reference' && opt.of) {
      return (
        <div key={optIdx} className="flex items-start gap-2">
          <Badge variant="outline" className="mt-1">{opt.count}x</Badge>
          <div className="flex-1">
            <ReferencedItem
              url={opt.of.url}
              item={opt.of}
              onItemClick={onItemClick}
              resolvedData={resolvedData}
            />
          </div>
        </div>
      );
    }
    if (opt.option_type === 'choice' && opt.choice) {
      if (opt.choice.from && opt.choice.from.equipment_category) {
        return (
          <Card key={optIdx} className="bg-muted/50">
            <CardContent className="p-3">
              <p className="text-sm font-medium mb-2">{opt.choice.desc || 'Escolha de equipamento'}</p>
              <Badge variant="outline">
                {opt.choice.from.equipment_category.name || opt.choice.from.equipment_category.index}
              </Badge>
            </CardContent>
          </Card>
        );
      }
      return (
        <Card key={optIdx} className="bg-muted/50">
          <CardContent className="p-3">
            <p className="text-sm">{opt.choice.desc || 'Escolha de equipamento'}</p>
          </CardContent>
        </Card>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-3">
      {options.map((option, idx) => {
        if (!option || !option.from) return null;
        
        const desc = option.desc || '';
        const optionItems = option.from.options || option.from.option_set_type === 'equipment_category' 
          ? [{ option_type: 'choice', choice: option.from }]
          : (option.from.options || []);
        
        return (
          <Card key={idx}>
            <CardContent className="p-4">
              <div className="space-y-3">
                {desc && <p className="text-sm font-medium mb-2">{desc}</p>}
                <div className="grid grid-cols-1 gap-2">
                  {optionItems.map((opt: any, optIdx: number) => renderOption(opt, optIdx))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

