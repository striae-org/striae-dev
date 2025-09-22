// Annotation-related types and interfaces

export interface BoxAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label?: string;
  timestamp: string;
}

export interface BasicConfirmationData {
  fullName: string;           // Confirming examiner's full name
  badgeId: string;            // Badge/ID number of confirming examiner  
  timestamp: string;          // Human-readable confirmation timestamp
  confirmationId: string;     // Unique ID generated at confirmation time
}

export interface ConfirmationData extends BasicConfirmationData {
  confirmedBy: string;        // User UID of the confirming examiner
  confirmedByEmail: string;   // Email of the confirming examiner
  confirmedAt: string;        // ISO timestamp of confirmation
}

export interface AnnotationData {
  leftCase: string;
  rightCase: string;
  leftItem: string;
  rightItem: string;
  caseFontColor?: string;
  classType?: 'Bullet' | 'Cartridge Case' | 'Other';
  customClass?: string;
  classNote?: string;
  indexType?: 'number' | 'color';
  indexNumber?: string;
  indexColor?: string;
  supportLevel?: 'ID' | 'Exclusion' | 'Inconclusive';
  hasSubclass?: boolean;
  includeConfirmation: boolean;
  confirmationData?: BasicConfirmationData;
  additionalNotes?: string;
  boxAnnotations?: BoxAnnotation[];
  updatedAt: string;
}