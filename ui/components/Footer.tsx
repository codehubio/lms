import { getUiText } from '@/lib/ui-text';
import { type Locale } from '@/proxy';

interface FooterProps {
  locale?: Locale;
}

export default async function Footer({ locale = 'en' }: FooterProps) {
  const text = await getUiText(locale);
  
  return (
    <footer className="bg-gray-800 text-gray-300 py-2 sm:py-3 md:py-4 text-center w-full flex-shrink-0">
      <p className="text-xs sm:text-sm">{text.footer.copyright}</p>
    </footer>
  );
}

