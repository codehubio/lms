/**
 * Script to find and merge duplicated vocabulary words across vocabulary files
 * 
 * Usage:
 *   tsx scripts/find-duplicated-words/duplicated-words.ts [mode] [limit]
 * 
 * Modes:
 *   find - Find duplicated words only (default)
 *   merge - Find duplicated words first, then merge them (all words by default, or specify limit)
 * 
 * Example:
 *   tsx scripts/find-duplicated-words/duplicated-words.ts find
 *   tsx scripts/find-duplicated-words/duplicated-words.ts merge        # Merge all
 *   tsx scripts/find-duplicated-words/duplicated-words.ts merge 80     # Merge first 80
 * 
 * Note: When using "merge" mode, the script will automatically find duplicated words
 *       before merging them, so you don't need to run "find" mode separately.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface VocabularyEntry {
  word: string;
  tags?: string[];
  pinyin1?: string;
  pinyin2?: string;
  translation?: {
    en?: string;
    vi?: string;
    zh?: string;
  };
  description?: {
    en?: string;
    vi?: string;
    zh?: string;
  };
  [key: string]: any;
}

interface ResultEntry {
  word: string;
  files: string[];
}

interface MergeResult {
  word: string;
  targetFile: string;
  sourceFiles: string[];
  tagsMerged: string[];
  fieldsMerged: string[];
}

/**
 * Get all words from all vocabulary JSON files and track which files contain each word
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
 * Find words that appear in multiple files (duplicated words)
 */
function findDuplicatedWords(): ResultEntry[] {
  const wordToFiles = getAllVocabularyWords();
  const results: ResultEntry[] = [];

  console.log('\nFinding duplicated words (words appearing in multiple files)...');

  for (const [word, files] of wordToFiles.entries()) {
    // Only include words that appear in more than one file
    if (files.length > 1) {
      results.push({
        word,
        files: files.sort() // Sort files alphabetically for consistency
      });
    }
  }

  // Sort results by word alphabetically
  results.sort((a, b) => a.word.localeCompare(b.word));

  console.log(`\nFound ${results.length} duplicated words.`);
  return results;
}

/**
 * Merge text fields by joining with comma
 */
function mergeTextFields(...values: (string | undefined)[]): string {
  const nonEmpty = values.filter(v => v && v.trim() !== '') as string[];
  if (nonEmpty.length === 0) return '';
  
  // Remove duplicates and join with comma
  const unique = Array.from(new Set(nonEmpty));
  return unique.join(', ');
}

/**
 * Merge vocabulary entries from multiple files into the first file
 */
function mergeVocabularyEntry(
  targetEntry: VocabularyEntry,
  sourceEntries: VocabularyEntry[]
): VocabularyEntry {
  const merged: VocabularyEntry = { ...targetEntry };

  // Merge tags (union of all unique tags)
  const allTags = new Set<string>();
  if (targetEntry.tags) {
    targetEntry.tags.forEach(tag => allTags.add(tag));
  }
  for (const source of sourceEntries) {
    if (source.tags) {
      source.tags.forEach(tag => allTags.add(tag));
    }
  }
  merged.tags = Array.from(allTags).sort();

  // Merge translation fields (join with comma)
  if (merged.translation) {
    for (const source of sourceEntries) {
      if (source.translation) {
        if (source.translation.en) {
          merged.translation.en = mergeTextFields(merged.translation.en, source.translation.en);
        }
        if (source.translation.vi) {
          merged.translation.vi = mergeTextFields(merged.translation.vi, source.translation.vi);
        }
        if (source.translation.zh) {
          merged.translation.zh = mergeTextFields(merged.translation.zh, source.translation.zh);
        }
      }
    }
  } else if (sourceEntries.length > 0 && sourceEntries[0].translation) {
    merged.translation = { ...sourceEntries[0].translation };
    for (let i = 1; i < sourceEntries.length; i++) {
      if (sourceEntries[i].translation) {
        const src = sourceEntries[i].translation;
        if (src && src.en) {
          merged.translation = merged.translation || {};
          merged.translation.en = mergeTextFields(merged.translation.en, src.en);
        }
        if (src && src.vi) {
          merged.translation = merged.translation || {};
          merged.translation.vi = mergeTextFields(merged.translation.vi, src.vi);
        }
        if (src && src.zh) {
          merged.translation = merged.translation || {};
          merged.translation.zh = mergeTextFields(merged.translation.zh, src.zh);
        }
      }
    }
  }

  // Merge description fields (join with comma)
  if (merged.description) {
    for (const source of sourceEntries) {
      if (source.description) {
        if (source.description.en) {
          merged.description.en = mergeTextFields(merged.description.en, source.description.en);
        }
        if (source.description.vi) {
          merged.description.vi = mergeTextFields(merged.description.vi, source.description.vi);
        }
        if (source.description.zh) {
          merged.description.zh = mergeTextFields(merged.description.zh, source.description.zh);
        }
      }
    }
  } else if (sourceEntries.length > 0 && sourceEntries[0].description) {
    merged.description = { ...sourceEntries[0].description };
    for (let i = 1; i < sourceEntries.length; i++) {
      if (sourceEntries[i].description) {
        const src = sourceEntries[i].description;
        if (src && src.en) {
          merged.description = merged.description || {};
          merged.description.en = mergeTextFields(merged.description.en, src.en);
        }
        if (src && src.vi) {
          merged.description = merged.description || {};
          merged.description.vi = mergeTextFields(merged.description.vi, src.vi);
        }
        if (src && src.zh) {
          merged.description = merged.description || {};
          merged.description.zh = mergeTextFields(merged.description.zh, src.zh);
        }
      }
    }
  }

  // Keep pinyin from target (first file)
  // Pinyin should remain as is from the target entry

  return merged;
}

/**
 * Load vocabulary file
 */
function loadVocabularyFile(fileName: string): VocabularyEntry[] {
  const vocabularyDir = path.join(__dirname, '../../data/vocabulary');
  const filePath = path.join(vocabularyDir, fileName);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error);
    return [];
  }
}

/**
 * Save vocabulary file
 */
function saveVocabularyFile(fileName: string, entries: VocabularyEntry[]): void {
  const vocabularyDir = path.join(__dirname, '../../data/vocabulary');
  const filePath = path.join(vocabularyDir, fileName);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${fileName}:`, error);
    throw error;
  }
}

/**
 * Merge duplicated words from duplicated-words.json
 */
function mergeDuplicatedWords(limit: number | undefined = undefined, skipFind: boolean = false): MergeResult[] {
  const duplicatedWordsPath = path.join(__dirname, './duplicated-words.json');
  
  // If file doesn't exist or skipFind is false, run find first
  if (!fs.existsSync(duplicatedWordsPath) || !skipFind) {
    if (!skipFind) {
      console.log('Finding duplicated words first...\n');
      const results = findDuplicatedWords();
      
      // Save the results to file
      fs.writeFileSync(duplicatedWordsPath, JSON.stringify(results, null, 2), 'utf-8');
      console.log(`Results saved to: ${duplicatedWordsPath}\n`);
    } else {
      console.error('Error: duplicated-words.json not found. Please run in "find" mode first.');
      process.exit(1);
    }
  }

  // Read the duplicated words file (either existing or newly created)
  if (!fs.existsSync(duplicatedWordsPath)) {
    console.error('Error: duplicated-words.json not found after finding duplicates.');
    process.exit(1);
  }

  const duplicatedWords: ResultEntry[] = JSON.parse(
    fs.readFileSync(duplicatedWordsPath, 'utf-8')
  );

  const wordsToMerge = limit ? duplicatedWords.slice(0, limit) : duplicatedWords;
  const totalWords = duplicatedWords.length;
  const mergingCount = wordsToMerge.length;
  
  if (limit) {
    console.log(`Merging ${mergingCount} of ${totalWords} duplicated words (limit: ${limit})...\n`);
  } else {
    console.log(`Merging all ${mergingCount} duplicated words...\n`);
  }

  const results: MergeResult[] = [];
  const fileCache = new Map<string, VocabularyEntry[]>();
  const fileModified = new Set<string>();

  // Load all files that will be modified
  for (const entry of wordsToMerge) {
    for (const file of entry.files) {
      if (!fileCache.has(file)) {
        fileCache.set(file, loadVocabularyFile(file));
      }
    }
  }

  // Process each duplicated word
  for (const entry of wordsToMerge) {
    const { word, files } = entry;
    const targetFile = files[0];
    const sourceFiles = files.slice(1);

    console.log(`Processing: "${word}"`);
    console.log(`  Target file: ${targetFile}`);
    console.log(`  Source files: ${sourceFiles.join(', ')}`);

    // Find entry in target file
    const targetEntries = fileCache.get(targetFile)!;
    const targetIndex = targetEntries.findIndex(e => e.word === word);
    
    if (targetIndex === -1) {
      console.error(`  ERROR: Word "${word}" not found in target file ${targetFile}`);
      continue;
    }

    const targetEntry = targetEntries[targetIndex];
    
    // Find entries in source files
    const sourceEntries: VocabularyEntry[] = [];
    for (const sourceFile of sourceFiles) {
      const sourceEntriesList = fileCache.get(sourceFile)!;
      const sourceEntry = sourceEntriesList.find(e => e.word === word);
      if (sourceEntry) {
        sourceEntries.push(sourceEntry);
      }
    }

    if (sourceEntries.length === 0) {
      console.log(`  WARNING: No source entries found for "${word}"`);
      continue;
    }

    // Merge entries
    const mergedEntry = mergeVocabularyEntry(targetEntry, sourceEntries);
    
    // Update target entry
    targetEntries[targetIndex] = mergedEntry;
    fileModified.add(targetFile);

    // Remove from source files
    for (const sourceFile of sourceFiles) {
      const sourceEntriesList = fileCache.get(sourceFile)!;
      const sourceIndex = sourceEntriesList.findIndex(e => e.word === word);
      if (sourceIndex !== -1) {
        sourceEntriesList.splice(sourceIndex, 1);
        fileModified.add(sourceFile);
        console.log(`  Removed from ${sourceFile}`);
      }
    }

    // Track merged fields
    const fieldsMerged: string[] = [];
    if (mergedEntry.tags && mergedEntry.tags.length > (targetEntry.tags?.length || 0)) {
      fieldsMerged.push('tags');
    }
    if (sourceEntries.some(e => e.translation)) {
      fieldsMerged.push('translation');
    }
    if (sourceEntries.some(e => e.description)) {
      fieldsMerged.push('description');
    }

    results.push({
      word,
      targetFile,
      sourceFiles,
      tagsMerged: mergedEntry.tags || [],
      fieldsMerged
    });

    console.log(`  ✓ Merged successfully\n`);
  }

  // Save all modified files
  console.log('Saving modified files...');
  for (const fileName of fileModified) {
    const entries = fileCache.get(fileName)!;
    saveVocabularyFile(fileName, entries);
    console.log(`  ✓ Saved ${fileName}`);
  }

  return results;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'find';
  const limit = args[1] ? parseInt(args[1], 10) : undefined;

  if (mode === 'merge') {
    console.log('='.repeat(60));
    console.log('Finding and merging duplicated words across vocabulary files');
    console.log('='.repeat(60));
    console.log();

    if (limit && (isNaN(limit) || limit < 1)) {
      console.error('Error: Limit must be a positive number');
      process.exit(1);
    }

    // Find duplicated words first, then merge (all if no limit specified)
    const results = mergeDuplicatedWords(limit, false);

    // Save merge report
    const reportPath = path.join(__dirname, './merge-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');

    console.log(`\nMerge completed!`);
    console.log(`Words processed: ${results.length}`);
    console.log(`Report saved to: ${reportPath}`);
  } else {
    console.log('='.repeat(60));
    console.log('Finding duplicated words across vocabulary files');
    console.log('='.repeat(60));
    console.log();

    const results = findDuplicatedWords();

    // Output to JSON file
    const outputPath = path.join(__dirname, './duplicated-words.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

    console.log(`\nResults saved to: ${outputPath}`);
    console.log(`Total duplicated words: ${results.length}`);

    // Show statistics
    if (results.length > 0) {
      const fileCounts = new Map<number, number>();
      for (const result of results) {
        const count = result.files.length;
        fileCounts.set(count, (fileCounts.get(count) || 0) + 1);
      }

      console.log('\nStatistics:');
      console.log('Words by number of files they appear in:');
      const sortedCounts = Array.from(fileCounts.entries()).sort((a, b) => a[0] - b[0]);
      for (const [fileCount, wordCount] of sortedCounts) {
        console.log(`  ${fileCount} file(s): ${wordCount} word(s)`);
      }

      // Show sample results
      console.log('\nSample results (first 20):');
      results.slice(0, 20).forEach((entry, index) => {
        console.log(`  ${index + 1}. "${entry.word}" appears in: ${entry.files.join(', ')}`);
      });
      if (results.length > 20) {
        console.log(`  ... and ${results.length - 20} more`);
      }
    } else {
      console.log('\n✓ No duplicated words found!');
    }
  }
}

// Run the script
main();

