'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUiText } from '@/lib/ui-text';
import { type Locale } from '@/proxy';

interface HomeSectionsProps {
  locale: Locale;
}

export default function HomeSections({ locale }: HomeSectionsProps) {
  const [text, setText] = useState<any>(null);

  useEffect(() => {
    // Load UI text (bundled, so synchronous)
    const uiText = getUiText(locale);
    setText(uiText);
  }, [locale]);

  if (!text) {
    return (
      <div className="flex-1 py-8 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto w-full" suppressHydrationWarning>
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-6"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const vocabularyPath = `/${locale}/vocabulary`;
  const grammarPath = `/${locale}/grammar`;

  return (
    <section className="flex-1 py-8 sm:py-12 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto w-full">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Vocabulary Section */}
        <Link
          href={vocabularyPath}
          className="block bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 sm:p-10 border border-gray-200 hover:border-teal-300 group overflow-hidden relative"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-teal-200/40 transition-colors duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-start mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mr-5 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-teal-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <title>{text.home?.vocabularyTitle || 'Vocabulary'}</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors duration-300">
                  {text.home.vocabularyTitle}
                </h2>
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                  {text.home.vocabularySubtitle}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 group-hover:border-teal-200 transition-colors duration-300">
              <span className="text-teal-600 font-bold text-lg group-hover:text-teal-700 transition-colors duration-300">
                {text.home.exploreVocabulary}
              </span>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-50 group-hover:bg-teal-100 transition-colors duration-300">
                <svg className="w-5 h-5 text-teal-600 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <title>{text.home?.exploreVocabulary || 'Explore'}</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Grammar Section */}
        <Link
          href={grammarPath}
          className="block bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 sm:p-10 border border-gray-200 hover:border-teal-300 group overflow-hidden relative"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-teal-200/40 transition-colors duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-start mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mr-5 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-teal-500/50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <title>{text.home?.grammarTitle || 'Grammar'}</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors duration-300">
                  {text.home.grammarTitle || 'Chinese Grammar'}
                </h2>
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                  {text.home.grammarSubtitle || 'Comprehensive Chinese grammar explanations with examples and markdown support'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 group-hover:border-teal-200 transition-colors duration-300">
              <span className="text-teal-600 font-bold text-lg group-hover:text-teal-700 transition-colors duration-300">
                {text.home.exploreGrammar || 'Explore Grammar'}
              </span>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-50 group-hover:bg-teal-100 transition-colors duration-300">
                <svg className="w-5 h-5 text-teal-600 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <title>{text.home?.exploreGrammar || 'Explore'}</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

