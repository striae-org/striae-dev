// User-related types and interfaces

export interface UserData {
  uid: string;
  email: string | null;
  firstName: string;
  lastName: string;
  company: string;
  permitted: boolean;
  cases: Array<{
    caseNumber: string;
    createdAt: string;
  }>;
  readOnlyCases?: Array<{
    caseNumber: string;
    importedAt: string;
    originalExportDate: string;
    originalExportedBy: string;
    sourceChecksum?: string;
    isReadOnly: true;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export interface UserLimits {
  maxCases: number;
  maxFilesPerCase: number;
}