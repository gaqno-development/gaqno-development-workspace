export type LocationType = 'dungeon' | 'city' | 'region' | 'landmark' | 'building';

export interface Location {
  id: string;
  campaignId: string;
  name: string;
  type: LocationType;
  description?: string;
  content: Record<string, any>;
  metadata: Record<string, any>;
  coordinates?: {
    x?: number;
    y?: number;
    z?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationRequest {
  name: string;
  type: LocationType;
  description?: string;
  content?: Record<string, any>;
  metadata?: Record<string, any>;
  coordinates?: {
    x?: number;
    y?: number;
    z?: number;
  };
}

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {}

export interface GenerateLocationRequest {
  name: string;
  type: LocationType;
  description?: string;
  context?: Record<string, any>;
}

export interface GenerateEncounterRequest {
  partyLevel: number;
  partySize: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'deadly';
  environment?: string;
}

