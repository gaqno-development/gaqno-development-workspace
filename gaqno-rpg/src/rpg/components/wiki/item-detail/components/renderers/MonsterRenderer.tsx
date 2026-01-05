import React from 'react';
import { Badge } from '@gaqno-dev/frontcore/components/ui';
import { Award, BookOpen, Eye, Heart, Shield, Sparkles, Sword, Target, Users } from 'lucide-react';
import { ArmorClassRenderer } from '../common/ArmorClassRenderer';
import { SpeedRenderer } from '../common/SpeedRenderer';
import { SensesRenderer } from '../common/SensesRenderer';
import { SpecialAbilitiesRenderer } from '../common/SpecialAbilitiesRenderer';
import { ActionsRenderer } from '../common/ActionsRenderer';

interface MonsterRendererProps {
  monsterData: any;
  onReferenceClick?: (category: string, index: string) => void;
  resolvedData?: any;
}

export const MonsterRenderer: React.FC<MonsterRendererProps> = ({
  monsterData,
  onReferenceClick,
  resolvedData,
}) => {
  if (!monsterData) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {monsterData.size && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground">Tamanho</div>
            <Badge variant="outline" className="w-full justify-center font-medium">
              {String(monsterData.size)}
            </Badge>
          </div>
        )}
        {monsterData.type && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground">Tipo</div>
            <Badge variant="outline" className="w-full justify-center font-medium capitalize">
              {String(monsterData.type)}
            </Badge>
          </div>
        )}
        {monsterData.alignment && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground">Alinhamento</div>
            <Badge variant="outline" className="w-full justify-center font-medium">
              {String(monsterData.alignment)}
            </Badge>
          </div>
        )}
        {monsterData.challengeRating !== undefined && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground">ND</div>
            <Badge variant="default" className="w-full justify-center font-bold text-sm">
              {String(monsterData.challengeRating)}
            </Badge>
          </div>
        )}
      </div>

      {monsterData.armorClass && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Classe de Armadura
          </h3>
          <ArmorClassRenderer armorClass={monsterData.armorClass} />
        </div>
      )}

      {(monsterData.hitPoints || monsterData.hitDice) && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Pontos de Vida
          </h3>
          <div className="flex items-center gap-3 flex-wrap">
            {monsterData.hitPoints && (
              <Badge variant="default" className="bg-primary text-primary-foreground font-bold text-base px-3 py-1.5">
                {monsterData.hitPoints} PV
              </Badge>
            )}
            {monsterData.hitDice && (
              <Badge variant="outline" className="font-medium">
                {monsterData.hitDice}
              </Badge>
            )}
            {monsterData.hitPointsRoll && (
              <span className="text-sm text-muted-foreground font-mono">
                ({monsterData.hitPointsRoll})
              </span>
            )}
          </div>
        </div>
      )}

      {monsterData.speed && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Velocidade
          </h3>
          <SpeedRenderer speed={monsterData.speed} />
        </div>
      )}

      {(monsterData.strength || monsterData.dexterity || monsterData.constitution || 
        monsterData.intelligence || monsterData.wisdom || monsterData.charisma) && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Atributos
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {monsterData.strength !== undefined && (
              <div className="text-center space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase">FOR</div>
                <Badge variant="secondary" className="w-full justify-center font-bold text-sm py-1.5">
                  {String(monsterData.strength)}
                </Badge>
              </div>
            )}
            {monsterData.dexterity !== undefined && (
              <div className="text-center space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase">DES</div>
                <Badge variant="secondary" className="w-full justify-center font-bold text-sm py-1.5">
                  {String(monsterData.dexterity)}
                </Badge>
              </div>
            )}
            {monsterData.constitution !== undefined && (
              <div className="text-center space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase">CON</div>
                <Badge variant="secondary" className="w-full justify-center font-bold text-sm py-1.5">
                  {String(monsterData.constitution)}
                </Badge>
              </div>
            )}
            {monsterData.intelligence !== undefined && (
              <div className="text-center space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase">INT</div>
                <Badge variant="secondary" className="w-full justify-center font-bold text-sm py-1.5">
                  {String(monsterData.intelligence)}
                </Badge>
              </div>
            )}
            {monsterData.wisdom !== undefined && (
              <div className="text-center space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase">SAB</div>
                <Badge variant="secondary" className="w-full justify-center font-bold text-sm py-1.5">
                  {String(monsterData.wisdom)}
                </Badge>
              </div>
            )}
            {monsterData.charisma !== undefined && (
              <div className="text-center space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase">CAR</div>
                <Badge variant="secondary" className="w-full justify-center font-bold text-sm py-1.5">
                  {String(monsterData.charisma)}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

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

      {monsterData.senses && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Sentidos
          </h3>
          <SensesRenderer senses={monsterData.senses} />
        </div>
      )}

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

      {monsterData.specialAbilities && monsterData.specialAbilities.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Habilidades Especiais
          </h3>
          <SpecialAbilitiesRenderer
            abilities={monsterData.specialAbilities}
            onItemClick={onReferenceClick}
            resolvedData={resolvedData}
          />
        </div>
      )}

      {monsterData.actions && monsterData.actions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sword className="w-4 h-4" />
            Ações
          </h3>
          <ActionsRenderer
            actions={monsterData.actions}
            onItemClick={onReferenceClick}
            resolvedData={resolvedData}
          />
        </div>
      )}

      {monsterData.legendaryActions && monsterData.legendaryActions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Ações Lendárias
          </h3>
          <ActionsRenderer
            actions={monsterData.legendaryActions}
            onItemClick={onReferenceClick}
            resolvedData={resolvedData}
          />
        </div>
      )}

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
  );
};

