import React from 'react';
import { Badge, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@gaqno-dev/frontcore/components/ui';
import { Award, ChevronDown, Image as ImageIcon, Package } from 'lucide-react';
import { ReferencedItem } from '../ReferencedItem';
import { ReferencedItemArray } from '../ReferencedItemArray';
import { RarityRenderer } from '../common/RarityRenderer';
import { ImageRenderer } from '../common/ImageRenderer';
import { ContentsRenderer } from '../common/ContentsRenderer';
import { AbilityBonusesRenderer } from '../common/AbilityBonusesRenderer';
import { PropertyIcon as PropertyIconComponent } from '../../../Dnd5eIcons';

interface GenericRendererProps {
  item: any;
  itemImage?: any;
  onReferenceClick?: (category: string, index: string) => void;
  resolvedData?: any;
}

export const GenericRenderer: React.FC<GenericRendererProps> = ({
  item,
  itemImage,
  onReferenceClick,
  resolvedData,
}) => {
  const excludedKeys = [
    'name', 'index', 'url', 'desc', 'description', 'source', 
    'level', 'school', 'casting_time', 'range', 'components', 'duration', 
    'ritual', 'concentration', 'damage', 'damage_at_slot_level', 'higher_level',
    'classes', 'subclasses', 'attack_type',
    'equipment_category', 'cost', 'weight', 'properties', 'weapon_category',
    'weapon_range', 'category_range', 'two_handed_damage', 'throw_range',
    'subsections',
    'hit_die', 'proficiencies', 'proficiency_choices', 'saving_throws',
    'starting_equipment', 'starting_equipment_options', 'class_levels',
    'multi_classing', 'spellcasting', 'spells',
    'rarity', 'image', 'contents', 'ability_bonuses',
    'size', 'type', 'alignment', 'armor_class', 'hit_points', 'hit_dice', 'hit_points_roll',
    'speed', 'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
    'damage_immunities', 'damage_resistances', 'damage_vulnerabilities', 'condition_immunities',
    'senses', 'languages', 'challenge_rating', 'proficiency_bonus', 'xp',
    'special_abilities', 'actions', 'legendary_actions', '_resolved'
  ];

  return (
    <>
      {Object.entries(item)
        .filter(([key]) => !excludedKeys.includes(key))
        .map(([key, value]) => {
          if (!value || (Array.isArray(value) && value.length === 0)) return null;
          
          if (key === 'rarity') {
            return (
              <div key={key} className="border-b pb-2 last:border-0">
                <h3 className="font-semibold text-sm capitalize mb-2 flex items-center gap-2">
                  <PropertyIconComponent property={key} />
                  {key.replace(/_/g, ' ')}
                </h3>
                <RarityRenderer rarity={value} />
              </div>
            );
          }
          
          if (key === 'image' || key.includes('image')) {
            if (key === 'image' && itemImage) {
              return null;
            }
            return (
              <div key={key} className="border-b pb-2 last:border-0">
                <h3 className="font-semibold text-sm capitalize mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {key.replace(/_/g, ' ')}
                </h3>
                <ImageRenderer image={value} className="max-w-xs rounded-md" />
              </div>
            );
          }
          
          if (key === 'contents' && Array.isArray(value) && value.length > 0) {
            return (
              <div key={key} className="border-b pb-2 last:border-0">
                <h3 className="font-semibold text-sm capitalize mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {key.replace(/_/g, ' ')}
                </h3>
                <ContentsRenderer
                  contents={value}
                  onItemClick={onReferenceClick}
                  resolvedData={resolvedData}
                />
              </div>
            );
          }
          
          if (key === 'ability_bonuses' && Array.isArray(value) && value.length > 0) {
            return (
              <div key={key} className="border-b pb-2 last:border-0">
                <h3 className="font-semibold text-sm capitalize mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  {key.replace(/_/g, ' ')}
                </h3>
                <AbilityBonusesRenderer
                  abilityBonuses={value}
                  onItemClick={onReferenceClick}
                  resolvedData={resolvedData}
                />
              </div>
            );
          }
          
          if (typeof value === 'object' && !Array.isArray(value) && 'url' in value && typeof (value as any).url === 'string') {
            return (
              <div key={key}>
                <h3 className="font-semibold mb-2 capitalize flex items-center gap-2">
                  <PropertyIconComponent property={key} />
                  {key.replace(/_/g, ' ')}
                </h3>
                <ReferencedItem url={(value as any).url} item={value} onItemClick={onReferenceClick} resolvedData={resolvedData} />
              </div>
            );
          }
          
          if (Array.isArray(value) && value.length > 0 && value[0]?.url) {
            return (
              <div key={key}>
                <h3 className="font-semibold mb-2 capitalize flex items-center gap-2">
                  <PropertyIconComponent property={key} />
                  {key.replace(/_/g, ' ')}
                </h3>
                <ReferencedItemArray items={value} onItemClick={onReferenceClick} resolvedData={resolvedData} />
              </div>
            );
          }
          
          if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
            return (
              <div key={key} className="border-b pb-2 last:border-0">
                <h3 className="font-semibold text-sm capitalize mb-2 flex items-center gap-2">
                  <PropertyIconComponent property={key} />
                  {key.replace(/_/g, ' ')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {value.map((v, idx) => (
                    <Badge key={idx} variant="secondary">
                      {typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          }
          
          return (
            <div key={key} className="border-b pb-2 last:border-0">
              <h3 className="font-semibold text-sm capitalize mb-1 flex items-center gap-2">
                <PropertyIconComponent property={key} />
                {key.replace(/_/g, ' ')}
              </h3>
              <div className="text-sm text-muted-foreground">
                {Array.isArray(value) ? (
                  <ul className="list-disc list-inside">
                    {value.map((v, idx) => (
                      <li key={idx}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</li>
                    ))}
                  </ul>
                ) : typeof value === 'object' ? (
                  <Collapsible className="group">
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium mb-2 hover:text-foreground">
                      <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]/group:rotate-180" />
                      Ver detalhes (JSON)
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  String(value)
                )}
              </div>
            </div>
          );
        })}
    </>
  );
};

