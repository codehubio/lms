/**
 * Script to find and merge duplicated vocabulary words across and within vocabulary files
 * 
 * Usage:
 *   tsx scripts/find-and-merge-duplicated-words/find-and-merge-duplicated-words.ts [mode] [limit]
 * 
 * Modes:
 *   find - Find duplicated words only (default) - both across files and within files
 *   merge - Find duplicated words first, then merge them (all words by default, or specify limit)
 * 
 * Example:
 *   tsx scripts/find-and-merge-duplicated-words/find-and-merge-duplicated-words.ts find
 *   tsx scripts/find-and-merge-duplicated-words/find-and-merge-duplicated-words.ts merge        # Merge all
 *   tsx scripts/find-and-merge-duplicated-words/find-and-merge-duplicated-words.ts merge 80     # Merge first 80
 * 
 * Note: When using "merge" mode, the script will automatically:
 *       1. Find and merge duplicates across different files
 *       2. Find and merge duplicates within the same file
 *       So you don't need to run "find" mode separately.
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

interface InternalDuplicateInfo {
  word: string;
  fileName: string;
  count: number;
  indices: number[];
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
 * Find words that appear in multiple files (duplicated words across files)
 */
function findDuplicatedWordsAcrossFiles(): ResultEntry[] {
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

  console.log(`\nFound ${results.length} duplicated words across files.`);
  return results;
}

/**
 * Find duplicates within a single file
 */
function findDuplicatesInFile(fileName: string): InternalDuplicateInfo[] {
  const vocabularyDir = path.join(__dirname, '../../data/vocabulary');
  const filePath = path.join(vocabularyDir, fileName);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const entries: VocabularyEntry[] = JSON.parse(content);
    
    const wordToIndices = new Map<string, number[]>();
    
    entries.forEach((entry, index) => {
      if (entry.word && typeof entry.word === 'string') {
        const word = entry.word.trim();
        if (word) {
          if (!wordToIndices.has(word)) {
            wordToIndices.set(word, []);
          }
          wordToIndices.get(word)!.push(index);
        }
      }
    });
    
    const duplicates: InternalDuplicateInfo[] = [];
    for (const [word, indices] of wordToIndices.entries()) {
      if (indices.length > 1) {
        duplicates.push({
          word,
          fileName,
          count: indices.length,
          indices
        });
      }
    }
    
    return duplicates;
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error);
    return [];
  }
}

/**
 * Find all duplicates within files
 */
function findDuplicatedWordsWithinFiles(): InternalDuplicateInfo[] {
  const vocabularyDir = path.join(__dirname, '../../data/vocabulary');
  const vocabularyFiles = fs.readdirSync(vocabularyDir).filter(file => file.endsWith('.json'));
  
  const allDuplicates: InternalDuplicateInfo[] = [];
  
  for (const file of vocabularyFiles) {
    const duplicates = findDuplicatesInFile(file);
    allDuplicates.push(...duplicates);
  }
  
  return allDuplicates.sort((a, b) => b.count - a.count);
}

/**
 * Find all duplicated words (both across files and within files)
 */
function findDuplicatedWords(): { acrossFiles: ResultEntry[]; withinFiles: InternalDuplicateInfo[] } {
  const acrossFiles = findDuplicatedWordsAcrossFiles();
  const withinFiles = findDuplicatedWordsWithinFiles();
  
  return { acrossFiles, withinFiles };
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

  // Merge pinyin fields (join with comma if multiple)
  const pinyin1Values = [targetEntry.pinyin1, ...sourceEntries.map(e => e.pinyin1)].filter(Boolean) as string[];
  const pinyin2Values = [targetEntry.pinyin2, ...sourceEntries.map(e => e.pinyin2)].filter(Boolean) as string[];
  if (pinyin1Values.length > 0) {
    merged.pinyin1 = mergeTextFields(...pinyin1Values);
  }
  if (pinyin2Values.length > 0) {
    merged.pinyin2 = mergeTextFields(...pinyin2Values);
  }

  return merged;
}

/**
 * Merge vocabulary entries from the same file (for internal duplicates)
 */
function mergeVocabularyEntriesSameFile(
  entries: VocabularyEntry[]
): VocabularyEntry {
  return mergeVocabularyEntry(entries[0], entries.slice(1));
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
 * Merge duplicates within a file
 */
function mergeDuplicatesInFile(fileName: string, duplicates: InternalDuplicateInfo[]): number {
  const vocabularyDir = path.join(__dirname, '../../data/vocabulary');
  const filePath = path.join(vocabularyDir, fileName);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const entries: VocabularyEntry[] = JSON.parse(content);
    
    // Group duplicates by word
    const fileDuplicates = duplicates.filter(d => d.fileName === fileName);
    const wordToDuplicates = new Map<string, InternalDuplicateInfo[]>();
    for (const dup of fileDuplicates) {
      if (!wordToDuplicates.has(dup.word)) {
        wordToDuplicates.set(dup.word, []);
      }
      wordToDuplicates.get(dup.word)!.push(dup);
    }
    
    let mergedCount = 0;
    const indicesToRemove = new Set<number>();
    
    // Process each word's duplicates
    for (const [word, wordDups] of wordToDuplicates.entries()) {
      // Get all unique indices for this word across all duplicate entries
      const allIndices = new Set<number>();
      for (const dup of wordDups) {
        dup.indices.forEach(idx => allIndices.add(idx));
      }
      
      if (allIndices.size < 2) {
        continue; // Need at least 2 occurrences
      }
      
      // Get all entries for this word
      const duplicateEntries = Array.from(allIndices)
        .sort((a, b) => a - b)
        .map(idx => entries[idx])
        .filter(Boolean);
      
      if (duplicateEntries.length > 1) {
        // Merge entries
        const merged = mergeVocabularyEntriesSameFile(duplicateEntries);
        
        // Keep the first occurrence (lowest index)
        const firstIndex = Math.min(...allIndices);
        entries[firstIndex] = merged;
        
        // Mark other indices for removal
        for (const idx of allIndices) {
          if (idx !== firstIndex) {
            indicesToRemove.add(idx);
          }
        }
        
        mergedCount++;
      }
    }
    
    // Remove all marked indices in reverse order to maintain indices
    const sortedIndicesToRemove = Array.from(indicesToRemove).sort((a, b) => b - a);
    for (const idx of sortedIndicesToRemove) {
      entries.splice(idx, 1);
    }
    
    // Save the file
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8');
    
    return mergedCount;
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
    return 0;
  }
}

/**
 * Merge duplicated words from duplicated-words.json (across files)
 */
function mergeDuplicatedWordsAcrossFiles(limit: number | undefined = undefined, skipFind: boolean = false): MergeResult[] {
  const duplicatedWordsPath = path.join(__dirname, './duplicated-words.json');
  
  // If file doesn't exist or skipFind is false, run find first
  if (!fs.existsSync(duplicatedWordsPath) || !skipFind) {
    if (!skipFind) {
      console.log('Finding duplicated words across files first...\n');
      const results = findDuplicatedWordsAcrossFiles();
      
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
    console.log(`Merging ${mergingCount} of ${totalWords} duplicated words across files (limit: ${limit})...\n`);
  } else {
    console.log(`Merging all ${mergingCount} duplicated words across files...\n`);
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
 * Merge duplicated words (both across files and within files)
 */
function mergeAllDuplicatedWords(limit: number | undefined = undefined): { acrossFiles: MergeResult[]; withinFiles: number } {
  console.log('='.repeat(60));
  console.log('Finding and merging all duplicated words');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Merge duplicates across files
  console.log('Step 1: Merging duplicates across different files...\n');
  const acrossFilesResults = mergeDuplicatedWordsAcrossFiles(limit, false);

  // Step 2: Find and merge duplicates within files
  console.log('\n' + '='.repeat(60));
  console.log('Step 2: Merging duplicates within the same files...\n');
  
  const withinFilesDuplicates = findDuplicatedWordsWithinFiles();
  const duplicatesToProcess = limit ? withinFilesDuplicates.slice(0, limit) : withinFilesDuplicates;
  
  console.log(`Found ${withinFilesDuplicates.length} duplicate words within files.`);
  if (limit) {
    console.log(`Processing first ${duplicatesToProcess.length}...\n`);
  } else {
    console.log(`Processing all...\n`);
  }

  // Group by file
  const byFile = new Map<string, InternalDuplicateInfo[]>();
  for (const dup of duplicatesToProcess) {
    if (!byFile.has(dup.fileName)) {
      byFile.set(dup.fileName, []);
    }
    byFile.get(dup.fileName)!.push(dup);
  }

  let totalMergedWithinFiles = 0;
  for (const [fileName, fileDups] of byFile.entries()) {
    console.log(`Processing ${fileName}...`);
    const merged = mergeDuplicatesInFile(fileName, fileDups);
    totalMergedWithinFiles += merged;
    console.log(`  ✓ Merged ${merged} duplicate word(s)\n`);
  }

  return {
    acrossFiles: acrossFilesResults,
    withinFiles: totalMergedWithinFiles
  };
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'find';
  const limit = args[1] ? parseInt(args[1], 10) : undefined;

  if (mode === 'merge') {
    if (limit && (isNaN(limit) || limit < 1)) {
      console.error('Error: Limit must be a positive number');
      process.exit(1);
    }

    // Find and merge all duplicates (across files and within files)
    const results = mergeAllDuplicatedWords(limit);

    // Save merge report
    const reportPath = path.join(__dirname, './merge-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      acrossFiles: results.acrossFiles,
      withinFiles: {
        totalMerged: results.withinFiles
      }
    }, null, 2), 'utf-8');

    console.log(`\n` + '='.repeat(60));
    console.log('Merge completed!');
    console.log('='.repeat(60));
    console.log(`Words merged across files: ${results.acrossFiles.length}`);
    console.log(`Words merged within files: ${results.withinFiles}`);
    console.log(`Report saved to: ${reportPath}`);
    console.log(`\n⚠️  Note: You need to regenerate the database for changes to take effect.`);
  } else {
    console.log('='.repeat(60));
    console.log('Finding duplicated words (across files and within files)');
    console.log('='.repeat(60));
    console.log();

    const { acrossFiles, withinFiles } = findDuplicatedWords();

    // Output to JSON file
    const outputPath = path.join(__dirname, './duplicated-words.json');
    fs.writeFileSync(outputPath, JSON.stringify(acrossFiles, null, 2), 'utf-8');

    const internalOutputPath = path.join(__dirname, './internal-duplicates.json');
    fs.writeFileSync(internalOutputPath, JSON.stringify(withinFiles, null, 2), 'utf-8');

    console.log(`\nResults saved to:`);
    console.log(`  - ${outputPath} (duplicates across files)`);
    console.log(`  - ${internalOutputPath} (duplicates within files)`);
    console.log(`\nTotal duplicated words across files: ${acrossFiles.length}`);
    console.log(`Total duplicated words within files: ${withinFiles.length}`);

    // Show statistics for across files
    if (acrossFiles.length > 0) {
      const fileCounts = new Map<number, number>();
      for (const result of acrossFiles) {
        const count = result.files.length;
        fileCounts.set(count, (fileCounts.get(count) || 0) + 1);
      }

      console.log('\nStatistics (across files):');
      console.log('Words by number of files they appear in:');
      const sortedCounts = Array.from(fileCounts.entries()).sort((a, b) => a[0] - b[0]);
      for (const [fileCount, wordCount] of sortedCounts) {
        console.log(`  ${fileCount} file(s): ${wordCount} word(s)`);
      }

      // Show sample results
      console.log('\nSample results - across files (first 10):');
      acrossFiles.slice(0, 10).forEach((entry, index) => {
        console.log(`  ${index + 1}. "${entry.word}" appears in: ${entry.files.join(', ')}`);
      });
      if (acrossFiles.length > 10) {
        console.log(`  ... and ${acrossFiles.length - 10} more`);
      }
    }

    // Show statistics for within files
    if (withinFiles.length > 0) {
      const byCount = new Map<number, number>();
      for (const dup of withinFiles) {
        byCount.set(dup.count, (byCount.get(dup.count) || 0) + 1);
      }
      
      console.log('\nStatistics (within files):');
      console.log('Duplicates by occurrence count:');
      const sortedCounts = Array.from(byCount.entries()).sort((a, b) => b[0] - a[0]);
      for (const [count, wordCount] of sortedCounts) {
        console.log(`  ${count} occurrence(s): ${wordCount} word(s)`);
      }
      
      console.log('\nSample results - within files (first 10):');
      withinFiles.slice(0, 10).forEach((dup, index) => {
        console.log(`  ${index + 1}. "${dup.word}" in ${dup.fileName}: appears ${dup.count} times`);
      });
      if (withinFiles.length > 10) {
        console.log(`  ... and ${withinFiles.length - 10} more`);
      }
    }

    if (acrossFiles.length === 0 && withinFiles.length === 0) {
      console.log('\n✓ No duplicated words found!');
    }
  }
}

// Run the script
main();

