'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getLocaleFromPath, addLocaleToPath, type Locale, locales } from '@/lib/i18n';
import Select from './Select';
import { getUiText } from '@/lib/ui-text';

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentLocale, setCurrentLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentLocale(getLocaleFromPath(pathname));
  }, [pathname]);

  const handleLanguageChange = (newLocale: string) => {
    const locale = newLocale as Locale;
    if (locale === currentLocale || !mounted) return;
    
    // Preserve search params when switching language
    const params = searchParams.toString();
    const newPath = addLocaleToPath(pathname, locale);
    const finalPath = params ? `${newPath}?${params}` : newPath;
    router.push(finalPath);
  };

  const [text, setText] = useState<any>(null);

  useEffect(() => {
    // Load UI text for current locale (bundled, so synchronous)
    const uiText = getUiText(currentLocale);
    setText(uiText);
  }, [currentLocale]);

  const languageOptions = text
    ? locales.map((locale) => {
        let label = '';
        if (locale === 'en') {
          label = text.language.english;
        } else if (locale === 'vi') {
          label = text.language.vietnamese;
        } else if (locale === 'zh') {
          label = text.language.chinese || '中文 (ZH)';
        }
        return {
          value: locale,
          label: label,
        };
      })
    : [
        { value: 'en', label: 'English (EN)' },
        { value: 'vi', label: 'Tiếng Việt (VI)' },
        { value: 'zh', label: '中文 (ZH)' },
      ];

  return (
    <div className="flex items-center gap-2" suppressHydrationWarning>
      <Select
        id="language-select"
        value={mounted ? currentLocale : 'en'}
        onChange={handleLanguageChange}
        options={languageOptions}
        disabled={!mounted || !text}
        dark={true}
      />
    </div>
  );
}

