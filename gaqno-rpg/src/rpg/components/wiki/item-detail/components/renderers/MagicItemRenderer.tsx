import React from 'react';
import { Badge } from '@gaqno-dev/frontcore/components/ui';
import { Coins, Package, Scale } from 'lucide-react';
import { formatCost } from '../../helpers';

interface MagicItemRendererProps {
  magicItemsData: any;
}

export const MagicItemRenderer: React.FC<MagicItemRendererProps> = ({ magicItemsData }) => {
  if (!magicItemsData) return null;

  return (
    <>
      {magicItemsData.equipmentCategory && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Categoria
          </h3>
          <Badge variant="outline">
            {magicItemsData.equipmentCategory.name || magicItemsData.equipmentCategory.index}
          </Badge>
        </div>
      )}

      {magicItemsData.cost && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Custo
          </h3>
          {formatCost(magicItemsData.cost)}
        </div>
      )}

      {magicItemsData.weight && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Peso
          </h3>
          <Badge variant="secondary">{magicItemsData.weight} lbs</Badge>
        </div>
      )}

      {magicItemsData.properties && magicItemsData.properties.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Propriedades</h3>
          <div className="flex flex-wrap gap-2">
            {magicItemsData.properties.map((prop: any, idx: number) => (
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

