# NEX AI (xskill.ai) Pricing Table

**Source:** Collected from https://www.xskill.ai (March 2025)  
**API:** Model pricing is available via `https://api.xskill.ai/api/v3/models/{modelId}/docs?lang=en-US`

---

## Summary

- **Total Models:** 75 (16 Image, 54 Video, 5 Audio)
- **Billing:** Points/credits per call, per image, or per second
- **USD Credit Packs:** **Not publicly available** — recharge page (#/recharge) requires login. No public API or documentation found for credit pack USD pricing.

---

## Model Pricing from API (March 2025)

**Source:** `GET https://api.xskill.ai/api/v3/models/{modelId}/docs?lang=en-US` returns full `pricing` object per model.

### SCRAPED MODEL CREDIT COSTS (6 models)

| Model Name | Model ID | Price Type | Credits | Details |
|------------|----------|------------|---------|---------|
| **Sora 2 文生视频** | `fal-ai/sora-2/text-to-video` | duration_map | 160 base | 4s=160, 8s=320, 12s=480 pts |
| **Seedance 1.5 Pro 文生视频** | `fal-ai/bytedance/seedance/v1.5/pro/text-to-video` | duration_price | 105 base | 480p: 10/s, 720p: 21/s, 1080p: 47/s |
| **Hailuo 2.3 [Pro] 文生视频** | `fal-ai/minimax/hailuo-2.3/pro/text-to-video` | fixed | **196** | 196 pts/call |
| **Gemini 3 Pro Image Preview** | `kapon/gemini-3-pro-image-preview` | size_based | 25–30 | 1K: 25, 2K: 25, 4K: 30 pts |
| **Flux 2 Flash** | `fal-ai/flux-2/flash` | quantity_based | **2** | 2 pts/image |
| **Nano Banana Pro** | `fal-ai/nano-banana-pro` | resolution_quantity | 45–120 | 0.5K: 45, 1K: 60, 2K: 90, 4K: 120 pts/image |

### Seedance 1.5 Pro Price Examples
- 2s 480p: 20 pts | 3s 480p: 30 pts
- 2s 720p: 42 pts | 3s 720p: 63 pts
- 2s 1080p: 94 pts | 3s 1080p: 141 pts

### Nano Banana Pro Price Examples
- 0.5K 1 image: 45 pts | 1K 1 image: 60 pts
- 2K 1 image: 90 pts | 4K 1 image: 120 pts
- 1K + web search: 66 pts

---

## Complete Model Pricing (Points/Credits)

### IMAGE GENERATION (16 models)

| Model Name | Model ID | Credits/Points | Unit | Category |
|------------|----------|---------------|------|----------|
| 即梦 5.0 旗舰 (Jimeng 5.0) | `jimeng-5.0` | 2 | per image | Image |
| 即梦 4.6 | `jimeng-4.6` | — | — | Image |
| 即梦 4.0 | `jimeng-4.0` | — | — | Image |
| 即梦 4.5 | `jimeng-4.5` | — | — | Image |
| 即梦 4.1 | `jimeng-4.1` | — | — | Image |
| 即梦智能创作 | `jimeng-agent` | — | — | Image |
| Nano Banana 2 | `fal-ai/nano-banana-2` | — | — | Image |
| Flux 2 Flash | `fal-ai/flux-2/flash` | 2 | per image | Image |
| Nano Banana Pro | `fal-ai/nano-banana-pro` | 45–120 | per image (0.5K–4K) | Image |
| Gemini 3 Pro Image Preview | `kapon/gemini-3-pro-image-preview` | 25–30 | 1K/2K: 25, 4K: 30 | Image |
| Seedream 4.5 文生图 | `fal-ai/bytedance/seedream/v4.5/text-to-image` | — | — | Image |
| Seedream 4.5 图像编辑 | `fal-ai/bytedance/seedream/v4.5/edit` | — | — | Image |
| Seedream 5.0 Lite 文生图 | `fal-ai/bytedance/seedream/v5/lite/text-to-image` | — | — | Image |
| Seedream 5.0 Lite 图像编辑 | `fal-ai/bytedance/seedream/v5/lite/edit` | — | — | Image |
| LLM 图片理解 | `openrouter/router/vision` | — | — | Image |
| Qwen 多角度图像生成 | `fal-ai/qwen-image-edit-2511-multiple-angles` | — | — | Image |

---

### VIDEO GENERATION (54 models)

#### Fixed per-call pricing

| Model Name | Model ID | Credits/Points | Unit | Category |
|------------|----------|---------------|------|----------|
| Sora 2 Pub 文生视频 | `sora2pub/text-to-video` | 20 | per call | Video |
| Sora 2 Pub 图生视频 | `sora2pub/image-to-video` | 20 | per call | Video |
| Sora 2 VIP 文生视频 | `sprcra/sora-2-vip/text-to-video` | 100 | per call (10s video) | Video |
| Sora 2 VIP 图生视频 | `sprcra/sora-2-vip/image-to-video` | 100 | per call (10s video) | Video |
| Sora 2 角色创建 | `sprcra/sora-2-character` | 1 | per call | Video |
| Hailuo 2.3 [Pro] 文生视频 | `fal-ai/minimax/hailuo-2.3/pro/text-to-video` | 196 | per call | Video |

#### Per-second pricing

| Model Name | Model ID | Credits/Points | Resolution | Category |
|------------|----------|---------------|------------|----------|
| Grok Imagine Video 文生视频 | `xai/grok-imagine-video/text-to-video` | 20 | per second | Video |
| Grok Imagine Video 图生视频 | `xai/grok-imagine-video/image-to-video` | 20 | per second (min 1s, max 15s) | Video |
| Grok Imagine Video 视频编辑 | `xai/grok-imagine-video/edit-video` | — | per second | Video |
| Veo 3.1 文生视频 | `fal-ai/veo3.1` | 160 (720p/1080p), 240 (4K) | per second (with audio) | Video |
| Veo 3.1 视频延长 | `fal-ai/veo3.1/extend-video` | 160 | per second (720p/1080p) | Video |
| Veo 3.1 图生视频 | `fal-ai/veo3.1/image-to-video` | 160 | per second | Video |
| Veo 3.1 首尾帧视频 | `fal-ai/veo3.1/first-last-frame-to-video` | 160 | per second | Video |
| Veo 3.1 参考图视频 | `fal-ai/veo3.1/reference-to-video` | 160 | per second | Video |
| Veo 3.1 Fast 文生视频 | `fal-ai/veo3.1/fast` | 60 (720p/1080p), 140 (4K) | per second | Video |
| Veo 3.1 Fast 视频延长 | `fal-ai/veo3.1/fast/extend-video` | 60 | per second | Video |
| Veo 3.1 Fast 图生视频 | `fal-ai/veo3.1/fast/image-to-video` | 60 | per second | Video |
| Veo 3.1 Fast 首尾帧视频 | `fal-ai/veo3.1/fast/first-last-frame-to-video` | 60 | per second | Video |
| Kling O3 图生视频 [Standard] | `fal-ai/kling-video/o3/standard/image-to-video` | per second | 3–15s duration | Video |
| Kling O3 图生视频 [Pro] | `fal-ai/kling-video/o3/pro/image-to-video` | per second | 3–15s duration | Video |
| Kling O3 文生视频 [Standard] | `fal-ai/kling-video/o3/standard/text-to-video` | per second | 3–15s duration | Video |
| Kling O3 文生视频 [Pro] | `fal-ai/kling-video/o3/pro/text-to-video` | per second | 3–15s duration | Video |
| Kling O3 参考视频生成 [Standard] | `fal-ai/kling-video/o3/standard/video-to-video/reference` | per second | — | Video |
| Kling O3 参考视频生成 [Pro] | `fal-ai/kling-video/o3/pro/video-to-video/reference` | per second | — | Video |

#### Duration-based video models

| Model Name | Model ID | Credits | Details |
|------------|----------|---------|---------|
| Sora 2 文生视频 | `fal-ai/sora-2/text-to-video` | 160 base | 4s=160, 8s=320, 12s=480 pts |
| Seedance 1.5 Pro 文生视频 | `fal-ai/bytedance/seedance/v1.5/pro/text-to-video` | 10–47/s | 480p: 10/s, 720p: 21/s, 1080p: 47/s |

#### Other video models (pricing from model detail pages)

| Model Name | Model ID | Category |
|------------|----------|----------|
| Sora 2 图生视频 | `fal-ai/sora-2/image-to-video` | Video |
| Sora 2 Pro 文生视频 | `fal-ai/sora-2/text-to-video/pro` | Video |
| Sora 2 Pro 图生视频 | `fal-ai/sora-2/image-to-video/pro` | Video |
| Sora 2 视频重混 | `fal-ai/sora-2/video-to-video/remix` | Video |
| Kling Motion Control 动作迁移 | `fal-ai/kling-video/v2.6/standard/motion-control` | Video |
| Wan 2.6 文生视频 | `wan/v2.6/text-to-video` | Video |
| Wan 2.6 图生视频 | `wan/v2.6/image-to-video` | Video |
| Wan 2.6 参考视频生成 | `wan/v2.6/reference-to-video` | Video |
| Wan 2.6 Flash 图生视频 | `wan/v2.6/image-to-video/flash` | Video |
| Seedance Lite 文生视频 | `fal-ai/bytedance/seedance/v1/lite/text-to-video` | Video |
| Seedance Lite 参考图生视频 | `fal-ai/bytedance/seedance/v1/lite/reference-to-video` | Video |
| Seedance Pro Fast 图生视频 | `fal-ai/bytedance/seedance/v1/pro/fast/image-to-video` | Video |
| Seedance Pro Fast 文生视频 | `fal-ai/bytedance/seedance/v1/pro/fast/text-to-video` | Video |
| Seedance 1.5 Pro 图生视频 | `fal-ai/bytedance/seedance/v1.5/pro/image-to-video` | Video |
| Seedance 1.5 Pro 文生视频 | `fal-ai/bytedance/seedance/v1.5/pro/text-to-video` | Video |
| Seedance Lite 图生视频 | `fal-ai/bytedance/seedance/v1/lite/image-to-video` | Video |
| OmniHuman v1.5 音频驱动视频 | `fal-ai/bytedance/omnihuman/v1.5` | Video |
| 即梦 3.5 Pro 视频 (5秒) | `jimeng-video-3.5-pro` | Video |
| 即梦 3.5 Pro 视频 (10秒) | `jimeng-video-3.5-pro-10s` | Video |
| 即梦 3.5 Pro 视频 (12秒) | `jimeng-video-3.5-pro-12s` | Video |
| Vidu Q3 图生视频 | `fal-ai/vidu/q3/image-to-video` | Video |
| Vidu Q3 文生视频 | `fal-ai/vidu/q3/text-to-video` | Video |
| Dreamactor V2 动作迁移 | `fal-ai/bytedance/dreamactor/v2` | Video |
| Hailuo 2.3 Fast [Pro] 图生视频 | `fal-ai/minimax/hailuo-2.3-fast/pro/image-to-video` | Video |
| Hailuo 2.3 Fast [Standard] 图生视频 | `fal-ai/minimax/hailuo-2.3-fast/standard/image-to-video` | Video |
| Hailuo 2.3 [Pro] 图生视频 | `fal-ai/minimax/hailuo-2.3/pro/image-to-video` | Video |
| Hailuo 2.3 [Pro] 文生视频 | `fal-ai/minimax/hailuo-2.3/pro/text-to-video` | Video |
| Hailuo 2.3 [Standard] 图生视频 | `fal-ai/minimax/hailuo-2.3/standard/image-to-video` | Video |
| Hailuo 2.3 [Standard] 文生视频 | `fal-ai/minimax/hailuo-2.3/standard/text-to-video` | Video |
| LLM 视频理解 | `openrouter/router/video` | Video |

---

### AUDIO GENERATION (5 models)

| Model Name | Model ID | Category |
|------------|----------|----------|
| 海螺语音合成 (Hailuo TTS) | `minimax/t2a` | Audio |
| 海螺语音设计 | `minimax/voice-design` | Audio |
| 海螺声音克隆 | `minimax/voice-clone` | Audio |
| 海螺音乐生成 | `minimax/music-gen` | Audio |
| ElevenLabs Scribe V2 语音转文字 | `fal-ai/elevenlabs/speech-to-text/scribe-v2` | Audio |

---

## Price Examples (from model detail pages)

| Model | Example |
|-------|---------|
| 即梦 5.0 (jimeng-5.0) | 1 image = 2 points, 4 images = 8 points |
| Grok Imagine Video 图生视频 | 5s = 100 points, 10s = 200 points, 15s = 300 points |

---

## USD Pricing for Credits

**Not found.** The recharge/billing page (https://www.xskill.ai/#/recharge) requires login. To get USD pricing for credit packs, you would need to:

1. Create an NEX AI account at https://www.xskill.ai
2. Log in and navigate to Pricing / Recharge
3. View available credit pack tiers and their USD prices

---

## API Reference

- **Models API:** `https://api.xskill.ai/api/v3/mcp/models?lang=en-US`
- **Model Detail:** `https://api.xskill.ai/api/v3/mcp/models/{modelId}`

---

*Data collected March 2025. Pricing may change — verify at https://www.xskill.ai/#/v2/models*
