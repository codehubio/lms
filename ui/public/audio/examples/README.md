# Audio Examples Directory

This directory contains audio files for example words in paragraph entries.

## Directory Structure

```
ui/public/audio/examples/
  └── pronunciation-c/
      ├── ci.mp3      (pronunciation of 刺 - cì)
      ├── cao.mp3     (pronunciation of 草 - cǎo)
      └── cong.mp3    (pronunciation of 从 - cóng)
```

## File Naming Convention

Follows the same convention as `pinyin-chart`:
- Format: `{syllable}{tone}.mp3`
- Use pinyin syllable without tone marks, followed by tone number (1-4)
- Convert ü to v (e.g., nü → nv)
- Examples:
  - `ci4.mp3` for 刺 (cì - tone 4)
  - `cao3.mp3` for 草 (cǎo - tone 3)
  - `cong2.mp3` for 从 (cóng - tone 2)

## Adding Audio Files

1. Record or generate MP3 audio files for each example word
2. Place them in the appropriate subdirectory (e.g., `pronunciation-c/`)
3. Ensure the file path in the JSON matches the actual file location
4. Audio files should be:
   - MP3 format
   - Clear pronunciation
   - Appropriate length (typically 1-3 seconds for single words)

## Current Audio Files Needed

For `pronunciation-c.json`:
- `/audio/examples/pronunciation-c/ci4.mp3` - 刺 (cì - tone 4)
- `/audio/examples/pronunciation-c/cao3.mp3` - 草 (cǎo - tone 3)
- `/audio/examples/pronunciation-c/cong2.mp3` - 从 (cóng - tone 2)

## Fallback Behavior

If audio files are not available, the component will automatically fall back to browser Text-to-Speech (TTS) using the Web Speech API.

