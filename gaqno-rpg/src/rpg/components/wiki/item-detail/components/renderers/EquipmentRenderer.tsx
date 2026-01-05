import React from 'react';
import { Badge } from '@gaqno-dev/frontcore/components/ui';
import { Coins, Scale, Sword } from 'lucide-react';
import { formatCost, formatDamage } from '../../helpers';

interface EquipmentRendererProps {
  equipmentData: any;
  onReferenceClick?: (category: string, index: string) => void;
  resolvedData?: any;
}

export const EquipmentRenderer: React.FC<EquipmentRendererProps> = ({
  equipmentData,
  onReferenceClick,
  resolvedData,
}) => {
  if (!equipmentData) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {equipmentData.cost && (
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Coins className="w-3 h-3" />
              Custo
            </div>
            <span className="text-sm">{formatCost(equipmentData.cost)}</span>
          </div>
        )}
        {equipmentData.weight !== undefined && (
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Scale className="w-3 h-3" />
              Peso
            </div>
            <span className="text-sm">{equipmentData.weight} lbs</span>
          </div>
        )}
        {equipmentData.equipmentCategory && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Categoria</div>
            <Badge variant="outline">{equipmentData.equipmentCategory.name || equipmentData.equipmentCategory.index}</Badge>
          </div>
        )}
      </div>

      {equipmentData.damage && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sword className="w-4 h-4" />
            Dano
          </h3>
          {formatDamage(equipmentData.damage, onReferenceClick, resolvedData)}
        </div>
      )}

      {equipmentData.properties && equipmentData.properties.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Propriedades</h3>
          <div className="flex flex-wrap gap-2">
            {equipmentData.properties.map((prop: any, idx: number) => (
              <Badge key={idx} variant="secondary">
                {prop.name || prop.index}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

