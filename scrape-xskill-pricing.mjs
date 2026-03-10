#!/usr/bin/env node
/**
 * Scrape xskill.ai (NEX AI) pricing page for model costs and credit info
 */
import { chromium } from 'playwright';

const BASE = 'https://www.xskill.ai';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Set viewport and wait for network idle
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`${BASE}/#/v2/pricing`, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for content to load (SPA)
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: '/tmp/xskill-pricing.png', fullPage: true });

  // Extract all visible text
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('=== BODY TEXT (pricing page) ===\n');
  console.log(bodyText);

  // Look for tables
  const tableData = await page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    return Array.from(tables).map((t, i) => ({
      index: i,
      html: t.outerHTML.slice(0, 5000),
      text: t.innerText
    }));
  });
  console.log('\n=== TABLES ===\n', JSON.stringify(tableData, null, 2));

  // Look for pricing-related elements
  const pricingElements = await page.evaluate(() => {
    const els = document.querySelectorAll('[class*="pricing"], [class*="price"], [class*="credit"], [data-testid]');
    return Array.from(els).slice(0, 30).map(e => ({
      tag: e.tagName,
      class: e.className,
      text: e.innerText?.slice(0, 500)
    }));
  });
  console.log('\n=== PRICING ELEMENTS ===\n', JSON.stringify(pricingElements, null, 2));

  await browser.close();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
