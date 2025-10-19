#!/bin/bash

###############################################################################
# Database Restore Script
# Restores PostgreSQL database from a backup file
###############################################################################

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
POSTGRES_DB="${POSTGRES_DB:-devopsinterview}"
POSTGRES_USER="${POSTGRES_USER:-devopsinterview}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
POSTGRES_HOST="${POSTGRES_HOST:-db}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}"/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    # Try to find it in the backup directory
    if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    else
        echo "❌ Backup file not found: ${BACKUP_FILE}"
        exit 1
    fi
fi

echo "================================================"
echo "Database Restore Script"
echo "================================================"
echo "⚠️  WARNING: This will REPLACE all data in the database!"
echo ""
echo "Database: ${POSTGRES_DB}"
echo "Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
echo "Backup file: ${BACKUP_FILE}"
echo "================================================"
echo ""

# Ask for confirmation
read -p "Are you sure you want to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled"
    exit 1
fi

# Export password
export PGPASSWORD="${POSTGRES_PASSWORD}"

echo "Dropping existing database..."
psql -h "${POSTGRES_HOST}" \
     -p "${POSTGRES_PORT}" \
     -U "${POSTGRES_USER}" \
     -d postgres \
     -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"

echo "Creating new database..."
psql -h "${POSTGRES_HOST}" \
     -p "${POSTGRES_PORT}" \
     -U "${POSTGRES_USER}" \
     -d postgres \
     -c "CREATE DATABASE ${POSTGRES_DB};"

echo "Restoring backup..."
if gunzip -c "${BACKUP_FILE}" | psql -h "${POSTGRES_HOST}" \
                                     -p "${POSTGRES_PORT}" \
                                     -U "${POSTGRES_USER}" \
                                     -d "${POSTGRES_DB}"; then
    echo ""
    echo "================================================"
    echo "✅ Database restored successfully!"
    echo "================================================"
    exit 0
else
    echo ""
    echo "================================================"
    echo "❌ Database restore failed!"
    echo "================================================"
    exit 1
fi
