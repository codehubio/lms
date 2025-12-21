import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    // Start at home
    await page.goto('/en');
    await expect(page).toHaveURL(/\/en$/);
    
    // Wait for navigation link to be visible and ready
    const vocabLink = page.getByTestId('nav-vocabulary-link');
    await expect(vocabLink).toBeVisible();
    await expect(vocabLink).toBeEnabled();
    
    // Navigate to vocabulary using test ID and wait for navigation
    await Promise.all([
      page.waitForURL(/\/en\/vocabulary/),
      vocabLink.click()
    ]);
    
    // Navigate back to home
    const homeLink = page.getByTestId('nav-home-link');
    await expect(homeLink).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/en$/),
      homeLink.click()
    ]);
  });

  test('should maintain locale when navigating', async ({ page }) => {
    // Start in Vietnamese
    await page.goto('/vi');
    await expect(page).toHaveURL(/\/vi$/);
    
    // Wait for navigation link to be ready
    const vocabLink = page.getByTestId('nav-vocabulary-link');
    await expect(vocabLink).toBeVisible();
    
    // Navigate to vocabulary and wait for navigation
    await Promise.all([
      page.waitForURL(/\/vi\/vocabulary/),
      vocabLink.click()
    ]);
    
    // Navigate back
    const homeLink = page.getByTestId('nav-home-link');
    await expect(homeLink).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/vi$/),
      homeLink.click()
    ]);
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/en');
    
    // Check all navigation links are present and clickable using test IDs
    const homeLink = page.getByTestId('nav-home-link');
    const vocabLink = page.getByTestId('nav-vocabulary-link');
    const brandLink = page.getByTestId('nav-brand-link');
    
    await expect(homeLink).toBeVisible();
    await expect(vocabLink).toBeVisible();
    await expect(brandLink).toBeVisible();
    
    // Check links are clickable
    await expect(homeLink).toBeEnabled();
    await expect(vocabLink).toBeEnabled();
    await expect(brandLink).toBeEnabled();
  });

  test('should display logo/brand name', async ({ page }) => {
    await page.goto('/en');
    
    // Check for logo or brand name using test ID
    const brandLink = page.getByTestId('nav-brand-link');
    await expect(brandLink).toBeVisible();
    
    // Logo should link to home - wait for navigation
    await Promise.all([
      page.waitForURL(/\/en$/),
      brandLink.click()
    ]);
  });
});

