/**
 * UI Text Loader
 * Loads language-specific UI text constants from JSON file with nested translations
 * The JSON is bundled into the client code at build time
 */
import { type Locale } from '@/proxy';
import uiTextJson from '@/constants/ui-text.json';

let cachedTexts: Record<string, any> = {};

/**
 * Process the JSON structure to create language-specific text objects with functions
 */
function processTextForLanguage(data: any, locale: Locale, fallbackLocale: Locale = 'en'): any {
  const result: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Check if this is a language object (has 'en', 'vi', or 'zh' keys)
      if ('en' in value || 'vi' in value || 'zh' in value) {
        // This is a language-specific value
        const text = (value as any)[locale] || (value as any)[fallbackLocale] || '';
        result[key] = text;
      } else {
        // This is a nested object, recurse
        result[key] = processTextForLanguage(value, locale, fallbackLocale);
      }
    } else {
      result[key] = value;
    }
  }
  
  // Keep template strings as-is (don't create functions)
  // Client components will handle placeholder replacement themselves
  
  return result;
}

/**
 * Get UI text for a specific locale
 * The JSON is bundled into the client code, so this is synchronous
 * @param locale - The locale to get text for
 * @returns Processed UI text object for the locale
 */
export function getUiText(locale: Locale = 'en'): any {
  // Return cached if available
  if (cachedTexts[locale]) {
    return cachedTexts[locale];
  }

  // Process the JSON data for the requested locale with fallback to 'en'
  // The JSON is already imported and bundled, so this is synchronous
  const processedText = processTextForLanguage(uiTextJson, locale, 'en');
  cachedTexts[locale] = processedText;
  return processedText;
}

/**
 * Async version for backward compatibility
 * @deprecated Use getUiText() directly - it's now synchronous since JSON is bundled
 */
export async function getUiTextAsync(locale: Locale = 'en'): Promise<any> {
  return Promise.resolve(getUiText(locale));
}

/**
 * Hook for client components to get UI text synchronously
 * Since the JSON is bundled, this is now synchronous
 */
export function useUiTextSync(locale: Locale = 'en') {
  return getUiText(locale);
}

