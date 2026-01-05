import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@gaqno-dev/frontcore/components/ui';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Input } from '@gaqno-dev/frontcore/components/ui';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useDnd5eCategoryList, useDnd5eItem } from '../hooks/useDnd5e';
import { useCreateRpgCharacter } from '../hooks/useRpgCharacters';
import { Dnd5eItemDetail } from './wiki/item-detail';
import { Loader2 } from 'lucide-react';

interface CharacterCreationWizardProps {
  sessionId: string;
  onComplete?: (character: any) => void;
  onCancel?: () => void;
}

type WizardStep = 'name' | 'race' | 'class' | 'background' | 'attributes' | 'skills' | 'equipment' | 'review';

const ABILITY_SCORES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;
const ABILITY_SCORE_LABELS: Record<string, string> = {
  strength: 'Força',
  dexterity: 'Destreza',
  constitution: 'Constituição',
  intelligence: 'Inteligência',
  wisdom: 'Sabedoria',
  charisma: 'Carisma',
};

export const CharacterCreationWizard: React.FC<CharacterCreationWizardProps> = ({
  sessionId,
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('name');
  const [characterData, setCharacterData] = useState({
    name: '',
    race: null as { index: string; name: string } | null,
    subrace: null as { index: string; name: string } | null,
    class: null as { index: string; name: string } | null,
    subclass: null as { index: string; name: string } | null,
    background: null as { index: string; name: string } | null,
    attributes: {
      strength: 8,
      dexterity: 8,
      constitution: 8,
      intelligence: 8,
      wisdom: 8,
      charisma: 8,
    },
    skills: [] as string[],
    equipment: [] as string[],
  });

  const [selectedItem, setSelectedItem] = useState<{ category: string; index: string } | null>(null);

  const { data: racesList } = useDnd5eCategoryList('races');
  const { data: subracesList } = useDnd5eCategoryList('subraces');
  const { data: classesList } = useDnd5eCategoryList('classes');
  const { data: subclassesList } = useDnd5eCategoryList('subclasses');
  const { data: backgroundsList } = useDnd5eCategoryList('backgrounds');
  const { data: raceData } = useDnd5eItem('races', characterData.race?.index || null);
  const { data: classData } = useDnd5eItem('classes', characterData.class?.index || null);
  const { data: backgroundData } = useDnd5eItem('backgrounds', characterData.background?.index || null);
  const { data: itemDetail } = useDnd5eItem(selectedItem?.category || null, selectedItem?.index || null);

  const createCharacter = useCreateRpgCharacter();

  const abilityScoreModifiers = useMemo(() => {
    const modifiers: Record<string, number> = {};
    if (raceData?.ability_bonuses) {
      raceData.ability_bonuses.forEach((bonus: any) => {
        const ability = bonus.ability_score?.index || bonus.ability_score?.name?.toLowerCase();
        if (ability) {
          modifiers[ability] = (modifiers[ability] || 0) + (bonus.bonus || 0);
        }
      });
    }
    if (characterData.subrace) {
      // Sub-races também podem ter modificadores
    }
    return modifiers;
  }, [raceData, characterData.subrace]);

  const finalAttributes = useMemo(() => {
    const final: Record<string, number> = {};
    ABILITY_SCORES.forEach((score) => {
      final[score] = characterData.attributes[score] + (abilityScoreModifiers[score] || 0);
    });
    return final;
  }, [characterData.attributes, abilityScoreModifiers]);

  const steps: WizardStep[] = ['name', 'race', 'class', 'background', 'attributes', 'skills', 'equipment', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handleFinish = async () => {
    try {
      const character = await createCharacter.mutateAsync({
        sessionId,
        name: characterData.name,
        attributes: finalAttributes,
        resources: {
          hitPoints: classData?.hit_die ? Math.floor(classData.hit_die / 2) + 1 + Math.floor((finalAttributes.constitution - 10) / 2) : 0,
          maxHitPoints: classData?.hit_die ? Math.floor(classData.hit_die / 2) + 1 + Math.floor((finalAttributes.constitution - 10) / 2) : 0,
        },
        metadata: {
          race: characterData.race,
          subrace: characterData.subrace,
          class: characterData.class,
          subclass: characterData.subclass,
          background: characterData.background,
          skills: characterData.skills,
          equipment: characterData.equipment,
        },
      });
      onComplete?.(character);
    } catch (error) {
      console.error('Error creating character:', error);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'name':
        return characterData.name.trim().length > 0;
      case 'race':
        return !!characterData.race;
      case 'class':
        return !!characterData.class;
      case 'background':
        return !!characterData.background;
      case 'attributes':
        return true;
      case 'skills':
        return true;
      case 'equipment':
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'name':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Nome do Personagem</h3>
            <Input
              value={characterData.name}
              onChange={(e) => setCharacterData({ ...characterData, name: e.target.value })}
              placeholder="Digite o nome do personagem"
              className="max-w-md"
            />
          </div>
        );

      case 'race':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Raça</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {racesList?.results.map((race) => (
                <Card
                  key={race.index}
                  className={`cursor-pointer hover:border-primary ${
                    characterData.race?.index === race.index ? 'border-primary border-2' : ''
                  }`}
                  onClick={() => {
                    setCharacterData({ ...characterData, race: { index: race.index, name: race.name } });
                    setSelectedItem({ category: 'races', index: race.index });
                  }}
                >
                  <CardHeader>
                    <CardTitle>{race.name}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
            {characterData.race && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedItem({ category: 'races', index: characterData.race!.index })}
                >
                  Ver Detalhes da Raça
                </Button>
              </div>
            )}
          </div>
        );

      case 'class':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Classe</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classesList?.results.map((cls) => (
                <Card
                  key={cls.index}
                  className={`cursor-pointer hover:border-primary ${
                    characterData.class?.index === cls.index ? 'border-primary border-2' : ''
                  }`}
                  onClick={() => {
                    setCharacterData({ ...characterData, class: { index: cls.index, name: cls.name } });
                    setSelectedItem({ category: 'classes', index: cls.index });
                  }}
                >
                  <CardHeader>
                    <CardTitle>{cls.name}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
            {characterData.class && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedItem({ category: 'classes', index: characterData.class!.index })}
                >
                  Ver Detalhes da Classe
                </Button>
              </div>
            )}
          </div>
        );

      case 'background':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Antecedente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {backgroundsList?.results.map((bg) => (
                <Card
                  key={bg.index}
                  className={`cursor-pointer hover:border-primary ${
                    characterData.background?.index === bg.index ? 'border-primary border-2' : ''
                  }`}
                  onClick={() => {
                    setCharacterData({ ...characterData, background: { index: bg.index, name: bg.name } });
                    setSelectedItem({ category: 'backgrounds', index: bg.index });
                  }}
                >
                  <CardHeader>
                    <CardTitle>{bg.name}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'attributes':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Atributos</h3>
            <p className="text-sm text-muted-foreground">
              Modificadores da raça: {Object.entries(abilityScoreModifiers).map(([key, val]) => 
                val !== 0 ? `${ABILITY_SCORE_LABELS[key] || key}: ${val > 0 ? '+' : ''}${val}` : null
              ).filter(Boolean).join(', ') || 'Nenhum'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ABILITY_SCORES.map((score) => (
                <div key={score} className="space-y-2">
                  <label className="text-sm font-medium">
                    {ABILITY_SCORE_LABELS[score] || score}
                  </label>
                  <Input
                    type="number"
                    min="8"
                    max="20"
                    value={characterData.attributes[score]}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 8;
                      setCharacterData({
                        ...characterData,
                        attributes: { ...characterData.attributes, [score]: value },
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Final: {finalAttributes[score]} (Mod: {Math.floor((finalAttributes[score] - 10) / 2)})
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Perícias</h3>
            <p className="text-sm text-muted-foreground">
              As perícias serão baseadas na classe e antecedente selecionados
            </p>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Perícias serão configuradas automaticamente baseadas na classe e antecedente.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 'equipment':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Equipamento Inicial</h3>
            <p className="text-sm text-muted-foreground">
              O equipamento inicial será baseado na classe selecionada
            </p>
            {classData?.starting_equipment && (
              <Card>
                <CardHeader>
                  <CardTitle>Equipamento da Classe</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {classData.starting_equipment.map((item: any, idx: number) => (
                      <li key={idx}>
                        {item.quantity}x {item.equipment?.name || item.name}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Revisão</h3>
            <Card>
              <CardHeader>
                <CardTitle>{characterData.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <strong>Raça:</strong> {characterData.race?.name}
                  {characterData.subrace && ` (${characterData.subrace.name})`}
                </div>
                <div>
                  <strong>Classe:</strong> {characterData.class?.name}
                  {characterData.subclass && ` (${characterData.subclass.name})`}
                </div>
                <div>
                  <strong>Antecedente:</strong> {characterData.background?.name}
                </div>
                <div>
                  <strong>Atributos:</strong>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {ABILITY_SCORES.map((score) => (
                      <div key={score} className="text-sm">
                        {ABILITY_SCORE_LABELS[score] || score}: {finalAttributes[score]} ({Math.floor((finalAttributes[score] - 10) / 2) >= 0 ? '+' : ''}{Math.floor((finalAttributes[score] - 10) / 2)})
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Criar Personagem</CardTitle>
          <p className="text-sm text-muted-foreground">
            Passo {currentStepIndex + 1} de {steps.length}
          </p>
        </CardHeader>
        <CardContent>
          {renderStep()}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={currentStepIndex === 0 ? onCancel : handlePrevious}
              disabled={createCharacter.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStepIndex === 0 ? 'Cancelar' : 'Anterior'}
            </Button>

            {currentStepIndex === steps.length - 1 ? (
              <Button
                onClick={handleFinish}
                disabled={!canProceed() || createCharacter.isPending}
              >
                {createCharacter.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Criar Personagem
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedItem && (
        <Dnd5eItemDetail
          item={itemDetail}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          category={selectedItem.category}
        />
      )}
    </div>
  );
};

