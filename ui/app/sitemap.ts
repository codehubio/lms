import { MetadataRoute } from 'next';
import { locales, type Locale } from '@/proxy';
import { fetchGrammarEntries } from '@/lib/data';

/**
 * Generate sitemap for the LMS application
 * Includes all pages and dynamic routes (grammar entries) for all locales
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Determine base URL from environment variables or use default
  // Priority: NEXT_PUBLIC_BASE_URL > VERCEL_URL > default
  // Set NEXT_PUBLIC_BASE_URL in .env.local or your deployment platform
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'https://lms.codehub.io'; // Default domain - update this or set NEXT_PUBLIC_BASE_URL
  
  const entries: MetadataRoute.Sitemap = [];
  
  // Static routes that exist for all locales
  const staticRoutes = [
    { path: '', priority: 1.0, changefreq: 'daily' },
    { path: '/vocabulary', priority: 0.9, changefreq: 'daily' },
    { path: '/grammar', priority: 0.8, changefreq: 'weekly' },
    { path: '/about', priority: 0.7, changefreq: 'monthly' },
  ];
  
  // Add static routes for all locales
  for (const locale of locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${baseUrl}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changefreq as 'daily' | 'weekly' | 'monthly' | 'yearly',
        priority: route.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map(loc => [loc, `${baseUrl}/${loc}${route.path}`])
          ),
        },
      });
    }
  }
  
  // Fetch grammar entries for all locales and add dynamic routes
  try {
    // Fetch grammar entries for each locale
    for (const locale of locales) {
      try {
        const grammarEntries = await fetchGrammarEntries({ language: locale });
        
        // Add each grammar entry as a sitemap entry
        for (const entry of grammarEntries) {
          entries.push({
            url: `${baseUrl}/${locale}/grammar/${entry.id}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
            alternates: {
              languages: Object.fromEntries(
                locales.map(loc => [loc, `${baseUrl}/${loc}/grammar/${entry.id}`])
              ),
            },
          });
        }
      } catch (error) {
        // Log error but continue with other locales
        console.error(`Error fetching grammar entries for locale ${locale}:`, error);
      }
    }
  } catch (error) {
    // Log error but continue - static routes are already added
    console.error('Error fetching grammar entries for sitemap:', error);
  }
  
  return entries;
}
