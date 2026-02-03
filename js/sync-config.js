{
  "syncServices": {
    "google_sheets": {
      "name": "Google Sheets",
      "enabled": true,
      "authType": "oauth2",
      "scope": "https://www.googleapis.com/auth/spreadsheets",
      "templateSheetId": "1EXAMPLE_SHEET_ID",
      "autoCreateSheet": true
    },
    "firebase": {
      "name": "Firebase Firestore",
      "enabled": true,
      "projectId": "your-project-id",
      "collectionName": "payrolls",
      "workersCollection": "payroll_workers"
    },
    "supabase": {
      "name": "Supabase",
      "enabled": true,
      "url": "https://your-project.supabase.co",
      "apiKey": "your-anon-key",
      "tableName": "payrolls"
    },
    "postgresql": {
      "name": "PostgreSQL",
      "enabled": false,
      "host": "localhost",
      "port": 5432,
      "database": "construction_db",
      "username": "user",
      "ssl": false
    }
  },
  "syncSettings": {
    "autoSync": true,
    "syncOnSave": true,
    "syncInterval": 3600000,
    "retryAttempts": 3,
    "offlineMode": true,
    "conflictResolution": "server_wins"
  },
  "exportFormats": {
    "pdf": {
      "enabled": true,
      "template": "professional",
      "includeHeader": true,
      "includeFooter": true,
      "includeSignatures": true,
      "watermark": false
    },
    "csv": {
      "enabled": true,
      "separator": ",",
      "includeHeaders": true,
      "dateFormat": "YYYY-MM-DD"
    },
    "json": {
      "enabled": true,
      "prettyPrint": true,
      "includeMetadata": true
    },
    "excel": {
      "enabled": false,
      "format": "xlsx"
    }
  },
  "backupSettings": {
    "autoBackup": true,
    "backupInterval": 86400000,
    "maxBackups": 30,
    "backupLocation": "local",
    "cloudBackup": false
  },
  "notifications": {
    "onSyncComplete": true,
    "onSyncError": true,
    "onBackupComplete": true,
    "onPayrollGenerated": true
  }
}