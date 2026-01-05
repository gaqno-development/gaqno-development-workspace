import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCampaignWizardStore } from '../store/campaignWizardStore';
import { CampaignWizardStepper } from '../components/CampaignWizardStepper';
import { CampaignStepEditor } from '../components/CampaignStepEditor';
import { Button } from '@gaqno-dev/frontcore/components/ui';
import { Card, CardContent } from '@gaqno-dev/frontcore/components/ui';
import {
  useCreateRpgCampaign,
  useRpgCampaign,
  useGenerateCampaignStep,
  useUpdateCampaignStep,
  useFinalizeCampaign,
} from '../hooks/useRpgCampaigns';
import { CampaignStep } from '../types/campaign.types';
import { ArrowLeft, ArrowRight, Check, MapPin, Users } from 'lucide-react';

const stepLabels: Record<CampaignStep, string> = {
  concept: 'Conceito',
  world: 'Mundo',
  narrative: 'Narrativa',
  npcs: 'NPCs',
  hooks: 'Ganchos',
};

export const CampaignWizardView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const {
    currentStep,
    steps,
    isGenerating,
    campaignId,
    setCurrentStep,
    setStepContent,
    setIsGenerating,
    setCampaignId,
    getNextStep,
    getPreviousStep,
    reset,
  } = useCampaignWizardStore();

  const createCampaign = useCreateRpgCampaign();
  const { data: existingCampaign } = useRpgCampaign(id || null);
  const generateStep = useGenerateCampaignStep();
  const updateStep = useUpdateCampaignStep();
  const finalizeCampaign = useFinalizeCampaign();

  useEffect(() => {
    if (id && existingCampaign) {
      setCampaignId(id);
      if (existingCampaign.concept) setStepContent('concept', existingCampaign.concept);
      if (existingCampaign.world) setStepContent('world', existingCampaign.world);
      if (existingCampaign.initialNarrative) setStepContent('narrative', existingCampaign.initialNarrative);
      if (existingCampaign.npcs) setStepContent('npcs', existingCampaign.npcs);
      if (existingCampaign.hooks) setStepContent('hooks', existingCampaign.hooks);
    } else if (!id && !campaignId) {
      handleCreateCampaign();
    }
  }, [id, existingCampaign]);

  const handleCreateCampaign = async () => {
    try {
      const result = await createCampaign.mutateAsync({
        name: 'Nova Campanha',
        description: '',
      });
      setCampaignId(result.id);
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const handleGenerate = async () => {
    if (!campaignId) return;

    setIsGenerating(true);
    try {
      const result = await generateStep.mutateAsync({
        id: campaignId,
        request: {
          step: currentStep,
          context: {},
          existingContent: steps,
        },
      });
      setStepContent(currentStep, result.content);
    } catch (error) {
      console.error('Error generating step:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdate = async (content: any) => {
    if (!campaignId) return;

    try {
      await updateStep.mutateAsync({
        id: campaignId,
        step: currentStep,
        content,
      });
      setStepContent(currentStep, content);
    } catch (error) {
      console.error('Error updating step:', error);
    }
  };

  const handleNext = () => {
    const next = getNextStep();
    if (next) {
      setCurrentStep(next);
    }
  };

  const handlePrevious = () => {
    const prev = getPreviousStep();
    if (prev) {
      setCurrentStep(prev);
    }
  };

  const handleFinalize = async () => {
    if (!campaignId) return;

    try {
      await finalizeCampaign.mutateAsync(campaignId);
      navigate(`/rpg/campaigns/${campaignId}`);
    } catch (error) {
      console.error('Error finalizing campaign:', error);
    }
  };

  const isLastStep = currentStep === 'hooks';
  const canFinalize = steps.concept && steps.world && steps.narrative;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/rpg/campaigns')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Criar Campanha</h1>

      <CampaignWizardStepper currentStep={currentStep} steps={steps} />

      {campaignId && (
        <div className="mb-6 flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/rpg/campaigns/${campaignId}/locations`)}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Localizações
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/rpg/campaigns/${campaignId}/custom-classes`)}
          >
            <Users className="w-4 h-4 mr-2" />
            Classes Customizadas
          </Button>
        </div>
      )}

      <CampaignStepEditor
        step={currentStep}
        content={steps[currentStep]}
        onGenerate={handleGenerate}
        onUpdate={handleUpdate}
        isGenerating={isGenerating || generateStep.isPending}
        stepLabel={stepLabels[currentStep]}
      />

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={!getPreviousStep()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        {isLastStep ? (
          <Button onClick={handleFinalize} disabled={!canFinalize || finalizeCampaign.isPending}>
            <Check className="w-4 h-4 mr-2" />
            Finalizar Campanha
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Próximo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

