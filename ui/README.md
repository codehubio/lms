# Chinese LMS - Next.js Application

## Data Fetching Setup

This project is prepared for server-side data fetching. Here's how it works:

### Architecture

1. **Types** (`types/index.ts`): Define your data structures here
2. **Data Layer** (`lib/data.ts`): Functions to fetch data from various sources
3. **API Routes** (`app/api/`): REST API endpoints for client-side fetching
4. **Server Components**: Fetch data directly in page components

### Two Approaches for Data Fetching

#### 1. Server Components (Recommended for initial load)
- Data is fetched on the server before rendering
- Better for SEO and performance
- Example: `app/page.tsx` fetches courses using `fetchCourses()`

#### 2. API Routes (For client-side fetching)
- Create endpoints in `app/api/`
- Useful for real-time updates, mutations, or client-side fetching
- Example: `app/api/courses/route.ts` provides `/api/courses` endpoint

### How to Add Your Data

1. **Update Types** (`types/index.ts`):
   ```typescript
   export interface YourDataType {
     id: string;
     // your fields
   }
   ```

2. **Update Data Functions** (`lib/data.ts`):
   ```typescript
   export async function fetchYourData(): Promise<YourDataType[]> {
     // Replace with your actual data source:
     // - Database query
     // - External API call
     // - File system read
     // - etc.
   }
   ```

3. **Use in Components**:
   - Server Component: `const data = await fetchYourData();`
   - Client Component: `fetch('/api/your-endpoint')`

### Example Data Sources

- **Database**: Use Prisma, Drizzle, or raw SQL
- **External API**: Use `fetch()` with your API endpoint
- **File System**: Use Node.js `fs` module (server-side only)
- **Environment Variables**: Use `process.env` for API keys

### Development

```bash
npm run dev    # Start dev server on port 3333
npm run build  # Build for production
npm run start  # Start production server
```

### Next Steps

1. Decide on your data structure and update `types/index.ts`
2. Implement your data fetching logic in `lib/data.ts`
3. Create API routes in `app/api/` if needed
4. Update components to use your data
