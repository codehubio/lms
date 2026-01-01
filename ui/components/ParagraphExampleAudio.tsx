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
    // If audio file is available, use it
    if (example.audio?.path) {
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
        // Fallback to TTS if audio file fails
        handleTTS();
      } finally {
        setIsLoading(false);
      }
    } else {
      // Fallback to TTS if no audio file
      handleTTS();
    }
  };

  const handleTTS = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setError('Text-to-speech not supported');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(example.word);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.7;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(v => v.lang.startsWith('zh') || v.lang.startsWith('cmn'));
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setError('TTS failed');
      setIsPlaying(false);
    };
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
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
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
      <button
        onClick={handlePlay}
        disabled={isLoading}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          rounded-full
          bg-blue-500 hover:bg-blue-600 active:bg-blue-700
          text-white
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          shadow-sm hover:shadow-md
        `}
        aria-label={`Play pronunciation of ${example.word}`}
        title={isPlaying ? 'Stop' : 'Play'}
      >
        {isLoading ? (
          <svg className={`${iconSizeClasses[size]} animate-spin`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : isPlaying ? (
          <svg className={iconSizeClasses[size]} fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        ) : (
          <svg className={iconSizeClasses[size]} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
      {showText && (
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-lg font-semibold text-gray-900">{example.word}</p>
            {example.pinyin && (
              <p className="text-sm text-gray-600 font-mono">{example.pinyin}</p>
            )}
          </div>
          {example.translation?.[locale] && (
            <p className="text-sm text-gray-500 mt-1">{example.translation[locale]}</p>
          )}
        </div>
      )}
      {error && (
        <span className="text-red-500 text-xs" title={error}>⚠</span>
      )}
    </div>
  );
}

