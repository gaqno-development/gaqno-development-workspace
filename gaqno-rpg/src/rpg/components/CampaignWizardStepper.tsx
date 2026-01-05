import React from 'react';
import { CampaignStep } from '../types/campaign.types';
import { cn } from '@gaqno-dev/frontcore/lib/utils';

interface CampaignWizardStepperProps {
  currentStep: CampaignStep;
  steps: Partial<Record<CampaignStep, any>>;
}

const stepLabels: Record<CampaignStep, string> = {
  concept: 'Conceito',
  world: 'Mundo',
  narrative: 'Narrativa',
  npcs: 'NPCs',
  hooks: 'Ganchos',
};

const stepOrder: CampaignStep[] = ['concept', 'world', 'narrative', 'npcs', 'hooks'];

export const CampaignWizardStepper: React.FC<CampaignWizardStepperProps> = ({
  currentStep,
  steps,
}) => {
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="flex items-center justify-between mb-8">
      {stepOrder.map((step, index) => {
        const isCompleted = !!steps[step];
        const isCurrent = step === currentStep;
        const isPast = index < currentIndex;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors',
                  isCurrent && 'bg-primary text-primary-foreground',
                  isPast && 'bg-green-500 text-white',
                  !isCurrent && !isPast && 'bg-muted text-muted-foreground'
                )}
              >
                {isPast ? '✓' : index + 1}
              </div>
              <div className="mt-2 text-sm font-medium">{stepLabels[step]}</div>
            </div>
            {index < stepOrder.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-1 mx-2 transition-colors',
                  isPast ? 'bg-green-500' : 'bg-muted'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

