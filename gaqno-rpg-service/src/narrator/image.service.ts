import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface ImageGenerationRequest {
  prompt: string;
  style?: string;
  aspect_ratio?: string;
  negative_tags?: string[];
}

export interface ImageGenerationResponse {
  imageUrl: string;
  metadata: {
    prompt: string;
    style: string;
    aspect_ratio: string;
    provider: 'stable_diffusion' | 'gemini';
  };
}

@Injectable()
export class ImageService {
  private readonly stableDiffusionUrl: string;
  private readonly geminiUrl: string;
  private readonly geminiApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService
  ) {
    this.stableDiffusionUrl = this.config.get<string>('STABLE_DIFFUSION_URL') || 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';
    this.geminiUrl = this.config.get<string>('GEMINI_URL') || 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3:generateContent';
    this.geminiApiKey = this.config.get<string>('GEMINI_API_KEY') || '';
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      if (this.geminiApiKey) {
        return await this.generateWithGemini(request);
      } else {
        return await this.generateWithStableDiffusion(request);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      throw new Error('Failed to generate image');
    }
  }

  private async generateWithStableDiffusion(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const apiKey = this.config.get<string>('STABLE_DIFFUSION_API_KEY');
    if (!apiKey) {
      throw new Error('STABLE_DIFFUSION_API_KEY not configured');
    }

    const response = await firstValueFrom(
      this.httpService.post(
        this.stableDiffusionUrl,
        {
          text_prompts: [
            {
              text: request.prompt,
              weight: 1
            },
            ...(request.negative_tags || []).map(tag => ({
              text: tag,
              weight: -1
            }))
          ],
          cfg_scale: 7,
          height: this.parseAspectRatio(request.aspect_ratio || '16:9').height,
          width: this.parseAspectRatio(request.aspect_ratio || '16:9').width,
          steps: 30,
          samples: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )
    );

    const imageBase64 = response.data.artifacts[0]?.base64;
    if (!imageBase64) {
      throw new Error('No image generated');
    }

    return {
      imageUrl: `data:image/png;base64,${imageBase64}`,
      metadata: {
        prompt: request.prompt,
        style: request.style || 'realistic',
        aspect_ratio: request.aspect_ratio || '16:9',
        provider: 'stable_diffusion'
      }
    };
  }

  private async generateWithGemini(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.geminiUrl}?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: request.prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1024
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    );

    const imageData = response.data.candidates[0]?.content?.parts[0]?.text;
    if (!imageData) {
      throw new Error('No image generated');
    }

    return {
      imageUrl: imageData,
      metadata: {
        prompt: request.prompt,
        style: request.style || 'realistic',
        aspect_ratio: request.aspect_ratio || '16:9',
        provider: 'gemini'
      }
    };
  }

  private parseAspectRatio(ratio: string): { width: number; height: number } {
    const [w, h] = ratio.split(':').map(Number);
    const baseSize = 1024;
    
    if (w / h > 1) {
      return { width: baseSize, height: Math.round(baseSize * h / w) };
    } else {
      return { width: Math.round(baseSize * w / h), height: baseSize };
    }
  }
}

