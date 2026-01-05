import { create } from 'zustand';
import { CampaignStep, CampaignStepContent } from '../types/campaign.types';

interface CampaignWizardStore {
  currentStep: CampaignStep;
  steps: Partial<CampaignStepContent>;
  isGenerating: boolean;
  campaignId: string | null;
  
  setCurrentStep: (step: CampaignStep) => void;
  setStepContent: (step: CampaignStep, content: any) => void;
  setIsGenerating: (generating: boolean) => void;
  setCampaignId: (id: string | null) => void;
  reset: () => void;
  canProceed: (step: CampaignStep) => boolean;
  getNextStep: () => CampaignStep | null;
  getPreviousStep: () => CampaignStep | null;
}

const stepOrder: CampaignStep[] = ['concept', 'world', 'narrative', 'npcs', 'hooks'];

export const useCampaignWizardStore = create<CampaignWizardStore>((set, get) => ({
  currentStep: 'concept',
  steps: {},
  isGenerating: false,
  campaignId: null,

  setCurrentStep: (step) => set({ currentStep: step }),
  
  setStepContent: (step, content) =>
    set((state) => ({
      steps: {
        ...state.steps,
        [step]: content,
      },
    })),

  setIsGenerating: (generating) => set({ isGenerating: generating }),

  setCampaignId: (id) => set({ campaignId: id }),

  reset: () =>
    set({
      currentStep: 'concept',
      steps: {},
      isGenerating: false,
      campaignId: null,
    }),

  canProceed: (step) => {
    const state = get();
    const stepIndex = stepOrder.indexOf(step);
    
    if (stepIndex === 0) {
      return !!state.steps.concept;
    }
    
    if (stepIndex === 1) {
      return !!state.steps.concept && !!state.steps.world;
    }
    
    if (stepIndex === 2) {
      return !!state.steps.concept && !!state.steps.world && !!state.steps.narrative;
    }
    
    return true;
  },

  getNextStep: () => {
    const state = get();
    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex < stepOrder.length - 1) {
      return stepOrder[currentIndex + 1];
    }
    return null;
  },

  getPreviousStep: () => {
    const state = get();
    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex > 0) {
      return stepOrder[currentIndex - 1];
    }
    return null;
  },
}));

