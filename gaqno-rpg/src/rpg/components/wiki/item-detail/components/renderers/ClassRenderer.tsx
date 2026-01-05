import React from 'react';
import { Badge } from '@gaqno-dev/frontcore/components/ui';
import { Award, BookOpen, Dice1, Package, Shield, Sparkles, Users } from 'lucide-react';
import { ReferencedItem } from '../ReferencedItem';
import { ProficiencyChoicesRenderer } from '../common/ProficiencyChoicesRenderer';
import { SavingThrowsRenderer } from '../common/SavingThrowsRenderer';
import { EquipmentOptionsRenderer } from '../common/EquipmentOptionsRenderer';
import { SpellcastingRenderer } from '../common/SpellcastingRenderer';
import { MultiClassingRenderer } from '../common/MultiClassingRenderer';
import { UrlLinkRenderer } from '../common/UrlLinkRenderer';
import { ReferencedItemArray } from '../ReferencedItemArray';

interface ClassRendererProps {
  classData: any;
  onReferenceClick?: (category: string, index: string) => void;
  resolvedData?: any;
}

export const ClassRenderer: React.FC<ClassRendererProps> = ({
  classData,
  onReferenceClick,
  resolvedData,
}) => {
  if (!classData) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {classData.hitDie && (
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Dice1 className="w-3 h-3" />
              Dado de Vida
            </div>
            <Badge variant="default" className="text-lg">
              d{classData.hitDie}
            </Badge>
          </div>
        )}
        {classData.subclasses && classData.subclasses.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Subclasses</div>
            <Badge variant="outline">{classData.subclasses.length} disponíveis</Badge>
          </div>
        )}
      </div>

      {classData.proficiencies && classData.proficiencies.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Proficiências
          </h3>
          <div className="flex flex-wrap gap-2">
            {classData.proficiencies.map((prof: any, idx: number) => {
              if (typeof prof === 'string') {
                return <Badge key={idx} variant="secondary">{prof}</Badge>;
              }
              if (prof.url) {
                return (
                  <ReferencedItem
                    key={idx}
                    url={prof.url}
                    item={prof}
                    onItemClick={onReferenceClick}
                    resolvedData={resolvedData}
                  />
                );
              }
              return <Badge key={idx} variant="secondary">{prof.name || prof.index || prof}</Badge>;
            })}
          </div>
        </div>
      )}

      {classData.proficiencyChoices && Array.isArray(classData.proficiencyChoices) && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Escolhas de Proficiência
          </h3>
          <div className="space-y-3">
            {classData.proficiencyChoices.map((choice: any, idx: number) => (
              <ProficiencyChoicesRenderer
                key={idx}
                choices={choice}
                onItemClick={onReferenceClick}
                resolvedData={resolvedData}
              />
            ))}
          </div>
        </div>
      )}

      {classData.savingThrows && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Testes de Resistência
          </h3>
          <SavingThrowsRenderer
            savingThrows={classData.savingThrows}
            onItemClick={onReferenceClick}
            resolvedData={resolvedData}
          />
        </div>
      )}

      {classData.startingEquipment && classData.startingEquipment.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Equipamento Inicial
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {classData.startingEquipment.map((eq: any, idx: number) => {
              if (eq.equipment && eq.equipment.url) {
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <Badge variant="outline">{eq.quantity}x</Badge>
                    <ReferencedItem
                      url={eq.equipment.url}
                      item={eq.equipment}
                      onItemClick={onReferenceClick}
                      resolvedData={resolvedData}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {classData.startingEquipmentOptions && classData.startingEquipmentOptions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Opções de Equipamento Inicial
          </h3>
          <EquipmentOptionsRenderer
            options={classData.startingEquipmentOptions}
            onItemClick={onReferenceClick}
            resolvedData={resolvedData}
          />
        </div>
      )}

      {classData.spellcasting && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Conjuração
          </h3>
          <SpellcastingRenderer spellcasting={classData.spellcasting} />
        </div>
      )}

      {classData.multiClassing && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Multiclasse
          </h3>
          <MultiClassingRenderer
            multiClassing={classData.multiClassing}
            onItemClick={onReferenceClick}
          />
        </div>
      )}

      {classData.classLevels && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Níveis da Classe
          </h3>
          <UrlLinkRenderer
            url={classData.classLevels}
            label="Ver Níveis da Classe"
            onItemClick={onReferenceClick}
          />
        </div>
      )}

      {classData.spells && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Magias
          </h3>
          <UrlLinkRenderer
            url={classData.spells}
            label="Ver Lista de Magias"
            onItemClick={onReferenceClick}
          />
        </div>
      )}

      {classData.subclasses && classData.subclasses.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Subclasses
          </h3>
          <ReferencedItemArray items={classData.subclasses} onItemClick={onReferenceClick} resolvedData={resolvedData} />
        </div>
      )}
    </>
  );
};

