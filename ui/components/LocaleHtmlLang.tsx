'use client';

import React, { useEffect } from 'react';
import type { Locale } from '@/proxy';

/**
 * Client component to set the lang attribute on the html element
 * Receives locale as a prop from the server component
 */
interface LocaleHtmlLangProps {
  locale: Locale;
}

export default function LocaleHtmlLang({ locale }: LocaleHtmlLangProps) {
  useEffect(() => {
    // Set lang attribute on html element
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('lang', locale);
    }
  }, [locale]);

  return null;
}

