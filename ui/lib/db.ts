/**
 * DuckDB Database Connection and Query Utilities
 * 
 * This file provides database connection and query utilities.
 * The database file is downloaded from SeaweedFS using scripts/download-db.ts
 * This file only connects to the existing database file in READ-ONLY mode.
 */

// @ts-ignore - DuckDB doesn't have TypeScript definitions
import duckdb from 'duckdb';
import path from 'path';

let db: any = null;
let connection: any = null;
let connectPromise: Promise<any> | null = null;

/**
 * Connect to the existing database file
 */
export async function getConnection(): Promise<any> {
  // If connection already exists, return it
  if (connection && db) {
    return connection;
  }

  // If connection is in progress, wait for it
  if (connectPromise) {
    await connectPromise;
    return connection;
  }

  // Start connection
  connectPromise = (async () => {
    const dbPath = path.join(process.cwd(), 'data', 'database.duckdb');
    const normalizedDbPath = dbPath.replace(/\\/g, '/');
    
    try {
      // Open existing database connection in READ-ONLY mode
      // Use path-based configuration for read-only access
      const readonlyDbPath = `${normalizedDbPath}`;
      
      db = new duckdb.Database(readonlyDbPath, (err: Error | null) => {
        if (err) {
          const logData = {
            type: 'other',
            action: 'database_open',
            path: normalizedDbPath,
            success: false,
            error: err.message,
          };
          console.error(JSON.stringify(logData));
          throw err;
        }
      });

      connection = db.connect((err: Error | null) => {
        if (err) {
          const logData = {
            type: 'other',
            action: 'database_connect',
            path: normalizedDbPath,
            success: false,
            error: err.message,
          };
          console.error(JSON.stringify(logData));
          throw err;
        }
      });

      const logData = {
        type: 'other',
        action: 'database_connect',
        path: normalizedDbPath,
        success: true,
      };
      console.log(JSON.stringify(logData));
      return connection;
    } catch (error) {
      const logData = {
        type: 'other',
        action: 'database_connect',
        path: normalizedDbPath,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      console.error(JSON.stringify(logData));
      connectPromise = null; // Reset on error so we can retry
      throw error;
    }
  })();

  return connectPromise;
}

/**
 * Wait for database connection to be established
 */
export async function waitForDatabase(): Promise<void> {
  // Ensure connection exists
  await getConnection();
}

/**
 * Compact SQL query by removing newlines and extra whitespace
 */
function compactSql(sql: string): string {
  return sql
    .replace(/\n/g, ' ')  // Replace newlines with spaces
    .replace(/\t/g, ' ')  // Replace tabs with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();              // Trim leading/trailing whitespace
}

/**
 * Execute a query and return results
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const conn = await getConnection();
  const startTime = Date.now();
  const compactedSql = compactSql(sql);
  
  return new Promise((resolve, reject) => {
    // DuckDB's all() method signature: all(sql, callback) or all(sql, params, callback)
    // Only pass params if they exist and are not empty
    if (params && params.length > 0) {
      conn.all(sql, params, (err: Error | null, result: T[]) => {
        const duration = Date.now() - startTime;
        const resultCount = result?.length || 0;
        
        const logData = {
          type: 'sql',
          sql: compactedSql,
          params,
          duration,
          rows: resultCount,
          success: !err,
          ...(err ? { error: err.message } : {}),
        };
        
        if (err) {
          console.error(JSON.stringify(logData));
          reject(err);
          return;
        }
        
        console.log(JSON.stringify(logData));
        resolve(result || []);
      });
    } else {
      conn.all(sql, (err: Error | null, result: T[]) => {
        const duration = Date.now() - startTime;
        const resultCount = result?.length || 0;
        
        const logData = {
          type: 'sql',
          sql: compactedSql,
          duration,
          rows: resultCount,
          success: !err,
          ...(err ? { error: err.message } : {}),
        };
        
        if (err) {
          console.error(JSON.stringify(logData));
          reject(err);
          return;
        }
        
        console.log(JSON.stringify(logData));
        resolve(result || []);
      });
    }
  });
}


