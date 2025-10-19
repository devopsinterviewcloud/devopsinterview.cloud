#!/bin/bash

###############################################################################
# Database Backup Script
# Backs up PostgreSQL database with compression and rotation
###############################################################################

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
POSTGRES_DB="${POSTGRES_DB:-devopsinterview}"
POSTGRES_USER="${POSTGRES_USER:-devopsinterview}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
POSTGRES_HOST="${POSTGRES_HOST:-db}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Timestamp for backup file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "================================================"
echo "Database Backup Script"
echo "================================================"
echo "Database: ${POSTGRES_DB}"
echo "Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
echo "Backup file: ${BACKUP_FILE}"
echo "Retention: ${RETENTION_DAYS} days"
echo "================================================"

# Perform backup
echo "Starting backup..."
export PGPASSWORD="${POSTGRES_PASSWORD}"

if pg_dump -h "${POSTGRES_HOST}" \
           -p "${POSTGRES_PORT}" \
           -U "${POSTGRES_USER}" \
           -d "${POSTGRES_DB}" \
           --format=plain \
           --no-owner \
           --no-acl | gzip > "${BACKUP_FILE}"; then

    echo "✅ Backup completed successfully!"

    # Get backup file size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "Backup size: ${BACKUP_SIZE}"

    # Cleanup old backups
    echo ""
    echo "Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
    find "${BACKUP_DIR}" -name "*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

    # List remaining backups
    echo ""
    echo "Current backups:"
    ls -lh "${BACKUP_DIR}"/*.sql.gz 2>/dev/null || echo "No backups found"

    # Optional: Upload to cloud storage
    if [ -n "${AWS_S3_BUCKET}" ]; then
        echo ""
        echo "Uploading backup to S3..."
        aws s3 cp "${BACKUP_FILE}" "s3://${AWS_S3_BUCKET}/backups/" --storage-class STANDARD_IA
        echo "✅ Backup uploaded to S3"
    fi

    if [ -n "${GOOGLE_CLOUD_BUCKET}" ]; then
        echo ""
        echo "Uploading backup to Google Cloud Storage..."
        gsutil cp "${BACKUP_FILE}" "gs://${GOOGLE_CLOUD_BUCKET}/backups/"
        echo "✅ Backup uploaded to GCS"
    fi

    echo ""
    echo "================================================"
    echo "Backup completed successfully at $(date)"
    echo "================================================"

    exit 0
else
    echo "❌ Backup failed!"
    exit 1
fi
