/**
 * CRC32 utility functions for data integrity validation
 * Uses IEEE 802.3 polynomial standard for consistency across the application
 */

// Pre-computed CRC32 lookup table (IEEE 802.3 polynomial)
// Calculated once at module load time for optimal performance
const CRC32_TABLE = (() => {
  const table: number[] = new Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c;
  }
  return table;
})();

/**
 * Calculate CRC32 checksum for content integrity validation
 * This implementation uses the IEEE 802.3 polynomial and matches the algorithm
 * used throughout the Striae application for forensic data validation.
 * 
 * @param content - The string content to calculate checksum for
 * @returns CRC32 checksum as lowercase hexadecimal string (8 characters)
 */
export function calculateCRC32(content: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  let crc = 0xFFFFFFFF;
  
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}

/**
 * Calculate CRC32 checksum for binary data (images, files)
 * 
 * @param data - Binary data as Uint8Array, ArrayBuffer, or Blob
 * @returns CRC32 checksum as lowercase hexadecimal string (8 characters)
 */
export async function calculateCRC32Binary(data: Uint8Array | ArrayBuffer | Blob): Promise<string> {
  let bytes: Uint8Array;
  
  if (data instanceof Blob) {
    const arrayBuffer = await data.arrayBuffer();
    bytes = new Uint8Array(arrayBuffer);
  } else if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data);
  } else {
    bytes = data;
  }
  
  let crc = 0xFFFFFFFF;
  
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}

/**
 * Verify content against expected CRC32 checksum
 * 
 * @param content - The content to verify
 * @param expectedChecksum - The expected CRC32 checksum (case-insensitive)
 * @returns True if checksums match, false otherwise
 */
export function verifyCRC32(content: string, expectedChecksum: string): boolean {
  const actualChecksum = calculateCRC32(content);
  return actualChecksum.toLowerCase() === expectedChecksum.toLowerCase();
}

/**
 * Generate a checksum validation report
 * 
 * @param content - The content to validate
 * @param expectedChecksum - The expected CRC32 checksum
 * @returns Validation result with details
 */
export function validateCRC32(content: string, expectedChecksum: string): {
  isValid: boolean;
  actualChecksum: string;
  expectedChecksum: string;
  error?: string;
} {
  try {
    const actualChecksum = calculateCRC32(content);
    const isValid = actualChecksum.toLowerCase() === expectedChecksum.toLowerCase();
    
    return {
      isValid,
      actualChecksum,
      expectedChecksum: expectedChecksum.toLowerCase(),
      error: isValid ? undefined : 'Checksum validation failed - content may have been modified'
    };
  } catch (error) {
    return {
      isValid: false,
      actualChecksum: '',
      expectedChecksum: expectedChecksum.toLowerCase(),
      error: `CRC32 calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Generate comprehensive file manifest with checksums for all files
 * 
 * @param dataContent - JSON data content
 * @param imageFiles - Map of filename to image blob
 * @returns Forensic manifest with individual and combined checksums
 */
export async function generateForensicManifest(
  dataContent: string,
  imageFiles: { [filename: string]: Blob }
): Promise<{
  dataChecksum: string;
  imageChecksums: { [filename: string]: string };
  manifestChecksum: string;
  totalFiles: number;
  createdAt: string;
}> {
  // Calculate data file checksum
  const dataChecksum = calculateCRC32(dataContent);
  
  // Calculate checksums for all image files
  const imageChecksums: { [filename: string]: string } = {};
  for (const [filename, blob] of Object.entries(imageFiles)) {
    imageChecksums[filename] = await calculateCRC32Binary(blob);
  }
  
  // Create manifest content for overall checksum
  const manifestContent = JSON.stringify({
    dataChecksum,
    imageChecksums,
    fileOrder: Object.keys(imageFiles).sort() // Deterministic ordering
  });
  
  // Calculate checksum of the manifest itself
  const manifestChecksum = calculateCRC32(manifestContent);
  
  return {
    dataChecksum,
    imageChecksums,
    manifestChecksum,
    totalFiles: Object.keys(imageFiles).length + 1, // +1 for data file
    createdAt: new Date().toISOString()
  };
}

/**
 * Validate complete case integrity including data and images
 * 
 * @param dataContent - JSON data content
 * @param imageFiles - Map of filename to image blob
 * @param expectedManifest - Expected forensic manifest
 * @returns Comprehensive validation result
 */
export async function validateCaseIntegrity(
  dataContent: string,
  imageFiles: { [filename: string]: Blob },
  expectedManifest: {
    dataChecksum: string;
    imageChecksums: { [filename: string]: string };
    manifestChecksum: string;
  }
): Promise<{
  isValid: boolean;
  dataValid: boolean;
  imageValidation: { [filename: string]: boolean };
  manifestValid: boolean;
  errors: string[];
  summary: string;
}> {
  const errors: string[] = [];
  
  // Validate data checksum
  const actualDataChecksum = calculateCRC32(dataContent);
  const dataValid = actualDataChecksum.toLowerCase() === expectedManifest.dataChecksum.toLowerCase();
  if (!dataValid) {
    errors.push(`Data file checksum mismatch: expected ${expectedManifest.dataChecksum}, got ${actualDataChecksum}`);
  }
  
  // Validate image checksums
  const imageValidation: { [filename: string]: boolean } = {};
  for (const [filename, blob] of Object.entries(imageFiles)) {
    const actualImageChecksum = await calculateCRC32Binary(blob);
    const expectedImageChecksum = expectedManifest.imageChecksums[filename];
    
    if (!expectedImageChecksum) {
      imageValidation[filename] = false;
      errors.push(`No expected checksum found for image: ${filename}`);
    } else {
      const isValid = actualImageChecksum.toLowerCase() === expectedImageChecksum.toLowerCase();
      imageValidation[filename] = isValid;
      if (!isValid) {
        errors.push(`Image checksum mismatch for ${filename}: expected ${expectedImageChecksum}, got ${actualImageChecksum}`);
      }
    }
  }
  
  // Check for missing images
  for (const expectedFilename of Object.keys(expectedManifest.imageChecksums)) {
    if (!imageFiles[expectedFilename]) {
      imageValidation[expectedFilename] = false;
      errors.push(`Missing expected image file: ${expectedFilename}`);
    }
  }
  
  // Validate manifest checksum
  const recreatedManifest = JSON.stringify({
    dataChecksum: expectedManifest.dataChecksum,
    imageChecksums: expectedManifest.imageChecksums,
    fileOrder: Object.keys(expectedManifest.imageChecksums).sort()
  });
  const actualManifestChecksum = calculateCRC32(recreatedManifest);
  const manifestValid = actualManifestChecksum.toLowerCase() === expectedManifest.manifestChecksum.toLowerCase();
  if (!manifestValid) {
    errors.push(`Manifest checksum mismatch: expected ${expectedManifest.manifestChecksum}, got ${actualManifestChecksum}`);
  }
  
  const isValid = dataValid && Object.values(imageValidation).every(v => v === true) && manifestValid;
  const totalFiles = Object.keys(imageFiles).length + 1;
  const validFiles = (dataValid ? 1 : 0) + Object.values(imageValidation).filter(v => v === true).length;
  
  return {
    isValid,
    dataValid,
    imageValidation,
    manifestValid,
    errors,
    summary: isValid 
      ? `All ${totalFiles} files validated successfully`
      : `${validFiles}/${totalFiles} files valid, ${errors.length} integrity issues found`
  };
}
