'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { type Locale } from '@/proxy';
import { getUiText } from '@/lib/ui-text';

interface UiTextContextType {
  text: any;
  locale: Locale;
  isLoading: boolean;
}

const UiTextContext = createContext<UiTextContextType | null>(null);

interface UiTextProviderProps {
  children: ReactNode;
  locale: Locale;
  initialText?: any; // Optional initial text from server
}

export function UiTextProvider({ children, locale, initialText }: UiTextProviderProps) {
  const [text, setText] = useState<any>(initialText || null);
  const [isLoading, setIsLoading] = useState(!initialText);

  useEffect(() => {
    // Only load if we don't have initial text
    if (!initialText) {
      setIsLoading(true);
      try {
        // Load UI text (bundled, so synchronous)
        const uiText = getUiText(locale);
        setText(uiText);
        setIsLoading(false);
      } catch (error) {
        console.error('[UiTextProvider] Failed to load UI text:', error);
        setIsLoading(false);
      }
    }
  }, [locale, initialText]);

  return (
    <UiTextContext.Provider value={{ text, locale, isLoading }}>
      {children}
    </UiTextContext.Provider>
  );
}

export function useUiText(): UiTextContextType {
  const context = useContext(UiTextContext);
  if (!context) {
    throw new Error('useUiText must be used within UiTextProvider');
  }
  return context;
}

