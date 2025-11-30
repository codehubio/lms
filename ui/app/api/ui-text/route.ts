import { NextResponse } from 'next/server';
import uiTextJson from '@/constants/ui-text.json';

/**
 * API route to serve UI text JSON for client components
 */
export async function GET() {
  try {
    return NextResponse.json(uiTextJson, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[API /ui-text] Error reading UI text JSON:', error);
    return NextResponse.json(
      { error: 'Failed to load UI text' },
      { status: 500 }
    );
  }
}

