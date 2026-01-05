import React from 'react';
import { Badge } from '@gaqno-dev/frontcore/components/ui';
import { Clock, Sword, Target } from 'lucide-react';
import { SchoolIcon } from '../../../Dnd5eIcons';
import { formatSpellLevel, formatComponents, formatDamage } from '../../helpers';
import { ReferencedItemArray } from '../ReferencedItemArray';

interface SpellRendererProps {
  spellData: any;
  onReferenceClick?: (category: string, index: string) => void;
  resolvedData?: any;
}

export const SpellRenderer: React.FC<SpellRendererProps> = ({
  spellData,
  onReferenceClick,
  resolvedData,
}) => {
  if (!spellData) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {spellData.level !== undefined && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Nível</div>
            {formatSpellLevel(spellData.level)}
          </div>
        )}
        {spellData.school && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Escola</div>
            <div className="flex items-center gap-2">
              <SchoolIcon school={spellData.school.name || spellData.school.index || ''} />
              <Badge variant="outline">{spellData.school.name || spellData.school.index}</Badge>
            </div>
          </div>
        )}
        {spellData.castingTime && (
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Tempo de Conjuração
            </div>
            <span className="text-sm">{spellData.castingTime}</span>
          </div>
        )}
        {spellData.range && (
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Alcance
            </div>
            <span className="text-sm">{spellData.range}</span>
          </div>
        )}
        {spellData.duration && (
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Duração
            </div>
            <span className="text-sm">{spellData.duration}</span>
          </div>
        )}
        {spellData.components && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Componentes</div>
            {formatComponents(spellData.components)}
          </div>
        )}
        {spellData.ritual !== undefined && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Ritual</div>
            <Badge variant={spellData.ritual ? 'default' : 'outline'}>
              {spellData.ritual ? 'Sim' : 'Não'}
            </Badge>
          </div>
        )}
        {spellData.concentration !== undefined && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Concentração</div>
            <Badge variant={spellData.concentration ? 'default' : 'outline'}>
              {spellData.concentration ? 'Sim' : 'Não'}
            </Badge>
          </div>
        )}
      </div>

      {spellData.damage && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sword className="w-4 h-4" />
            Dano
          </h3>
          {formatDamage(spellData.damage, onReferenceClick, resolvedData)}
        </div>
      )}

      {spellData.higherLevel && (
        <div>
          <h3 className="font-semibold mb-2">Níveis Superiores</h3>
          <p className="text-sm">{spellData.higherLevel}</p>
        </div>
      )}

      {(spellData.classes || spellData.subclasses) && (
        <div>
          <h3 className="font-semibold mb-2">Classes e Subclasses</h3>
          <div className="space-y-4">
            {spellData.classes && (
              <ReferencedItemArray items={spellData.classes} title="Classes" onItemClick={onReferenceClick} resolvedData={resolvedData} />
            )}
            {spellData.subclasses && (
              <ReferencedItemArray items={spellData.subclasses} title="Subclasses" onItemClick={onReferenceClick} resolvedData={resolvedData} />
            )}
          </div>
        </div>
      )}
    </>
  );
};

