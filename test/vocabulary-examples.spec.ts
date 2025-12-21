import { test, expect } from '@playwright/test';

test.describe('Vocabulary Examples Coverage', () => {
  test('should list Chinese words without example sentences', async ({ page }) => {
    await page.goto('/en/vocabulary?pageSize=500'); // Get more entries per page
    
    // Wait for entries to load
    await page.waitForTimeout(2000);
    
    const wordsWithoutExamples: string[] = [];
    let hasMorePages = true;
    let currentPage = 1;
    const maxPages = 10; // Limit to prevent infinite loops
    
    while (hasMorePages && currentPage <= maxPages) {
      // Wait for entries to be visible
      const entries = page.getByTestId('vocabulary-entry');
      const entryCount = await entries.count();
      
      if (entryCount === 0) {
        break;
      }
      
      // Check each entry on the current page
      for (let i = 0; i < entryCount; i++) {
        const entry = entries.nth(i);
        
        // Get the word
        const wordElement = entry.getByTestId('vocabulary-entry-word');
        if (await wordElement.count() > 0) {
          const word = await wordElement.textContent();
          
          if (word && word.trim()) {
            // Wait a bit for the component to mount and render examples
            await page.waitForTimeout(500);
            
            // Check if examples section exists
            // Examples are shown with heading "Examples:" (case insensitive)
            const examplesHeading = entry.locator('h4').filter({ hasText: /Examples?/i });
            const hasExamplesHeading = await examplesHeading.count() > 0;
            
            // Also check for example sentence containers (the gray boxes with sentences)
            const exampleContainers = entry.locator('.bg-gray-50.rounded-lg.p-3.border.border-gray-200');
            const hasExampleContainers = await exampleContainers.count() > 0;
            
            // Check if there's any text that looks like an example sentence (Chinese characters in a container)
            const exampleText = entry.locator('div.bg-gray-50 p.text-base.font-medium.text-gray-900');
            const hasExampleText = await exampleText.count() > 0;
            
            // If none of these indicators exist, word has no examples
            if (!hasExamplesHeading && !hasExampleContainers && !hasExampleText) {
              wordsWithoutExamples.push(word.trim());
            }
          }
        }
      }
      
      // Check if there's a next page
      const nextButton = page.getByTestId('vocabulary-pagination-next');
      const nextButtonCount = await nextButton.count();
      
      if (nextButtonCount > 0 && await nextButton.isEnabled()) {
        // Navigate to next page
        await Promise.all([
          page.waitForURL((url) => {
            const urlObj = new URL(url);
            const newPage = parseInt(urlObj.searchParams.get('page') || '1');
            return newPage > currentPage;
          }, { timeout: 5000 }),
          nextButton.click()
        ]);
        
        currentPage++;
        await page.waitForTimeout(1000); // Wait for page to load
      } else {
        hasMorePages = false;
      }
    }
    
    // Output the results
    console.log('\n=== Words without example sentences ===');
    console.log(`Total words without examples: ${wordsWithoutExamples.length}`);
    
    if (wordsWithoutExamples.length > 0) {
      console.log('\nWords:');
      wordsWithoutExamples.forEach((word, index) => {
        console.log(`${index + 1}. ${word}`);
      });
      
      // Also output as a comma-separated list for easy copying
      console.log('\nComma-separated list:');
      console.log(wordsWithoutExamples.join(', '));
    } else {
      console.log('\nAll words have example sentences! ✓');
    }
    
    // This test always passes - it's informational
    // You can change this to fail if you want to enforce examples for all words
    expect(wordsWithoutExamples.length).toBeGreaterThanOrEqual(0);
  });
  
  test('should check example coverage for a specific tag', async ({ page }) => {
    // Test for a specific tag (e.g., HSK1)
    await page.goto('/en/vocabulary?tag=hsk1&pageSize=500');
    
    await page.waitForTimeout(2000);
    
    const wordsWithoutExamples: string[] = [];
    const entries = page.getByTestId('vocabulary-entry');
    const entryCount = await entries.count();
    
    for (let i = 0; i < entryCount; i++) {
      const entry = entries.nth(i);
      const wordElement = entry.getByTestId('vocabulary-entry-word');
      
      if (await wordElement.count() > 0) {
        const word = await wordElement.textContent();
        
        if (word && word.trim()) {
          await page.waitForTimeout(500);
          
          const examplesHeading = entry.locator('h4').filter({ hasText: /Examples?/i });
          const hasExamplesHeading = await examplesHeading.count() > 0;
          const exampleContainers = entry.locator('.bg-gray-50.rounded-lg.p-3.border.border-gray-200');
          const hasExampleContainers = await exampleContainers.count() > 0;
          const exampleText = entry.locator('div.bg-gray-50 p.text-base.font-medium.text-gray-900');
          const hasExampleText = await exampleText.count() > 0;
          
          if (!hasExamplesHeading && !hasExampleContainers && !hasExampleText) {
            wordsWithoutExamples.push(word.trim());
          }
        }
      }
    }
    
    console.log(`\n=== HSK1 words without examples: ${wordsWithoutExamples.length} ===`);
    if (wordsWithoutExamples.length > 0) {
      console.log(wordsWithoutExamples.join(', '));
    }
    
    expect(wordsWithoutExamples.length).toBeGreaterThanOrEqual(0);
  });
});

