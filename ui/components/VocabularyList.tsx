import VocabularyEntry from '@/components/VocabularyEntry';
import VocabularyTableView from '@/components/VocabularyTableView';
import VocabularyViewToggle from '@/components/VocabularyViewToggle';
import { DictionaryEntry } from '@/types';

type ViewMode = 'card' | 'table';

interface VocabularyListProps {
  entries: DictionaryEntry[];
  viewMode?: ViewMode;
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

export default function VocabularyList({ entries, viewMode = 'card', locale, text, cardUrl, tableUrl }: VocabularyListProps) {
  return (
    <>
      <VocabularyViewToggle viewMode={viewMode} locale={locale} text={text} cardUrl={cardUrl} tableUrl={tableUrl} />
      
      {viewMode === 'card' ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry, index) => (
            <VocabularyEntry 
              key={entry.id} 
              entry={entry} 
              allEntries={entries}
              currentIndex={index}
            />
          ))}
        </div>
      ) : (
        <VocabularyTableView entries={entries} />
      )}
    </>
  );
}

