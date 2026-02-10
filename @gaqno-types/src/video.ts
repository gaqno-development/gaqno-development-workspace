export enum VideoGenerationStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum VideoMode {
  MODIFY_VIDEO = "modify_video",
  USE_VIDEO_REFERENCE = "use_video_reference",
}

export interface VideoModel {
  id: string;
  name: string;
  provider: "kling" | "runway" | "pika" | "stability";
  description?: string;
  maxDuration?: number;
  supportedFormats?: string[];
}

export interface VideoGenerationRequest {
  prompt: string;
  model: string;
  mode?: VideoMode;
  reference_video?: string;
  reference_image?: string;
  reference_elements?: string[];
  settings?: {
    add_audio?: boolean;
    add_voice?: boolean;
    duration?: number;
    aspect_ratio?: string;
  };
}

export interface VideoGenerationResponse {
  id: string;
  status: VideoGenerationStatus;
  video_url?: string;
  thumbnail_url?: string;
  progress?: number;
  error?: string;
  created_at: string;
  completed_at?: string;
}

export interface UploadAssetResponse {
  id: string;
  url: string;
  type: "video" | "image";
  metadata?: {
    duration?: number;
    width?: number;
    height?: number;
    size?: number;
    format?: string;
  };
}
