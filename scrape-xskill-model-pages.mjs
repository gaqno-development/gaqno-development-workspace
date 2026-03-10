#!/usr/bin/env node
/**
 * Visit individual model pages to extract credit pricing
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'https://www.xskill.ai';

// Model IDs from xskill URL patterns (need to discover from page)
const MODEL_IDS = [
  'openai/sora-2-pub/text-to-video',
  'openai/sora-2-pub/image-to-video',
  'openai/sora-2/text-to-video',
  'openai/sora-2/image-to-video',
  'openai/sora-2-pro/text-to-video',
  'openai/sora-2-pro/image-to-video',
  'kuaishou/kling-o3/image-to-video',
  'bytedance/seedream-5.0/text-to-image',
  'bytedance/seedream-4.5/text-to-image',
  'google/veo-3.1/text-to-video',
  'minimax/hailuo-2.3/image-to-video',
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  const results = [];

  // First get model links from models page
  await page.goto(`${BASE}/#/v2/models`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="/models/"]'))
      .map(a => (a.getAttribute('href') || a.href).match(/\/models\/([^?#]+)/)?.[1])
      .filter(Boolean);
  });

  const uniqueLinks = [...new Set(links)].filter(l => l && l !== 'models').slice(0, 40);
  console.log('Model URLs to visit:', uniqueLinks.length);

  for (const path of uniqueLinks) {
    const url = `${BASE}/#/v2/models/${path}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 12000 });
      await page.waitForTimeout(1500);

      const info = await page.evaluate(() => {
        const text = document.body.innerText;
        const creditPerSec = text.match(/(\d+)\s*points?\/sec|(\d+)\s*积分\/秒/);
        const creditPerCall = text.match(/(\d+)\s*points?\/call|(\d+)\s*积分\/次|固定\s*(\d+)\s*积分/);
        const priceExamples = text.match(/(\d+秒[\s\n]*\d+\s*points?)/g);
        const title = document.querySelector('h1, [class*="title"]')?.innerText || '';
        return {
          title: title.slice(0, 100),
          creditsPerSec: creditPerSec ? +(creditPerSec[1] || creditPerSec[2]) : null,
          creditsPerCall: creditPerCall ? +(creditPerCall[1] || creditPerCall[2] || creditPerCall[3]) : null,
          priceExamples: priceExamples || [],
          snippet: text.slice(0, 1200)
        };
      });

      if (info.creditsPerSec || info.creditsPerCall || info.priceExamples?.length) {
        results.push({ path, ...info });
        console.log(path, '->', info.creditsPerSec || info.creditsPerCall, info.priceExamples);
      }
    } catch (e) {
      // skip
    }
  }

  writeFileSync('/tmp/xskill-model-details.json', JSON.stringify(results, null, 2));
  console.log('\nSaved', results.length, 'model details');
  await browser.close();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
