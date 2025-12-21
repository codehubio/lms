import { test, expect } from '@playwright/test';

test.describe('Vocabulary Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/vocabulary');
  });

  test('should load vocabulary page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/vocabulary|dictionary/i);
    
    // Check search input is visible using test ID
    await expect(page.getByTestId('vocabulary-search-input')).toBeVisible();
    await expect(page.getByTestId('vocabulary-search-form')).toBeVisible();
  });

  test('should display vocabulary entries', async ({ page }) => {
    // Wait for vocabulary entries to load using test ID
    const entry = page.getByTestId('vocabulary-entry').first();
    
    // Should have at least one entry
    await expect(entry).toBeVisible({ timeout: 10000 });
  });

  test('should search for vocabulary', async ({ page }) => {
    // Find search input using test ID
    const searchInput = page.getByTestId('vocabulary-search-input');
    
    // Type search term
    await searchInput.fill('你好');
    await searchInput.press('Enter');
    
    // Wait for results to update
    await page.waitForTimeout(1000);
    
    // Check URL contains search parameter (handle URL encoding)
    const url = new URL(page.url());
    expect(url.searchParams.get('search')).toBe('你好');
  });

  test('should filter by tags', async ({ page }) => {
    // Wait for tag filters to load
    await page.waitForTimeout(1000);
    
    // Check tag filter container is visible
    await expect(page.getByTestId('vocabulary-tag-filter')).toBeVisible();
    
    // Try to find a common tag like HSK1
    const hsk1Tag = page.getByTestId('vocabulary-tag-hsk1');
    
    if (await hsk1Tag.count() > 0) {
      await hsk1Tag.click();
      
      // Wait for URL to update with tag parameter
      await page.waitForTimeout(1000);
      
      // Check URL contains tag parameter
      const url = new URL(page.url());
      expect(url.searchParams.getAll('tag')).toContain('hsk1');
    }
  });

  test('should paginate through results', async ({ page }) => {
    // Wait for pagination to load
    await page.waitForTimeout(1000);
    
    // Check pagination container is visible
    await expect(page.getByTestId('vocabulary-pagination')).toBeVisible();
    
    // Find next button using test ID
    const nextButton = page.getByTestId('vocabulary-pagination-next');
    
    // Only test pagination if next button exists and is enabled
    const nextButtonCount = await nextButton.count();
    if (nextButtonCount > 0) {
      const isEnabled = await nextButton.isEnabled();
      
      if (isEnabled) {
        // Get current URL before clicking
        const currentUrl = new URL(page.url());
        const currentPage = parseInt(currentUrl.searchParams.get('page') || '1');
        
        // Click next button and wait for URL to change
        await Promise.all([
          page.waitForURL((url) => {
            const urlObj = new URL(url);
            const newPage = parseInt(urlObj.searchParams.get('page') || '1');
            return newPage > currentPage;
          }, { timeout: 5000 }),
          nextButton.click()
        ]);
        
        // Verify URL contains page parameter and it's greater than before
        const newUrl = new URL(page.url());
        const newPage = parseInt(newUrl.searchParams.get('page') || '1');
        expect(newPage).toBeGreaterThan(currentPage);
        expect(newPage).toBeGreaterThan(1);
      }
      // If button is disabled, pagination is not available (only one page of results)
      // This is a valid state, so we just verify the pagination component exists
    }
  });

  test('should display vocabulary entry details', async ({ page }) => {
    // Wait for entries to load
    await page.waitForTimeout(2000);
    
    // Find first vocabulary entry using test ID
    const entry = page.getByTestId('vocabulary-entry').first();
    
    if (await entry.count() > 0) {
      await expect(entry).toBeVisible();
      
      // Check for word using test ID
      const word = entry.getByTestId('vocabulary-entry-word');
      await expect(word).toBeVisible();
      
      // Word should contain Chinese characters
      const wordText = await word.textContent();
      expect(wordText).toMatch(/[\u4e00-\u9fff]+/);
    }
  });

  test('should work in Vietnamese locale', async ({ page }) => {
    await page.goto('/vi/vocabulary');
    
    // Check page loads
    await expect(page).toHaveURL(/\/vi\/vocabulary/);
    
    // Check search input is visible using test ID
    await expect(page.getByTestId('vocabulary-search-input')).toBeVisible();
  });

  test('should work in Chinese locale', async ({ page }) => {
    await page.goto('/zh/vocabulary');
    
    // Check page loads
    await expect(page).toHaveURL(/\/zh\/vocabulary/);
    
    // Check search input is visible using test ID
    await expect(page.getByTestId('vocabulary-search-input')).toBeVisible();
  });
});

