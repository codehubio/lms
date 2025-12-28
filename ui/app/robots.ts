import { MetadataRoute } from 'next';

/**
 * Generate robots.txt for the LMS application
 * Controls how search engines crawl and index the site
 */
export default function robots(): MetadataRoute.Robots {
  // Determine base URL from environment variables or use default
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'https://lms.codehub.io';

  return {
    rules: [
      {
        userAgent: '*',
        disallow: [
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

