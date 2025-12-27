'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getLocaleFromPath } from '@/lib/i18n';
import { DictionaryEntry as DictionaryEntryType } from '@/types';
import StrokeOrder from './StrokeOrder';

interface VocabularyEntryProps {
  entry: DictionaryEntryType;
  allEntries?: DictionaryEntryType[];
  currentIndex?: number;
}

export default function VocabularyEntry({ entry, allEntries = [], currentIndex = -1 }: VocabularyEntryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [locale, setLocale] = useState<string>('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentModalEntry, setCurrentModalEntry] = useState<DictionaryEntryType>(entry);
  const [currentModalIndex, setCurrentModalIndex] = useState(currentIndex);
  const [isLoadingExamples, setIsLoadingExamples] = useState(false);
  const [speakingExampleIndex, setSpeakingExampleIndex] = useState<number | null>(null);

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
      setSpeakingExampleIndex(null);
    }
  };

  const handleSpeakExample = (example: { sentence: string }, index: number) => {
    if (!speechSupported) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    const synthesis = window.speechSynthesis;
    
    // Cancel any ongoing speech
    synthesis.cancel();
    
    setSpeakingExampleIndex(index);
    setIsSpeaking(false); // Reset word speaking state

    // Create utterance for the example sentence
    const utterance = new SpeechSynthesisUtterance(example.sentence);
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
      setSpeakingExampleIndex(null);
    };

    utterance.onerror = (event) => {
      if (event.error !== 'interrupted') {
        console.error('Speech synthesis error:', event);
        setSpeakingExampleIndex(null);
      } else {
        setSpeakingExampleIndex(null);
      }
    };

    synthesis.speak(utterance);
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

  const handleCardClick = async (e: React.MouseEvent) => {
    // Don't open modal if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]')
    ) {
      return;
    }
    setCurrentModalEntry(entry);
    setCurrentModalIndex(currentIndex);
    setIsModalOpen(true);
    
    // Fetch examples if not already loaded
    if (!entry.examples || entry.examples.length === 0) {
      setIsLoadingExamples(true);
      try {
        const response = await fetch(`/api/vocabulary/${encodeURIComponent(entry.word)}/examples`);
        if (response.ok) {
          const data = await response.json();
          setCurrentModalEntry(prev => ({
            ...prev,
            examples: data.examples || []
          }));
        }
      } catch (error) {
        console.error('Error fetching examples:', error);
      } finally {
        setIsLoadingExamples(false);
      }
    }
  };

  const handleCloseModal = useCallback(() => {
    // Stop any ongoing speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingExampleIndex(null);
    setIsModalOpen(false);
  }, []);

  const loadExamplesForEntry = useCallback(async (entry: DictionaryEntryType): Promise<DictionaryEntryType> => {
    if (!entry.examples || entry.examples.length === 0) {
      setIsLoadingExamples(true);
      try {
        const response = await fetch(`/api/vocabulary/${encodeURIComponent(entry.word)}/examples`);
        if (response.ok) {
          const data = await response.json();
          return {
            ...entry,
            examples: data.examples || []
          };
        }
      } catch (error) {
        console.error('Error fetching examples:', error);
      } finally {
        setIsLoadingExamples(false);
      }
    }
    return entry;
  }, []);

  const handlePrevious = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allEntries.length > 0 && currentModalIndex > 0) {
      const prevIndex = currentModalIndex - 1;
      setCurrentModalIndex(prevIndex);
      const prevEntry = allEntries[prevIndex];
      const entryWithExamples = await loadExamplesForEntry(prevEntry);
      setCurrentModalEntry(entryWithExamples);
      setIsSpeaking(false); // Stop any ongoing speech
      setSpeakingExampleIndex(null); // Stop any example speech
    }
  };

  const handleNext = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allEntries.length > 0 && currentModalIndex < allEntries.length - 1) {
      const nextIndex = currentModalIndex + 1;
      setCurrentModalIndex(nextIndex);
      const nextEntry = allEntries[nextIndex];
      const entryWithExamples = await loadExamplesForEntry(nextEntry);
      setCurrentModalEntry(entryWithExamples);
      setIsSpeaking(false); // Stop any ongoing speech
      setSpeakingExampleIndex(null); // Stop any example speech
    }
  };

  // Update currentModalEntry when entry prop changes (for navigation)
  useEffect(() => {
    if (isModalOpen && allEntries.length > 0 && currentModalIndex >= 0 && currentModalIndex < allEntries.length) {
      const entry = allEntries[currentModalIndex];
      setCurrentModalEntry(entry);
      // Load examples if not already loaded
      if (!entry.examples || entry.examples.length === 0) {
        loadExamplesForEntry(entry).then(entryWithExamples => {
          setCurrentModalEntry(entryWithExamples);
        });
      }
    }
  }, [isModalOpen, currentModalIndex, allEntries, loadExamplesForEntry]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (allEntries.length > 0 && currentModalIndex > 0) {
          const prevIndex = currentModalIndex - 1;
          setCurrentModalIndex(prevIndex);
          const prevEntry = allEntries[prevIndex];
          const entryWithExamples = await loadExamplesForEntry(prevEntry);
          setCurrentModalEntry(entryWithExamples);
          setIsSpeaking(false);
          setSpeakingExampleIndex(null);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (allEntries.length > 0 && currentModalIndex < allEntries.length - 1) {
          const nextIndex = currentModalIndex + 1;
          setCurrentModalIndex(nextIndex);
          const nextEntry = allEntries[nextIndex];
          const entryWithExamples = await loadExamplesForEntry(nextEntry);
          setCurrentModalEntry(entryWithExamples);
          setIsSpeaking(false);
          setSpeakingExampleIndex(null);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, currentModalIndex, allEntries, handleCloseModal, loadExamplesForEntry]);

  return (
    <>
      <div 
        className="bg-white border border-gray-200 rounded-lg shadow-md p-3 sm:p-4 hover:shadow-xl transition cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{entry.word}</h3>
            {/* Reserve space for speech button to prevent layout shift */}
            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8">
              {speechSupported && (
                <button
                  onClick={isSpeaking ? handleStop : handleSpeak}
                  className="w-full h-full rounded-full bg-teal-100 hover:bg-teal-200 text-teal-600 flex items-center justify-center transition-colors duration-200"
                  aria-label={isSpeaking ? 'Stop pronunciation' : 'Pronounce word'}
                  title={isSpeaking ? 'Stop pronunciation' : 'Click to hear pronunciation'}
                >
                  {isSpeaking ? (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
            {/* Tags - right of speaker icon */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((tag, index) => (
                  <button
                    key={index}
                    onClick={(e) => handleTagClick(tag, e)}
                    aria-label={`Filter by ${getTagDisplayName(tag)}`}
                    className={`px-1.5 py-0.5 rounded text-xs font-semibold transition-colors hover:opacity-80 cursor-pointer ${
                      tagColors[tag] || 'bg-gray-100 text-gray-800'
                    }`}
                    title={`Filter by ${getTagDisplayName(tag)}`}
                  >
                    {getTagDisplayName(tag)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col mb-1.5">
            <p className="text-base sm:text-lg text-teal-700 font-medium">{entry.pinyin1}</p>
            <p className="text-xs text-gray-500">({entry.pinyin2})</p>
          </div>
          <p className="text-sm sm:text-base text-gray-700 font-semibold mb-2">{entry.translation}</p>
          {/* Description */}
          {entry.description && entry.description.trim() && (
            <div className="mb-2">
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{entry.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Modal for enlarged card view */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-1 sm:p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-7xl w-full h-[95vh] sm:h-[90vh] flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Navigation buttons - Previous (centered on left edge) */}
            {allEntries.length > 1 && currentModalIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious(e);
                }}
                className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-[60] w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white shadow-2xl hover:bg-gray-50 flex items-center justify-center transition-colors border-2 border-teal-500"
                aria-label="Previous entry"
                title="Previous (←)"
                style={{ pointerEvents: 'auto' }}
              >
                <svg className="w-5 h-5 sm:w-7 sm:h-7 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Navigation buttons - Next (centered on right edge) */}
            {allEntries.length > 1 && currentModalIndex < allEntries.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext(e);
                }}
                className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-[60] w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white shadow-2xl hover:bg-gray-50 flex items-center justify-center transition-colors border-2 border-teal-500"
                aria-label="Next entry"
                title="Next (→)"
                style={{ pointerEvents: 'auto' }}
              >
                <svg className="w-5 h-5 sm:w-7 sm:h-7 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{currentModalEntry.word}</h2>
                {allEntries.length > 0 && (
                  <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
                    {currentModalIndex + 1} / {allEntries.length}
                  </span>
                )}
              </div>
              <button
                onClick={handleCloseModal}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                aria-label="Close modal"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pl-12 sm:pl-16 pr-12 sm:pr-16">
              {/* Enlarged card content */}
              <div className="space-y-3 sm:space-y-4">
                {/* Word, speech button, and tags */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{currentModalEntry.word}</h3>
                  {speechSupported && (
                    <button
                      onClick={() => {
                        const utterance = new SpeechSynthesisUtterance(currentModalEntry.word);
                        utterance.lang = 'zh-CN';
                        utterance.rate = 0.6;
                        utterance.pitch = 1.0;
                        utterance.volume = 1.0;
                        const currentVoices = window.speechSynthesis.getVoices();
                        const chineseVoice = currentVoices.find(voice =>
                          voice.lang.startsWith('zh') || voice.lang.startsWith('cmn')
                        );
                        if (chineseVoice) {
                          utterance.voice = chineseVoice;
                        }
                        window.speechSynthesis.cancel();
                        window.speechSynthesis.speak(utterance);
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-teal-100 hover:bg-teal-200 text-teal-600 flex items-center justify-center transition-colors duration-200"
                      aria-label="Pronounce word"
                      title="Click to hear pronunciation"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                      </svg>
                    </button>
                  )}
                  {/* Tags - right of speaker icon */}
                  {currentModalEntry.tags && currentModalEntry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {currentModalEntry.tags.map((tag, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            handleTagClick(tag, e);
                            handleCloseModal();
                          }}
                          aria-label={`Filter by ${getTagDisplayName(tag)}`}
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-semibold transition-colors hover:opacity-80 cursor-pointer ${
                            tagColors[tag] || 'bg-gray-100 text-gray-800'
                          }`}
                          title={`Filter by ${getTagDisplayName(tag)}`}
                        >
                          {getTagDisplayName(tag)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Pinyin */}
                <div className="flex flex-col">
                  <p className="text-xl sm:text-2xl text-teal-700 font-medium">{currentModalEntry.pinyin1}</p>
                  <p className="text-sm sm:text-base text-gray-500">({currentModalEntry.pinyin2})</p>
                </div>
                
                {/* Translation */}
                <p className="text-lg sm:text-xl text-gray-700 font-semibold">{currentModalEntry.translation}</p>
                
                {/* Description */}
                {currentModalEntry.description && currentModalEntry.description.trim() && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Description:</h4>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{currentModalEntry.description}</p>
                  </div>
                )}
                
                {/* Stroke Order - Enlarged */}
                <div className="w-full flex justify-center">
                  <StrokeOrder key={`${currentModalEntry.id}-${currentModalEntry.word}-modal`} word={currentModalEntry.word} size={120} />
                </div>
                
                {/* Example Sentences */}
                {isLoadingExamples ? (
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">Examples:</h4>
                    <div className="text-xs sm:text-sm text-gray-500">Loading examples...</div>
                  </div>
                ) : mounted && currentModalEntry.examples && currentModalEntry.examples.length > 0 ? (
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">Examples:</h4>
                    <div className="space-y-2 sm:space-y-3">
                      {currentModalEntry.examples.map((example, index) => {
                        const exampleTranslation = locale === 'vi' 
                          ? (example.translation.vi || example.translation.en)
                          : (example.translation.en || example.translation.vi);
                        const isExampleSpeaking = speakingExampleIndex === index;
                        
                        return (
                          <div key={index} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-base sm:text-lg font-medium text-gray-900 flex-1 break-words">{example.sentence}</p>
                              {speechSupported && (
                                <button
                                  onClick={() => {
                                    if (isExampleSpeaking) {
                                      handleStop();
                                    } else {
                                      handleSpeakExample(example, index);
                                    }
                                  }}
                                  className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-teal-100 hover:bg-teal-200 text-teal-600 flex items-center justify-center transition-colors duration-200"
                                  aria-label={isExampleSpeaking ? 'Stop pronunciation' : 'Pronounce sentence'}
                                  title={isExampleSpeaking ? 'Stop pronunciation' : 'Click to hear pronunciation'}
                                >
                                  {isExampleSpeaking ? (
                                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </div>
                            <p className="text-sm sm:text-base text-teal-700 mb-1">{example.pinyin1}</p>
                            <p className="text-sm sm:text-base text-gray-600">{exampleTranslation}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

