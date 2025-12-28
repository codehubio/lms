/**
 * API Route: /api/dictionary
 * 
 * This is a Next.js API route that runs on the server.
 * You can fetch dictionary data from databases, external APIs, or files here.
 * 
 * Access this at: http://localhost:3333/api/dictionary
 */

import { NextResponse } from 'next/server';
import { fetchDictionaryEntries } from '@/lib/data';
import { ApiResponse, DictionaryEntry } from '@/types';

export async function GET(request: Request) {
  const startTime = Date.now();
  const url = new URL(request.url);
  
  // Get query parameters
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10);
  const search = url.searchParams.get('search') || '';
  // Get all tag parameters (support multiple tags)
  const tags = url.searchParams.getAll('tag').filter(Boolean);
  
  const beginLog = {
    type: 'api',
    phase: 'begin',
    endpoint: '/api/dictionary',
    method: 'GET',
    url: url.pathname,
    params: { page, pageSize, search, tags },
  };
  console.log(JSON.stringify(beginLog));
  
  try {
    // Fetch data from your data source
    const result = await fetchDictionaryEntries({ page, pageSize, search, tag: tags });
    
    const response: ApiResponse<typeof result> = {
      data: result,
      success: true,
    };

    const duration = Date.now() - startTime;
    const endLog = {
      type: 'api',
      phase: 'end',
      endpoint: '/api/dictionary',
      method: 'GET',
      duration,
      status: 200,
      entriesCount: result.entries.length,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      success: true,
    };
    console.log(JSON.stringify(endLog));

    return NextResponse.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    const endLog = {
      type: 'api',
      phase: 'end',
      endpoint: '/api/dictionary',
      method: 'GET',
      duration,
      status: 500,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dictionary entries',
    };
    console.error(JSON.stringify(endLog));
    
    const response: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dictionary entries',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

