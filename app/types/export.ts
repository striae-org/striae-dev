// Export-related types and interfaces

export interface ExportOptions {
  format?: 'json' | 'csv';
  includeMetadata?: boolean;
  includeUserInfo?: boolean;
  protectForensicData?: boolean; // Enable read-only protection
}