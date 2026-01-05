import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  ScrollArea,
} from '@gaqno-dev/frontcore/components/ui';
import { X, ScrollText, Loader2 } from 'lucide-react';
import { Dnd5eItemDetailProps } from './types';
import { ImageRenderer } from './components/common/ImageRenderer';
import { FramedImageRenderer } from './components/common/FramedImageRenderer';
import { RarityRenderer } from './components/common/RarityRenderer';
import { CategoryIcon } from '../Dnd5eIcons';
import { SpellRenderer } from './components/renderers/SpellRenderer';
import { EquipmentRenderer } from './components/renderers/EquipmentRenderer';
import { RuleRenderer } from './components/renderers/RuleRenderer';
import { ClassRenderer } from './components/renderers/ClassRenderer';
import { MonsterRenderer } from './components/renderers/MonsterRenderer';
import { MagicItemRenderer } from './components/renderers/MagicItemRenderer';
import { GenericRenderer } from './components/renderers/GenericRenderer';

export const Dnd5eItemDetail: React.FC<Dnd5eItemDetailProps> = ({
  item,
  isOpen,
  onClose,
  category,
  onReferenceClick,
  isLoading = false,
}) => {
  if (isLoading && !item) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando detalhes do item...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!item) return null;

  const resolvedReferences = item._resolved || {};
  const name = item.name || item.index || 'Item';
  const description = item.desc || item.description || '';
  const itemImage = item.image;
  const itemRarity = item.rarity;
  
  const spellData = category === 'spells' ? {
    level: item.level,
    school: item.school,
    castingTime: item.casting_time,
    range: item.range,
    components: item.components,
    duration: item.duration,
    ritual: item.ritual,
    concentration: item.concentration,
    damage: item.damage,
    damageAtSlotLevel: item.damage_at_slot_level,
    higherLevel: item.higher_level,
    classes: item.classes,
    subclasses: item.subclasses,
    attackType: item.attack_type,
  } : null;

  const equipmentData = category === 'equipment' ? {
    equipmentCategory: item.equipment_category,
    cost: item.cost,
    weight: item.weight,
    properties: item.properties,
    weaponCategory: item.weapon_category,
    weaponRange: item.weapon_range,
    categoryRange: item.category_range,
    damage: item.damage,
    twoHandedDamage: item.two_handed_damage,
    range: item.range,
    throwRange: item.throw_range,
  } : null;

  const ruleData = category === 'rules' ? {
    subsections: item.subsections,
  } : null;

  const magicItemsData = category === 'magic-items' ? {
    rarity: item.rarity,
    equipmentCategory: item.equipment_category,
    cost: item.cost,
    weight: item.weight,
    properties: item.properties,
  } : null;

  const monsterData = category === 'monsters' ? {
    size: item.size,
    type: item.type,
    alignment: item.alignment,
    armorClass: item.armor_class,
    hitPoints: item.hit_points,
    hitDice: item.hit_dice,
    hitPointsRoll: item.hit_points_roll,
    speed: item.speed,
    strength: item.strength,
    dexterity: item.dexterity,
    constitution: item.constitution,
    intelligence: item.intelligence,
    wisdom: item.wisdom,
    charisma: item.charisma,
    damageImmunities: item.damage_immunities,
    damageResistances: item.damage_resistances,
    damageVulnerabilities: item.damage_vulnerabilities,
    conditionImmunities: item.condition_immunities,
    senses: item.senses,
    languages: item.languages,
    challengeRating: item.challenge_rating,
    proficiencyBonus: item.proficiency_bonus,
    xp: item.xp,
    specialAbilities: item.special_abilities,
    actions: item.actions,
    legendaryActions: item.legendary_actions,
  } : null;

  const classData = category === 'classes' ? {
    hitDie: item.hit_die,
    proficiencies: item.proficiencies,
    proficiencyChoices: item.proficiency_choices,
    savingThrows: item.saving_throws,
    startingEquipment: item.starting_equipment,
    startingEquipmentOptions: item.starting_equipment_options,
    classLevels: item.class_levels,
    multiClassing: item.multi_classing,
    spellcasting: item.spellcasting,
    spells: item.spells,
    subclasses: item.subclasses,
  } : null;

  const handleReferenceClick = (refCategory: string, refIndex: string) => {
    if (onReferenceClick) {
      onReferenceClick(refCategory, refIndex);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start gap-6 flex-wrap">
            {itemImage && (
              <div className="flex-shrink-0">
                <FramedImageRenderer image={itemImage} className="w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72" />
              </div>
            )}
            <div className="flex-1 min-w-0 flex-grow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <DialogTitle className="text-2xl">{name}</DialogTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription>
                {category ? `Detalhes do ${category}` : 'Detalhes do item'}
              </DialogDescription>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {category && (
                  <div className="flex items-center gap-2">
                    <CategoryIcon category={category} />
                    <span className="text-sm text-muted-foreground capitalize">{category}</span>
                  </div>
                )}
                {itemRarity && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Raridade:</span>
                    <RarityRenderer rarity={itemRarity} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>
        
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Atualizando...</p>
            </div>
          </div>
        )}
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {description && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <ScrollText className="w-4 h-4" />
                  Descrição
                </h3>
                {Array.isArray(description) ? (
                  description.map((desc, idx) => (
                    <p key={idx} className="text-sm mb-2 leading-relaxed">{desc}</p>
                  ))
                ) : (
                  <p className="text-sm leading-relaxed">{description}</p>
                )}
              </div>
            )}

            {spellData && (
              <SpellRenderer
                spellData={spellData}
                onReferenceClick={handleReferenceClick}
                resolvedData={resolvedReferences}
              />
            )}

            {equipmentData && (
              <EquipmentRenderer
                equipmentData={equipmentData}
                onReferenceClick={handleReferenceClick}
                resolvedData={resolvedReferences}
              />
            )}

            {ruleData && (
              <RuleRenderer
                ruleData={ruleData}
                onReferenceClick={handleReferenceClick}
                resolvedData={resolvedReferences}
              />
            )}

            {classData && (
              <ClassRenderer
                classData={classData}
                onReferenceClick={handleReferenceClick}
                resolvedData={resolvedReferences}
              />
            )}

            {monsterData && (
              <MonsterRenderer
                monsterData={monsterData}
                onReferenceClick={handleReferenceClick}
                resolvedData={resolvedReferences}
              />
            )}

            {magicItemsData && (
              <MagicItemRenderer magicItemsData={magicItemsData} />
            )}

            <GenericRenderer
              item={item}
              itemImage={itemImage}
              onReferenceClick={handleReferenceClick}
              resolvedData={resolvedReferences}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

