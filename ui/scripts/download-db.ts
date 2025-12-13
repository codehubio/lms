/**
 * Download Database from SeaweedFS Script
 * 
 * This script downloads the database.duckdb file from SeaweedFS S3,
 * saves it temporarily as database.duckdb.tmp, then renames it to database.duckdb
 */

import { S3Client, GetObjectCommand, ListBucketsCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
// @ts-ignore - DuckDB doesn't have TypeScript definitions
import duckdb from 'duckdb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:8333";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "admin";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "admin123";

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: S3_ENDPOINT,
  forcePathStyle: true, // Required for SeaweedFS
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
});

async function listTables(dbPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const normalizedDbPath = dbPath.replace(/\\/g, '/');
      
      // Open the database (not read-only to ensure we can read all data)
      const db = new duckdb.Database(normalizedDbPath, (err: Error | null) => {
        if (err) {
          console.error(`[List Tables] Error opening database:`, err);
          reject(err);
          return;
        }
        
        // Connect to the database (connect() returns the connection directly)
        const conn = db.connect();
        
        // Small delay to ensure connection is ready
        setTimeout(() => {
          // Query information_schema to list all tables
          conn.all(
            `SELECT table_name, table_type 
             FROM information_schema.tables 
             WHERE table_schema = 'main' 
             ORDER BY table_name`,
            (err: Error | null, result: any[]) => {
              if (err) {
                // Try alternative query
                conn.all(`SHOW TABLES`, (err2: Error | null, result2: any[]) => {
                  if (err2) {
                    console.error(`[List Tables] Error querying tables:`, err2);
                    conn.close();
                    db.close();
                    reject(err2);
                    return;
                  }
                  
                  if (!result2 || result2.length === 0) {
                    console.log(`  ⚠ No tables found in the database`);
                    conn.close();
                    db.close();
                    resolve();
                    return;
                  }
                  
                  // Parse SHOW TABLES result
                  const tables = result2.map((row: any) => ({
                    table_name: row.name || row.table_name || Object.values(row)[0],
                    table_type: 'TABLE'
                  }));
                  displayTables(conn, db, tables, resolve, reject);
                });
                return;
              }

              if (!result || result.length === 0) {
                console.log(`  ⚠ No tables found in the database`);
                conn.close();
                db.close();
                resolve();
                return;
              }

              displayTables(conn, db, result, resolve, reject);
            }
          );
        }, 100);
      });
    } catch (error) {
      console.error(`[List Tables] Failed to list tables:`, error);
      reject(error);
    }
  });
}

function displayTables(conn: any, db: any, tables: any[], resolve: () => void, reject: (error: any) => void) {
  console.log(`  ✓ Found ${tables.length} table(s):`);
  
  // Get row counts for all tables using Promise.all
  const tablePromises = tables.map((row: any) => {
    return new Promise<void>((resolveTable) => {
      conn.all(
        `SELECT COUNT(*) as count FROM "${row.table_name}"`,
        (countErr: Error | null, countResult: any[]) => {
          const count = countErr || !countResult || countResult.length === 0 
            ? '?' 
            : countResult[0]?.count || 0;
          console.log(`    - ${row.table_name} (${row.table_type || 'TABLE'}) - ${count} row(s)`);
          resolveTable();
        }
      );
    });
  });

  // Wait for all table count queries to complete
  Promise.all(tablePromises)
    .then(() => {
      conn.close();
      db.close();
      resolve();
    })
    .catch((error) => {
      console.error(`[List Tables] Error getting table counts:`, error);
      conn.close();
      db.close();
      reject(error);
    });
}

async function checkConnection(): Promise<boolean> {
  try {
    console.log(`Testing connection to ${S3_ENDPOINT}...`);
    // Try to list buckets as a connection test
    await s3.send(new ListBucketsCommand({}));
    console.log("✓ Successfully connected to SeaweedFS S3");
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNREFUSED') {
      console.error("\n❌ Connection refused! SeaweedFS S3 service is not running.");
      console.error("\nTo start the services, run:");
      console.error("  docker-compose up -d seaweed-s3");
      console.error("\nOr start all SeaweedFS services:");
      console.error("  docker-compose up -d seaweed-master seaweed-filer seaweed-s3");
      console.error(`\nMake sure the service is accessible at: ${S3_ENDPOINT}`);
    } else {
      console.error("Connection test failed:", error);
    }
    return false;
  }
}

async function checkBucketExists(bucketName: string): Promise<boolean> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'NotFound' || error.code === 'NoSuchBucket') {
        return false;
      }
    }
    throw error;
  }
}

async function downloadDB() {
  try {
    // Check connection first
    const isConnected = await checkConnection();
    if (!isConnected) {
      process.exit(1);
    }

    const bucketName = "dictionary";
    
    // Check if bucket exists
    console.log(`\nChecking if bucket '${bucketName}' exists...`);
    const bucketExists = await checkBucketExists(bucketName);
    
    if (!bucketExists) {
      console.error(`\n❌ Bucket '${bucketName}' does not exist in SeaweedFS.`);
      console.error(`\nThe bucket will be created automatically when you first upload the database.`);
      console.error(`\nTo fix this, you need to upload the database first:`);
      console.error(`  1. Make sure you have a database file at: maindb/database.duckdb`);
      console.error(`  2. Run the upload script:`);
      console.error(`     cd maindb`);
      console.error(`     npm run upload`);
      console.error(`\nOr if you're using Docker:`);
      console.error(`  docker-compose exec maindb npm run upload`);
      process.exit(1);
    }

    // Determine the output paths
    const dataDir = path.join(__dirname, "..", "data");
    const tempPath = path.join(dataDir, "database.duckdb.tmp");
    const finalPath = path.join(dataDir, "database.duckdb");
    
    console.log(`\nDownloading database.duckdb from SeaweedFS...`);
    console.log(`Temporary path: ${tempPath}`);
    console.log(`Final path: ${finalPath}`);
    
    // Ensure the data directory exists
    if (!fs.existsSync(dataDir)) {
      console.log(`Creating data directory: ${dataDir}`);
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Download the file from SeaweedFS
    const data = await s3.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: "database.duckdb",
    }));

    if (!data.Body) {
      throw new Error("No data received from SeaweedFS");
    }

    // Write the file to disk as temporary file first
    const writeStream = fs.createWriteStream(tempPath);
    const bodyStream = data.Body as NodeJS.ReadableStream;
    
    bodyStream.pipe(writeStream);
    
    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", () => {
        const stats = fs.statSync(tempPath);
        console.log(`✓ Successfully downloaded database.duckdb from SeaweedFS`);
        console.log(`  File size: ${stats.size} bytes`);
        console.log(`  Saved to: ${tempPath}`);
        resolve();
      });
      writeStream.on("error", reject);
      bodyStream.on("error", reject);
    });

    // Rename the temporary file to the final filename
    console.log(`Renaming ${tempPath} to ${finalPath}...`);
    fs.renameSync(tempPath, finalPath);
    console.log(`✓ Successfully renamed to database.duckdb`);
    console.log(`  Final location: ${finalPath}`);

    // List tables in the downloaded database
    console.log(`\nListing tables in the downloaded database...`);
    await listTables(finalPath);
    
  } catch (error) {
    console.error("\n❌ Error downloading database:");
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ECONNREFUSED') {
        console.error("Connection refused. Make sure SeaweedFS S3 is running:");
        console.error("  docker-compose up -d seaweed-s3");
      } else if (error.code === 'NoSuchBucket') {
        console.error("Bucket 'dictionary' does not exist in SeaweedFS.");
        console.error("\nThe bucket will be created automatically when you first upload the database.");
        console.error("\nTo fix this:");
        console.error("  1. Make sure you have a database file at: maindb/database.duckdb");
        console.error("  2. Run: cd maindb && npm run upload");
      } else if (error.code === 'NoSuchKey') {
        console.error("File 'database.duckdb' does not exist in the 'dictionary' bucket.");
        console.error("\nYou need to upload the database first:");
        console.error("  cd maindb && npm run upload");
      } else {
        console.error(`Error code: ${error.code}`);
      }
    }
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    throw error;
  }
}

// Run download if this script is executed directly
// Check if this file is being run directly (not imported)
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('download-db.ts') || 
  process.argv[1].endsWith('download-db.js')
);

if (isMainModule) {
  downloadDB().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { downloadDB };

