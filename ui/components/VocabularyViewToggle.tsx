import VocabularyViewToggleButtons from './VocabularyViewToggleButtons';

type ViewMode = 'card' | 'table';

interface VocabularyViewToggleProps {
  viewMode: ViewMode;
  locale: string;
  text: {
    dictionary?: {
      viewMode?: string;
      cardView?: string;
      tableView?: string;
    };
  };
  cardUrl: string;
  tableUrl: string;
}

export default function VocabularyViewToggle({ viewMode, locale, text, cardUrl, tableUrl }: VocabularyViewToggleProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm text-gray-600 mr-2">
        {text.dictionary?.viewMode || 'View:'}
      </span>
      <VocabularyViewToggleButtons
        currentViewMode={viewMode}
        cardLabel={text.dictionary?.cardView || 'Cards'}
        tableLabel={text.dictionary?.tableView || 'Table'}
        cardUrl={cardUrl}
        tableUrl={tableUrl}
      />
    </div>
  );
}

