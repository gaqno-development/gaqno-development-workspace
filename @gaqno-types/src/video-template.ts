export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
}

export type VideoTemplateSummary = Omit<VideoTemplate, "promptTemplate">;
