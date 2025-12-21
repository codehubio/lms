import { NextRequest, NextResponse } from 'next/server';
import { fetchWordExamples } from '@/lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ word: string }> }
) {
  try {
    const { word } = await params;
    
    if (!word || typeof word !== 'string') {
      return NextResponse.json(
        { error: 'Word parameter is required' },
        { status: 400 }
      );
    }
    
    const examples = await fetchWordExamples(word);
    
    return NextResponse.json({ examples }, { status: 200 });
  } catch (error) {
    console.error('Error fetching word examples:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch word examples',
        examples: []
      },
      { status: 500 }
    );
  }
}

