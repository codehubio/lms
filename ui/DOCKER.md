# Docker Setup

This document describes how to run the LMS application using Docker.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. Build and start the application:
   ```bash
   docker-compose up -d
   ```

2. The application will be available at `http://localhost:3333`

3. To view logs:
   ```bash
   docker-compose logs -f app
   ```

4. To stop the application:
   ```bash
   docker-compose down
   ```

## Database Persistence

The database file (`database.duckdb`) is persisted by mounting the `./data` folder from the host machine. This ensures that:

- Database data persists across container restarts
- Database data is stored directly on the host filesystem
- You can access and backup the database file directly from the host
- JSON source files are also accessible from the host

**Note:** The `./data` folder on your host machine will contain:
- `database.duckdb` - The DuckDB database file (created on first run)
- `database.duckdb.wal` - Write-ahead log file (created automatically)
- `courses.json` - Course data source
- `hsk-word-list.json` - Dictionary data source
- `ui-text.json` - UI text translations

## Building the Image

To build the Docker image manually:
```bash
docker build -t lms-app .
```

## Environment Variables

You can override environment variables in `docker-compose.yml`:
- `NODE_ENV`: Set to `production` by default
- `PORT`: Set to `3333` by default

## Notes

- The database is initialized automatically when the container starts
- The entire `./data` folder is mounted from the host, so all files (JSON sources and database) are accessible on the host
- The database file (`database.duckdb`) will be created in `./data` on the host if it doesn't exist
- Make sure the `./data` directory exists and has proper permissions before starting the container

