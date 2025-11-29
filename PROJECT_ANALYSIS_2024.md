# LMS Project - Comprehensive Analysis

**Date:** December 2024  
**Project Type:** Chinese Language Learning Management System  
**Status:** Production-ready with comprehensive features

---

## Executive Summary

This is a **Chinese Language Learning Management System (LMS)** built with modern web technologies. The project provides a multilingual (English/Vietnamese/Chinese) interface for exploring Chinese vocabulary with comprehensive HSK word lists, featuring advanced search, filtering, pagination, stroke order visualization, and example sentences.

**Key Highlights:**
- ✅ Next.js 15 with App Router (Server Components)
- ✅ DuckDB embedded database for fast analytical queries
- ✅ SeaweedFS for distributed storage (S3-compatible)
- ✅ Multi-language support (en/vi/zh)
- ✅ Advanced vocabulary search and tag filtering
- ✅ Server-side rendering for optimal performance
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ Interactive stroke order visualization
- ✅ Example sentences with translations
- ✅ Text-to-speech pronunciation
- ✅ Comprehensive E2E testing with Playwright

---

## 1. Project Architecture

### 1.1 Directory Structure

```
lms/
├── ui/                          # Next.js frontend application
│   ├── app/
│   │   ├── [locale]/            # Internationalized routes (en/vi/zh)
│   │   │   ├── page.tsx         # Home page
│   │   │   ├── vocabulary/     # Vocabulary dictionary page
│   │   │   └── about/           # About page
│   │   └── api/                 # API routes
│   │       ├── vocabulary/      # Vocabulary API endpoint
│   │       ├── dictionary/      # Dictionary API endpoint
│   │       └── ui-text/         # UI text translations API
│   ├── components/              # React components
│   │   ├── VocabularySearch.tsx
│   │   ├── VocabularyTagFilter.tsx
│   │   ├── VocabularyEntry.tsx
│   │   ├── VocabularyPagination.tsx
│   │   ├── StrokeOrder.tsx     # Hanzi stroke order visualization
│   │   ├── NavBar.tsx
│   │   ├── Hero.tsx
│   │   ├── HomeSections.tsx
│   │   ├── Footer.tsx
│   │   └── LanguageSwitcher.tsx
│   ├── lib/
│   │   ├── db.ts               # DuckDB connection & query utilities
│   │   ├── data.ts             # Data fetching functions
│   │   ├── ui-text.ts          # UI text loader with i18n
│   │   └── i18n.ts             # Internationalization helpers
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── constants/
│   │   └── ui-text.json        # UI text translations
│   ├── data/                   # Local database file (DuckDB)
│   └── scripts/
│       └── download-db.ts     # Database download script
│
├── maindb/                      # Database management
│   ├── data/
│   │   ├── vocabulary/         # JSON vocabulary files
│   │   │   ├── hsk.json        # HSK word list
│   │   │   ├── computer.json   # Computer-related vocabulary
│   │   │   ├── conjunction.json # Conjunctions
│   │   │   ├── daily.json      # Daily vocabulary
│   │   │   └── food.json       # Food vocabulary
│   │   ├── sentence/           # Example sentences
│   │   └── tag-group.json      # Tag group definitions
│   ├── database.duckdb         # Compiled DuckDB database
│   ├── init-db.sql             # Database initialization script
│   └── upload-db.ts            # Script to upload DB to SeaweedFS
│
├── test/                        # E2E tests with Playwright
│   ├── home.spec.ts
│   ├── navigation.spec.ts
│   ├── vocabulary.spec.ts
│   ├── vocabulary-entry.spec.ts
│   └── vocabulary-examples.spec.ts
│
└── seaweed/                     # SeaweedFS storage
    ├── config/
    │   └── s3.json              # S3 configuration
    └── data/                    # SeaweedFS volume data
```

### 1.2 Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Frontend Framework** | Next.js | 15.1.0 | React framework with App Router |
| **UI Library** | React | 19.2.0 | Component library |
| **Database** | DuckDB | 1.0.0 | Embedded analytical database |
| **Storage** | SeaweedFS | Latest | Distributed file system (S3-compatible) |
| **Styling** | Tailwind CSS | 4.1.17 | Utility-first CSS framework |
| **Language** | TypeScript | 5.9.3 | Type-safe JavaScript |
| **Containerization** | Docker | - | Container orchestration |
| **Character Visualization** | hanzi-writer | 3.7.3 | Chinese character stroke order |
| **Testing** | Playwright | 1.48.0 | E2E testing framework |

---

## 2. Core Features

### 2.1 Internationalization (i18n)

**Implementation:**
- **Middleware-based routing** (`middleware.ts`): Automatically redirects to locale-prefixed paths
- **Supported locales**: `en`, `vi`, `zh` (English, Vietnamese, Chinese)
- **Locale detection**: 
  1. URL path (`/en/...`, `/vi/...`, `/zh/...`)
  2. `Accept-Language` HTTP header
  3. Default: English

**Translation Strategy:**
- Nested translation structure in JSON (`constants/ui-text.json`)
- UI text loaded from JSON files
- Database translations stored as JSON objects with language keys (`translation.en`, `translation.vi`)
- Fallback to English if translation missing

### 2.2 Vocabulary Dictionary

**Features:**
- **Search**: Multi-field search (word, pinyin, translation)
- **Tag Filtering**: Filter by HSK levels and custom tags (OR logic - shows entries with ANY selected tag)
- **Pagination**: Configurable page size (default: 50 entries)
- **Multi-language**: Translations in English and Vietnamese
- **Data Grouping**: Groups duplicate words and merges fields
- **Example Sentences**: Automatically finds and displays example sentences containing each word
- **Stroke Order**: Interactive visualization of Chinese character stroke order
- **Text-to-Speech**: Browser-based pronunciation using Web Speech API

**Data Structure:**
```typescript
interface DictionaryEntry {
  id: string;
  tags: string[];        // e.g., ["HSK1", "HSK2", "conjunction"]
  word: string;          // Chinese character/word
  pinyin1: string;      // Pinyin with tone marks (nǐ hǎo)
  pinyin2: string;      // Pinyin with tone numbers (ni3 hao3)
  translation: string;  // Translation in current locale
  examples?: ExampleSentence[]; // Example sentences
}

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

**Vocabulary Sources:**
- HSK word lists (levels 1-9)
- Computer-related vocabulary
- Daily vocabulary
- Food vocabulary
- Conjunctions
- Custom tag groups

### 2.3 Tag System

**Tag Groups:**
- Hierarchical tag organization
- Each tag group contains multiple tags
- Tags support multilingual display names and descriptions

**Filtering Logic:**
- Multiple tag selection (OR logic)
- Tags are stored as arrays in the database
- Uses `array_position()` for efficient filtering
- Clicking a tag adds it to the filter and resets to page 1

### 2.4 Stroke Order Visualization

**Features:**
- Interactive stroke order animation using `hanzi-writer`
- Three speed presets: Slow (0.5x), Normal (2x), Fast (4x)
- Play/Pause/Resume controls
- Modal view for enlarged characters
- Supports multi-character words
- Filters out punctuation and whitespace
- Prevents layout shift with loading placeholders

**Implementation:**
- Creates 3 separate writers per character (one for each speed)
- Uses absolute positioning to stack writers
- Dynamically imports character data from `hanzi-writer-data`
- Handles cleanup and error states gracefully

### 2.5 Example Sentences

**Features:**
- Automatically finds sentences containing each vocabulary word
- Uses DuckDB's `CONTAINS()` function for matching
- Displays up to 2 examples per entry
- Shows sentence, pinyin, and translation
- Locale-aware translation display

**Query Logic:**
```sql
LEFT JOIN sentence s ON CONTAINS(s.sentence, v.word)
```

---

## 3. Database Architecture

### 3.1 DuckDB Database

**Tables:**
1. **`vocabulary`**: Main vocabulary table
   - Source: `data/vocabulary/*.json` files
   - Fields: `word`, `pinyin1`, `pinyin2`, `tags` (array), `translation` (JSON object)
   
2. **`sentence`**: Example sentences table
   - Source: `data/sentence/*.json` files
   - Fields: `sentence`, `pinyin1`, `pinyin2`, `translation` (JSON object)
   
3. **`tag_group`**: Tag group definitions
   - Source: `data/tag-group.json`
   - Contains tag hierarchies and metadata

**Initialization** (`maindb/init-db.sql`):
```sql
DROP TABLE IF EXISTS vocabulary;
DROP TABLE IF EXISTS sentence;
DROP TABLE IF EXISTS tag_group;
CREATE TABLE sentence as SELECT * FROM read_json_auto('data/sentence/*.json');
CREATE TABLE vocabulary as SELECT * FROM read_json_auto('data/vocabulary/*.json');
CREATE TABLE tag_group as SELECT * FROM read_json_auto('data/tag-group.json');
```

**Connection Management** (`lib/db.ts`):
- Singleton pattern for connection reuse
- Read-only mode in production
- Connection pooling via singleton
- Error handling with retry capability
- Structured JSON logging for all queries
- SQL query compaction (removes whitespace for logging)

### 3.2 Data Flow

```
┌─────────────────┐
│  JSON Files     │
│  (vocabulary/*) │
│  (sentence/*)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  init-db.sql    │
│  (DuckDB)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  database.duckdb│
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌──────────────┐
│  SeaweedFS S3   │  │  ui/data/   │
│  (Production)   │  │  (Local)    │
└─────────────────┘  └──────────────┘
```

**Upload Process** (`maindb/upload-db.ts`):
1. Verify database file exists
2. Validate database structure (check tables, row counts)
3. Upload to SeaweedFS S3 bucket `dictionary`
4. Key: `database.duckdb`
5. Verify uploaded data by downloading and checking

**Download Process** (`ui/scripts/download-db.ts`):
1. Connect to SeaweedFS S3
2. Download `database.duckdb` to `ui/data/`
3. Verify download (list tables)
4. Atomic write (temp file → rename)

### 3.3 Query Optimization

**Complex Query Structure:**
- Uses CTEs (Common Table Expressions) for complex grouping
- `word_examples` CTE: Finds example sentences using `CONTAINS()`
- `expanded_tags` CTE: Expands tag arrays
- `aggregated_tags` CTE: Groups and deduplicates tags
- `grouped_data` CTE: Merges all fields by word
- Efficient pagination with `LIMIT`/`OFFSET`
- `string_agg()` with `DISTINCT` for concatenating values
- Language-specific translation extraction with fallback

**Field Cleaning:**
- `cleanJoinedField()` function normalizes whitespace
- Removes duplicates from joined fields
- Handles multiple delimiters (comma, semicolon, multiple spaces)
- Unicode normalization (NFC)

---

## 4. Component Architecture

### 4.1 Server Components

**Vocabulary Page** (`app/[locale]/vocabulary/page.tsx`):
- Server-side data fetching
- Parallel fetching of tag groups and vocabulary entries
- Dynamic rendering (no static generation)
- SEO-friendly with server-side rendering
- Metadata generation for SEO
- Structured logging for performance monitoring

**Home Page** (`app/[locale]/page.tsx`):
- Server-side rendering
- Hero section
- Home sections
- Footer

### 4.2 Client Components

**VocabularySearch** (`components/VocabularySearch.tsx`):
- Client-side search input
- URL-based state management
- Form submission for search
- Locale-aware UI text

**VocabularyTagFilter** (`components/VocabularyTagFilter.tsx`):
- Multi-select tag filtering
- URL parameter synchronization
- Hierarchical tag display
- Locale-aware tag names

**VocabularyEntry** (`components/VocabularyEntry.tsx`):
- Displays individual vocabulary entries
- Shows word, pinyin, translation
- Tag display with color coding
- Clickable tags for filtering
- Example sentences display
- Text-to-speech pronunciation button
- Stroke order visualization integration

**VocabularyPagination** (`components/VocabularyPagination.tsx`):
- Page navigation controls
- Shows current page, total pages, total entries
- URL-based state management

**StrokeOrder** (`components/StrokeOrder.tsx`):
- Hanzi stroke order visualization
- Uses `hanzi-writer` library
- Three-speed animation system
- Modal view for enlarged display
- Complex state management for multiple characters

### 4.3 Component Communication

```
┌─────────────────────┐
│  VocabularyPage     │
│  (Server Component) │
└──────────┬──────────┘
           │
           ├─────────────────┐
           │                 │
           ▼                 ▼
┌──────────────────┐  ┌──────────────────┐
│  VocabularySearch│  │ VocabularyTagFilter│
│  (Client)        │  │  (Client)         │
└──────────┬───────┘  └──────────┬────────┘
           │                     │
           │  URL Parameters     │
           │  (search, tag, page)│
           │                     │
           └──────────┬──────────┘
                      │
                      ▼
           ┌──────────────────┐
           │  Server Re-render│
           │  (New Query)     │
           └──────────────────┘
```

---

## 5. API Endpoints

### 5.1 `/api/vocabulary`

**Method:** GET

**Query Parameters:**
- `page` (number, default: 1)
- `pageSize` (number, default: 50)
- `search` (string, optional)
- `tag` (string[], optional) - Multiple tags supported

**Response:**
```typescript
{
  data: {
    entries: DictionaryEntry[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  success: boolean;
  error?: string;
}
```

**Implementation:**
- Server-side API route
- Uses `fetchDictionaryEntries()` from `lib/data.ts`
- Supports multiple tags via `getAll('tag')`
- Structured JSON logging for monitoring

### 5.2 `/api/ui-text`

**Method:** GET

**Response:**
- UI text translations for current locale
- Loaded from `constants/ui-text.json`

---

## 6. Testing Infrastructure

### 6.1 Playwright E2E Tests

**Test Files:**
- `home.spec.ts` - Home page and locale switching
- `navigation.spec.ts` - Navigation between pages
- `vocabulary.spec.ts` - Vocabulary page functionality
- `vocabulary-entry.spec.ts` - Individual entry components
- `vocabulary-examples.spec.ts` - Example sentences display

**Test Coverage:**
- Page loading and navigation
- Search functionality
- Tag filtering
- Pagination
- Multi-locale support
- Component interactions
- Text-to-speech functionality
- Example sentences display

**Configuration:**
- Auto-starts dev server before tests
- Runs in Chromium by default
- Generates HTML reports
- Takes screenshots on failure
- Collects traces for debugging

---

## 7. Security Analysis

### 7.1 Current Security Measures

✅ **Implemented:**
- Read-only database access in production
- SQL escaping for search terms (single quotes and backslashes)
- Server-side validation of query parameters
- Type-safe API responses
- Structured logging for monitoring

⚠️ **Potential Issues:**

1. **SQL Injection Risk** (`lib/data.ts:224-235`):
   - **Risk**: User input directly interpolated into SQL (though escaped)
   - **Current Mitigation**: Escaping single quotes and backslashes
   - **Recommendation**: Use DuckDB's parameterized queries for better security

2. **No Authentication/Authorization**:
   - All endpoints are publicly accessible
   - No user management system
   - No rate limiting

3. **No Input Validation**:
   - Page size can be set to very large values
   - Search terms not length-limited
   - No sanitization beyond SQL escaping

### 7.2 Recommendations

1. **Implement Parameterized Queries:**
   ```typescript
   // Instead of string interpolation
   await query(
     `SELECT * FROM vocabulary WHERE word LIKE ?`,
     [`%${search}%`]
   );
   ```

2. **Add Rate Limiting:**
   - Use middleware for API routes
   - Limit requests per IP

3. **Input Validation:**
   - Validate page size (max 100)
   - Limit search term length
   - Sanitize tag names

4. **Environment Variables:**
   - Move S3 credentials to environment variables
   - Use secrets management

---

## 8. Performance Characteristics

### 8.1 Strengths

✅ **Server-Side Rendering:**
- Initial page load is fast
- SEO-friendly
- No client-side data fetching for initial render

✅ **Embedded Database:**
- No network latency for queries
- DuckDB optimized for analytical queries
- Efficient connection pooling

✅ **Pagination:**
- Limits data transfer
- Fast queries with LIMIT/OFFSET

✅ **Connection Management:**
- Singleton pattern prevents connection leaks
- Connection reuse across requests

✅ **Structured Logging:**
- All queries and API calls are logged
- Performance monitoring built-in
- JSON format for easy parsing

✅ **Caching Headers:**
- Static assets cached for 30 days
- Immutable cache for `_next/static`

### 8.2 Potential Optimizations

1. **Caching:**
   - Add Redis for frequently accessed data
   - Cache tag groups (rarely change)
   - Cache UI text translations

2. **Database Indexes:**
   - Index on `word` column (if not already indexed)
   - Index on `tags` array (if DuckDB supports it)

3. **Query Optimization:**
   - Consider materialized views for common queries
   - Pre-compute tag aggregations

4. **CDN:**
   - Serve static assets via CDN
   - Cache API responses

5. **Incremental Updates:**
   - Instead of full database replacement
   - Support partial updates

---

## 9. Development Workflow

### 9.1 Local Development

```bash
# 1. Start UI development server
cd ui
npm run dev  # Port 3333

# 2. Initialize database (if needed)
cd maindb
# Run init-db.sql to create DuckDB from JSON files

# 3. Upload database to SeaweedFS (optional)
npm run upload

# 4. Download database in UI (if using SeaweedFS)
cd ui
npm run download-db

# 5. Run tests
cd test
npm test
```

### 9.2 Production Deployment

```bash
# Start all services with Docker Compose
docker-compose up -d

# Services:
# - ui: Next.js app (port 3333)
# - seaweed-master: SeaweedFS master (port 9333)
# - seaweed-volume: Volume server (port 8080)
# - seaweed-filer: File server (port 8888)
# - seaweed-s3: S3 API (port 8333)
```

### 9.3 Database Management

**Upload Process:**
1. Build database: `maindb/init-db.sql` creates `database.duckdb`
2. Verify: Script checks tables exist and shows row counts
3. Upload: `maindb/upload-db.ts` uploads to SeaweedFS
4. Verify: Downloads and verifies uploaded database

**Download Process:**
1. Check connection to SeaweedFS
2. Download `database.duckdb` to `ui/data/`
3. Verify: List tables to confirm download
4. Atomic write: Temp file → rename

---

## 10. Code Quality & Patterns

### 10.1 Strengths

✅ **Type Safety:**
- Full TypeScript implementation
- Well-defined interfaces
- Type-safe API responses

✅ **Error Handling:**
- Try-catch blocks in data fetching
- Error logging with context
- Graceful fallbacks
- Structured error logging

✅ **Code Organization:**
- Clear separation of concerns
- Reusable utility functions
- Consistent naming conventions

✅ **Modern React Patterns:**
- Server Components for data fetching
- Client Components for interactivity
- Proper use of hooks
- Suspense for loading states

✅ **Logging:**
- Structured JSON logging
- Performance monitoring
- API call tracking
- Database query logging

✅ **Testing:**
- Comprehensive E2E tests with Playwright
- Test IDs for reliable element selection
- Multiple test scenarios

### 10.2 Areas for Improvement

1. **SQL Injection Prevention:**
   - Replace string interpolation with parameterized queries
   - Use DuckDB's prepared statements

2. **Error Handling:**
   - More specific error types
   - User-friendly error messages
   - Error boundaries in React

3. **Testing:**
   - Add unit tests for data functions
   - Add integration tests for API routes
   - Add component tests with React Testing Library

4. **Documentation:**
   - Add JSDoc comments to functions
   - Document complex SQL queries
   - API documentation

---

## 11. Dependencies Analysis

### 11.1 Production Dependencies

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `next` | 15.1.0 | Framework | Latest stable |
| `react` | 19.2.0 | UI Library | Latest version |
| `react-dom` | 19.2.0 | React DOM | Latest version |
| `duckdb` | 1.0.0 | Database | Embedded DB |
| `@aws-sdk/client-s3` | 3.700.0 | S3 Client | For SeaweedFS |
| `hanzi-writer` | 3.7.3 | Stroke Order | Chinese character visualization |
| `hanzi-writer-data` | 2.0.1 | Stroke Data | Character data |

### 11.2 Notable Dependencies

**`hanzi-writer`**: Used for stroke order visualization
- Provides interactive character writing
- Supports animation with speed control
- Handles multi-character words

---

## 12. Known Issues & Limitations

### 12.1 Current Limitations

1. **No User Management:**
   - No authentication system
   - No user accounts
   - No progress tracking

2. **Static Content:**
   - Course content appears static
   - No dynamic lesson generation
   - No interactive exercises

3. **Translation Coverage:**
   - Some dictionary entries may lack Vietnamese translations
   - Incomplete Chinese (zh) locale support in some areas

4. **Search Limitations:**
   - No fuzzy search
   - No phonetic search (pinyin without tones)
   - No character decomposition search

5. **No Offline Support:**
   - Requires database file
   - No service workers
   - No PWA capabilities

### 12.2 Technical Debt

1. **SQL Injection Risk:**
   - String interpolation in queries
   - Needs parameterized queries

2. **Limited Testing:**
   - No unit tests
   - No integration tests
   - E2E tests exist but could be expanded

3. **Error Handling:**
   - Generic error messages
   - No error boundaries
   - Limited error recovery

---

## 13. Future Enhancement Opportunities

### 13.1 Feature Enhancements

1. **User System:**
   - User registration/login
   - Progress tracking
   - Learning analytics
   - Personalized recommendations

2. **Learning Features:**
   - Spaced repetition system (SRS)
   - Flashcard system
   - Quizzes and assessments
   - Audio pronunciation (pre-recorded)
   - Interactive lessons

3. **Search Improvements:**
   - Fuzzy search
   - Phonetic search
   - Character decomposition
   - Advanced filters

4. **Mobile Support:**
   - PWA implementation
   - Mobile-optimized UI
   - Offline support

### 13.2 Technical Improvements

1. **Performance:**
   - Add caching layer (Redis)
   - Implement CDN
   - Optimize database queries
   - Add database indexes

2. **Security:**
   - Implement authentication
   - Add rate limiting
   - Parameterized queries
   - Input validation

3. **Testing:**
   - Unit tests
   - Integration tests
   - Expanded E2E tests
   - Performance tests

4. **Monitoring:**
   - Error tracking (Sentry)
   - Performance monitoring
   - Analytics
   - Logging system (already partially implemented)

---

## 14. Conclusion

### 14.1 Project Strengths

✅ **Modern Architecture:**
- Next.js 15 with App Router
- Server Components for optimal performance
- Type-safe TypeScript implementation

✅ **Efficient Data Layer:**
- DuckDB for fast analytical queries
- SeaweedFS for distributed storage
- Well-structured data flow

✅ **User Experience:**
- Multi-language support
- Advanced search and filtering
- Clean, responsive UI
- Interactive stroke order visualization
- Example sentences
- Text-to-speech pronunciation
- Structured logging for monitoring

✅ **Testing:**
- Comprehensive E2E tests
- Good test coverage of core features

### 14.2 Recommendations

**High Priority:**
1. Fix SQL injection risks (parameterized queries)
2. Add input validation and rate limiting
3. Implement basic authentication (if needed)

**Medium Priority:**
1. Add caching layer
2. Implement unit and integration tests
3. Add error boundaries
4. Expand E2E test coverage

**Low Priority:**
1. User management system
2. Learning features (SRS, flashcards)
3. Mobile/PWA support

### 14.3 Overall Assessment

This is a **well-structured, production-ready** application with:
- Solid architecture and code organization
- Efficient data handling with DuckDB
- Modern React/Next.js patterns
- Good internationalization support
- Comprehensive logging and monitoring
- Interactive learning features (stroke order, examples)
- Good test coverage with Playwright

The project demonstrates excellent engineering practices but would benefit from:
- Enhanced security measures (parameterized queries)
- Expanded testing infrastructure
- Performance optimizations (caching)
- User management features (if needed)

**Rating: 8.5/10** - Excellent foundation with room for enhancement in security, testing, and user features.

---

## Appendix: Key Files Reference

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `ui/lib/data.ts` | Data fetching functions | 525 | ⚠️ SQL injection risk |
| `ui/lib/db.ts` | Database connection | 177 | ✅ Good |
| `ui/middleware.ts` | i18n routing | 50 | ✅ Good |
| `ui/app/[locale]/vocabulary/page.tsx` | Vocabulary page | 157 | ✅ Good |
| `ui/app/[locale]/page.tsx` | Home page | 53 | ✅ Good |
| `ui/components/VocabularyEntry.tsx` | Entry component | 224 | ✅ Good |
| `ui/components/StrokeOrder.tsx` | Stroke visualization | 992 | ✅ Good |
| `maindb/upload-db.ts` | Database upload | 393 | ✅ Good |
| `ui/scripts/download-db.ts` | Database download | ~260 | ✅ Good |
| `ui/lib/ui-text.ts` | UI text loader | ~84 | ✅ Good |
| `test/vocabulary.spec.ts` | E2E tests | 145 | ✅ Good |

---

*Analysis Date: December 2024*  
*Analyzed by: AI Code Analysis System*

