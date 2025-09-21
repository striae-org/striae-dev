/**
 * CRC32 utility functions for data integrity validation
 * Uses IEEE 802.3 polynomial standard for consistency across the application
 */

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
  
  // CRC32 polynomial table (IEEE 802.3)
  const crcTable = new Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[i] = c;
  }
  
  for (let i = 0; i < bytes.length; i++) {
    crc = crcTable[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
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
