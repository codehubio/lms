import Link from 'next/link';

type ViewMode = 'card' | 'table';

interface VocabularyViewToggleButtonsProps {
  currentViewMode: ViewMode;
  cardLabel: string;
  tableLabel: string;
  cardUrl: string;
  tableUrl: string;
}

export default function VocabularyViewToggleButtons({
  currentViewMode,
  cardLabel,
  tableLabel,
  cardUrl,
  tableUrl,
}: VocabularyViewToggleButtonsProps) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <Link
        href={cardUrl}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          currentViewMode === 'card'
            ? 'bg-white text-teal-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-label={cardLabel}
        title={cardLabel}
      >
        <svg className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        {cardLabel}
      </Link>
      <Link
        href={tableUrl}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          currentViewMode === 'table'
            ? 'bg-white text-teal-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-label={tableLabel}
        title={tableLabel}
      >
        <svg className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {tableLabel}
      </Link>
    </div>
  );
}

