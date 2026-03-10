#!/usr/bin/env node
/**
 * Scrape xskill.ai (NEX AI) models page and individual model pages for pricing
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'https://www.xskill.ai';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  const results = [];

  // 1. Go to models page
  console.log('Fetching models page...');
  await page.goto(`${BASE}/#/v2/models`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);

  const modelsPageText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== MODELS PAGE TEXT ===\n', modelsPageText.slice(0, 4000));

  // Find all model links
  const modelLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="models/"]'));
    const seen = new Set();
    return links
      .map(a => {
        const href = a.getAttribute('href') || a.href;
        const match = href.match(/models\/([^?#/]+)/);
        return match ? { path: match[1], fullHref: href } : null;
      })
      .filter(Boolean)
      .filter(({ path }) => {
        if (seen.has(path)) return false;
        seen.add(path);
        return path && path !== 'models';
      });
  });

  console.log('\nFound model paths:', modelLinks);

  // 2. Extract model cards / list content
  const modelCards = await page.evaluate(() => {
    const cards = document.querySelectorAll('[class*="model"], [class*="card"], [class*="item"]');
    const text = Array.from(cards).map(c => c.innerText).join('\n---\n');
    return text.slice(0, 8000);
  });
  console.log('\n=== MODEL CARDS TEXT ===\n', modelCards);

  // 3. Visit individual model pages for pricing
  const sampleModels = [
    'xai%2Fgrok-imagine-video%2Fimage-to-video',
    'xai%2Fgrok-imagine-image',
    'openai%2Fsora-2',
  ];

  for (const modelPath of sampleModels) {
    const url = `${BASE}/#/v2/models/${modelPath}`;
    console.log(`\nFetching ${url}...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      const text = await page.evaluate(() => document.body.innerText);
      const creditsMatch = text.match(/(\d+)\s*credits?/gi) || [];
      const priceMatch = text.match(/\$[\d.]+/g) || [];
      results.push({
        model: modelPath,
        credits: creditsMatch,
        prices: priceMatch,
        snippet: text.slice(0, 1500)
      });
      console.log('Credits:', creditsMatch, 'Prices:', priceMatch);
    } catch (e) {
      console.log('Error:', e.message);
    }
  }

  // 4. Try pricing page for credit packs
  console.log('\nFetching pricing page for credit packs...');
  await page.goto(`${BASE}/#/v2/pricing`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Look for USD/credit pack info
  const pricingText = await page.evaluate(() => document.body.innerText);
  const usdMatches = pricingText.match(/\$[\d,.]+/g) || [];
  const creditMatches = pricingText.match(/(\d+)\s*credits?/gi) || [];

  results.push({
    page: 'pricing',
    usd: usdMatches,
    credits: creditMatches,
    fullText: pricingText
  });

  writeFileSync('/tmp/xskill-scrape-results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to /tmp/xskill-scrape-results.json');

  await page.screenshot({ path: '/tmp/xskill-models.png', fullPage: true });
  await browser.close();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
