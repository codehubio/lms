import { getUiText } from '@/lib/ui-text';
import { type Locale } from '@/proxy';

interface HeroProps {
  locale?: Locale;
}

export default async function Hero({ locale = 'en' }: HeroProps) {
  const text = await getUiText(locale);
  
  return (
    <section className="bg-gradient-to-r from-secondary to-secondary/90 text-white py-3 sm:py-4 text-center animate-fade-in w-full flex-shrink-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {/* Compact SVG icon */}
          <svg className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <title>{text.nav?.brand || 'Chinese Vocabulary'}</title>
            <path d="M12 2L15 8H9L12 2Z" fill="currentColor" />
            <path d="M12 22L9 16H15L12 22Z" fill="currentColor" />
            <path d="M2 12L8 15V9L2 12Z" fill="currentColor" />
            <path d="M22 12L16 9V15L22 12Z" fill="currentColor" />
          </svg>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight">{text.hero.title}</h1>
            <p className="text-xs sm:text-sm md:text-base text-white/90 mt-0.5 sm:mt-1 line-clamp-1">{text.hero.subtitle}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

