export interface CustomClass {
  id: string;
  campaignId: string;
  name: string;
  description?: string;
  baseClass?: string;
  features: Record<string, any>;
  hitDie?: number;
  proficiencies: Record<string, any>;
  spellcasting?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomClassRequest {
  name: string;
  description?: string;
  baseClass?: string;
  features?: Record<string, any>;
  hitDie?: number;
  proficiencies?: Record<string, any>;
  spellcasting?: Record<string, any>;
}

export interface UpdateCustomClassRequest extends Partial<CreateCustomClassRequest> {}

export interface GenerateCustomClassRequest {
  baseClass: string;
  name?: string;
  theme?: string;
  modifications?: Record<string, any>;
}

