# Playwright Tests for LMS UI

This directory contains end-to-end tests for the LMS UI application using Playwright. This is a standalone test project that does not interfere with the UI folder.

## Setup

1. Install dependencies (from the `test` directory):
   ```bash
   cd test
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

## Running Tests

All test commands should be run from the `test` directory:

```bash
cd test
```

### Run all tests
```bash
npm test
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run specific test file
```bash
npx playwright test vocabulary.spec.ts
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### View test report
```bash
npm run test:report
```

## Prerequisites

Before running tests, make sure:
1. The UI application dependencies are installed in the `../ui` folder
2. The UI can be started with `cd ../ui && npm run dev` (tests will auto-start it)

## Test Files

- `home.spec.ts` - Tests for the home page, including locale switching
- `vocabulary.spec.ts` - Tests for the vocabulary page, including search, filtering, and pagination
- `vocabulary-entry.spec.ts` - Tests for individual vocabulary entry components
- `navigation.spec.ts` - Tests for navigation between pages
- `scrape-hsk7-9.spec.ts` - Script to scrape HSK7-9 vocabulary words from OMG Chinese

## Scraping HSK7-9 Vocabulary

To scrape HSK7-9 words from [OMG Chinese](https://www.omgchinese.com/new-hsk/band7/words) and export to CSV:

```bash
npm run scrape:hsk7
```

This will:
1. Navigate to the HSK7-9 vocabulary page
2. Extract all Chinese words from the table (handles pagination automatically)
3. Export to `hsk7-9-words.csv` (1 column, no header)

The output file will be created in the `test` directory with one word per line.

## Configuration

The Playwright configuration is located at `playwright.config.ts`. It:
- Points to the current directory for test files
- Configures the base URL as `http://localhost:3333`
- Automatically starts the dev server in `../ui` before running tests
- Runs tests in multiple browsers (Chrome, Firefox, Safari) and mobile viewports

## Writing New Tests

When writing new tests:

1. Create a new `.spec.ts` file in the `test` directory
2. Import `test` and `expect` from `@playwright/test`
3. Use descriptive test names
4. Use `page.goto()` to navigate to pages
5. Use `page.locator()` to find elements
6. Use `expect()` for assertions

Example:
```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/en/vocabulary');
  await expect(page).toHaveTitle(/vocabulary/i);
});
```

## CI/CD

Tests are configured to:
- Retry failed tests 2 times on CI
- Generate HTML reports
- Take screenshots on failure
- Collect traces on retry

