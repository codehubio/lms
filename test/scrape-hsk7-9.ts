/**
 * Standalone script to scrape HSK7-9 words from OMG Chinese
 * 
 * Note: This requires the 'playwright' package to be installed separately:
 *   npm install playwright
 * 
 * Or use the test version instead: npm run scrape:hsk7
 * 
 * Run with: npx tsx scrape-hsk7-9.ts
 */

// Try to import from playwright, fallback to @playwright/test
let chromium: any;
try {
  const playwright = require('playwright');
  chromium = playwright.chromium;
} catch {
  try {
    const pwTest = require('@playwright/test');
    chromium = pwTest.chromium;
  } catch {
    throw new Error('Please install playwright: npm install playwright');
  }
}
import { writeFileSync } from 'fs';
import { join } from 'path';

async function scrapeHSK7Words() {
  const url = 'https://www.omgchinese.com/new-hsk/band7/words';
  const words: string[] = [];
  const processedUrls = new Set<string>();

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for the table to load
    await page.waitForSelector('table', { timeout: 15000 });
    await page.waitForTimeout(2000); // Give extra time for content to load

    console.log('Page loaded, finding pagination links...');

    // Find all pagination links - they appear as "1 - 50", "51 - 100", etc.
    const paginationSection = page.locator('text=/Jump to Word/').locator('..');
    const allLinks = await paginationSection.locator('a').all();
    
    const pageUrls = new Set<string>([url]); // Start with base URL
    
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      const linkText = await link.textContent();
      
      if (href && linkText && /^\d+ - \d+$/.test(linkText.trim())) {
        const fullUrl = href.startsWith('http') ? href : `https://www.omgchinese.com${href}`;
        pageUrls.add(fullUrl);
      }
    }

    console.log(`Found ${pageUrls.size} pages to process`);

    // Process each page
    for (const pageUrl of Array.from(pageUrls)) {
      if (processedUrls.has(pageUrl)) continue;
      processedUrls.add(pageUrl);

      console.log(`Processing: ${pageUrl}`);
      
      try {
        await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('table tbody tr', { timeout: 10000 });
        await page.waitForTimeout(1500); // Wait for content to render

        // Extract words from table rows
        // Table structure: number | word with pinyin | translation
        const rows = await page.locator('table tbody tr').all();
        
        console.log(`  Found ${rows.length} rows on this page`);

        for (const row of rows) {
          try {
            // Get the second column (index 1) which contains the word and pinyin
            const wordCell = row.locator('td').nth(1);
            const cellText = await wordCell.textContent();
            
            if (cellText) {
              // The format is typically: "word pinyin" where word is Chinese characters
              // Extract Chinese characters (everything before the first space or pinyin character)
              const trimmed = cellText.trim();
              
              // Find where pinyin starts (usually after Chinese characters)
              // Pinyin typically starts with a letter that has tone marks or is uppercase
              let chineseWord = '';
              
              // Try to split by whitespace - first part is usually the word
              const parts = trimmed.split(/\s+/);
              if (parts.length > 0) {
                // The first part should be the Chinese word
                chineseWord = parts[0].trim();
              } else {
                // If no spaces, extract all Chinese characters
                chineseWord = trimmed.match(/^[\u4e00-\u9fff]+/)?.[0] || '';
              }
              
              // Only add if it contains Chinese characters and is not empty
              if (chineseWord && /[\u4e00-\u9fff]/.test(chineseWord)) {
                words.push(chineseWord);
              }
            }
          } catch (err) {
            console.warn(`  Error processing row: ${err}`);
          }
        }
      } catch (err) {
        console.error(`Error processing page ${pageUrl}:`, err);
      }
    }

    // Remove duplicates while preserving order
    const uniqueWords = Array.from(new Set(words));

    console.log(`\nExtracted ${uniqueWords.length} unique words (${words.length} total before deduplication)`);

    // Export to CSV (1 column, no header)
    const csvContent = uniqueWords.map(word => word).join('\n');
    const outputPath = join(__dirname, 'hsk7-9-words.csv');
    writeFileSync(outputPath, csvContent, 'utf-8');

    console.log(`Words exported to: ${outputPath}`);
    console.log(`Total unique words: ${uniqueWords.length}`);

    if (uniqueWords.length < 1000) {
      console.warn('Warning: Expected around 5600+ words, but got fewer. Some pages may not have loaded correctly.');
    }

  } finally {
    await browser.close();
  }
}

// Run the script
scrapeHSK7Words().catch(console.error);

