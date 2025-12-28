import { S3Client, PutObjectCommand, GetObjectCommand, ListBucketsCommand, CreateBucketCommand, HeadBucketCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
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

async function verifyDatabase(dbPath: string): Promise<{ valid: boolean; tables: string[]; error?: string }> {
  return new Promise((resolve) => {
    try {
      const normalizedDbPath = dbPath.replace(/\\/g, '/');
      
      // Try to open the database (not read-only, in case we need to read WAL)
      const db = new duckdb.Database(normalizedDbPath, (err: Error | null) => {
        if (err) {
          resolve({ valid: false, tables: [], error: `Failed to open database: ${err.message}` });
          return;
        }
        
        try {
          const conn = db.connect();
          
          // Small delay to ensure connection is ready
          setTimeout(() => {
            // Try multiple queries to find tables
            conn.all(
              `SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' ORDER BY table_name`,
              (err: Error | null, result: any[]) => {
                if (err) {
                  // Try alternative query
                  conn.all(`SHOW TABLES`, (err2: Error | null, result2: any[]) => {
                    conn.close();
                    db.close();
                    
                    if (err2) {
                      resolve({ valid: false, tables: [], error: `Failed to query database: ${err.message || err2.message}` });
                      return;
                    }
                    
                    // Parse SHOW TABLES result (format may vary)
                    const tables = result2 ? result2.map((row: any) => row.name || row.table_name || Object.values(row)[0]) : [];
                    resolve({ valid: true, tables });
                  });
                  return;
                }
                
                const tables = result ? result.map((row: any) => row.table_name) : [];
                conn.close();
                db.close();
                resolve({ valid: true, tables });
              }
            );
          }, 100);
        } catch (connError) {
          db.close();
          resolve({ 
            valid: false, 
            tables: [], 
            error: `Failed to connect: ${connError instanceof Error ? connError.message : 'Unknown error'}` 
          });
        }
      });
    } catch (error) {
      resolve({ 
        valid: false, 
        tables: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
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

async function ensureBucketExists(bucketName: string): Promise<void> {
  try {
    // Check if bucket exists
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`✓ Bucket '${bucketName}' already exists`);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'NotFound' || error.code === 'NoSuchBucket') {
        // Bucket doesn't exist, create it
        console.log(`Creating bucket '${bucketName}'...`);
        try {
          await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
          console.log(`✓ Successfully created bucket '${bucketName}'`);
        } catch (createError) {
          // In SeaweedFS, buckets are created automatically on first PutObject
          // So if CreateBucket fails, we'll just proceed with the upload
          console.log(`  Note: Bucket will be created automatically on upload`);
        }
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
}

async function getTableRowCounts(dbPath: string, tables: string[]): Promise<Record<string, number>> {
  return new Promise((resolve) => {
    const counts: Record<string, number> = {};
    let completed = 0;
    
    if (tables.length === 0) {
      resolve(counts);
      return;
    }
    
    try {
      const normalizedDbPath = dbPath.replace(/\\/g, '/');
      const db = new duckdb.Database(normalizedDbPath, (err: Error | null) => {
        if (err) {
          // If we can't open, return empty counts
          resolve(counts);
          return;
        }
        
        const conn = db.connect();
        setTimeout(() => {
          tables.forEach((tableName) => {
            conn.all(
              `SELECT COUNT(*) as count FROM "${tableName}"`,
              (countErr: Error | null, countResult: any[]) => {
                counts[tableName] = countErr || !countResult || countResult.length === 0 
                  ? 0 
                  : Number(countResult[0]?.count || 0);
                completed++;
                
                if (completed === tables.length) {
                  conn.close();
                  db.close();
                  resolve(counts);
                }
              }
            );
          });
        }, 100);
      });
    } catch (error) {
      resolve(counts);
    }
  });
}

async function verifyUploadedData(bucketName: string, key: string): Promise<void> {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("Verifying uploaded data...");
    console.log("=".repeat(60));
    
    // Check if object exists and get metadata
    const headResult = await s3.send(new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));
    
    console.log(`✓ File exists in SeaweedFS`);
    console.log(`  Bucket: ${bucketName}`);
    console.log(`  Key: ${key}`);
    console.log(`  Size: ${headResult.ContentLength?.toLocaleString()} bytes`);
    if (headResult.LastModified) {
      console.log(`  Last Modified: ${headResult.LastModified.toISOString()}`);
    }
    
    // Download and verify the database
    console.log(`\nDownloading to verify database integrity...`);
    const tempPath = path.join(__dirname, "database.duckdb.verify.tmp");
    
    const data = await s3.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));
    
    if (!data.Body) {
      throw new Error("No data received from SeaweedFS");
    }
    
    const writeStream = fs.createWriteStream(tempPath);
    const bodyStream = data.Body as NodeJS.ReadableStream;
    
    bodyStream.pipe(writeStream);
    
    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", () => resolve());
      writeStream.on("error", reject);
      bodyStream.on("error", reject);
    });
    
    const downloadedStats = fs.statSync(tempPath);
    console.log(`✓ Downloaded file: ${downloadedStats.size.toLocaleString()} bytes`);
    
    // Verify the downloaded database
    console.log(`\nVerifying database structure...`);
    const verification = await verifyDatabase(tempPath);
    
    if (!verification.valid) {
      console.warn(`⚠ Warning: Downloaded database verification failed: ${verification.error}`);
      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      return;
    }
    
    if (verification.tables.length === 0) {
      console.warn(`⚠ Warning: Database has no tables`);
    } else {
      console.log(`✓ Database verified successfully`);
      console.log(`  Found ${verification.tables.length} table(s):`);
      
      // Get row counts for each table
      const rowCounts = await getTableRowCounts(tempPath, verification.tables);
      
      verification.tables.forEach((tableName) => {
        const count = rowCounts[tableName] || 0;
        console.log(`    - ${tableName}: ${count.toLocaleString()} row(s)`);
      });
      
      const totalRows = Object.values(rowCounts).reduce((sum, count) => sum + count, 0);
      console.log(`\n  Total rows across all tables: ${totalRows.toLocaleString()}`);
    }
    
    // Clean up temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✓ Upload verification complete!");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("\n⚠ Warning: Could not verify uploaded data:", error instanceof Error ? error.message : error);
    // Don't throw - upload was successful, verification is just a bonus
  }
}

async function uploadDB() {
  try {
    // Check connection first
    const isConnected = await checkConnection();
    if (!isConnected) {
      process.exit(1);
    }

    const bucketName = "dictionary";
    const key = "database.duckdb";
    
    // Ensure bucket exists (or will be created automatically)
    await ensureBucketExists(bucketName);

    const filePath = path.join(__dirname, "database.duckdb");
    console.log(`\nChecking if file exists: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileStats = fs.statSync(filePath);
    console.log(`File size: ${fileStats.size.toLocaleString()} bytes`);
    
    // Verify the database before uploading
    console.log("\nVerifying database file before upload...");
    const verification = await verifyDatabase(filePath);
    
    if (!verification.valid) {
      throw new Error(`Database verification failed: ${verification.error || 'Unknown error'}`);
    }
    
    if (verification.tables.length === 0) {
      console.warn("⚠ Warning: Database has no tables!");
      console.warn("  The database file exists but contains no tables.");
      console.warn("  You may want to initialize it first before uploading.");
    } else {
      console.log(`✓ Database verified successfully`);
      console.log(`  Found ${verification.tables.length} table(s): ${verification.tables.join(', ')}`);
      
      // Show row counts before upload
      const rowCounts = await getTableRowCounts(filePath, verification.tables);
      console.log(`\n  Table row counts:`);
      verification.tables.forEach((tableName) => {
        const count = rowCounts[tableName] || 0;
        console.log(`    - ${tableName}: ${count.toLocaleString()} row(s)`);
      });
    }
    
    console.log("\nReading database.duckdb file...");
    const fileBuffer = fs.readFileSync(filePath);
    console.log("File read successfully, uploading to SeaweedFS...");
    
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: "application/octet-stream",
    }));
    
    console.log("\n✓ Successfully uploaded database.duckdb to SeaweedFS");
    
    // Verify the uploaded data
    await verifyUploadedData(bucketName, key);
  } catch (error) {
    console.error("\n❌ Error uploading database:");
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ECONNREFUSED') {
        console.error("Connection refused. Make sure SeaweedFS S3 is running:");
        console.error("  docker-compose up -d seaweed-s3");
      } else if (error.code === 'NoSuchBucket') {
        console.error("Bucket 'dictionary' does not exist. Create it first in SeaweedFS.");
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

async function downloadDB() {
  try {
    console.log("Downloading database.duckdb from SeaweedFS...");
    const data = await s3.send(new GetObjectCommand({
      Bucket: "dictionary",
      Key: "database.duckdb",
    }));
    const writeStream = fs.createWriteStream("./database.duckdb");
    (data.Body as NodeJS.ReadableStream).pipe(writeStream);
    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", () => resolve());
      writeStream.on("error", reject);
    });
    console.log("Successfully downloaded database.duckdb from SeaweedFS");
  } catch (error) {
    console.error("Error downloading database:", error);
    throw error;
  }
}

// Run upload if this script is executed directly
// Check if this file is being run directly (not imported)
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('upload-db.ts') || 
  process.argv[1].endsWith('upload-db.js')
);

if (isMainModule) {
  uploadDB().catch(console.error);
}

export { uploadDB, downloadDB };

