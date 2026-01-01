'use client';

import { useState, useMemo, useRef, useEffect } from 'react';

interface PinyinChartProps {
  locale: 'en' | 'vi' | 'zh';
}

interface ToneData {
  tone: string;
  toneNumber: number;
  audioPath: string | null;
}

// Pinyin chart data structure
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

// Helper function to get all syllables from pinyin data
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

// Helper function to convert ü to v for file paths
// Yabla CDN and file system use 'v' instead of 'ü' in filenames
// e.g., nü → nv, nüe → nve
function syllableToFileName(syllable: string): string {
  return syllable.replace(/ü/g, 'v');
}

// Generate audio paths for all syllables
// Files are stored in public/audio/pinyin-chart/{syllable}{tone}.mp3
// Note: syllables with ü are stored with 'v' instead (e.g., nü → nv)
// In Next.js, these should be accessible at /audio/pinyin-chart/{syllable}{tone}.mp3
function generateToneAudioData(): Record<string, { 1: string | null; 2: string | null; 3: string | null; 4: string | null }> {
  const syllables = getAllSyllables();
  const audioData: Record<string, { 1: string | null; 2: string | null; 3: string | null; 4: string | null }> = {};
  
  for (const syllable of syllables) {
    // Convert ü to v for file paths
    const fileName = syllableToFileName(syllable);
    audioData[syllable] = {
      1: `/audio/pinyin-chart/${fileName}1.mp3`,
      2: `/audio/pinyin-chart/${fileName}2.mp3`,
      3: `/audio/pinyin-chart/${fileName}3.mp3`,
      4: `/audio/pinyin-chart/${fileName}4.mp3`,
    };
  }
  
  return audioData;
}

// Generate tone audio data for all syllables
const toneAudioData = generateToneAudioData();

// Helper function to get audio path for a tone
function getToneAudioPath(syllable: string, tone: number): string | null {
  const audioData = toneAudioData[syllable];
  if (!audioData) return null;
  return audioData[tone as 1 | 2 | 3 | 4] || null;
}

const translations = {
  en: {
    title: 'Complete Pinyin Pronunciation Chart',
    intro: 'This comprehensive chart shows all valid combinations of Pinyin initials (声母) and finals (韵母) in Mandarin Chinese. Find the intersection of an initial (row) and final (column) to see the resulting syllable.',
    howToUse: 'How to use this chart:',
    initials: 'Initials (声母):',
    finals: 'Finals (韵母):',
    emptyCells: 'Empty cells:',
    specialCases: 'Special cases:',
    note: 'Note:',
    legend: 'Legend:',
    zeroInitial: '(zero)',
    emptyCellDesc: 'Empty cells indicate invalid combinations',
    zeroRowDesc: '(zero) row represents syllables that start with vowels (written as y or w)',
    jqxDesc: 'For j, q, x with ü, the umlaut is omitted (e.g., ju = jü)',
    zcsDesc: 'z, c, s, zh, ch, sh, r with i form special syllables (e.g., zi, ci, si)',
    toneNote: 'This chart shows the basic syllables without tone marks. Each syllable can be pronounced with four tones (plus neutral tone) in Mandarin Chinese.',
    initialsList: 'Listed vertically on the left (b, p, m, f, d, t, n, l, g, k, h, z, c, s, zh, ch, sh, r, j, q, x)',
    finalsList: 'Listed horizontally at the top (a, o, e, i, u, ü, and their combinations)',
    emptyCellsDesc: 'Indicate combinations that do not exist in standard Pinyin',
    jqxSpecial: 'j, q, x combine with ü but the umlaut is omitted in writing (e.g., ju, jue, juan, jun)',
    zcsSpecial: 'z, c, s, zh, ch, sh, r combine with i to form special syllables (e.g., zi, ci, si, zhi, chi, shi, ri)',
    standaloneVowels: 'Standalone vowels i, u, ü are written as yi, wu, yu when they appear alone',
  },
  vi: {
    title: 'Bảng phát âm Pinyin đầy đủ',
    intro: 'Bảng toàn diện này hiển thị tất cả các kết hợp hợp lệ của thanh mẫu (声母) và vận mẫu (韵母) trong tiếng Trung Quốc. Tìm giao điểm của thanh mẫu (hàng) và vận mẫu (cột) để xem âm tiết kết quả.',
    howToUse: 'Cách sử dụng bảng này:',
    initials: 'Thanh mẫu (声母):',
    finals: 'Vận mẫu (韵母):',
    emptyCells: 'Ô trống:',
    specialCases: 'Trường hợp đặc biệt:',
    note: 'Lưu ý:',
    legend: 'Chú giải:',
    zeroInitial: '(zero)',
    emptyCellDesc: 'Ô trống chỉ ra các kết hợp không hợp lệ',
    zeroRowDesc: 'Hàng (zero) đại diện cho các âm tiết bắt đầu bằng nguyên âm (viết là y hoặc w)',
    jqxDesc: 'Đối với j, q, x với ü, dấu umlaut bị bỏ qua (ví dụ: ju = jü)',
    zcsDesc: 'z, c, s, zh, ch, sh, r với i tạo thành các âm tiết đặc biệt (ví dụ: zi, ci, si)',
    toneNote: 'Bảng này hiển thị các âm tiết cơ bản không có dấu thanh. Mỗi âm tiết có thể được phát âm với bốn thanh điệu (cộng với thanh trung tính) trong tiếng Trung Quốc.',
    initialsList: 'Liệt kê theo chiều dọc ở bên trái (b, p, m, f, d, t, n, l, g, k, h, z, c, s, zh, ch, sh, r, j, q, x)',
    finalsList: 'Liệt kê theo chiều ngang ở phía trên (a, o, e, i, u, ü, và các kết hợp của chúng)',
    emptyCellsDesc: 'Chỉ ra các kết hợp không tồn tại trong Pinyin chuẩn',
    jqxSpecial: 'j, q, x kết hợp với ü nhưng dấu umlaut bị bỏ qua khi viết (ví dụ: ju, jue, juan, jun)',
    zcsSpecial: 'z, c, s, zh, ch, sh, r kết hợp với i để tạo thành các âm tiết đặc biệt (ví dụ: zi, ci, si, zhi, chi, shi, ri)',
    standaloneVowels: 'Các nguyên âm đơn lẻ i, u, ü được viết thành yi, wu, yu khi đứng một mình',
  },
  zh: {
    title: '完整拼音发音表',
    intro: '此综合表显示了中文中所有有效的拼音声母和韵母组合。找到声母（行）和韵母（列）的交集以查看结果音节。',
    howToUse: '如何使用此表：',
    initials: '声母：',
    finals: '韵母：',
    emptyCells: '空单元格：',
    specialCases: '特殊情况：',
    note: '注意：',
    legend: '图例：',
    zeroInitial: '(zero)',
    emptyCellDesc: '空单元格表示无效组合',
    zeroRowDesc: '(zero)行表示以元音开头的音节（写作y或w）',
    jqxDesc: '对于j, q, x与ü，省略变音符号（例如：ju = jü）',
    zcsDesc: 'z, c, s, zh, ch, sh, r与i形成特殊音节（例如：zi, ci, si）',
    toneNote: '此表显示不带声调标记的基本音节。每个音节在中文中可以用四个声调（加上轻声）发音。',
    initialsList: '在左侧垂直列出（b, p, m, f, d, t, n, l, g, k, h, z, c, s, zh, ch, sh, r, j, q, x）',
    finalsList: '在顶部水平列出（a, o, e, i, u, ü及其组合）',
    emptyCellsDesc: '表示标准拼音中不存在的组合',
    jqxSpecial: 'j, q, x与ü组合时，书写时省略变音符号（例如：ju, jue, juan, jun）',
    zcsSpecial: 'z, c, s, zh, ch, sh, r与i组合形成特殊音节（例如：zi, ci, si, zhi, chi, shi, ri）',
    standaloneVowels: '单独的元音i, u, ü单独出现时写作yi, wu, yu',
  },
};

// Function to add tone marks to a syllable
function addToneMark(syllable: string, tone: number): string {
  if (!syllable || tone < 1 || tone > 4) return syllable;
  
  const toneMarks: Record<string, string[]> = {
    'a': ['ā', 'á', 'ǎ', 'à'],
    'e': ['ē', 'é', 'ě', 'è'],
    'i': ['ī', 'í', 'ǐ', 'ì'],
    'o': ['ō', 'ó', 'ǒ', 'ò'],
    'u': ['ū', 'ú', 'ǔ', 'ù'],
    'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
  };
  
  // Find where to place the tone mark
  // Priority: a > e > o (in ou/uo) > o > last vowel (i, u, ü)
  let toneIndex = -1;
  let vowelToMark = '';
  
  // Check for 'a' first
  const aIndex = syllable.indexOf('a');
  if (aIndex !== -1) {
    toneIndex = aIndex;
    vowelToMark = 'a';
  } else {
    // Check for 'e'
    const eIndex = syllable.indexOf('e');
    if (eIndex !== -1) {
      toneIndex = eIndex;
      vowelToMark = 'e';
    } else {
      // Check for 'ou' or 'uo' - mark goes on 'o'
      const ouIndex = syllable.indexOf('ou');
      const uoIndex = syllable.indexOf('uo');
      if (ouIndex !== -1) {
        toneIndex = ouIndex;
        vowelToMark = 'o';
      } else if (uoIndex !== -1) {
        toneIndex = uoIndex + 1; // 'o' is after 'u' in 'uo'
        vowelToMark = 'o';
      } else {
        // Check for 'o'
        const oIndex = syllable.indexOf('o');
        if (oIndex !== -1) {
          toneIndex = oIndex;
          vowelToMark = 'o';
        } else {
          // Find last vowel (i, u, ü)
          const vowels = ['i', 'u', 'ü'];
          for (let i = syllable.length - 1; i >= 0; i--) {
            const char = syllable[i];
            if (vowels.includes(char)) {
              toneIndex = i;
              vowelToMark = char;
              break;
            }
          }
        }
      }
    }
  }
  
  if (toneIndex === -1 || !vowelToMark) return syllable;
  
  // Replace the vowel with the toned version
  const before = syllable.substring(0, toneIndex);
  const after = syllable.substring(toneIndex + 1);
  const tonedVowel = toneMarks[vowelToMark][tone - 1] || vowelToMark;
  
  return before + tonedVowel + after;
}

// Function to get all tones for a syllable with audio data
function getAllTones(syllable: string): ToneData[] {
  if (!syllable) return [];
  return [
    {
      tone: addToneMark(syllable, 1),
      toneNumber: 1,
      audioPath: getToneAudioPath(syllable, 1),
    },
    {
      tone: addToneMark(syllable, 2),
      toneNumber: 2,
      audioPath: getToneAudioPath(syllable, 2),
    },
    {
      tone: addToneMark(syllable, 3),
      toneNumber: 3,
      audioPath: getToneAudioPath(syllable, 3),
    },
    {
      tone: addToneMark(syllable, 4),
      toneNumber: 4,
      audioPath: getToneAudioPath(syllable, 4),
    },
  ];
}

export default function PinyinChart({ locale }: PinyinChartProps) {
  const t = translations[locale];
  const [hoveredCell, setHoveredCell] = useState<{ initial: string; final: string } | null>(null);
  const [clickedCell, setClickedCell] = useState<{ initial: string; final: string } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const getSyllable = (initial: string, final: string): string | null => {
    if (initial === 'zero') {
      const zeroSyllables = pinyinData.syllables.zero;
      return zeroSyllables[final as keyof typeof zeroSyllables] || null;
    }
    const initialSyllables = pinyinData.syllables[initial as keyof typeof pinyinData.syllables];
    if (!initialSyllables) return null;
    return initialSyllables[final as keyof typeof initialSyllables] || null;
  };

  const displayInitial = (initial: string): string => {
    if (initial === 'zero') return '';
    return initial;
  };

  const handleCellMouseEnter = (initial: string, final: string) => {
    const syllable = getSyllable(initial, final);
    if (syllable) {
      // Only update if different to avoid unnecessary re-renders
      setHoveredCell(prev => {
        if (prev?.initial === initial && prev?.final === final) {
          return prev; // Same cell, no update needed
        }
        return { initial, final };
      });
    } else {
      // Clear hover immediately when entering an empty cell
      setHoveredCell(null);
    }
  };

  const handleCellMouseLeave = () => {
    // Only clear hover state, not clicked state
    setHoveredCell(null);
  };

  const handleCellClick = (initial: string, final: string, event: React.MouseEvent<HTMLTableCellElement>) => {
    const syllable = getSyllable(initial, final);
    if (syllable) {
      // Toggle popup: if clicking the same cell, close it; otherwise, open it
      if (clickedCell?.initial === initial && clickedCell?.final === final) {
        setClickedCell(null);
        setTooltipPosition(null);
      } else {
        setClickedCell({ initial, final });
        const rect = event.currentTarget.getBoundingClientRect();
        // Use viewport coordinates for tooltip positioning
        setTooltipPosition({
          x: rect.left + rect.width / 2,
          y: rect.top,
        });
      }
    }
  };

  const handleTooltipMouseEnter = () => {
    // Keep clicked state when mouse enters tooltip
  };

  const handleTooltipMouseLeave = () => {
    // Don't clear on tooltip mouse leave - let user click to close
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside the tooltip and table cells
      if (!target.closest('.pinyin-tooltip') && !target.closest('td')) {
        setClickedCell(null);
        setTooltipPosition(null);
      }
    };

    if (clickedCell) {
      document.addEventListener('click', handleDocumentClick);
      return () => {
        document.removeEventListener('click', handleDocumentClick);
      };
    }
  }, [clickedCell]);

  // Use clickedCell for popup, hoveredCell for highlighting
  const popupSyllable = clickedCell ? getSyllable(clickedCell.initial, clickedCell.final) : null;
  const allTones = popupSyllable ? getAllTones(popupSyllable) : [];
  
  // For highlighting, use hoveredCell if available, otherwise use clickedCell
  // Row/column highlights only show when hovering (not just clicked)
  // Memoize these calculations to avoid recalculating on every render
  const highlightCell = useMemo(() => hoveredCell || clickedCell, [hoveredCell, clickedCell]);
  const showRowColumnHighlights = useMemo(() => hoveredCell !== null, [hoveredCell]);

  const handlePlayTone = (toneData: ToneData, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!toneData.audioPath) return; // No audio file available yet
    
    const audioKey = `${popupSyllable}_${toneData.toneNumber}`;
    
    // Stop any currently playing audio
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    // Play the selected tone
    if (!audioRefs.current[audioKey]) {
      audioRefs.current[audioKey] = new Audio(toneData.audioPath);
    }
    
    const audio = audioRefs.current[audioKey];
    audio.currentTime = 0;
    audio.play().catch(err => {
      console.error('Error playing audio:', err);
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 sm:p-5 md:p-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
        {t.title}
      </h2>

      <div className="mb-6 space-y-4 text-gray-700">
        <p>{t.intro}</p>
        
        <div>
          <p className="font-semibold mb-2">{t.howToUse}</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>{t.initials}</strong> {t.initialsList}</li>
            <li><strong>{t.finals}</strong> {t.finalsList}</li>
            <li><strong>{t.emptyCells}</strong> {t.emptyCellsDesc}</li>
            <li><strong>{t.specialCases}</strong>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>{t.jqxSpecial}</li>
                <li>{t.zcsSpecial}</li>
                <li>{t.standaloneVowels}</li>
              </ul>
            </li>
          </ul>
        </div>

        <p className="text-sm italic"><strong>{t.note}</strong> {t.toneNote}</p>
      </div>

      {/* Table with horizontal scroll */}
      <div className="mb-6 overflow-x-auto -mx-4 sm:mx-0 relative">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-1 py-1.5 text-left text-[10px] font-semibold text-gray-900 sticky left-0 z-10 whitespace-nowrap bg-gray-50"
                  >
                  </th>
                  {pinyinData.finals.map((final) => {
                    // Only highlight column header when hovering (not just clicked)
                    const isHoveredColumn = showRowColumnHighlights && highlightCell?.final === final;
                    return (
                      <th 
                        key={final} 
                        scope="col" 
                        className={`px-1 py-1.5 text-center text-[10px] font-semibold text-gray-900 whitespace-nowrap ${
                          isHoveredColumn ? 'bg-teal-100' : 'bg-gray-50'
                        }`}
                      >
                        {final}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {pinyinData.initials.map((initial) => {
                  // Only highlight row when hovering (not just clicked)
                  const isHoveredRow = showRowColumnHighlights && highlightCell?.initial === initial;
                  return (
                    <tr 
                      key={initial} 
                      className={isHoveredRow ? 'bg-teal-100' : ''}
                    >
                      <td className={`px-1 py-1.5 text-xs font-semibold text-gray-900 sticky left-0 z-10 whitespace-nowrap ${
                        isHoveredRow ? 'bg-teal-100' : 'bg-white'
                      }`}>
                        {displayInitial(initial)}
                      </td>
                      {pinyinData.finals.map((final) => {
                        const syllable = getSyllable(initial, final);
                        const isHighlightedCell = highlightCell?.initial === initial && highlightCell?.final === final;
                        const isClickedCell = clickedCell?.initial === initial && clickedCell?.final === final;
                        // Only highlight row/column when hovering (not just clicked)
                        const isHoveredColumn = showRowColumnHighlights && highlightCell?.final === final;
                        const isHoveredRow = showRowColumnHighlights && highlightCell?.initial === initial;
                        
                        // Determine background color with proper emphasis:
                        // - Clicked cell: darkest (bg-teal-400)
                        // - Hovered cell: medium (bg-teal-300)
                        // - Row and column cells: same color (bg-teal-100) - only when hovering
                        let bgColor = '';
                        if (isClickedCell) {
                          bgColor = 'bg-teal-400 font-semibold text-white'; // Most emphasized - the clicked cell
                        } else if (isHighlightedCell && hoveredCell) {
                          bgColor = 'bg-teal-300 font-semibold text-white'; // Hovered cell
                        } else if (isHoveredRow || isHoveredColumn) {
                          bgColor = 'bg-teal-100'; // Row or column highlight - same color (only when hovering)
                        }
                        
                        return (
                          <td 
                            key={final} 
                            className={`px-1 py-1.5 text-xs text-center whitespace-nowrap cursor-pointer relative ${
                              (isClickedCell || (isHighlightedCell && hoveredCell)) ? 'text-white' : 'text-gray-900'
                            } ${bgColor}`}
                            onMouseEnter={() => handleCellMouseEnter(initial, final)}
                            onMouseLeave={handleCellMouseLeave}
                            onClick={(e) => handleCellClick(initial, final, e)}
                          >
                            {syllable || ''}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Tooltip showing all tones */}
        {popupSyllable && tooltipPosition && allTones.length > 0 && (
          <div
            className="pinyin-tooltip fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl border border-gray-700"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y - 10}px`,
              transform: 'translate(-50%, -100%)',
            }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] font-semibold mb-1.5 text-gray-300 uppercase tracking-wide">
              {popupSyllable}
            </div>
            <div className="flex flex-col gap-1.5">
              {allTones.map((toneData, index) => (
                <div key={index} className="flex items-center gap-1.5 text-sm font-semibold">
                  <span className="text-teal-300">{toneData.tone}</span>
                  <button
                    onClick={(e) => handlePlayTone(toneData, e)}
                    className={`p-0.5 rounded transition-colors ${
                      toneData.audioPath
                        ? 'text-teal-300 hover:text-teal-200 hover:bg-gray-800 cursor-pointer'
                        : 'text-gray-600 cursor-not-allowed opacity-50'
                    }`}
                    title={toneData.audioPath ? `Play ${toneData.tone}` : 'Audio not available'}
                    disabled={!toneData.audioPath}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.legend}</h3>
        <ul className="list-disc ml-6 space-y-1 text-gray-700">
          <li>{t.emptyCellDesc}</li>
          <li>{t.zeroRowDesc}</li>
          <li>{t.jqxDesc}</li>
          <li>{t.zcsDesc}</li>
        </ul>
      </div>
    </div>
  );
}

