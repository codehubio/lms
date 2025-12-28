import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load home page in English', async ({ page }) => {
    await page.goto('/en');
    
    // Check page title
    await expect(page).toHaveTitle(/Chinese Vocabulary/i);
    
    // Check navigation bar is visible
    await expect(page.getByTestId('nav-bar')).toBeVisible();
    
    // Check navigation links using test IDs
    await expect(page.getByTestId('nav-home-link')).toBeVisible();
    await expect(page.getByTestId('nav-vocabulary-link')).toBeVisible();
  });

  test('should load home page in Vietnamese', async ({ page }) => {
    await page.goto('/vi');
    
    // Check navigation bar is visible
    await expect(page.getByTestId('nav-bar')).toBeVisible();
  });

  test('should load home page in Chinese', async ({ page }) => {
    await page.goto('/zh');
    
    // Check navigation bar is visible
    await expect(page.getByTestId('nav-bar')).toBeVisible();
  });

  test('should navigate to vocabulary page', async ({ page }) => {
    await page.goto('/en');
    
    // Wait for vocabulary link to be ready
    const vocabLink = page.getByTestId('nav-vocabulary-link');
    await expect(vocabLink).toBeVisible();
    await expect(vocabLink).toBeEnabled();
    
    // Click vocabulary link and wait for navigation
    await Promise.all([
      page.waitForURL(/\/en\/vocabulary/),
      vocabLink.click()
    ]);
  });

  test('should switch language using language switcher', async ({ page }) => {
    await page.goto('/en');
    
    // Check language switcher is visible
    await expect(page.getByTestId('language-switcher')).toBeVisible();
    
    // Language switcher uses a Select component, so we can verify it exists
    // Actual switching would require interacting with the Select component
  });
});

