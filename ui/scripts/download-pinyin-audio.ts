import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Pinyin chart data structure (same as in PinyinChart.tsx)
const pinyinData = {
  initials: ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'z', 'c', 's', 'zh', 'ch', 'sh', 'r', 'j', 'q', 'x', 'zero'],
  finals: ['a', 'o', 'e', 'i', 'er', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong', 'ia', 'iao', 'ie', 'iu', 'ian', 'in', 'iang', 'ing', 'iong', 'u', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'ueng', 'ü', 'üe', 'üan', 'ün'],
  syllables: {
    'b': { 'a': 'ba', 'o': 'bo', 'ai': 'bai', 'ei': 'bei', 'ao': 'bao', 'an': 'ban', 'en': 'ben', 'ang': 'bang', 'eng': 'beng', 'i': 'bi', 'iao': 'biao', 'ie': 'bie', 'ian': 'bian', 'in': 'bin', 'ing': 'bing', 'u': 'bu' },
    'p': { 'a': 'pa', 'o': 'po', 'ai': 'pai', 'ei': 'pei', 'ao': 'pao', 'ou': 'pou', 'an': 'pan', 'en': 'pen', 'ang': 'pang', 'eng': 'peng', 'i': 'pi', 'iao': 'piao', 'ie': 'pie', 'ian': 'pian', 'in': 'pin', 'ing': 'ping', 'u': 'pu' },
    'm': { 'a': 'ma', 'o': 'mo', 'e': 'me', 'ai': 'mai', 'ei': 'mei', 'ao': 'mao', 'ou': 'mou', 'an': 'man', 'en': 'men', 'ang': 'mang', 'eng': 'meng', 'i': 'mi', 'iao': 'miao', 'ie': 'mie', 'iu': 'miu', 'ian': 'mian', 'in': 'min', 'ing': 'ming', 'u': 'mu' },
    'f': { 'a': 'fa', 'o': 'fo', 'ei': 'fei', 'ou': 'fou', 'an': 'fan', 'en': 'fen', 'ang': 'fang', 'eng': 'feng', 'u': 'fu' },
    'd': { 'a': 'da', 'e': 'de', 'ai': 'dai', 'ei': 'dei', 'ao': 'dao', 'ou': 'dou', 'an': 'dan', 'en': 'den', 'ang': 'dang', 'eng': 'deng', 'ong': 'dong', 'i': 'di', 'iao': 'diao', 'ie': 'die', 'iu': 'diu', 'ian': 'dian', 'ing': 'ding', 'u': 'du', 'uo': 'duo', 'ui': 'dui', 'uan': 'duan', 'un': 'dun' },
    't': { 'a': 'ta', 'e': 'te', 'ai': 'tai', 'ei': 'tei', 'ao': 'tao', 'ou': 'tou', 'an': 'tan', 'ang': 'tang', 'eng': 'teng', 'ong': 'tong', 'i': 'ti', 'iao': 'tiao', 'ie': 'tie', 'ian': 'tian', 'ing': 'ting', 'u': 'tu', 'uo': 'tuo', 'ui': 'tui', 'uan': 'tuan', 'un': 'tun' },
    'n': { 'a': 'na', 'e': 'ne', 'ai': 'nai', 'ei': 'nei', 'ao': 'nao', 'ou': 'nou', 'an': 'nan', 'en': 'nen', 'ang': 'nang', 'eng': 'neng', 'ong': 'nong', 'i': 'ni', 'iao': 'niao', 'ie': 'nie', 'iu': 'niu', 'ian': 'nian', 'in': 'nin', 'iang': 'niang', 'ing': 'ning', 'u': 'nu', 'uo': 'nuo', 'uan': 'nuan', 'ü': 'nü', 'üe': 'nüe' },
    'l': { 'a': 'la', 'e': 'le', 'ai': 'lai', 'ei': 'lei', 'ao': 'lao', 'ou': 'lou', 'an': 'lan', 'ang': 'lang', 'eng': 'leng', 'ong': 'long', 'i': 'li', 'ia': 'lia', 'iao': 'liao', 'ie': 'lie', 'iu': 'liu', 'ian': 'lian', 'in': 'lin', 'iang': 'liang', 'ing': 'ling', 'u': 'lu', 'uo': 'luo', 'uan': 'luan', 'un': 'lun', 'ü': 'lü', 'üe': 'lüe' },
    'g': { 'a': 'ga', 'e': 'ge', 'ai': 'gai', 'ei': 'gei', 'ao': 'gao', 'ou': 'gou', 'an': 'gan', 'en': 'gen', 'ang': 'gang', 'eng': 'geng', 'ong': 'gong', 'u': 'gu', 'ua': 'gua', 'uo': 'guo', 'uai': 'guai', 'ui': 'gui', 'uan': 'guan', 'un': 'gun', 'uang': 'guang' },
    'k': { 'a': 'ka', 'e': 'ke', 'ai': 'kai', 'ei': 'kei', 'ao': 'kao', 'ou': 'kou', 'an': 'kan', 'en': 'ken', 'ang': 'kang', 'eng': 'keng', 'ong': 'kong', 'u': 'ku', 'ua': 'kua', 'uo': 'kuo', 'uai': 'kuai', 'ui': 'kui', 'uan': 'kuan', 'un': 'kun', 'uang': 'kuang' },
    'h': { 'a': 'ha', 'e': 'he', 'ai': 'hai', 'ei': 'hei', 'ao': 'hao', 'ou': 'hou', 'an': 'han', 'en': 'hen', 'ang': 'hang', 'eng': 'heng', 'ong': 'hong', 'u': 'hu', 'ua': 'hua', 'uo': 'huo', 'uai': 'huai', 'ui': 'hui', 'uan': 'huan', 'un': 'hun', 'uang': 'huang' },
    'z': { 'a': 'za', 'e': 'ze', 'i': 'zi', 'ai': 'zai', 'ei': 'zei', 'ao': 'zao', 'ou': 'zou', 'an': 'zan', 'en': 'zen', 'ang': 'zang', 'eng': 'zeng', 'ong': 'zong', 'u': 'zu', 'uo': 'zuo', 'ui': 'zui', 'uan': 'zuan', 'un': 'zun' },
    'c': { 'a': 'ca', 'e': 'ce', 'i': 'ci', 'ai': 'cai', 'ao': 'cao', 'ou': 'cou', 'an': 'can', 'en': 'cen', 'ang': 'cang', 'eng': 'ceng', 'ong': 'cong', 'u': 'cu', 'uo': 'cuo', 'ui': 'cui', 'uan': 'cuan', 'un': 'cun' },
    's': { 'a': 'sa', 'e': 'se', 'i': 'si', 'ai': 'sai', 'ao': 'sao', 'ou': 'sou', 'an': 'san', 'en': 'sen', 'ang': 'sang', 'eng': 'seng', 'ong': 'song', 'u': 'su', 'uo': 'suo', 'ui': 'sui', 'uan': 'suan', 'un': 'sun' },
    'zh': { 'a': 'zha', 'e': 'zhe', 'i': 'zhi', 'ai': 'zhai', 'ei': 'zhei', 'ao': 'zhao', 'ou': 'zhou', 'an': 'zhan', 'en': 'zhen', 'ang': 'zhang', 'eng': 'zheng', 'ong': 'zhong', 'u': 'zhu', 'ua': 'zhua', 'uo': 'zhuo', 'uai': 'zhuai', 'ui': 'zhui', 'uan': 'zhuan', 'un': 'zhun', 'uang': 'zhuang' },
    'ch': { 'a': 'cha', 'e': 'che', 'i': 'chi', 'ai': 'chai', 'ao': 'chao', 'ou': 'chou', 'an': 'chan', 'en': 'chen', 'ang': 'chang', 'eng': 'cheng', 'ong': 'chong', 'u': 'chu', 'ua': 'chua', 'uo': 'chuo', 'uai': 'chuai', 'ui': 'chui', 'uan': 'chuan', 'un': 'chun', 'uang': 'chuang' },
    'sh': { 'a': 'sha', 'e': 'she', 'i': 'shi', 'ai': 'shai', 'ei': 'shei', 'ao': 'shao', 'ou': 'shou', 'an': 'shan', 'en': 'shen', 'ang': 'shang', 'eng': 'sheng', 'u': 'shu', 'ua': 'shua', 'uo': 'shuo', 'uai': 'shuai', 'ui': 'shui', 'uan': 'shuan', 'un': 'shun', 'uang': 'shuang' },
    'r': { 'e': 're', 'i': 'ri', 'ao': 'rao', 'ou': 'rou', 'an': 'ran', 'en': 'ren', 'ang': 'rang', 'eng': 'reng', 'ong': 'rong', 'u': 'ru', 'ua': 'rua', 'uo': 'ruo', 'ui': 'rui', 'uan': 'ruan', 'un': 'run' },
    'j': { 'i': 'ji', 'ia': 'jia', 'iao': 'jiao', 'ie': 'jie', 'iu': 'jiu', 'ian': 'jian', 'in': 'jin', 'iang': 'jiang', 'ing': 'jing', 'iong': 'jiong', 'ü': 'ju', 'üe': 'jue', 'üan': 'juan', 'ün': 'jun' },
    'q': { 'i': 'qi', 'ia': 'qia', 'iao': 'qiao', 'ie': 'qie', 'iu': 'qiu', 'ian': 'qian', 'in': 'qin', 'iang': 'qiang', 'ing': 'qing', 'iong': 'qiong', 'ü': 'qu', 'üe': 'que', 'üan': 'quan', 'ün': 'qun' },
    'x': { 'i': 'xi', 'ia': 'xia', 'iao': 'xiao', 'ie': 'xie', 'iu': 'xiu', 'ian': 'xian', 'in': 'xin', 'iang': 'xiang', 'ing': 'xing', 'iong': 'xiong', 'ü': 'xu', 'üe': 'xue', 'üan': 'xuan', 'ün': 'xun' },
    'zero': { 'a': 'a', 'o': 'o', 'e': 'e', 'er': 'er', 'ai': 'ai', 'ao': 'ao', 'ou': 'ou', 'an': 'an', 'en': 'en', 'ang': 'ang', 'eng': 'eng', 'i': 'yi', 'ia': 'ya', 'iao': 'yao', 'ie': 'ye', 'iu': 'you', 'ian': 'yan', 'in': 'yin', 'iang': 'yang', 'ing': 'ying', 'iong': 'yong', 'u': 'wu', 'ua': 'wa', 'uo': 'wo', 'uai': 'wai', 'ui': 'wei', 'uan': 'wan', 'un': 'wen', 'uang': 'wang', 'ueng': 'weng', 'ü': 'yu', 'üe': 'yue', 'üan': 'yuan', 'ün': 'yun' },
  }
};

// Base URL for Yabla audio files
const BASE_URL = 'https://yabla.b-cdn.net/media.yabla.com/chinese_static/audio/alicia';

// Output directory - use public folder so Next.js can serve the files
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'pinyin');

// Delay between requests to avoid overwhelming the server
const DELAY_MS = 100;

// Helper function to convert ü to v for file paths
// Yabla CDN uses 'v' instead of 'ü' in filenames
// e.g., nü → nv, nüe → nve
function syllableToFileName(syllable: string): string {
  return syllable.replace(/ü/g, 'v');
}

// Helper function to get all syllables from the pinyin data
function getAllSyllables(): string[] {
  const syllables = new Set<string>();
  
  for (const [initial, finals] of Object.entries(pinyinData.syllables)) {
    for (const syllable of Object.values(finals)) {
      if (syllable) {
        syllables.add(syllable);
      }
    }
  }
  
  return Array.from(syllables).sort();
}

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
  console.log('Starting Pinyin audio download...');
  
  // Create output directory if it doesn't exist
  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`Output directory: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('Error creating output directory:', error);
    process.exit(1);
  }
  
  // Get all syllables
  const syllables = getAllSyllables();
  console.log(`Found ${syllables.length} unique syllables`);
  
  let downloaded = 0;
  let skipped = 0;
  let errors = 0;
  
  // Download all tone variations for each syllable
  for (const syllable of syllables) {
    for (let tone = 1; tone <= 4; tone++) {
      // Convert ü to v for both URL and file path (Yabla CDN uses 'v' instead of 'ü')
      const fileName = `${syllableToFileName(syllable)}${tone}.mp3`;
      const url = `${BASE_URL}/${fileName}`;
      const filePath = path.join(OUTPUT_DIR, fileName);
      
      // Skip if file already exists
      if (fs.existsSync(filePath)) {
        console.log(`Skipping ${fileName} (already exists)`);
        skipped++;
        continue;
      }
      
      console.log(`Downloading ${fileName}...`);
      const success = await downloadFile(url, filePath);
      
      if (success) {
        downloaded++;
        console.log(`✓ Downloaded ${fileName}`);
      } else {
        errors++;
        console.log(`✗ Failed to download ${fileName} (404 or error)`);
      }
      
      // Delay between requests
      await sleep(DELAY_MS);
    }
  }
  
  console.log('\n=== Download Summary ===');
  console.log(`Total syllables: ${syllables.length}`);
  console.log(`Total files attempted: ${syllables.length * 4}`);
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

