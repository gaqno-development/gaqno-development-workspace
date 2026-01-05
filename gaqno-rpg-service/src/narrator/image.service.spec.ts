import { Test, TestingModule } from '@nestjs/testing';
import { ImageService } from './image.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';

describe('ImageService', () => {
  let service: ImageService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string): string | undefined => {
      if (key === 'STABLE_DIFFUSION_URL') return 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';
      if (key === 'STABLE_DIFFUSION_API_KEY') return 'test-api-key';
      if (key === 'GEMINI_URL') return 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3:generateContent';
      if (key === 'GEMINI_API_KEY') return '';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ImageService>(ImageService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateImage', () => {
    const request = {
      prompt: 'A fantasy castle on a hill',
      style: 'realistic',
      aspect_ratio: '16:9',
      negative_tags: ['watermark', 'text'],
    };

    it('should generate image with Stable Diffusion', async () => {
      mockHttpService.post.mockReturnValue(of({
        data: {
          artifacts: [
            {
              base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            },
          ],
        },
      }));

      const result = await service.generateImage(request);

      expect(result).toBeDefined();
      expect(result.imageUrl).toContain('data:image/png;base64,');
      expect(result.metadata.provider).toBe('stable_diffusion');
      expect(mockHttpService.post).toHaveBeenCalled();
    });

    it('should generate image with Gemini when API key is provided', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ImageService,
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string): string | undefined => {
                if (key === 'GEMINI_API_KEY') return 'test-gemini-key';
                if (key === 'STABLE_DIFFUSION_API_KEY') return '';
                if (key === 'GEMINI_URL') return 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3:generateContent';
                if (key === 'STABLE_DIFFUSION_URL') return 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';
                return undefined;
              }),
            },
          },
        ],
      }).compile();

      const geminiService = module.get<ImageService>(ImageService);

      mockHttpService.post.mockReturnValue(of({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'data:image/png;base64,dGVzdA==',
                  },
                ],
              },
            },
          ],
        },
      }));

      const result = await geminiService.generateImage(request);

      expect(result).toBeDefined();
      expect(result.metadata.provider).toBe('gemini');
    });

    it('should throw error if image generation fails', async () => {
      mockConfigService.get.mockImplementation((key: string): string | undefined => {
        if (key === 'STABLE_DIFFUSION_API_KEY') return 'test-api-key';
        if (key === 'STABLE_DIFFUSION_URL') return 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';
        return undefined;
      });

      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('API Error'))
      );

      await expect(
        service.generateImage(request)
      ).rejects.toThrow('Failed to generate image');
    });

    it('should handle different aspect ratios', async () => {
      mockConfigService.get.mockImplementation((key: string): string | undefined => {
        if (key === 'STABLE_DIFFUSION_API_KEY') return 'test-api-key';
        if (key === 'STABLE_DIFFUSION_URL') return 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';
        return undefined;
      });

      mockHttpService.post.mockReturnValue(of({
        data: {
          artifacts: [
            {
              base64: 'test',
            },
          ],
        },
      }));

      const portraitRequest = {
        ...request,
        aspect_ratio: '9:16',
      };

      const result = await service.generateImage(portraitRequest);

      expect(result).toBeDefined();
      expect(result.metadata.aspect_ratio).toBe('9:16');
    });
  });
});

