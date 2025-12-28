'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getLocaleFromPath, type Locale } from '@/lib/i18n';
import Select from './Select';
import { getUiText } from '@/lib/ui-text';

interface VocabularyPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export default function VocabularyPagination({
  currentPage,
  totalPages,
  total,
  pageSize,
}: VocabularyPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const currentLocale = getLocaleFromPath(pathname);
    setLocale(currentLocale);
    
    // Load UI text for current locale (bundled, so synchronous)
    const uiText = getUiText(currentLocale);
    setText(uiText);
  }, [pathname]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/${locale}/vocabulary?${params.toString()}`);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('pageSize', newPageSize.toString());
    params.set('page', '1'); // Reset to first page when changing page size
    router.push(`/${locale}/vocabulary?${params.toString()}`);
  };

  if (!text) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-4" suppressHydrationWarning>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm text-gray-600 font-medium">
              Page size:
            </label>
            <Select
              id="pageSize"
              value={pageSize.toString()}
              onChange={(value) => handlePageSizeChange(Number(value))}
              options={[
                { value: '10', label: '10' },
                { value: '50', label: '50' },
                { value: '100', label: '100' },
                { value: '500', label: '500' },
              ]}
              dark={false}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="px-4 py-1 text-sm text-gray-700 font-medium">
              {total.toLocaleString()} entries
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4" suppressHydrationWarning>
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-xs sm:text-sm text-gray-600 font-medium">
            {text.dictionary.pageSize}
          </label>
          <Select
            id="pageSize"
            value={pageSize.toString()}
            onChange={(value) => handlePageSizeChange(Number(value))}
            options={[
              { value: '10', label: '10' },
              { value: '50', label: '50' },
              { value: '100', label: '100' },
              { value: '500', label: '500' },
            ]}
            dark={false}
          />
        </div>

        {(totalPages > 1 || total > 0) && (
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {totalPages > 1 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                  aria-label={text.dictionary.first}
                  title={text.dictionary.first}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                  aria-label={text.dictionary.previous}
                  title={text.dictionary.previous}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              </>
            )}
            
            {totalPages > 1 && (
              <>
                <span className="px-2 sm:px-4 py-1 text-xs sm:text-sm text-gray-700">
                  {text.dictionary.page
                    .replace('{current}', currentPage.toString())
                    .replace('{total}', totalPages.toString())}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                  aria-label={text.dictionary.next}
                  title={text.dictionary.next}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                  aria-label={text.dictionary.last}
                  title={text.dictionary.last}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </>
            )}
            
            <span className="px-2 sm:px-4 py-1 text-xs sm:text-sm text-gray-700 font-medium">
              {text.dictionary.totalEntries.replace('{total}', total.toLocaleString())}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

