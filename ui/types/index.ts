// Placeholder types - update these when you decide on your data structure

/**
 * Example data types - customize these based on your needs
 */

// Example: User data type
export interface User {
  id: string;
  name: string;
  email?: string;
  // Add more fields as needed
}

// Example: Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Example sentence structure
export interface ExampleSentence {
  sentence: string;
  pinyin1: string;
  pinyin2: string;
  translation: {
    en: string;
    vi: string;
  };
}

// Dictionary entry type (HSK word list structure)
export interface DictionaryEntry {
  id: string;
  tags: string[]; // Array of tags (e.g., ["HSK1", "HSK2"])
  word: string; // Chinese word/character
  pinyin1: string; // Pinyin with tone marks
  pinyin2: string; // Pinyin with tone numbers
  translation: string; // Translation based on selected language
  description?: string; // Description based on selected language
  examples?: ExampleSentence[]; // Example sentences containing this word
}

// Tag group structure
export interface Tag {
  name: string;
  display_name: string | { en: string; vi: string; zh?: string };
  description: string | { en: string; vi: string; zh?: string };
}

export interface TagGroup {
  name: string;
  display_name?: string | { en: string; vi: string; zh?: string };
  tags: Tag[];
}

// Paragraph example with audio support
export interface ParagraphExample {
  word: string; // Chinese word/character
  pinyin?: string; // Pinyin transcription (e.g., "cì", "cǎo")
  translation?: {
    en?: string;
    vi?: string;
    zh?: string;
  };
  audio?: {
    path: string; // Audio file path (e.g., "/audio/examples/pronunciation-c/ci.mp3")
    duration?: number; // Duration in seconds (optional)
  };
}

// Grammar/Paragraph entry type
export interface GrammarEntry {
  id: string;
  title: string;
  tags: string[];
  translation: {
    en: string;
    vi: string;
    zh: string;
  };
  data: any[]; // The data array from the paragraph JSON
}

// Add more types as needed for your data structure

