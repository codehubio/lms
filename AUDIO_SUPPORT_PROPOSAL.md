# Audio Support for Paragraph Examples - Implementation Proposal

## Overview

This document proposes a comprehensive approach to add audio support for example sentences in all paragraph JSON files (grammar and pronunciation entries).

## Current Structure Analysis

### Paragraph JSON Structure
- Each paragraph file contains:
  - `id`: Unique identifier
  - `title`: Entry title
  - `tags`: Array of tags (e.g., `["grammar"]`, `["pronunciation"]`)
  - `translation`: Multi-language translations
  - `data`: Array of content items, each containing:
    - `title.translation`: Section title
    - `body.translation`: Markdown content with examples
    - `placeholders`: Optional placeholder replacements

### Example Format in Body Text
Examples are embedded in markdown like:
```markdown
**Examples:**
- **如果**下雨，我**就**不去。 (If it rains, then I won't go.)
- **如果**你有时间，**就**来找我。 (If you have time, then come find me.)
```

## Proposed Solution

### Option 1: Separate Examples Array (Recommended)

Add a new `examples` field to each data item in paragraph JSON files.

#### JSON Structure Enhancement

```json
{
  "id": "ruguo-jiu",
  "title": "如果……就 - Conditional Sentences",
  "tags": ["grammar"],
  "translation": { ... },
  "data": [{
    "title": { ... },
    "body": { ... },
    "placeholders": [ ... ],
    "examples": [
      {
        "sentence": "如果下雨，我就不去。",
        "pinyin": "rúguǒ xià yǔ, wǒ jiù bù qù.",
        "translation": {
          "en": "If it rains, then I won't go.",
          "vi": "Nếu trời mưa, thì tôi sẽ không đi.",
          "zh": "如果下雨，我就不去。"
        },
        "audio": {
          "path": "/audio/paragraph/ruguo-jiu/example-1.mp3",
          "duration": 3.2
        }
      },
      {
        "sentence": "如果你有时间，就来找我。",
        "pinyin": "rúguǒ nǐ yǒu shíjiān, jiù lái zhǎo wǒ.",
        "translation": {
          "en": "If you have time, then come find me.",
          "vi": "Nếu bạn có thời gian, thì hãy đến tìm tôi.",
          "zh": "如果你有时间，就来找我。"
        },
        "audio": {
          "path": "/audio/paragraph/ruguo-jiu/example-2.mp3",
          "duration": 3.8
        }
      }
    ]
  }]
}
```

#### Advantages
- ✅ Clean separation of examples from markdown
- ✅ Easy to parse and render
- ✅ Supports structured metadata (pinyin, translations, audio)
- ✅ Can be displayed separately or embedded in markdown
- ✅ Easier to maintain and update
- ✅ Supports batch audio generation

#### Disadvantages
- ⚠️ Requires updating all paragraph JSON files
- ⚠️ Need to extract examples from existing markdown

---

### Option 2: Inline Audio Markers in Markdown

Add audio markers directly in the markdown body text.

#### JSON Structure Enhancement

```json
{
  "body": {
    "translation": {
      "en": "**Examples:**\n- **如果**下雨，我**就**不去。 [audio:/audio/paragraph/ruguo-jiu/example-1.mp3] (If it rains, then I won't go.)\n- **如果**你有时间，**就**来找我。 [audio:/audio/paragraph/ruguo-jiu/example-2.mp3] (If you have time, then come find me.)"
    }
  }
}
```

#### Advantages
- ✅ Minimal changes to existing structure
- ✅ Examples stay in context
- ✅ Backward compatible (audio markers optional)

#### Disadvantages
- ⚠️ Mixes content with metadata
- ⚠️ Harder to parse and extract
- ⚠️ Less structured for programmatic access

---

### Option 3: Hybrid Approach (Best of Both Worlds)

Keep examples in markdown for display, but add a separate `examples` array for audio metadata.

#### JSON Structure Enhancement

```json
{
  "data": [{
    "title": { ... },
    "body": { ... },
    "placeholders": [ ... ],
    "examples": [
      {
        "sentence": "如果下雨，我就不去。",
        "audio": "/audio/paragraph/ruguo-jiu/example-1.mp3",
        "matchPattern": "如果.*下雨.*就.*不去"  // Regex to match in markdown
      }
    ]
  }]
}
```

#### Advantages
- ✅ Maintains existing markdown structure
- ✅ Adds structured audio metadata
- ✅ Can auto-match examples in markdown
- ✅ Flexible: can use either source

#### Disadvantages
- ⚠️ More complex matching logic
- ⚠️ Potential for mismatches

---

## Recommended Approach: Option 1 (Separate Examples Array)

### Implementation Plan

#### Phase 1: JSON Schema Enhancement

1. **Add `examples` field to paragraph data items**
   - Each example should have:
     - `sentence`: Chinese sentence (required)
     - `pinyin`: Pinyin transcription (optional, can be auto-generated)
     - `translation`: Multi-language translations (optional)
     - `audio`: Audio file reference (optional initially)
     - `order`: Display order (optional)

2. **Example Structure:**
```typescript
interface ParagraphExample {
  sentence: string;           // Chinese sentence
  pinyin?: string;           // Pinyin (e.g., "rúguǒ xià yǔ")
  translation?: {
    en?: string;
    vi?: string;
    zh?: string;
  };
  audio?: {
    path: string;            // Audio file path (e.g., "/audio/paragraph/{id}/{filename}.mp3")
    duration?: number;        // Duration in seconds (optional)
  };
  order?: number;             // Display order (default: array index)
}
```

#### Phase 2: Audio File Organization

1. **Directory Structure:**
```
public/audio/
  ├── pinyin-chart/          # Existing
  │   └── ...
  └── paragraph/             # New
      ├── ruguo-jiu/
      │   ├── example-1.mp3
      │   ├── example-2.mp3
      │   └── example-3.mp3
      ├── adjunct/
      │   ├── example-1.mp3
      │   └── example-2.mp3
      └── ...
```

2. **Naming Convention:**
   - Format: `{paragraph-id}/{example-index}.mp3`
   - Example: `/audio/paragraph/ruguo-jiu/example-1.mp3`
   - Alternative: Use sentence hash for unique naming

#### Phase 3: Component Enhancement

1. **Create `ParagraphExampleAudio` Component:**
```typescript
// components/ParagraphExampleAudio.tsx
interface ParagraphExampleAudioProps {
  example: ParagraphExample;
  locale: 'en' | 'vi' | 'zh';
  size?: 'sm' | 'md' | 'lg';
}

export default function ParagraphExampleAudio({
  example,
  locale,
  size = 'md'
}: ParagraphExampleAudioProps) {
  // Play button with audio player
  // Show loading state
  // Handle errors gracefully
  // Optional: Show duration
}
```

2. **Update `ParagraphEntry` Component:**
   - Render examples array if present
   - Display each example with audio button
   - Fallback to markdown parsing if examples array missing (backward compatible)
   - Support both display modes:
     - **Inline**: Examples embedded in markdown (current)
     - **Separate**: Examples displayed as separate cards with audio

#### Phase 4: Audio Generation Strategy

1. **Option A: Manual Audio Files**
   - Record audio files manually
   - Upload to `public/audio/paragraph/`
   - Reference in JSON

2. **Option B: Text-to-Speech (TTS)**
   - Use browser TTS API (like vocabulary entries)
   - Generate on-demand
   - Cache results

3. **Option C: Hybrid**
   - Prefer manual audio files if available
   - Fallback to TTS if not available
   - Mark TTS-generated audio for later replacement

4. **Option D: External TTS Service**
   - Use cloud TTS service (e.g., Google Cloud TTS, Azure TTS)
   - Generate audio files programmatically
   - Store in `public/audio/paragraph/`

#### Phase 5: Migration Strategy

1. **Script to Extract Examples from Markdown:**
   - Parse existing paragraph JSON files
   - Extract Chinese sentences from markdown
   - Generate `examples` array
   - Preserve existing structure (backward compatible)

2. **Gradual Migration:**
   - Start with new paragraph files
   - Migrate existing files one by one
   - Support both old and new formats during transition

---

## Implementation Details

### 1. TypeScript Types

```typescript
// types/index.ts
export interface ParagraphExample {
  sentence: string;
  pinyin?: string;
  translation?: {
    en?: string;
    vi?: string;
    zh?: string;
  };
  audio?: {
    path: string;
    duration?: number;
  };
  order?: number;
}

export interface ParagraphDataItem {
  title?: {
    translation: {
      en?: string;
      vi?: string;
      zh?: string;
    };
  };
  body?: {
    translation: {
      en?: string;
      vi?: string;
      zh?: string;
    };
  };
  placeholders?: Array<Record<string, string>>;
  examples?: ParagraphExample[];  // NEW
}

export interface GrammarEntry {
  id: string;
  title: string;
  tags: string[];
  translation: {
    en: string;
    vi: string;
    zh: string;
  };
  data: ParagraphDataItem[];
}
```

### 2. Component Implementation

```typescript
// components/ParagraphExampleAudio.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import type { ParagraphExample } from '@/types';

interface ParagraphExampleAudioProps {
  example: ParagraphExample;
  locale: 'en' | 'vi' | 'zh';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function ParagraphExampleAudio({
  example,
  locale,
  size = 'md',
  showText = true
}: ParagraphExampleAudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = async () => {
    if (!example.audio?.path) {
      // Fallback to TTS if no audio file
      handleTTS();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (!audioRef.current) {
        audioRef.current = new Audio(example.audio.path);
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = () => {
          setError('Failed to load audio');
          setIsPlaying(false);
          setIsLoading(false);
        };
      }

      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError('Failed to play audio');
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTTS = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setError('Text-to-speech not supported');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(example.sentence);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.7;
    
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(v => v.lang.startsWith('zh'));
    if (chineseVoice) utterance.voice = chineseVoice;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setError('TTS failed');
    
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePlay}
        disabled={isLoading}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          rounded-full
          bg-blue-500 hover:bg-blue-600
          text-white
          disabled:opacity-50
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500
        `}
        aria-label="Play audio"
      >
        {isLoading ? (
          <div className="animate-spin">⟳</div>
        ) : isPlaying ? (
          <span>⏸</span>
        ) : (
          <span>▶</span>
        )}
      </button>
      {showText && (
        <div className="flex-1">
          <p className="text-gray-900 font-medium">{example.sentence}</p>
          {example.pinyin && (
            <p className="text-gray-600 text-sm">{example.pinyin}</p>
          )}
          {example.translation?.[locale] && (
            <p className="text-gray-500 text-sm">{example.translation[locale]}</p>
          )}
        </div>
      )}
      {error && (
        <span className="text-red-500 text-xs">{error}</span>
      )}
    </div>
  );
}
```

### 3. Update ParagraphEntry Component

```typescript
// components/ParagraphEntry.tsx (partial update)
{contentItems.map((item: any, index: number) => {
  // ... existing code ...
  
  // Render examples if available
  const examples = item.examples && Array.isArray(item.examples) 
    ? item.examples 
    : [];
  
  return (
    <div key={index} className="pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
      {/* ... existing title and body rendering ... */}
      
      {/* Render examples section */}
      {examples.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            {text.grammar?.examples || 'Examples'}
          </h4>
          {examples.map((example: ParagraphExample, exIndex: number) => (
            <div 
              key={exIndex}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <ParagraphExampleAudio
                example={example}
                locale={locale as 'en' | 'vi' | 'zh'}
                size="md"
                showText={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
})}
```

### 4. Migration Script

```typescript
// maindb/scripts/extract-examples-from-paragraphs.ts
// Script to extract examples from markdown and create examples array
// This can be run gradually to migrate existing files
```

---

## File Organization

### Audio Files Structure
```
public/audio/
  ├── pinyin-chart/          # Existing
  └── paragraph/             # New
      ├── ruguo-jiu/
      │   ├── example-1.mp3
      │   └── example-2.mp3
      ├── adjunct/
      │   └── example-1.mp3
      └── ...
```

### Naming Convention Options

**Option A: Sequential**
- `{paragraph-id}/example-1.mp3`
- `{paragraph-id}/example-2.mp3`
- Simple but requires maintaining order

**Option B: Sentence Hash**
- `{paragraph-id}/{sentence-hash}.mp3`
- Unique per sentence
- Can handle reordering

**Option C: Sentence-based**
- `{paragraph-id}/{sanitized-sentence}.mp3`
- Human-readable
- May have filename length issues

**Recommendation: Option B (Sentence Hash)**

---

## Migration Path

### Step 1: Add Type Definitions
- Update `types/index.ts` with `ParagraphExample` interface
- Ensure backward compatibility

### Step 2: Create Audio Component
- Implement `ParagraphExampleAudio` component
- Support both file-based and TTS fallback

### Step 3: Update ParagraphEntry
- Add examples rendering section
- Maintain backward compatibility with markdown-only examples

### Step 4: Migrate One File
- Start with one paragraph file (e.g., `ruguo-jiu.json`)
- Extract examples manually or via script
- Add audio files
- Test end-to-end

### Step 5: Create Migration Script
- Script to extract examples from markdown
- Generate examples array
- Preserve original markdown

### Step 6: Gradual Migration
- Migrate files one by one
- Test each migration
- Update audio files as needed

---

## Benefits

1. **Enhanced Learning Experience**
   - Audio pronunciation for all examples
   - Better comprehension
   - Improved retention

2. **Consistent Structure**
   - Structured data for examples
   - Easier to maintain
   - Programmatic access

3. **Flexibility**
   - Support multiple audio sources
   - TTS fallback
   - Easy to update

4. **Scalability**
   - Can add more metadata later
   - Easy to extend
   - Supports future features

---

## Considerations

1. **Audio File Size**
   - Consider compression
   - Lazy loading
   - CDN for production

2. **Backward Compatibility**
   - Support both old and new formats
   - Gradual migration
   - No breaking changes

3. **Performance**
   - Lazy load audio files
   - Preload on hover
   - Cache audio elements

4. **Accessibility**
   - Proper ARIA labels
   - Keyboard navigation
   - Screen reader support

---

## Next Steps

1. **Review and Approve** this proposal
2. **Choose Audio Generation Strategy** (Manual, TTS, or Hybrid)
3. **Implement Type Definitions** (Step 1)
4. **Create Audio Component** (Step 2)
5. **Update ParagraphEntry** (Step 3)
6. **Migrate First File** (Step 4) - Start with `ruguo-jiu.json`
7. **Test and Iterate**
8. **Create Migration Script** (Step 5)
9. **Gradual Migration** (Step 6)

---

*This proposal is a suggestion. Implementation can be done gradually as requested.*

