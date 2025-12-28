/**
 * Data fetching utilities
 * 
 * This file contains functions to fetch data from various sources.
 * Update these functions when you decide on your data source (API, database, etc.)
 */

import { ApiResponse, DictionaryEntry, TagGroup, GrammarEntry } from '@/types';

/**
 * Helper function to clean joined fields: split by stopping characters, remove duplicates, and rejoin
 * @param value - The joined string value
 * @param delimiter - The delimiter used to rejoin (default: ', ')
 * @returns Cleaned string with duplicates removed
 */
function cleanJoinedField(value: string | null | undefined, delimiter: string = ', '): string {
  if (!value || typeof value !== 'string') return '';
  
  // First, normalize the entire string: Unicode normalization and whitespace
  let normalized = value.normalize('NFC');
  // Replace all whitespace variations with single space
  normalized = normalized.replace(/[\s\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]+/g, ' ');
  
  // Split by multiple stopping characters: comma, semicolon, and their variations
  // Also handle cases where values might be separated by multiple spaces or commas
  // Pattern: comma/semicolon (with optional spaces), or multiple spaces (2+)
  const parts = normalized
    .split(/[,;]\s*|\s{2,}/) // Split by comma/semicolon (with optional spaces) OR multiple spaces
    .map(part => part.trim())
    .filter(part => part.length > 0);
  
  // Further normalize each part (in case there are still whitespace issues)
  const normalizedParts = parts
    .map(part => part.replace(/\s+/g, ' ').trim())
    .filter(part => part.length > 0);
  
  // Remove duplicates while preserving order (case-sensitive for pinyin)
  const seen = new Set<string>();
  const uniqueParts: string[] = [];
  for (const part of normalizedParts) {
    // Use exact match (case-sensitive) for pinyin
    if (part && !seen.has(part)) {
      seen.add(part);
      uniqueParts.push(part);
    }
  }
  
  return uniqueParts.join(delimiter).trim();
}

/**
 * Example: Generic data fetcher with error handling
 */
export async function fetchData<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const startTime = Date.now();
  const method = options?.method || 'GET';
  
  const beginLog = {
    type: 'api',
    phase: 'begin',
    url,
    method,
  };
  console.log(JSON.stringify(beginLog));
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const endLog = {
        type: 'api',
        phase: 'end',
        url,
        method,
        duration,
        status: response.status,
        success: false,
        error: `HTTP error! status: ${response.status}`,
      };
      console.error(JSON.stringify(endLog));
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const endLog = {
      type: 'api',
      phase: 'end',
      url,
      method,
      duration,
      status: response.status,
      success: true,
    };
    console.log(JSON.stringify(endLog));
    
    return {
      data,
      success: true,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const endLog = {
      type: 'api',
      phase: 'end',
      url,
      method,
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    console.error(JSON.stringify(endLog));
    return {
      data: null as T,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Example: Server-side data fetcher (for use in Server Components)
 * This runs on the server, so it can access databases, file system, etc.
 */
export async function getServerData<T>(
  fetcher: () => Promise<T>
): Promise<ApiResponse<T>> {
  try {
    const data = await fetcher();
    return {
      data,
      success: true,
    };
  } catch (error) {
    return {
      data: null as T,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch tag groups from DuckDB database
 */
export async function fetchTagGroups(): Promise<TagGroup[]> {
  const startTime = Date.now();
  
  try {
    const { waitForDatabase, query } = await import('./db');
    await waitForDatabase();
    
    const results = await query<any>('SELECT * FROM tag_group');
    
    // Convert to TagGroup array
    const tagGroups: TagGroup[] = results.map((row: any) => ({
      name: row.name,
      display_name: row.display_name, // Include display_name for translations
      tags: row.tags || [],
    }));
    
    const duration = Date.now() - startTime;
    const logData = {
      type: 'other',
      action: 'fetchTagGroups',
      duration,
      count: tagGroups.length,
      success: true,
    };
    console.log(JSON.stringify(logData));
    
    return tagGroups;
  } catch (error) {
    const duration = Date.now() - startTime;
    const logData = {
      type: 'other',
      action: 'fetchTagGroups',
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    console.error(JSON.stringify(logData));
    throw error;
  }
}

/**
 * Fetch dictionary entries from DuckDB database with pagination, search, and tag filtering
 */
export async function fetchDictionaryEntries(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  tag?: string | string[];
  language?: string;
  includeExamples?: boolean;
}): Promise<{ entries: DictionaryEntry[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const { page = 1, pageSize = 50, search = '', tag = '', language = 'en', includeExamples = false } = options || {};
  // Normalize tag to array
  const tags = Array.isArray(tag) ? tag : (tag ? [tag] : []);
  const tagsFilter = tags.filter(t => t && t.trim());
  
  const startTime = Date.now();
  
  try {
    // Ensure database connection is established before querying
    const { waitForDatabase, query } = await import('./db');
    await waitForDatabase();
    
    // Build WHERE clause for search and tag filter
    const conditions: string[] = [];
    const qualifiedConditions: string[] = [];
    
    // Escape search term for SQL safety (used in both WHERE and ORDER BY)
    const escapedSearch = search && search.trim() 
      ? search.trim().replace(/'/g, "''").replace(/\\/g, '\\\\')
      : '';
    
    if (search && search.trim()) {
      const searchPattern = `%${escapedSearch}%`;
      
      // Search in word, pinyin, and translation fields
      conditions.push(`(
        word LIKE '${searchPattern}' OR 
        pinyin1 LIKE '${searchPattern}' OR 
        pinyin2 LIKE '${searchPattern}' OR 
        translation.en LIKE '${searchPattern}' OR 
        translation.vi LIKE '${searchPattern}'
      )`);
      
      // Qualified version for JOIN context
      qualifiedConditions.push(`(
        v.word LIKE '${searchPattern}' OR 
        v.pinyin1 LIKE '${searchPattern}' OR 
        v.pinyin2 LIKE '${searchPattern}' OR 
        v.translation.en LIKE '${searchPattern}' OR 
        v.translation.vi LIKE '${searchPattern}'
      )`);
    }
    
    if (tagsFilter.length > 0) {
      // Filter by tags - check if any of the selected tags exists in the tags array
      // Use OR logic: show entries that have ANY of the selected tags
      const tagConditions = tagsFilter.map(tag => {
        const escapedTag = tag.trim().replace(/'/g, "''");
        return `array_position(tags, '${escapedTag}') IS NOT NULL`;
      });
      conditions.push(`(${tagConditions.join(' OR ')})`);
      
      // Qualified version for JOIN context
      const qualifiedTagConditions = tagsFilter.map(tag => {
        const escapedTag = tag.trim().replace(/'/g, "''");
        return `array_position(v.tags, '${escapedTag}') IS NOT NULL`;
      });
      qualifiedConditions.push(`(${qualifiedTagConditions.join(' OR ')})`);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const qualifiedWhereClause = qualifiedConditions.length > 0 ? `WHERE ${qualifiedConditions.join(' AND ')}` : '';
    
    // Extract translation for the requested language (translation is a JSON object)
    const translationField = language === 'vi' ? "translation.vi" : "translation.en";
    const fallbackTranslation = language === 'vi' ? "translation.en" : "translation.vi";
    
    // Extract description for the requested language (description is a JSON object)
    const descriptionField = language === 'vi' ? "v.description.vi" : language === 'zh' ? "v.description.zh" : "v.description.en";
    const fallbackDescription1 = language === 'vi' ? "v.description.en" : language === 'zh' ? "v.description.vi" : "v.description.vi";
    const fallbackDescription2 = language === 'vi' ? "v.description.zh" : language === 'zh' ? "v.description.en" : "v.description.zh";
    
    // Get total count - count distinct words after grouping
    const countQuery = `SELECT COUNT(DISTINCT word) as total FROM vocabulary ${whereClause}`;
    const countResults = await query<any>(countQuery);
    const total = Number(countResults[0]?.total || 0);
    
    // Calculate pagination
    const offset = (page - 1) * pageSize;
    const totalPages = Math.ceil(total / pageSize);
    
    // Build query with pagination
    const safePageSize = Number(pageSize);
    const safeOffset = Number(offset);
    
    // Group by word and merge other fields
    // Use CTE to expand tags, then group and aggregate all fields
    // Conditionally include example sentences based on includeExamples flag
    const examplesCTE = includeExamples ? `,
    word_examples AS (
      SELECT 
        v.word,
        LIST({
          'sentence': s.sentence,
          'pinyin1': s.pinyin1,
          'pinyin2': s.pinyin2,
          'translation': s.translation
        }) as examples
      FROM vocabulary v
      LEFT JOIN sentence s ON CONTAINS(s.sentence, v.word)
      ${qualifiedWhereClause}
      GROUP BY v.word
    )` : '';
    
    const examplesJoin = includeExamples ? `LEFT JOIN word_examples ex ON v.word = ex.word` : '';
    const examplesSelect = includeExamples ? `COALESCE(ex.examples, []) as examples` : `[] as examples`;
    const examplesGroupBy = includeExamples ? `, ex.examples` : '';
    
    const dataQuery = `WITH expanded_tags AS (
      SELECT 
        word,
        unnest(tags) as tag
      FROM vocabulary 
      ${whereClause}
    ),
    aggregated_tags AS (
      SELECT 
        word,
        list_distinct(LIST(tag)) as tags
      FROM expanded_tags
      GROUP BY word
    )${examplesCTE},
    grouped_data AS (
      SELECT 
        v.word,
        COALESCE(tag_agg.tags, []) as tags,
        string_agg(DISTINCT v.pinyin1, ', ') FILTER (WHERE v.pinyin1 IS NOT NULL AND v.pinyin1 != '') as pinyin1,
        string_agg(DISTINCT v.pinyin2, ', ') FILTER (WHERE v.pinyin2 IS NOT NULL AND v.pinyin2 != '') as pinyin2,
        COALESCE(
          string_agg(DISTINCT ${translationField}, ', ') FILTER (WHERE ${translationField} IS NOT NULL AND ${translationField} != ''),
          string_agg(DISTINCT ${fallbackTranslation}, ', ') FILTER (WHERE ${fallbackTranslation} IS NOT NULL AND ${fallbackTranslation} != ''),
          ''
        ) as translation,
        COALESCE(
          string_agg(DISTINCT ${descriptionField}, ', ') FILTER (WHERE ${descriptionField} IS NOT NULL AND ${descriptionField} != ''),
          string_agg(DISTINCT ${fallbackDescription1}, ', ') FILTER (WHERE ${fallbackDescription1} IS NOT NULL AND ${fallbackDescription1} != ''),
          string_agg(DISTINCT ${fallbackDescription2}, ', ') FILTER (WHERE ${fallbackDescription2} IS NOT NULL AND ${fallbackDescription2} != ''),
          ''
        ) as description,
        ${examplesSelect}
      FROM vocabulary v
      LEFT JOIN aggregated_tags tag_agg ON v.word = tag_agg.word
      ${examplesJoin}
      ${qualifiedWhereClause}
      GROUP BY v.word, tag_agg.tags${examplesGroupBy}
    )
    SELECT * FROM (
      SELECT 
        ROW_NUMBER() OVER (ORDER BY 
          ${escapedSearch ? `CASE WHEN word = '${escapedSearch}' THEN 0 ELSE 1 END,` : ''}
          COALESCE(tags[1], ''), 
          word
        ) as id,
        tags,
        word,
        pinyin1,
        pinyin2,
        translation,
        description,
        examples
      FROM grouped_data
    ) ORDER BY 
      ${escapedSearch ? `CASE WHEN word = '${escapedSearch}' THEN 0 ELSE 1 END,` : ''}
      COALESCE(tags[1], ''), 
      word
    LIMIT ${safePageSize} OFFSET ${safeOffset}`;
    
    const results = await query<any>(dataQuery, undefined);
    
    // Convert and ensure types, and clean joined fields by splitting on stopping characters
    const entries: DictionaryEntry[] = results.map((row: any) => ({
      id: String(row.id),
      tags: Array.isArray(row.tags) ? row.tags : (row.tags ? [row.tags] : []),
      word: row.word || '',
      pinyin1: cleanJoinedField(row.pinyin1, ', '),
      pinyin2: cleanJoinedField(row.pinyin2, ', '),
      translation: cleanJoinedField(row.translation, ', '),
      description: cleanJoinedField(row.description, ', ') || undefined,
      examples: Array.isArray(row.examples) ? row.examples.filter((ex: any) => ex && ex.sentence) : [],
    }));
    
    const duration = Date.now() - startTime;
    const logData = {
      type: 'other',
      action: 'fetchDictionaryEntries',
      duration,
      page,
      pageSize,
      entriesCount: entries.length,
      total,
      success: true,
    };
    console.log(JSON.stringify(logData));
    
    return {
      entries,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const logData = {
      type: 'other',
      action: 'fetchDictionaryEntries',
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    console.error(JSON.stringify(logData));
    throw error;
  }
}

/**
 * Split a word by special characters like "..." or "…"
 * Returns an array of parts.
 */
function splitWordBySpecialChars(word: string): string[] {
  // Common special characters/patterns used in correlative conjunctions
  const specialPatterns = [
    /\.\.\./,           // Three dots
    /…/,                // Ellipsis character
    /\s+\.\.\.\s+/,     // Three dots with spaces
    /\s+…\s+/,          // Ellipsis with spaces
  ];

  // Try to split by special patterns
  for (const pattern of specialPatterns) {
    if (pattern.test(word)) {
      const parts = word.split(pattern).map(part => part.trim()).filter(part => part.length > 0);
      if (parts.length > 1) {
        return parts;
      }
    }
  }

  // If no special pattern found, return the word as a single part
  return [word];
}

/**
 * Fetch example sentences for a specific word
 * If the word contains special characters (like "..."), it will be split and
 * sentences containing all parts will be returned.
 */
export async function fetchWordExamples(word: string): Promise<any[]> {
  const startTime = Date.now();
  
  try {
    const { waitForDatabase, query } = await import('./db');
    await waitForDatabase();
    
    // Split word by special characters
    const parts = splitWordBySpecialChars(word);
    
    let examplesQuery: string;
    
    if (parts.length > 1) {
      // Word has special characters - find sentences containing ALL parts
      // Escape each part for SQL safety
      const escapedParts = parts.map(part => part.replace(/'/g, "''").replace(/\\/g, '\\\\'));
      
      // Build WHERE clause: sentence must contain all parts
      const conditions = escapedParts.map(part => `CONTAINS(sentence, '${part}')`).join(' AND ');
      
      examplesQuery = `
        SELECT 
          sentence,
          pinyin1,
          pinyin2,
          translation
        FROM sentence
        WHERE ${conditions}
        ORDER BY sentence
        LIMIT 50
      `;
    } else {
      // Simple word - just check if sentence contains the word
      const escapedWord = word.replace(/'/g, "''").replace(/\\/g, '\\\\');
      
      examplesQuery = `
        SELECT 
          sentence,
          pinyin1,
          pinyin2,
          translation
        FROM sentence
        WHERE CONTAINS(sentence, '${escapedWord}')
        ORDER BY sentence
        LIMIT 50
      `;
    }
    
    const results = await query<any>(examplesQuery, undefined);
    
    const examples = results.map((row: any) => ({
      sentence: row.sentence || '',
      pinyin1: row.pinyin1 || '',
      pinyin2: row.pinyin2 || '',
      translation: row.translation || { en: '', vi: '', zh: '' },
    }));
    
    const duration = Date.now() - startTime;
    const logData = {
      type: 'other',
      action: 'fetchWordExamples',
      word,
      parts: parts.length > 1 ? parts : undefined,
      duration,
      examplesCount: examples.length,
      success: true,
    };
    console.log(JSON.stringify(logData));
    
    return examples;
  } catch (error) {
    const duration = Date.now() - startTime;
    const logData = {
      type: 'other',
      action: 'fetchWordExamples',
      word,
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    console.error(JSON.stringify(logData));
    throw error;
  }
}

/**
 * Fetch grammar entries (paragraphs) from DuckDB database with grammar tag
 */
export async function fetchGrammarEntries(options?: {
  language?: string;
}): Promise<GrammarEntry[]> {
  const { language = 'en' } = options || {};
  
  const startTime = Date.now();
  
  try {
    const { waitForDatabase, query } = await import('./db');
    await waitForDatabase();
    
    // Query paragraphs with grammar tag
    const translationField = language === 'vi' ? "translation.vi" : language === 'zh' ? "translation.zh" : "translation.en";
    
    const dataQuery = `
      SELECT 
        id,
        title,
        tags,
        translation,
        data
      FROM paragraph
      WHERE array_position(tags, 'grammar') IS NOT NULL
      ORDER BY COALESCE(tags[1], ''), ${translationField}
    `;
    
    const results = await query<any>(dataQuery);
    
    // Convert to GrammarEntry array
    const entries: GrammarEntry[] = results.map((row: any) => {
      const id = row.id ? String(row.id) : '';
      const title = String(row.title || '');
      const tags = Array.isArray(row.tags) ? row.tags : (row.tags ? [row.tags] : []);
      const translation = (row.translation && typeof row.translation === 'object') 
        ? { 
            en: String(row.translation.en || ''),
            vi: String(row.translation.vi || ''),
            zh: String(row.translation.zh || ''),
          }
        : { en: '', vi: '', zh: '' };
      const data = Array.isArray(row.data) ? row.data : [];
      
      return {
        id,
        title,
        tags,
        translation,
        data,
      };
    });
    
    const duration = Date.now() - startTime;
    const logData = {
      type: 'other',
      action: 'fetchGrammarEntries',
      duration,
      entriesCount: entries.length,
      success: true,
    };
    console.log(JSON.stringify(logData));
    
    return entries;
  } catch (error) {
    const duration = Date.now() - startTime;
    const logData = {
      type: 'other',
      action: 'fetchGrammarEntries',
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    console.error(JSON.stringify(logData));
    throw error;
  }
}

/**
 * Fetch pronunciation entries (paragraphs) from DuckDB database with pronunciation tag
 */
export async function fetchPronunciationEntries(options?: {
  language?: string;
}): Promise<GrammarEntry[]> {
  const { language = 'en' } = options || {};
  
  const startTime = Date.now();
  
  try {
    const { waitForDatabase, query } = await import('./db');
    await waitForDatabase();
    
    // Query paragraphs with pronunciation tag
    const translationField = language === 'vi' ? "translation.vi" : language === 'zh' ? "translation.zh" : "translation.en";
    
    const dataQuery = `
      SELECT 
        id,
        title,
        tags,
        translation,
        data
      FROM paragraph
      WHERE array_position(tags, 'pronunciation') IS NOT NULL
      ORDER BY COALESCE(tags[1], ''), ${translationField}
    `;
    
    const results = await query<any>(dataQuery);
    
    // Convert to GrammarEntry array (same structure as grammar entries)
    const entries: GrammarEntry[] = results.map((row: any) => {
      const id = row.id ? String(row.id) : '';
      const title = String(row.title || '');
      const tags = Array.isArray(row.tags) ? row.tags : (row.tags ? [row.tags] : []);
      const translation = (row.translation && typeof row.translation === 'object') 
        ? { 
            en: String(row.translation.en || ''),
            vi: String(row.translation.vi || ''),
            zh: String(row.translation.zh || ''),
          }
        : { en: '', vi: '', zh: '' };
      const data = Array.isArray(row.data) ? row.data : [];
      
      return {
        id,
        title,
        tags,
        translation,
        data,
      };
    });
    
    const duration = Date.now() - startTime;
    // Add synthetic entry for pinyin-chart at the beginning
    const pinyinChartEntry: GrammarEntry = {
      id: 'pronunciation-pinyin-chart',
      title: 'Complete Pinyin Pronunciation Chart',
      tags: ['pronunciation'],
      translation: {
        en: 'Complete Pinyin Pronunciation Chart',
        vi: 'Bảng phát âm Pinyin đầy đủ',
        zh: '完整拼音发音表',
      },
      data: [],
    };
    
    const allEntries = [pinyinChartEntry, ...entries];
    
    const logData = {
      type: 'other',
      action: 'fetchPronunciationEntries',
      duration,
      entriesCount: allEntries.length,
      success: true,
    };
    console.log(JSON.stringify(logData));
    
    return allEntries;
  } catch (error) {
    const duration = Date.now() - startTime;
    const logData = {
      type: 'other',
      action: 'fetchPronunciationEntries',
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    console.error(JSON.stringify(logData));
    throw error;
  }
}

