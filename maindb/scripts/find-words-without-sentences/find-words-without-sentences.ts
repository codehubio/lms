/**
 * Script to find vocabulary words that don't appear in any sentences
 * 
 * Usage:
 *   tsx scripts/find-words-without-sentences.ts [limit]
 * 
 * Example:
 *   tsx scripts/find-words-without-sentences.ts 50
 *   (finds first 50 words without sentences)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface VocabularyEntry {
  word: string;
  [key: string]: any;
}

interface SentenceEntry {
  sentence: string;
  [key: string]: any;
}

interface ResultEntry {
  word: string;
  fileName: string;
}

/**
 * Get all words from all vocabulary JSON files
 */
function getAllVocabularyWords(): Map<string, string[]> {
  const vocabularyDir = path.join(__dirname, '../../data/vocabulary');
  const vocabularyFiles = fs.readdirSync(vocabularyDir).filter(file => file.endsWith('.json'));
  const wordToFiles = new Map<string, string[]>();

  console.log(`Reading ${vocabularyFiles.length} vocabulary files...`);

  for (const file of vocabularyFiles) {
    const filePath = path.join(vocabularyDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const entries: VocabularyEntry[] = JSON.parse(content);

      for (const entry of entries) {
        if (entry.word && typeof entry.word === 'string') {
          const word = entry.word.trim();
          if (word) {
            if (!wordToFiles.has(word)) {
              wordToFiles.set(word, []);
            }
            const files = wordToFiles.get(word)!;
            if (!files.includes(file)) {
              files.push(file);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  }

  console.log(`Found ${wordToFiles.size} unique words in vocabulary files.`);
  return wordToFiles;
}

/**
 * Get all sentences from all sentence JSON files
 */
function getAllSentences(): string[] {
  const sentenceDir = path.join(__dirname, '../../data/sentence');
  const sentenceFiles = fs.readdirSync(sentenceDir).filter(file => file.endsWith('.json'));
  const allSentences: string[] = [];

  console.log(`Reading ${sentenceFiles.length} sentence files...`);

  for (const file of sentenceFiles) {
    const filePath = path.join(sentenceDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const entries: SentenceEntry[] = JSON.parse(content);

      for (const entry of entries) {
        if (entry.sentence && typeof entry.sentence === 'string') {
          allSentences.push(entry.sentence);
        }
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  }

  console.log(`Found ${allSentences.length} sentences.`);
  return allSentences;
}

/**
 * Split a word by special characters (like ...) to get its parts
 * For example: "不是...就是" -> ["不是", "就是"]
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
 * Check if a word appears in any sentence
 * For words with special characters (like "不是...就是"), check if all parts appear
 */
function wordInSentences(word: string, sentences: string[]): boolean {
  // First, try exact match (for simple words)
  for (const sentence of sentences) {
    if (sentence.includes(word)) {
      return true;
    }
  }

  // If exact match fails, check if word has special characters
  const parts = splitWordBySpecialChars(word);
  
  // If word was split into multiple parts, check if all parts appear
  if (parts.length > 1) {
    // Check if all parts appear in at least one sentence
    for (const sentence of sentences) {
      let allPartsFound = true;
      for (const part of parts) {
        if (!sentence.includes(part)) {
          allPartsFound = false;
          break;
        }
      }
      if (allPartsFound) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Find words that don't appear in any sentences
 */
function findWordsWithoutSentences(limit?: number): ResultEntry[] {
  const wordToFiles = getAllVocabularyWords();
  const sentences = getAllSentences();
  const results: ResultEntry[] = [];

  console.log('\nChecking which words appear in sentences...');

  let checked = 0;
  for (const [word, files] of wordToFiles.entries()) {
    checked++;
    if (!wordInSentences(word, sentences)) {
      // Add one entry per file that contains this word
      for (const fileName of files) {
        results.push({ word, fileName });
      }
    }

    // Show progress every 100 words
    if (checked % 100 === 0) {
      process.stdout.write(`\rChecked ${checked}/${wordToFiles.size} words... Found ${results.length} words without sentences`);
    }
  }

  console.log(`\n\nTotal words checked: ${checked}`);
  console.log(`Words without sentences found: ${results.length}`);

  // Apply limit after checking all words
  if (limit && results.length > limit) {
    console.log(`Limiting results to ${limit} entries.`);
    return results.slice(0, limit);
  }

  return results;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const limit = args[0] ? parseInt(args[0], 10) : undefined;

  if (limit !== undefined && (isNaN(limit) || limit < 1)) {
    console.error('Error: Limit must be a positive number');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('Finding vocabulary words without example sentences');
  console.log('='.repeat(60));
  if (limit) {
    console.log(`Limit: ${limit} results\n`);
  } else {
    console.log('No limit specified - will find all words without sentences\n');
  }

  const results = findWordsWithoutSentences(limit);

  // Output to JSON file
  const outputPath = path.join(__dirname, './words-without-sentences.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`\nResults saved to: ${outputPath}`);
  console.log(`Total entries: ${results.length}`);

  // Show sample results
  if (results.length > 0) {
    console.log('\nSample results (first 10):');
    results.slice(0, 10).forEach((entry, index) => {
      console.log(`  ${index + 1}. "${entry.word}" (from ${entry.fileName})`);
    });
    if (results.length > 10) {
      console.log(`  ... and ${results.length - 10} more`);
    }
  } else {
    console.log('\n✓ All words have example sentences!');
  }
}

// Run the script
main();

