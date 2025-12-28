# LMS Project - Comprehensive Analysis

**Date:** January 2025  
**Project Type:** Chinese Language Learning Management System  
**Status:** Production-ready

---

## Executive Summary

This is a **Chinese Language Learning Management System (LMS)** designed to help users learn Chinese vocabulary, grammar, and language structures. The system provides a comprehensive dictionary with HSK word lists (levels 1-9), grammar explanations, example sentences, and advanced search/filtering capabilities.

**Key Highlights:**
- ✅ Next.js 15.5.6 with App Router (Server Components)
- ✅ DuckDB embedded database for fast analytical queries
- ✅ SeaweedFS for distributed storage (S3-compatible)
- ✅ Multi-language support (English/Vietnamese/Chinese)
- ✅ Advanced vocabulary search and tag filtering
- ✅ Grammar explanations with structured data
- ✅ Example sentences linked to vocabulary
- ✅ Server-side rendering for optimal performance
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ Playwright for E2E testing
- ✅ Docker containerization

---

## 1. Project Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                        │
└────────────────────┬──────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Application (UI)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Server Components (SSR)                         │  │
│  │  - Vocabulary Page                                │  │
│  │  - Grammar Page                                   │  │
│  │  - Home Page                                      │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Client Components                                │  │
│  │  - VocabularyEntry (with modal)                  │  │
│  │  - VocabularySearch                               │  │
│  │  - VocabularyTagFilter                            │  │
│  │  - StrokeOrder (hanzi-writer)                    │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  API Routes                                       │  │
│  │  - /api/vocabulary/[word]/examples              │  │
│  │  - /api/dictionary                               │  │
│  │  - /api/ui-text                                  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬──────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Data Layer (lib/)                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  lib/data.ts - Data fetching functions           │  │
│  │  lib/db.ts - DuckDB connection & queries        │  │
│  │  lib/ui-text.ts - UI text translations          │  │
│  │  lib/i18n.ts - Internationalization helpers      │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬──────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              DuckDB Database (Read-Only)                │
│  ┌──────────┬──────────┬──────────┬──────────┐        │
│  │vocabulary│ sentence │paragraph │tag_group │        │
│  └──────────┴──────────┴──────────┴──────────┘        │
└────────────────────┬──────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         SeaweedFS S3 Storage (Production)               │
│         Local File System (Development)                  │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Directory Structure

```
lms/
├── ui/                          # Next.js frontend application
│   ├── app/
│   │   ├── [locale]/            # Internationalized routes (en/vi/zh)
│   │   │   ├── page.tsx         # Home page
│   │   │   ├── vocabulary/      # Vocabulary dictionary page
│   │   │   ├── grammar/         # Grammar page
│   │   │   │   └── [entry]/     # Individual grammar entry
│   │   │   └── about/           # About page
│   │   ├── api/                 # API routes
│   │   │   ├── vocabulary/      # Vocabulary API
│   │   │   ├── dictionary/      # Dictionary API
│   │   │   └── ui-text/         # UI text translations API
│   │   └── layout.tsx           # Root layout
│   ├── components/              # React components
│   │   ├── VocabularyEntry.tsx  # Vocabulary card with modal
│   │   ├── VocabularyList.tsx   # List container
│   │   ├── VocabularySearch.tsx # Search input
│   │   ├── VocabularyTagFilter.tsx # Tag filter sidebar
│   │   ├── VocabularyPagination.tsx # Pagination controls
│   │   ├── VocabularyTableView.tsx # Table view
│   │   ├── StrokeOrder.tsx      # Hanzi stroke order
│   │   ├── GrammarEntry.tsx     # Grammar display
│   │   ├── NavBar.tsx           # Navigation bar
│   │   ├── Hero.tsx             # Home page hero
│   │   ├── HomeSections.tsx     # Home page sections
│   │   ├── Footer.tsx           # Footer
│   │   └── LanguageSwitcher.tsx # Language selector
│   ├── lib/
│   │   ├── db.ts               # DuckDB connection & queries
│   │   ├── data.ts             # Data fetching functions
│   │   ├── ui-text.ts          # UI text loader
│   │   └── i18n.ts             # i18n helpers
│   ├── types/
│   │   └── index.ts            # TypeScript definitions
│   ├── constants/
│   │   └── ui-text.json        # UI text translations
│   ├── data/                   # Local DuckDB database
│   ├── scripts/
│   │   └── download-db.ts      # Database download script
│   ├── proxy.ts                # i18n routing middleware
│   └── middleware.ts            # Next.js middleware
│
├── maindb/                      # Database management
│   ├── data/
│   │   ├── vocabulary/         # JSON vocabulary files
│   │   ├── sentence/           # Example sentences
│   │   ├── paragraph/          # Grammar/paragraph data
│   │   └── tag-group.json      # Tag group definitions
│   ├── database.duckdb         # Compiled DuckDB database
│   ├── init-db.sql             # Database initialization
│   ├── upload-db.ts            # Upload to SeaweedFS
│   └── scripts/                # Data processing scripts
│
├── test/                        # E2E testing
│   ├── *.spec.ts               # Playwright test files
│   └── playwright.config.ts
│
├── docker-compose.yml           # Docker orchestration
└── seaweed/                     # SeaweedFS storage
```

---

## 2. Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Frontend Framework** | Next.js | 15.5.6 | React framework with App Router |
| **UI Library** | React | 19.2.0 | Component library |
| **Database** | DuckDB | 1.0.0 | Embedded analytical database |
| **Storage** | SeaweedFS | Latest | Distributed file system (S3-compatible) |
| **Styling** | Tailwind CSS | 4.1.17 | Utility-first CSS framework |
| **Language** | TypeScript | 5.9.3 | Type-safe JavaScript |
| **Containerization** | Docker | - | Container orchestration |
| **Character Visualization** | hanzi-writer | 3.7.3 | Chinese character stroke order |
| **Testing** | Playwright | Latest | E2E testing framework |
| **Markdown** | react-markdown | 10.1.0 | Markdown rendering |
| **AWS SDK** | @aws-sdk/client-s3 | 3.700.0 | S3 client for SeaweedFS |

---

## 3. Core Features

### 3.1 Internationalization (i18n)

**Supported Locales:**
- `en` - English (default)
- `vi` - Vietnamese
- `zh` - Chinese

**Implementation:**
- **Proxy-based routing** (`ui/proxy.ts`): Middleware that redirects to locale-prefixed paths
- **Locale detection priority:**
  1. URL path (`/en/...`, `/vi/...`, `/zh/...`)
  2. `Accept-Language` HTTP header
  3. Default: English

**Translation Strategy:**
- **UI Text**: Separate JSON file (`constants/ui-text.json`) with nested structure
- **Data Translations**: Stored in database with nested JSON fields (`translation.en`, `translation.vi`, `translation.zh`)
- **Fallback**: Falls back to English if translation missing
- **Synchronous Loading**: UI text is bundled at build time for performance

### 3.2 Vocabulary Dictionary

**Features:**
- **Search**: Multi-field search (word, pinyin1, pinyin2, translation)
- **Tag Filtering**: Filter by HSK levels (1-9) and custom tags (OR logic)
- **Pagination**: Configurable page size (default: 50 entries)
- **Multi-language**: Translations in English, Vietnamese, and Chinese
- **Data Grouping**: Groups duplicate words and merges fields
- **Example Sentences**: Shows example sentences containing each word (lazy-loaded)
- **Descriptions**: Optional descriptions for vocabulary entries
- **View Modes**: Card view and table view
- **Text-to-Speech**: Browser speech synthesis for pronunciation

**Data Structure:**
```typescript
interface DictionaryEntry {
  id: string;
  tags: string[];              // e.g., ["HSK1", "HSK2", "conjunction"]
  word: string;                 // Chinese character/word
  pinyin1: string;              // Pinyin with tone marks (nǐ hǎo)
  pinyin2: string;              // Pinyin with tone numbers (ni3 hao3)
  translation: string;          // Translation (based on locale)
  description?: string;          // Optional description
  examples?: ExampleSentence[];  // Example sentences (lazy-loaded)
}
```

**Search & Filter Logic:**
- Search matches: word, pinyin1, pinyin2, translation.en, translation.vi
- Tag filtering uses OR logic (shows entries with ANY selected tag)
- Results sorted by: exact word match → first tag → word alphabetically

### 3.3 Grammar System

**Features:**
- Grammar entries stored as paragraphs with `grammar` tag
- Multi-language translations
- Structured data display
- Markdown rendering support

**Data Structure:**
```typescript
interface GrammarEntry {
  id: string;
  title: string;
  tags: string[];
  translation: {
    en: string;
    vi: string;
    zh: string;
  };
  data: any[];  // Structured grammar data
}
```

### 3.4 Example Sentences

**Features:**
- Linked to vocabulary entries
- Contains sentence, pinyin, and translations
- Lazy-loaded when vocabulary entry modal opens
- Supports special characters (e.g., "..." for correlative conjunctions)
- Multi-language translations

**Data Structure:**
```typescript
interface ExampleSentence {
  sentence: string;
  pinyin1: string;
  pinyin2: string;
  translation: {
    en: string;
    vi: string;
  };
}
```

### 3.5 Stroke Order Visualization

**Features:**
- Uses `hanzi-writer` library
- Interactive stroke order animation
- Displays in vocabulary entry modal
- Size: 150px in modal, smaller in card view

---

## 4. Data Flow

### 4.1 Database Schema

**Tables:**
1. **vocabulary** - Main vocabulary entries
   - Fields: word, pinyin1, pinyin2, translation (JSON), description (JSON), tags (array)
   
2. **sentence** - Example sentences
   - Fields: sentence, pinyin1, pinyin2, translation (JSON)
   
3. **paragraph** - Grammar/paragraph entries
   - Fields: id, title, tags (array), translation (JSON), data (array)
   
4. **tag_group** - Tag group definitions
   - Fields: name, display_name, tags (array)

### 4.2 Data Fetching Flow

**Server Components (Initial Load):**
```
User Request → Next.js Server Component
  ↓
fetchDictionaryEntries() / fetchTagGroups()
  ↓
lib/db.ts → DuckDB Query
  ↓
Return Data → Render HTML
  ↓
Send to Client
```

**Client Components (Interactive Features):**
```
User Interaction → Client Component
  ↓
API Route (/api/vocabulary/[word]/examples)
  ↓
lib/data.ts → fetchWordExamples()
  ↓
lib/db.ts → DuckDB Query
  ↓
Return JSON → Update UI
```

### 4.3 Database Management

**Upload Process** (`maindb/upload-db.ts`):
1. Verify database file exists
2. Validate database structure
3. Upload to SeaweedFS S3 bucket `dictionary`
4. Verify upload

**Download Process** (`ui/scripts/download-db.ts`):
1. Connect to SeaweedFS S3
2. Download `database.duckdb` to `ui/data/`
3. Verify download

**Initialization** (`maindb/init-db.sql`):
- Creates tables from JSON files using DuckDB's `read_json_auto()`
- Loads vocabulary, sentence, paragraph, and tag_group data

---

## 5. Component Architecture

### 5.1 Server Components

**Vocabulary Page** (`app/[locale]/vocabulary/page.tsx`):
- Server-side data fetching
- Parallel fetching of tag groups and vocabulary entries
- Dynamic rendering (no static generation)
- SEO-friendly with server-side rendering
- Metadata generation for SEO
- Structured logging

**Home Page** (`app/[locale]/page.tsx`):
- Server-side rendering
- Hero section
- Home sections
- Footer

**Grammar Page** (`app/[locale]/grammar/page.tsx`):
- Server-side data fetching
- Redirects to first grammar entry or specified entry

### 5.2 Client Components

**VocabularyEntry** (`components/VocabularyEntry.tsx`):
- Card view with click-to-expand modal
- Text-to-speech functionality
- Tag filtering on click
- Keyboard navigation (Arrow keys, Escape)
- Lazy-loads examples when modal opens
- Previous/Next navigation in modal
- Stroke order visualization

**VocabularySearch** (`components/VocabularySearch.tsx`):
- Client-side search input
- URL-based state management
- Form submission for search

**VocabularyTagFilter** (`components/VocabularyTagFilter.tsx`):
- Tag group display
- Multi-select tag filtering
- URL-based state management
- Color-coded HSK levels

**StrokeOrder** (`components/StrokeOrder.tsx`):
- Wraps `hanzi-writer` library
- Handles character rendering
- Size configuration

### 5.3 API Routes

**`/api/vocabulary/[word]/examples`**:
- Fetches example sentences for a word
- Handles special characters (e.g., "...")
- Returns JSON array of examples

**`/api/dictionary`**:
- Dictionary API endpoint

**`/api/ui-text`**:
- UI text translations API

---

## 6. Key Implementation Details

### 6.1 Query Optimization

**Vocabulary Query** (`lib/data.ts`):
- Uses CTEs for complex aggregations
- Groups duplicate words
- Merges fields (pinyin, translation, description)
- Conditional example loading (only when needed)
- Efficient pagination with LIMIT/OFFSET
- Smart sorting (exact match → tag → alphabetical)

**Example Query**:
- Handles special characters in words (e.g., correlative conjunctions)
- Splits words by "..." or "…"
- Finds sentences containing ALL parts

### 6.2 Data Cleaning

**`cleanJoinedField()` function**:
- Normalizes Unicode
- Removes duplicate whitespace
- Splits by multiple delimiters (comma, semicolon, multiple spaces)
- Removes duplicates while preserving order
- Case-sensitive for pinyin

### 6.3 Logging

**Structured Logging**:
- All operations log JSON-formatted data
- Includes: type, action, duration, success, error
- Logs: API calls, SQL queries, page loads, data fetches

### 6.4 Error Handling

- Try-catch blocks in all data fetching functions
- Error logging with structured format
- Graceful fallbacks (e.g., English translation if Vietnamese missing)
- Database connection retry logic

---

## 7. Deployment

### 7.1 Docker Setup

**docker-compose.yml**:
- **ui**: Next.js application (port 3333)
- **seaweed-master**: SeaweedFS master (port 9333)
- **seaweed-volume**: SeaweedFS volume (port 8080)
- **seaweed-filer**: SeaweedFS filer (port 8888)
- **seaweed-s3**: SeaweedFS S3 gateway (port 8333)

**Volumes**:
- `./ui/data` mounted to persist database
- `./seaweed/data` for SeaweedFS data

### 7.2 Environment Variables

- `NODE_ENV`: production/development
- `PORT`: Application port (default: 3333)
- AWS S3 credentials for SeaweedFS (via `.env`)

---

## 8. Testing

### 8.1 E2E Tests (Playwright)

**Test Files**:
- `home.spec.ts`: Home page tests
- `navigation.spec.ts`: Navigation tests
- `vocabulary.spec.ts`: Vocabulary page tests
- `vocabulary-entry.spec.ts`: Vocabulary entry tests
- `vocabulary-examples.spec.ts`: Example sentences tests

**Coverage**:
- Page navigation
- Search functionality
- Tag filtering
- Vocabulary entry display
- Modal interactions
- Example sentence loading

---

## 9. Strengths

✅ **Modern Architecture**:
- Next.js 15 with App Router
- Server Components for optimal performance
- Type-safe TypeScript implementation
- Clean component structure

✅ **Efficient Data Layer**:
- DuckDB for fast analytical queries
- SeaweedFS for distributed storage
- Well-structured data flow
- Efficient query optimization

✅ **User Experience**:
- Multi-language support (en/vi/zh)
- Advanced search and filtering
- Clean, responsive UI
- Structured logging for monitoring
- Example sentences
- Grammar explanations
- Text-to-speech
- Stroke order visualization

✅ **Development Experience**:
- TypeScript for type safety
- Clear code organization
- Docker containerization
- E2E testing setup
- Structured logging

---

## 10. Areas for Improvement

### 10.1 Security

⚠️ **SQL Injection Risk**:
- Current queries use string interpolation for search terms
- Should use parameterized queries or proper escaping
- Example: `LIKE '${escapedSearch}'` could be improved

**Recommendation**: Use DuckDB's parameterized queries or a query builder

### 10.2 Performance

⚠️ **Potential Optimizations**:
- Add database indexes for common queries
- Implement caching layer (Redis) for frequently accessed data
- Add CDN for static assets
- Optimize bundle size (code splitting)

### 10.3 Features

💡 **Potential Enhancements**:
- User authentication and progress tracking
- Spaced repetition system
- Flashcard functionality
- Writing practice
- Pronunciation recording/feedback
- Mobile app (PWA)
- Offline support

### 10.4 Code Quality

⚠️ **Improvements**:
- Add unit tests for utility functions
- Expand E2E test coverage
- Add integration tests
- Implement error boundaries
- Add input validation middleware

### 10.5 Documentation

💡 **Enhancements**:
- API documentation
- Component documentation
- Database schema documentation
- Deployment guide
- Development setup guide

---

## 11. Data Statistics

Based on file structure:
- **Vocabulary**: HSK 1-9 + specialized categories (computer, conjunction, daily, food, learning, quantifier)
- **Sentences**: Multiple categories with example sentences
- **Grammar**: Multiple grammar categories (adjunct, adverb, complement, negation, preposition, quantifier)
- **Database Size**: Large DuckDB file (likely several MB)

---

## 12. Conclusion

This is a **well-architected, production-ready Chinese language learning platform** with:

- ✅ Modern tech stack (Next.js, DuckDB, TypeScript)
- ✅ Comprehensive vocabulary database (HSK 1-9)
- ✅ Multi-language support
- ✅ Advanced search and filtering
- ✅ Interactive features (text-to-speech, stroke order)
- ✅ Clean, maintainable code structure
- ✅ Docker deployment setup
- ✅ E2E testing

**Primary Use Case**: Chinese language learners studying vocabulary, grammar, and example sentences with a focus on HSK levels 1-9.

**Recommended Next Steps**:
1. Implement parameterized queries for security
2. Add caching layer for performance
3. Expand test coverage
4. Add user authentication and progress tracking
5. Implement mobile-responsive optimizations

---

*Analysis completed: January 2025*

