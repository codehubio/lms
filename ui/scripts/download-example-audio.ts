import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Base URL for Yabla audio files (same as pinyin-chart)
const BASE_URL = 'https://yabla.b-cdn.net/media.yabla.com/chinese_static/audio/alicia';

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'examples');

// Delay between requests to avoid overwhelming the server
const DELAY_MS = 100;

// Example words to download
const examples = [
  {
    paragraphId: 'pronunciation-c',
    files: [
      { fileName: 'ci4.mp3', word: '刺 (cì)' },
      { fileName: 'cao3.mp3', word: '草 (cǎo)' },
      { fileName: 'cong2.mp3', word: '从 (cóng)' },
    ],
  },
  {
    paragraphId: 'pronunciation-zh',
    files: [
      { fileName: 'zhi1.mp3', word: '知 (zhī)' },
      { fileName: 'zhe4.mp3', word: '这 (zhè)' },
      { fileName: 'zhong1.mp3', word: '中 (zhōng)' },
    ],
  },
  {
    paragraphId: 'pronunciation-ch',
    files: [
      { fileName: 'chi1.mp3', word: '吃 (chī)' },
      { fileName: 'che1.mp3', word: '车 (chē)' },
      { fileName: 'chang2.mp3', word: '长 (cháng)' },
    ],
  },
  {
    paragraphId: 'pronunciation-x',
    files: [
      { fileName: 'xi1.mp3', word: '西 (xī)' },
      { fileName: 'xiao3.mp3', word: '小 (xiǎo)' },
      { fileName: 'xue2.mp3', word: '学 (xué)' },
    ],
  },
  {
    paragraphId: 'pronunciation-q',
    files: [
      { fileName: 'qi1.mp3', word: '七 (qī)' },
      { fileName: 'qing3.mp3', word: '请 (qǐng)' },
      { fileName: 'qu4.mp3', word: '去 (qù)' },
    ],
  },
  {
    paragraphId: 'pronunciation-sh',
    files: [
      { fileName: 'shi1.mp3', word: '师 (shī)' },
      { fileName: 'shao3.mp3', word: '少 (shǎo)' },
      { fileName: 'shuo1.mp3', word: '说 (shuō)' },
    ],
  },
  {
    paragraphId: 'pronunciation-z',
    files: [
      { fileName: 'zi4.mp3', word: '字 (zì)' },
      { fileName: 'zao3.mp3', word: '早 (zǎo)' },
      { fileName: 'zuo4.mp3', word: '做 (zuò)' },
    ],
  },
  {
    paragraphId: 'pronunciation-s',
    files: [
      { fileName: 'si4.mp3', word: '四 (sì)' },
      { fileName: 'san1.mp3', word: '三 (sān)' },
      { fileName: 'song4.mp3', word: '送 (sòng)' },
    ],
  },
  {
    paragraphId: 'pronunciation-u',
    files: [
      { fileName: 'wu3.mp3', word: '五 (wǔ)' },
      { fileName: 'shu1.mp3', word: '书 (shū)' },
      { fileName: 'lu4.mp3', word: '路 (lù)' },
      { fileName: 'nv3.mp3', word: '女 (nǚ)' },
      { fileName: 'lv4.mp3', word: '绿 (lǜ)' },
      { fileName: 'yu3.mp3', word: '雨 (yǔ)' },
    ],
  },
  {
    paragraphId: 'pronunciation-i',
    files: [
      { fileName: 'yi1.mp3', word: '一 (yī)' },
      { fileName: 'li4.mp3', word: '力 (lì)' },
      { fileName: 'qi2.mp3', word: '棋 (qí)' },
      { fileName: 'zhi1.mp3', word: '知 (zhī)' },
      { fileName: 'chi1.mp3', word: '吃 (chī)' },
      { fileName: 'zi4.mp3', word: '字 (zì)' },
      { fileName: 'si4.mp3', word: '四 (sì)' },
      { fileName: 'ji1.mp3', word: '鸡 (jī)' },
      { fileName: 'xi1.mp3', word: '西 (xī)' },
    ],
  },
];

// Helper function to download a file
async function downloadFile(url: string, filePath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return false; // File doesn't exist
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await writeFile(filePath, buffer);
    return true;
  } catch (error) {
    console.error(`Error downloading ${url}:`, error);
    return false;
  }
}

// Helper function to sleep
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function
async function main() {
  console.log('Starting example audio download...');
  
  // Create output directory if it doesn't exist
  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`Output directory: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('Error creating output directory:', error);
    process.exit(1);
  }
  
  let downloaded = 0;
  let skipped = 0;
  let errors = 0;
  
  // Download files for each paragraph
  for (const example of examples) {
    const paragraphDir = path.join(OUTPUT_DIR, example.paragraphId);
    
    // Create paragraph directory if it doesn't exist
    try {
      await mkdir(paragraphDir, { recursive: true });
      console.log(`\nProcessing ${example.paragraphId}...`);
    } catch (error) {
      console.error(`Error creating directory for ${example.paragraphId}:`, error);
      continue;
    }
    
    // Download each file
    for (const file of example.files) {
      const url = `${BASE_URL}/${file.fileName}`;
      const filePath = path.join(paragraphDir, file.fileName);
      
      // Skip if file already exists
      if (fs.existsSync(filePath)) {
        console.log(`Skipping ${file.fileName} (already exists) - ${file.word}`);
        skipped++;
        continue;
      }
      
      console.log(`Downloading ${file.fileName}... (${file.word})`);
      const success = await downloadFile(url, filePath);
      
      if (success) {
        downloaded++;
        console.log(`✓ Downloaded ${file.fileName}`);
      } else {
        errors++;
        console.log(`✗ Failed to download ${file.fileName} (404 or error)`);
      }
      
      // Delay between requests
      await sleep(DELAY_MS);
    }
  }
  
  console.log('\n=== Download Summary ===');
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Failed/Not found: ${errors}`);
  console.log(`\nFiles saved to: ${OUTPUT_DIR}`);
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

