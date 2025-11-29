# LMS Project Analysis

## Overview

This is a **Chinese Language Learning Management System (LMS)** built with Next.js 15, featuring a bilingual (English/Vietnamese) interface for learning Chinese courses and accessing a comprehensive HSK (Hanyu Shuiping Kaoshi) word dictionary.

## Architecture

### Technology Stack

- **Frontend Framework**: Next.js 15.1.0 (App Router)
- **React**: 19.2.0
- **Database**: DuckDB (embedded analytical database)
- **Storage**: SeaweedFS (distributed file system with S3-compatible API)
- **Styling**: Tailwind CSS 4.1.17
- **Language**: TypeScript 5.9.3
- **Containerization**: Docker & Docker Compose

### Project Structure

```
lms/
├── ui/                    # Next.js frontend application
│   ├── app/              # Next.js App Router
│   │   ├── [locale]/     # Internationalized routes (en/vi)
│   │   └── api/          # API routes
│   ├── components/       # React components
│   ├── lib/              # Utility functions (DB, data fetching)
│   ├── types/            # TypeScript type definitions
│   └── data/             # Local database file (DuckDB)
│
├── maindb/               # Database management scripts
│   ├── data/             # Source JSON files
│   │   ├── courses.json
│   │   └── hsk-word-list.json
│   ├── database.duckdb  # Compiled DuckDB database
│   ├── init-db.sql      # Database initialization script
│   └── upload-db.ts     # Script to upload DB to SeaweedFS
│
└── seaweed/             # SeaweedFS storage configuration
    ├── config/          # S3 configuration
    └── data/            # SeaweedFS volume data
```

## Core Features

### 1. **Bilingual Support (i18n)**
- **Locales**: English (`en`) and Vietnamese (`vi`)
- **Middleware**: Automatic locale detection from `Accept-Language` header
- **URL Structure**: `/{locale}/...` (e.g., `/en/courses`, `/vi/dictionary`)
- **Fallback**: Defaults to English if locale not specified
- **UI Text**: Separate translation files for UI elements

### 2. **Course Management**
- **Data Source**: `courses.json` → DuckDB `courses` table
- **Features**:
  - Course listings with titles, descriptions, levels
  - Lesson counts
  - Bilingual course information
- **API Endpoint**: `/api/courses`
- **Component**: `CourseGrid`, `CourseCard`

### 3. **HSK Dictionary**
- **Data Source**: `hsk-word-list.json` → DuckDB `dictionary` table
- **Features**:
  - ~49,000+ Chinese words/characters
  - HSK levels 1-6
  - Pinyin (with tone marks and tone numbers)
  - Bilingual translations (English/Vietnamese)
  - Search functionality (word, pinyin, translation, level)
  - Pagination (default: 50 entries per page)
- **API Endpoint**: `/api/dictionary?page=1&pageSize=50&search=...`
- **Components**: `DictionarySearch`, `DictionaryEntry`, `DictionaryPagination`

### 4. **Database Architecture**

#### DuckDB Database
- **Type**: Embedded analytical database (read-only in production)
- **Location**: `ui/data/database.duckdb`
- **Tables**:
  1. `courses` - Course information
  2. `dictionary` - HSK word list

#### Database Initialization
```sql
-- init-db.sql
CREATE TABLE dictionary AS SELECT * FROM read_json_auto('data/hsk-word-list.json');
CREATE TABLE courses AS SELECT * FROM read_json_auto('data/courses.json');
```

#### Data Flow
1. **Development**: JSON files → DuckDB (via `init-db.sql`)
2. **Production**: DuckDB uploaded to SeaweedFS S3
3. **Runtime**: UI downloads DB from SeaweedFS on startup

### 5. **Storage System (SeaweedFS)**

#### Services
- **seaweed-master**: Master node (port 9333)
- **seaweed-volume**: Volume server (port 8080)
- **seaweed-filer**: File server (port 8888)
- **seaweed-s3**: S3-compatible API (port 8333)

#### Purpose
- Store and distribute the DuckDB database file
- S3-compatible API for database upload/download
- Bucket: `dictionary`
- Key: `database.duckdb`

#### Workflow
1. **Upload**: `maindb/upload-db.ts` uploads database to SeaweedFS
2. **Download**: `ui/scripts/download-db.ts` downloads database on deployment

## Data Fetching Strategy

The project uses **Server-Side Rendering (SSR)** with Next.js App Router:

### Current Implementation
- **Server Components**: Fetch data directly from DuckDB
- **API Routes**: Provide REST endpoints for client-side fetching (if needed)
- **Hybrid Approach**: Can combine both for optimal performance

### Data Fetching Functions (`lib/data.ts`)
- `fetchCourses(language)` - Fetch all courses
- `fetchCourseById(id, language)` - Fetch single course
- `fetchDictionaryEntries(options)` - Fetch dictionary with pagination/search
- `fetchDictionaryEntryById(id, language)` - Fetch single dictionary entry

### Database Connection (`lib/db.ts`)
- Singleton connection pattern
- Read-only mode for production
- Automatic connection pooling
- Error handling and retry logic

## Internationalization (i18n)

### Locale Detection
1. URL path (`/en/...` or `/vi/...`)
2. `Accept-Language` HTTP header
3. Default: English

### Translation Strategy
- **Course/Dictionary Data**: Stored in database with nested JSON fields
  ```json
  {
    "title": {
      "en": "Course Title",
      "vi": "Tiêu đề khóa học"
    }
  }
  ```
- **UI Text**: Separate JSON file (`constants/ui-text.json`)
- **Fallback**: If translation missing, falls back to English

### Middleware (`middleware.ts`)
- Intercepts all requests
- Redirects to locale-prefixed paths
- Excludes API routes and static assets

## Component Architecture

### Server Components
- `app/[locale]/page.tsx` - Home page (fetches courses server-side)
- `app/[locale]/dictionary/page.tsx` - Dictionary page

### Client Components
- `CourseGrid` - Displays course cards
- `CourseCard` - Individual course card
- `DictionarySearch` - Search input
- `DictionaryEntry` - Dictionary entry display
- `DictionaryPagination` - Pagination controls
- `LanguageSwitcher` - Locale switcher
- `NavBar` - Navigation bar
- `Hero` - Hero section
- `Footer` - Footer

## API Endpoints

### `/api/courses`
- **Method**: GET
- **Response**: `{ data: Course[], success: boolean, error?: string }`
- **Language**: Detected from request (currently defaults to 'en')

### `/api/dictionary`
- **Method**: GET
- **Query Parameters**:
  - `page` (default: 1)
  - `pageSize` (default: 50)
  - `search` (optional)
- **Response**: `{ data: { entries, total, page, pageSize, totalPages }, success: boolean }`

### `/api/ui-text`
- **Method**: GET
- **Response**: UI text translations for current locale

## Docker Setup

### Services
1. **ui**: Next.js application (port 3333)
2. **seaweed-master**: SeaweedFS master
3. **seaweed-volume**: SeaweedFS volume server
4. **seaweed-filer**: SeaweedFS file server
5. **seaweed-s3**: SeaweedFS S3 API

### Volume Mounts
- `./ui/data:/app/data` - Database persistence
- `./seaweed/data:/data` - SeaweedFS data

### Environment Variables
- `NODE_ENV=production`
- `PORT=3333`
- `S3_ENDPOINT=http://localhost:8333`
- `S3_ACCESS_KEY=admin`
- `S3_SECRET_KEY=admin123`

## Development Workflow

### Local Development
```bash
# Start UI
cd ui
npm run dev  # Port 3333

# Initialize database
cd maindb
# Run init-db.sql to create DuckDB from JSON files

# Upload database to SeaweedFS
npm run upload

# Download database in UI
cd ui
npm run download-db
```

### Production Deployment
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f ui
```

## Data Structure

### Course (`Course`)
```typescript
{
  id: string;
  title: string;
  description?: string;
  level?: string;
  lessonCount?: number;
}
```

### Dictionary Entry (`DictionaryEntry`)
```typescript
{
  id: string;
  level: string;        // HSK level (1-6)
  word: string;          // Chinese character/word
  pinyin1: string;       // Pinyin with tone marks
  pinyin2: string;       // Pinyin with tone numbers
  translation: string;   // Translation (en or vi)
}
```

## Security Considerations

### Current State
- ✅ SQL injection protection (parameterized queries where possible)
- ✅ Read-only database access in production
- ⚠️ Some string interpolation in SQL (search functionality)
- ⚠️ No authentication/authorization implemented
- ⚠️ No rate limiting on API endpoints

### Recommendations
1. Implement proper SQL parameterization for search queries
2. Add authentication for admin functions
3. Implement rate limiting
4. Add input validation and sanitization
5. Use environment variables for sensitive config

## Performance Characteristics

### Strengths
- ✅ Server-side rendering for SEO and initial load
- ✅ Embedded database (no network latency)
- ✅ Efficient DuckDB queries
- ✅ Pagination for large datasets
- ✅ Connection pooling

### Potential Optimizations
1. Add caching layer (Redis) for frequently accessed data
2. Implement database query caching
3. Add CDN for static assets
4. Optimize database indexes
5. Implement incremental data updates

## Known Issues / Limitations

1. **Translation Coverage**: Some dictionary entries missing Vietnamese translations (being addressed)
2. **Search SQL Injection Risk**: Search uses string interpolation (needs parameterization)
3. **No User Management**: No authentication or user accounts
4. **No Progress Tracking**: No user progress or learning analytics
5. **Static Content**: Course content appears to be static (no dynamic lessons)

## Future Enhancements

### Suggested Features
1. **User Accounts**: Registration, login, profiles
2. **Progress Tracking**: Track user learning progress
3. **Spaced Repetition**: Implement SRS for vocabulary learning
4. **Interactive Lessons**: Dynamic course content with exercises
5. **Audio Pronunciation**: Add audio files for words
6. **Flashcards**: Flashcard system for vocabulary
7. **Quizzes**: Assessment and testing features
8. **Analytics Dashboard**: Learning analytics and statistics
9. **Mobile App**: React Native or PWA version
10. **Offline Support**: Service workers for offline access

## Dependencies

### Production
- `next`: 15.1.0 - Next.js framework
- `react`: 19.2.0 - React library
- `react-dom`: 19.2.0 - React DOM
- `duckdb`: 1.0.0 - DuckDB database
- `@aws-sdk/client-s3`: 3.700.0 - S3 client for SeaweedFS

### Development
- `typescript`: 5.9.3
- `tailwindcss`: 4.1.17
- `eslint`: 9.39.1
- `tsx`: 4.20.6 - TypeScript execution

## Configuration Files

- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `docker-compose.yml` - Docker services
- `Dockerfile` - UI container image
- `postcss.config.js` - PostCSS configuration
- `.gitignore` - Git ignore rules

## Summary

This is a well-structured, modern Chinese language learning platform with:
- ✅ Solid architecture using Next.js 15 App Router
- ✅ Efficient data storage with DuckDB
- ✅ Distributed storage with SeaweedFS
- ✅ Bilingual support (English/Vietnamese)
- ✅ Comprehensive HSK dictionary (~49K entries)
- ✅ Course management system
- ✅ Server-side rendering for performance
- ✅ Docker containerization

The project is production-ready for basic use cases but could benefit from:
- User authentication and management
- Learning progress tracking
- Enhanced security measures
- Performance optimizations
- Additional interactive features

