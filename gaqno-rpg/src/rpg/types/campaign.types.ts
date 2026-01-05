export type CampaignStep = 'concept' | 'world' | 'narrative' | 'npcs' | 'hooks';

export interface CampaignStepContent {
  concept?: {
    theme: string;
    tone: string;
    setting: string;
  };
  world?: {
    name: string;
    geography: string;
    magic?: string;
    tech?: string;
    history?: string;
  };
  narrative?: {
    opening: string;
    inciting_incident: string;
    first_quest: string;
  };
  npcs?: Array<{
    name: string;
    role: string;
    description: string;
    motivation?: string;
  }>;
  hooks?: string[];
}

export interface CampaignArc {
  session: number;
  act: number;
  name: string;
}

export type CampaignGenre = 'Horror' | 'Épico' | 'Sci-Fi' | 'Fantasy' | 'Mystery' | 'Comedy' | 'Drama' | 'Action';

export interface Campaign {
  id: string;
  tenantId?: string;
  userId: string;
  name: string;
  description?: string;
  concept?: CampaignStepContent['concept'];
  world?: CampaignStepContent['world'];
  initialNarrative?: CampaignStepContent['narrative'];
  npcs?: CampaignStepContent['npcs'];
  hooks?: CampaignStepContent['hooks'];
  isPublic: boolean;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  moodboard?: string[];
  colorPalette?: string[];
  genre?: CampaignGenre;
  currentArc?: CampaignArc;
  pitch?: string;
}

export interface GenerateStepRequest {
  step: CampaignStep;
  context?: Record<string, any>;
  existingContent?: Record<string, any>;
}

export interface CampaignWizardState {
  currentStep: CampaignStep;
  steps: Partial<CampaignStepContent>;
  isGenerating: boolean;
  campaignId?: string;
}

