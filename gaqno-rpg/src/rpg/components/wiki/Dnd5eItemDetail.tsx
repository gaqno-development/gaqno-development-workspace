import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Badge,
  Card,
  CardContent,
  ScrollArea,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@gaqno-dev/frontcore/components/ui';
import { X, ExternalLink, ScrollText, Clock, Target, Coins, Scale, Sword, ChevronDown, Dice1, Users, Shield, BookOpen, Sparkles, Link2, Package, Award, Loader2, Table, Image as ImageIcon, Heart, Eye } from 'lucide-react';
import { useDnd5eReferencedItem, useDnd5eSpecialEndpoint } from '../../hooks/useDnd5e';
import {
  DamageTypeIcon,
  SchoolIcon,
  ComponentIcon,
  CategoryIcon,
  PropertyIcon,
} from './Dnd5eIcons';

interface Dnd5eItemDetailProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  category?: string;
  onReferenceClick?: (category: string, index: string) => void;
  isLoading?: boolean;
}

const getResolvedReference = (resolvedData: any, url: string): any | null => {
  if (!resolvedData || !url) return null;
  
  const urlParts = url.split('/').filter((p) => p && p !== 'api' && p !== '2014');
  if (urlParts.length < 2) return null;
  
  const category = urlParts[0];
  const index = urlParts[1];
  const key = `${category}:${index}`;
  
  return resolvedData[key] || null;
};

// Helper functions
const getCategoryFromUrl = (url: string): string | null => {
  const match = url.match(/\/api\/2014\/([^/]+)\//);
  return match ? match[1] : null;
};

const formatSpellLevel = (level: number): React.ReactNode => {
  const colors: Record<number, string> = {
    0: 'bg-gray-500',
    1: 'bg-blue-500',
    2: 'bg-green-500',
    3: 'bg-yellow-500',
    4: 'bg-orange-500',
    5: 'bg-red-500',
    6: 'bg-purple-500',
    7: 'bg-pink-500',
    8: 'bg-indigo-500',
    9: 'bg-cyan-500',
  };
  return (
    <Badge className={colors[level] || 'bg-gray-500'} variant="default">
      Nível {level}
    </Badge>
  );
};

const formatComponents = (components: string[]): React.ReactNode => {
  if (!components || components.length === 0) return null;
  
  return (
    <div className="flex gap-2 items-center">
      {components.map((comp, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <ComponentIcon component={comp} />
          <span className="text-sm font-mono">{comp}</span>
        </div>
      ))}
    </div>
  );
};

const formatCost = (cost: any): string | null => {
  if (!cost) return null;
  if (typeof cost === 'string') return cost;
  if (cost.quantity !== undefined && cost.unit) {
    return `${cost.quantity} ${cost.unit}`;
  }
  return null;
};

const formatDamage = (damage: any, onItemClick?: (category: string, index: string) => void, resolvedData?: any): React.ReactNode => {
  if (!damage) return null;
  
  if (Array.isArray(damage)) {
    return (
      <div className="space-y-1">
        {damage.map((dmg, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {dmg.damage_type && (
              <>
                <DamageTypeIcon type={dmg.damage_type.name || dmg.damage_type.index || ''} />
                {dmg.damage_type.url ? (
                  <ReferencedItem
                    url={dmg.damage_type.url}
                    item={dmg.damage_type}
                    onItemClick={onItemClick}
                    resolvedData={resolvedData}
                    compact
                  />
                ) : (
                  <span className="text-sm font-semibold">{dmg.damage_type.name || dmg.damage_type.index}:</span>
                )}
              </>
            )}
            <span className="text-sm">{dmg.damage_dice || dmg.damage || ''}</span>
          </div>
        ))}
      </div>
    );
  }
  
  if (typeof damage === 'object') {
    const damageDice = damage.damage_dice || damage.damage || '';
    const damageType = damage.damage_type;
    
    if (damageType) {
      return (
        <div className="flex items-center gap-2">
          <DamageTypeIcon type={damageType.name || damageType.index || ''} />
          {damageType.url ? (
            <ReferencedItem
              url={damageType.url}
              item={damageType}
              onItemClick={onItemClick}
              resolvedData={resolvedData}
              compact
            />
          ) : (
            <span className="text-sm font-semibold">{damageType.name || damageType.index}:</span>
          )}
          {damageDice && <span className="text-sm">{damageDice}</span>}
        </div>
      );
    }
    
    if (damageDice) {
      return <span className="text-sm">{damageDice}</span>;
    }
    
    if (damage.url) {
      return (
        <ReferencedItem
          url={damage.url}
          item={damage}
          onItemClick={onItemClick}
          resolvedData={resolvedData}
        />
      );
    }
    
    return (
      <div className="text-xs bg-muted p-2 rounded overflow-auto">
        <pre className="whitespace-pre-wrap">{JSON.stringify(damage, null, 2)}</pre>
      </div>
    );
  }
  
  return <span className="text-sm">{String(damage)}</span>;
};

const ReferencedItem: React.FC<{
  url: string;
  item: any;
  onItemClick?: (category: string, index: string) => void;
  compact?: boolean;
  resolvedData?: any;
}> = ({
  url,
  item,
  onItemClick,
  compact = false,
  resolvedData,
}) => {
  const category = getCategoryFromUrl(url);
  const resolved = resolvedData ? getResolvedReference(resolvedData, url) : null;
  const { data: referencedData, isLoading } = useDnd5eReferencedItem(resolved ? null : url);
  
  const displayData = resolved || referencedData || item;
  const name = displayData?.name || item?.name || item?.index || 'Unknown';
  const index = item?.index || url.split('/').pop() || '';
  
  const handleClick = () => {
    if (category && index && onItemClick) {
      onItemClick(category, index);
    }
  };
  
  if (compact) {
    return (
      <Badge 
        variant="outline" 
        className="cursor-pointer hover:bg-accent transition-colors flex items-center gap-1"
        onClick={handleClick}
      >
        {category && <CategoryIcon category={category} size={12} />}
        <span>{name}</span>
        <ExternalLink className="w-3 h-3" />
      </Badge>
    );
  }
  
  return (
    <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={handleClick}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {category && <CategoryIcon category={category} />}
          <span className="text-sm font-medium flex-1">{name}</span>
          {isLoading && <span className="text-xs text-muted-foreground">Carregando...</span>}
          {referencedData && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
        </div>
        {referencedData?.desc && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {Array.isArray(referencedData.desc) 
              ? referencedData.desc[0] 
              : referencedData.desc}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const ReferencedItemArray: React.FC<{ 
  items: any[]; 
  title?: string; 
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}> = ({
  items,
  title,
  onItemClick,
  resolvedData,
}) => {
  if (!items || items.length === 0) return null;
  
  return (
    <div className="space-y-2">
      {title && <h4 className="text-sm font-semibold">{title}</h4>}
      <div className="grid grid-cols-1 gap-2">
        {items.map((item, idx) => {
          if (!item || !item.url) return null;
          return <ReferencedItem key={idx} url={item.url} item={item} onItemClick={onItemClick} resolvedData={resolvedData} />;
        })}
      </div>
    </div>
  );
};

// Specialized renderers for complex data types
const ProficiencyChoicesRenderer: React.FC<{ 
  choices: any; 
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}> = ({ choices, onItemClick, resolvedData }) => {
  if (!choices || !choices.from || !choices.from.options) return null;
  
  const options = choices.from.options || [];
  const desc = choices.desc || '';
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {desc && <p className="text-sm font-medium mb-2">{desc}</p>}
          <div className="flex flex-wrap gap-2">
            {options.map((option: any, idx: number) => {
              if (option.option_type === 'reference' && option.item) {
                return (
                  <ReferencedItem
                    key={idx}
                    url={option.item.url}
                    item={option.item}
                    onItemClick={onItemClick}
                    resolvedData={resolvedData}
                    compact={true}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EquipmentOptionsRenderer: React.FC<{ 
  options: any[]; 
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}> = ({ options, onItemClick, resolvedData }) => {
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
      // Handle nested choice (like arcane focus)
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

const SpellcastingRenderer: React.FC<{ spellcasting: any }> = ({ spellcasting }) => {
  if (!spellcasting) return null;
  
  return (
    <div className="space-y-4">
      {spellcasting.level && (
        <div className="flex items-center gap-2">
          <Badge>Nível {spellcasting.level}</Badge>
          {spellcasting.spellcasting_ability && (
            <Badge variant="outline">
              {spellcasting.spellcasting_ability.name || spellcasting.spellcasting_ability.index}
            </Badge>
          )}
        </div>
      )}
      
      {spellcasting.info && Array.isArray(spellcasting.info) && (
        <div className="space-y-3">
          {spellcasting.info.map((info: any, idx: number) => (
            <Collapsible key={idx} defaultOpen={idx === 0} className="group">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-md hover:bg-muted/80 transition-colors">
                <span className="font-semibold text-sm">{info.name || `Seção ${idx + 1}`}</span>
                <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]/group:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-2 pl-4">
                  {Array.isArray(info.desc) ? (
                    info.desc.map((desc: string, descIdx: number) => (
                      <p key={descIdx} className="text-sm leading-relaxed">{desc}</p>
                    ))
                  ) : (
                    <p className="text-sm leading-relaxed">{info.desc}</p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
};

const MultiClassingRenderer: React.FC<{ 
  multiClassing: any; 
  onItemClick?: (category: string, index: string) => void;
}> = ({ multiClassing }) => {
  if (!multiClassing) return null;
  
  return (
    <div className="space-y-3">
      {multiClassing.prerequisites && multiClassing.prerequisites.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Pré-requisitos</h4>
          <div className="flex flex-wrap gap-2">
            {multiClassing.prerequisites.map((prereq: any, idx: number) => {
              if (prereq.ability_score) {
                return (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {prereq.ability_score.name || prereq.ability_score.index}: {prereq.minimum_score}+
                  </Badge>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
      
      {multiClassing.proficiencies && multiClassing.proficiencies.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Proficiências</h4>
          <div className="flex flex-wrap gap-2">
            {multiClassing.proficiencies.map((prof: any, idx: number) => (
              <Badge key={idx} variant="outline">
                {prof.name || prof.index}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RarityRenderer: React.FC<{ rarity: any }> = ({ rarity }) => {
  if (!rarity) return null;
  
  const rarityName = typeof rarity === 'string' ? rarity : rarity.name || rarity;
  if (!rarityName) return null;
  
  const rarityColors: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
    'Common': { variant: 'secondary' },
    'Uncommon': { variant: 'default' },
    'Rare': { variant: 'outline', className: 'border-purple-500 text-purple-700 dark:text-purple-400' },
    'Very Rare': { variant: 'destructive' },
    'Legendary': { variant: 'default', className: 'bg-yellow-500 text-yellow-950 border-yellow-600' },
    'Artifact': { variant: 'default', className: 'bg-amber-500 text-amber-950 border-amber-600' },
  };
  
  const config = rarityColors[rarityName] || { variant: 'secondary' };
  
  return (
    <Badge variant={config.variant} className={config.className}>
      {rarityName}
    </Badge>
  );
};

const ImageRenderer: React.FC<{ image: any; className?: string }> = ({ image, className = '' }) => {
  if (!image) return null;
  
  const imageUrl = typeof image === 'string' 
    ? image 
    : (image.url || image);
  
  if (!imageUrl) return null;
  
  const getFullImageUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/api/images/')) {
      return `https://www.dnd5eapi.co${url}`;
    }
    return url;
  };
  
  const fullUrl = getFullImageUrl(imageUrl);
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-md ${className}`}>
        <ImageIcon className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <img
      src={fullUrl}
      alt="Item"
      className={`rounded-md object-contain ${className}`}
      onError={() => setImageError(true)}
    />
  );
};

const ContentsRenderer: React.FC<{
  contents: any[];
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}> = ({ contents, onItemClick, resolvedData }) => {
  if (!contents || contents.length === 0) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {contents.map((content: any, idx: number) => {
        if (!content.item) return null;
        
        const item = content.item;
        const quantity = content.quantity || 1;
        
        if (item.url) {
          return (
            <div key={idx} className="flex items-center gap-2">
              <Badge variant="outline">{quantity}x</Badge>
              <ReferencedItem
                url={item.url}
                item={item}
                onItemClick={onItemClick}
                resolvedData={resolvedData}
              />
            </div>
          );
        }
        
        return (
          <div key={idx} className="flex items-center gap-2">
            <Badge variant="outline">{quantity}x</Badge>
            <Badge variant="secondary">{item.name || item.index || 'Item'}</Badge>
          </div>
        );
      })}
    </div>
  );
};

const ArmorClassRenderer: React.FC<{ armorClass: any }> = ({ armorClass }) => {
  if (!armorClass) return null;
  
  if (typeof armorClass === 'object' && armorClass !== null) {
    const type = armorClass.type || 'armor';
    const value = armorClass.value !== undefined ? armorClass.value : (typeof armorClass === 'number' ? armorClass : null);
    
    if (value === null || value === undefined) {
      return (
        <Badge variant="default" className="bg-primary text-primary-foreground">
          CA {JSON.stringify(armorClass)}
        </Badge>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant="default" className="bg-primary text-primary-foreground">
          CA {String(value)}
        </Badge>
        <span className="text-sm text-muted-foreground capitalize">({type})</span>
      </div>
    );
  }
  
  return (
    <Badge variant="default" className="bg-primary text-primary-foreground">
      CA {String(armorClass)}
    </Badge>
  );
};

const SpeedRenderer: React.FC<{ speed: any }> = ({ speed }) => {
  if (!speed) return null;
  
  if (typeof speed === 'object') {
    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(speed).map(([type, value]) => (
          <Badge key={type} variant="outline">
            <span className="capitalize">{type}:</span> {String(value)}
          </Badge>
        ))}
      </div>
    );
  }
  
  return <Badge variant="outline">{String(speed)}</Badge>;
};

const SensesRenderer: React.FC<{ senses: any }> = ({ senses }) => {
  if (!senses) return null;
  
  if (typeof senses === 'string') {
    return <span className="text-sm">{senses}</span>;
  }
  
  if (typeof senses === 'object') {
    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(senses).map(([key, value]) => (
          <Badge key={key} variant="secondary">
            <span className="capitalize">{key.replace(/_/g, ' ')}:</span> {String(value)}
          </Badge>
        ))}
      </div>
    );
  }
  
  return <span className="text-sm">{String(senses)}</span>;
};

const SpecialAbilitiesRenderer: React.FC<{
  abilities: any[];
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}> = ({ abilities, onItemClick, resolvedData }) => {
  if (!abilities || abilities.length === 0) return null;
  
  return (
    <div className="space-y-3">
      {abilities.map((ability: any, idx: number) => (
        <Card key={idx} className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-semibold text-sm">{ability.name}</h4>
              {ability.usage && (
                <Badge variant="outline" className="text-xs">
                  {ability.usage.type === 'per day' && `${ability.usage.times}/dia`}
                  {ability.usage.type === 'recharge on roll' && `Recarga ${ability.usage.dice} (${ability.usage.min_value}+)`}
                </Badge>
              )}
            </div>
            {ability.desc && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {Array.isArray(ability.desc) ? ability.desc.join(' ') : ability.desc}
              </p>
            )}
            {ability.damage && ability.damage.length > 0 && (
              <div className="mt-2">
                {formatDamage(ability.damage, onItemClick, resolvedData)}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const ActionsRenderer: React.FC<{
  actions: any[];
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}> = ({ actions, onItemClick, resolvedData }) => {
  if (!actions || actions.length === 0) return null;
  
  return (
    <div className="space-y-3">
      {actions.map((action: any, idx: number) => (
        <Card key={idx} className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-semibold text-sm">{action.name}</h4>
              {action.attack_bonus !== undefined && (
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  +{action.attack_bonus} to hit
                </Badge>
              )}
            </div>
            {action.desc && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                {Array.isArray(action.desc) ? action.desc.join(' ') : action.desc}
              </p>
            )}
            {action.damage && action.damage.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-semibold mr-2">Dano:</span>
                {formatDamage(action.damage, onItemClick, resolvedData)}
              </div>
            )}
            {action.dc && (
              <div className="mb-2">
                <Badge variant="outline">
                  CD {action.dc.dc_value} {action.dc.dc_type.name || action.dc.dc_type.index}
                  {action.dc.success_type === 'half' && ' (metade em sucesso)'}
                </Badge>
              </div>
            )}
            {action.usage && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {action.usage.type === 'per day' && `${action.usage.times}/dia`}
                  {action.usage.type === 'recharge on roll' && `Recarga ${action.usage.dice} (${action.usage.min_value}+)`}
                </Badge>
              </div>
            )}
            {action.actions && action.actions.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-semibold">Ações:</span> {action.actions.map((a: any) => a.action_name).join(', ')}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const AbilityBonusesRenderer: React.FC<{
  abilityBonuses: any[];
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}> = ({ abilityBonuses, onItemClick, resolvedData }) => {
  if (!abilityBonuses || abilityBonuses.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {abilityBonuses.map((bonus: any, idx: number) => {
        if (!bonus.ability_score) return null;
        
        const abilityScore = bonus.ability_score;
        const bonusValue = bonus.bonus || 0;
        const bonusText = bonusValue > 0 ? `+${bonusValue}` : String(bonusValue);
        
        if (abilityScore.url) {
          return (
            <div key={idx} className="flex items-center gap-2">
              <ReferencedItem
                url={abilityScore.url}
                item={abilityScore}
                onItemClick={onItemClick}
                resolvedData={resolvedData}
              />
              <Badge variant="default" className="bg-primary text-primary-foreground">
                {bonusText}
              </Badge>
            </div>
          );
        }
        
        return (
          <div key={idx} className="flex items-center gap-2">
            <Badge variant="secondary">{abilityScore.name || abilityScore.index}</Badge>
            <Badge variant="default" className="bg-primary text-primary-foreground">
              {bonusText}
            </Badge>
          </div>
        );
      })}
    </div>
  );
};

const SavingThrowsRenderer: React.FC<{ 
  savingThrows: any[]; 
  onItemClick?: (category: string, index: string) => void;
  resolvedData?: any;
}> = ({ savingThrows, onItemClick, resolvedData }) => {
  if (!savingThrows || savingThrows.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {savingThrows.map((st, idx) => {
        if (typeof st === 'string') {
          return (
            <Badge key={idx} variant="secondary">
              {st}
            </Badge>
          );
        }
        if (st.url) {
          return (
            <ReferencedItem
              key={idx}
              url={st.url}
              item={st}
              onItemClick={onItemClick}
              resolvedData={resolvedData}
            />
          );
        }
        return (
          <Badge key={idx} variant="secondary">
            {st.name || st.index || st}
          </Badge>
        );
      })}
    </div>
  );
};

const SpecialEndpointRenderer: React.FC<{
  category: string;
  index: string;
  endpoint: string;
  label: string;
  onItemClick?: (category: string, index: string) => void;
}> = ({ category, index, endpoint, label, onItemClick }) => {
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

const UrlLinkRenderer: React.FC<{ 
  url: string; 
  label: string;
  onItemClick?: (category: string, index: string) => void;
}> = ({ url, label, onItemClick }) => {
  // Handle special endpoints like /classes/wizard/levels or /classes/wizard/spells
  // These are not individual items but endpoints that return lists
  const urlParts = url.split('/').filter(p => p && p !== 'api' && p !== '2014');
  
  // If URL has more than 2 parts (e.g., classes/wizard/levels), it's a special endpoint
  if (urlParts.length > 2) {
    // Extract the base category and item (e.g., classes/wizard)
    const baseCategory = urlParts[0];
    const baseIndex = urlParts[1];
    const endpoint = urlParts[2]; // levels, spells, etc.
    
    return (
      <SpecialEndpointRenderer
        category={baseCategory}
        index={baseIndex}
        endpoint={endpoint}
        label={label}
        onItemClick={onItemClick}
      />
    );
  }
  
  // Regular item URL
  const category = getCategoryFromUrl(url);
  const index = urlParts[urlParts.length - 1] || '';
  
  const handleClick = () => {
    if (category && index && onItemClick) {
      onItemClick(category, index);
    }
  };
  
  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className="w-full justify-start"
    >
      <Link2 className="w-4 h-4 mr-2" />
      {label}
      <ExternalLink className="w-4 h-4 ml-auto" />
    </Button>
  );
};

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
  
  // Organize data by category
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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            {itemImage && (
              <div className="flex-shrink-0">
                <ImageRenderer image={itemImage} className="w-24 h-24 md:w-32 md:h-32" />
              </div>
            )}
            <div className="flex-1 min-w-0">
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
            {/* Description */}
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

            {/* Spell-specific sections */}
            {spellData && (
              <>
                {/* Basic Info */}
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

                {/* Damage */}
                {spellData.damage && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Sword className="w-4 h-4" />
                      Dano
                    </h3>
                    {formatDamage(spellData.damage, onReferenceClick || handleReferenceClick, resolvedReferences)}
                  </div>
                )}

                {/* Higher Level */}
                {spellData.higherLevel && (
                  <div>
                    <h3 className="font-semibold mb-2">Níveis Superiores</h3>
                    <p className="text-sm">{spellData.higherLevel}</p>
                  </div>
                )}

                {/* Classes and Subclasses */}
                {(spellData.classes || spellData.subclasses) && (
                  <div>
                    <h3 className="font-semibold mb-2">Classes e Subclasses</h3>
                    <div className="space-y-4">
                      {spellData.classes && (
                        <ReferencedItemArray items={spellData.classes} title="Classes" onItemClick={onReferenceClick || handleReferenceClick} resolvedData={resolvedReferences} />
                      )}
                      {spellData.subclasses && (
                        <ReferencedItemArray items={spellData.subclasses} title="Subclasses" onItemClick={onReferenceClick || handleReferenceClick} resolvedData={resolvedReferences} />
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Equipment-specific sections */}
            {equipmentData && (
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
                    {formatDamage(equipmentData.damage, onReferenceClick || handleReferenceClick, resolvedReferences)}
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
            )}

            {/* Class-specific sections */}
            {classData && (
              <>
                {/* Basic Info */}
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

                {/* Proficiencies */}
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
                              onItemClick={onReferenceClick || handleReferenceClick}
                              resolvedData={resolvedReferences}
                            />
                          );
                        }
                        return <Badge key={idx} variant="secondary">{prof.name || prof.index || prof}</Badge>;
                      })}
                    </div>
                  </div>
                )}

                {/* Proficiency Choices */}
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
                          onItemClick={onReferenceClick || handleReferenceClick}
                          resolvedData={resolvedReferences}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Saving Throws */}
                {classData.savingThrows && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Testes de Resistência
                    </h3>
                    <SavingThrowsRenderer
                      savingThrows={classData.savingThrows}
                      onItemClick={onReferenceClick || handleReferenceClick}
                      resolvedData={resolvedReferences}
                    />
                  </div>
                )}

                {/* Starting Equipment */}
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
                                onItemClick={onReferenceClick || handleReferenceClick}
                                resolvedData={resolvedReferences}
                              />
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}

                {/* Starting Equipment Options */}
                {classData.startingEquipmentOptions && classData.startingEquipmentOptions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Opções de Equipamento Inicial
                    </h3>
                    <EquipmentOptionsRenderer
                      options={classData.startingEquipmentOptions}
                      onItemClick={onReferenceClick || handleReferenceClick}
                      resolvedData={resolvedReferences}
                    />
                  </div>
                )}

                {/* Spellcasting */}
                {classData.spellcasting && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Conjuração
                    </h3>
                    <SpellcastingRenderer spellcasting={classData.spellcasting} />
                  </div>
                )}

                {/* Multi-classing */}
                {classData.multiClassing && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Multiclasse
                    </h3>
                    <MultiClassingRenderer
                      multiClassing={classData.multiClassing}
                      onItemClick={onReferenceClick || handleReferenceClick}
                    />
                  </div>
                )}

                {/* Class Levels */}
                {classData.classLevels && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Níveis da Classe
                    </h3>
                    <UrlLinkRenderer
                      url={classData.classLevels}
                      label="Ver Níveis da Classe"
                      onItemClick={onReferenceClick || handleReferenceClick}
                    />
                  </div>
                )}

                {/* Spells */}
                {classData.spells && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Magias
                    </h3>
                    <UrlLinkRenderer
                      url={classData.spells}
                      label="Ver Lista de Magias"
                      onItemClick={onReferenceClick || handleReferenceClick}
                    />
                  </div>
                )}

                {/* Subclasses */}
                {classData.subclasses && classData.subclasses.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Subclasses
                    </h3>
                    <ReferencedItemArray
                      items={classData.subclasses}
                      onItemClick={onReferenceClick || handleReferenceClick}
                      resolvedData={resolvedReferences}
                    />
                  </div>
                )}
              </>
            )}

            {/* Rules-specific sections */}
            {ruleData && ruleData.subsections && (
              <div>
                <h3 className="font-semibold mb-2">Subseções</h3>
                <ReferencedItemArray items={ruleData.subsections} onItemClick={onReferenceClick || handleReferenceClick} resolvedData={resolvedReferences} />
              </div>
            )}

            {/* Monster-specific sections */}
            {monsterData && (
              <>
                {/* Basic Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {monsterData.size && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Tamanho</div>
                      <Badge variant="outline">{String(monsterData.size)}</Badge>
                    </div>
                  )}
                  {monsterData.type && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Tipo</div>
                      <Badge variant="outline" className="capitalize">{String(monsterData.type)}</Badge>
                    </div>
                  )}
                  {monsterData.alignment && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Alinhamento</div>
                      <Badge variant="outline">{String(monsterData.alignment)}</Badge>
                    </div>
                  )}
                  {monsterData.challengeRating !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">ND</div>
                      <Badge variant="default" className="bg-primary text-primary-foreground">
                        {String(monsterData.challengeRating)}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Armor Class */}
                {monsterData.armorClass && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Classe de Armadura
                    </h3>
                    <ArmorClassRenderer armorClass={monsterData.armorClass} />
                  </div>
                )}

                {/* Hit Points */}
                {(monsterData.hitPoints || monsterData.hitDice) && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Pontos de Vida
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      {monsterData.hitPoints && (
                        <Badge variant="default" className="bg-primary text-primary-foreground text-lg">
                          {monsterData.hitPoints} PV
                        </Badge>
                      )}
                      {monsterData.hitDice && (
                        <Badge variant="outline">
                          {monsterData.hitDice}
                        </Badge>
                      )}
                      {monsterData.hitPointsRoll && (
                        <span className="text-sm text-muted-foreground">
                          ({monsterData.hitPointsRoll})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Speed */}
                {monsterData.speed && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Velocidade
                    </h3>
                    <SpeedRenderer speed={monsterData.speed} />
                  </div>
                )}

                {/* Ability Scores */}
                {(monsterData.strength || monsterData.dexterity || monsterData.constitution || 
                  monsterData.intelligence || monsterData.wisdom || monsterData.charisma) && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Atributos
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {monsterData.strength !== undefined && (
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">FOR</div>
                          <Badge variant="secondary">{String(monsterData.strength)}</Badge>
                        </div>
                      )}
                      {monsterData.dexterity !== undefined && (
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">DES</div>
                          <Badge variant="secondary">{String(monsterData.dexterity)}</Badge>
                        </div>
                      )}
                      {monsterData.constitution !== undefined && (
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">CON</div>
                          <Badge variant="secondary">{String(monsterData.constitution)}</Badge>
                        </div>
                      )}
                      {monsterData.intelligence !== undefined && (
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">INT</div>
                          <Badge variant="secondary">{String(monsterData.intelligence)}</Badge>
                        </div>
                      )}
                      {monsterData.wisdom !== undefined && (
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">SAB</div>
                          <Badge variant="secondary">{String(monsterData.wisdom)}</Badge>
                        </div>
                      )}
                      {monsterData.charisma !== undefined && (
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">CAR</div>
                          <Badge variant="secondary">{String(monsterData.charisma)}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Damage Immunities/Resistances/Vulnerabilities */}
                {(monsterData.damageImmunities || monsterData.damageResistances || monsterData.damageVulnerabilities) && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Resistências e Vulnerabilidades
                    </h3>
                    <div className="space-y-2">
                      {monsterData.damageImmunities && monsterData.damageImmunities.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400">Imunidades:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Array.isArray(monsterData.damageImmunities) ? (
                              monsterData.damageImmunities.map((dmg: any, idx: number) => (
                                <Badge key={idx} variant="outline" className="border-green-500">
                                  {typeof dmg === 'string' ? dmg : (dmg.name || dmg.index)}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="border-green-500">{String(monsterData.damageImmunities)}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {monsterData.damageResistances && monsterData.damageResistances.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">Resistências:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Array.isArray(monsterData.damageResistances) ? (
                              monsterData.damageResistances.map((dmg: any, idx: number) => (
                                <Badge key={idx} variant="outline" className="border-yellow-500">
                                  {typeof dmg === 'string' ? dmg : (dmg.name || dmg.index)}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="border-yellow-500">{String(monsterData.damageResistances)}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {monsterData.damageVulnerabilities && monsterData.damageVulnerabilities.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400">Vulnerabilidades:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Array.isArray(monsterData.damageVulnerabilities) ? (
                              monsterData.damageVulnerabilities.map((dmg: any, idx: number) => (
                                <Badge key={idx} variant="outline" className="border-red-500">
                                  {typeof dmg === 'string' ? dmg : (dmg.name || dmg.index)}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="border-red-500">{String(monsterData.damageVulnerabilities)}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Senses */}
                {monsterData.senses && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Sentidos
                    </h3>
                    <SensesRenderer senses={monsterData.senses} />
                  </div>
                )}

                {/* Languages */}
                {monsterData.languages && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Idiomas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(monsterData.languages) ? (
                        monsterData.languages.map((lang: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{lang}</Badge>
                        ))
                      ) : (
                        <Badge variant="secondary">{String(monsterData.languages)}</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Special Abilities */}
                {monsterData.specialAbilities && monsterData.specialAbilities.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Habilidades Especiais
                    </h3>
                    <SpecialAbilitiesRenderer
                      abilities={monsterData.specialAbilities}
                      onItemClick={onReferenceClick || handleReferenceClick}
                      resolvedData={resolvedReferences}
                    />
                  </div>
                )}

                {/* Actions */}
                {monsterData.actions && monsterData.actions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Sword className="w-4 h-4" />
                      Ações
                    </h3>
                    <ActionsRenderer
                      actions={monsterData.actions}
                      onItemClick={onReferenceClick || handleReferenceClick}
                      resolvedData={resolvedReferences}
                    />
                  </div>
                )}

                {/* Legendary Actions */}
                {monsterData.legendaryActions && monsterData.legendaryActions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Ações Lendárias
                    </h3>
                    <ActionsRenderer
                      actions={monsterData.legendaryActions}
                      onItemClick={onReferenceClick || handleReferenceClick}
                      resolvedData={resolvedReferences}
                    />
                  </div>
                )}

                {/* Challenge Rating & XP */}
                {(monsterData.challengeRating !== undefined || monsterData.xp !== undefined) && (
                  <div className="grid grid-cols-2 gap-4">
                    {monsterData.proficiencyBonus !== undefined && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Bônus de Proficiência</div>
                        <Badge variant="outline">+{String(monsterData.proficiencyBonus)}</Badge>
                      </div>
                    )}
                    {monsterData.xp !== undefined && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Experiência</div>
                        <Badge variant="outline">{typeof monsterData.xp === 'number' ? monsterData.xp.toLocaleString() : String(monsterData.xp)} XP</Badge>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Magic Items specific sections */}
            {magicItemsData && (
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
            )}

            {/* Generic details for other properties */}
            {Object.entries(item)
              .filter(([key]) => 
                !['name', 'index', 'url', 'desc', 'description', 'source', 
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
                  'special_abilities', 'actions', 'legendary_actions'].includes(key)
              )
              .map(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return null;
                
                // Special handling for rarity
                if (key === 'rarity') {
                  return (
                    <div key={key} className="border-b pb-2 last:border-0">
                      <h3 className="font-semibold text-sm capitalize mb-2 flex items-center gap-2">
                        <PropertyIcon property={key} />
                        {key.replace(/_/g, ' ')}
                      </h3>
                      <RarityRenderer rarity={value} />
                    </div>
                  );
                }
                
                // Special handling for image (skip if already shown in header)
                if (key === 'image' || key.includes('image')) {
                  // Skip if this is the main image already shown in header
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
                
                // Special handling for contents (equipment packs)
                if (key === 'contents' && Array.isArray(value) && value.length > 0) {
                  return (
                    <div key={key} className="border-b pb-2 last:border-0">
                      <h3 className="font-semibold text-sm capitalize mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {key.replace(/_/g, ' ')}
                      </h3>
                      <ContentsRenderer
                        contents={value}
                        onItemClick={onReferenceClick || handleReferenceClick}
                        resolvedData={resolvedReferences}
                      />
                    </div>
                  );
                }
                
                // Special handling for ability_bonuses
                if (key === 'ability_bonuses' && Array.isArray(value) && value.length > 0) {
                  return (
                    <div key={key} className="border-b pb-2 last:border-0">
                      <h3 className="font-semibold text-sm capitalize mb-2 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        {key.replace(/_/g, ' ')}
                      </h3>
                      <AbilityBonusesRenderer
                        abilityBonuses={value}
                        onItemClick={onReferenceClick || handleReferenceClick}
                        resolvedData={resolvedReferences}
                      />
                    </div>
                  );
                }
                
                // Check if it's a reference
                if (typeof value === 'object' && !Array.isArray(value) && 'url' in value && typeof (value as any).url === 'string') {
                  return (
                    <div key={key}>
                      <h3 className="font-semibold mb-2 capitalize flex items-center gap-2">
                        <PropertyIcon property={key} />
                        {key.replace(/_/g, ' ')}
                      </h3>
                      <ReferencedItem url={(value as any).url} item={value} onItemClick={onReferenceClick || handleReferenceClick} resolvedData={resolvedReferences} />
                    </div>
                  );
                }
                
                // Check if it's an array of references
                if (Array.isArray(value) && value.length > 0 && value[0]?.url) {
                  return (
                    <div key={key}>
                      <h3 className="font-semibold mb-2 capitalize flex items-center gap-2">
                        <PropertyIcon property={key} />
                        {key.replace(/_/g, ' ')}
                      </h3>
                      <ReferencedItemArray items={value} onItemClick={onReferenceClick || handleReferenceClick} resolvedData={resolvedReferences} />
                    </div>
                  );
                }
                
                // Regular value - check if it's an array of strings (display as badges)
                if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
                  return (
                    <div key={key} className="border-b pb-2 last:border-0">
                      <h3 className="font-semibold text-sm capitalize mb-2 flex items-center gap-2">
                        <PropertyIcon property={key} />
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
                
                // Regular value
                return (
                  <div key={key} className="border-b pb-2 last:border-0">
                    <h3 className="font-semibold text-sm capitalize mb-1 flex items-center gap-2">
                      <PropertyIcon property={key} />
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
                            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-60">
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
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
