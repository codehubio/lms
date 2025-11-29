'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getLocaleFromPath } from '@/lib/i18n';
import { DictionaryEntry as DictionaryEntryType } from '@/types';
import StrokeOrder from './StrokeOrder';

interface VocabularyEntryProps {
  entry: DictionaryEntryType;
}

export default function VocabularyEntry({ entry }: VocabularyEntryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [locale, setLocale] = useState<string>('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    setMounted(true);
    const currentLocale = getLocaleFromPath(pathname);
    setLocale(currentLocale);
  }, [pathname]);

  useEffect(() => {
    // Check if speech synthesis is supported
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
      
      // Load voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };
      
      loadVoices();
      // Voices may load asynchronously
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleSpeak = () => {
    if (!speechSupported) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    const synthesis = window.speechSynthesis;
    
    // Cancel any ongoing speech
    synthesis.cancel();
    
    setIsSpeaking(true);

    // Create utterance for the Chinese word
    const utterance = new SpeechSynthesisUtterance(entry.word);
    utterance.lang = 'zh-CN'; // Chinese language
    utterance.rate = 0.6; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a Chinese voice
    const currentVoices = synthesis.getVoices();
    const chineseVoice = currentVoices.find(voice => 
      voice.lang.startsWith('zh') || voice.lang.startsWith('cmn')
    );
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      if (event.error !== 'interrupted') {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      } else {
        setIsSpeaking(false);
      }
    };

    synthesis.speak(utterance);
  };

  const handleStop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };
  // Tag color mapping
  const tagColors: Record<string, string> = {
    'HSK1': 'bg-green-100 text-green-800',
    'HSK2': 'bg-blue-100 text-blue-800',
    'HSK3': 'bg-yellow-100 text-yellow-800',
    'HSK4': 'bg-orange-100 text-orange-800',
    'HSK5': 'bg-red-100 text-red-800',
    'HSK6': 'bg-purple-100 text-purple-800',
    'HSK7': 'bg-pink-100 text-pink-800',
    'HSK8': 'bg-indigo-100 text-indigo-800',
    'HSK9': 'bg-cyan-100 text-cyan-800',
  };

  const getTagDisplayName = (tag: string): string => {
    // Convert HSK1 to HSK 1, etc.
    if (tag.startsWith('HSK')) {
      const level = tag.substring(3);
      return `HSK ${level}`;
    }
    return tag;
  };

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const locale = getLocaleFromPath(pathname);
    const params = new URLSearchParams(searchParams.toString());
    
    // Get current tags
    const currentTags = searchParams.getAll('tag').filter(Boolean);
    
    // Add tag if not already selected
    if (!currentTags.includes(tag)) {
      params.append('tag', tag);
    }
    
    // Reset to first page when adding a tag
    params.set('page', '1');
    
    router.push(`/${locale}/vocabulary?${params.toString()}`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 sm:p-5 md:p-6 hover:shadow-xl transition min-h-[400px]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{entry.word}</h3>
            {/* Reserve space for speech button to prevent layout shift */}
            <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9">
              {speechSupported && (
                <button
                  onClick={isSpeaking ? handleStop : handleSpeak}
                  className="w-full h-full rounded-full bg-teal-100 hover:bg-teal-200 text-teal-600 flex items-center justify-center transition-colors duration-200"
                  aria-label={isSpeaking ? 'Stop pronunciation' : 'Pronounce word'}
                  title={isSpeaking ? 'Stop pronunciation' : 'Click to hear pronunciation'}
                >
                  {isSpeaking ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mb-2">
            <p className="text-lg sm:text-xl text-teal-700 font-medium">{entry.pinyin1}</p>
            <p className="text-sm text-gray-500">({entry.pinyin2})</p>
          </div>
          <p className="text-base sm:text-lg text-gray-700 font-semibold mb-3">{entry.translation}</p>
          
          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {entry.tags.map((tag, index) => (
                <button
                  key={index}
                  onClick={(e) => handleTagClick(tag, e)}
                  aria-label={`Filter by ${getTagDisplayName(tag)}`}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors hover:opacity-80 cursor-pointer ${
                    tagColors[tag] || 'bg-gray-100 text-gray-800'
                  }`}
                  title={`Filter by ${getTagDisplayName(tag)}`}
                >
                  {getTagDisplayName(tag)}
                </button>
              ))}
            </div>
          )}
          {/* Description */}
          {entry.description && entry.description.trim() && (
            <div className="mb-3">
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{entry.description}</p>
            </div>
          )}
          
          {/* Example Sentences */}
          {mounted && entry.examples && entry.examples.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Examples:</h4>
              <div className="space-y-2">
                {entry.examples.slice(0, 2).map((example, index) => {
                  const exampleTranslation = locale === 'vi' 
                    ? (example.translation.vi || example.translation.en)
                    : (example.translation.en || example.translation.vi);
                  
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-base font-medium text-gray-900 mb-1">{example.sentence}</p>
                      <p className="text-sm text-teal-700 mb-1">{example.pinyin1}</p>
                      <p className="text-sm text-gray-600">{exampleTranslation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Stroke Order - Reserve space to prevent layout shift */}
          <div className="min-h-[120px] w-full">
            <StrokeOrder key={`${entry.id}-${entry.word}`} word={entry.word} size={100} />
          </div>
        </div>
      </div>
    </div>
  );
}

