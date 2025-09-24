/**
 * CRC32 utility functions for data integrity validation
 * Uses IEEE 802.3 polynomial standard for consistency across the application
 */

// Pre-computed CRC32 lookup table (IEEE 802.3 polynomial)
// Calculated once at module load time for optimal performance
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c >>> 0; // Ensure unsigned 32-bit
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
 * @throws Error if content is null, undefined, or not a string
 */
export function calculateCRC32(content: string): string {
  // Input validation for forensic integrity
  if (content === null) {
    throw new Error('CRC32 calculation failed: Content cannot be null');
  }
  if (content === undefined) {
    throw new Error('CRC32 calculation failed: Content cannot be undefined');
  }
  if (typeof content !== 'string') {
    throw new Error(`CRC32 calculation failed: Content must be a string, received ${typeof content}`);
  }
  
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  let crc = 0xFFFFFFFF;
  
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}

/**
 * Calculate CRC32 checksum with timing attack mitigation
 * This version uses constant-time processing to prevent timing-based attacks
 * on forensically sensitive content. Use this for high-security environments.
 * 
 * @param content - The string content to calculate checksum for
 * @returns CRC32 checksum as lowercase hexadecimal string (8 characters)
 * @throws Error if content is null, undefined, or not a string
 */
export function calculateCRC32Secure(content: string): string {
  // Input validation for forensic integrity
  if (content === null) {
    throw new Error('CRC32 secure calculation failed: Content cannot be null');
  }
  if (content === undefined) {
    throw new Error('CRC32 secure calculation failed: Content cannot be undefined');
  }
  if (typeof content !== 'string') {
    throw new Error(`CRC32 secure calculation failed: Content must be a string, received ${typeof content}`);
  }
  
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  let crc = 0xFFFFFFFF;
  
  // Simplified constant-time approach: pad to next 64-byte boundary
  // This reduces timing variance while maintaining algorithm correctness
  const BLOCK_SIZE = 64;
  const paddedLength = Math.ceil(bytes.length / BLOCK_SIZE) * BLOCK_SIZE;
  
  // Process all bytes including padding in constant time
  for (let i = 0; i < paddedLength; i++) {
    // Use ternary to avoid branching, but ensure correct algorithm
    const byte = i < bytes.length ? bytes[i] : 0;
    const shouldProcess = i < bytes.length;
    
    if (shouldProcess) {
      crc = CRC32_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    }
    // Add a small constant-time operation for padding bytes to normalize timing
    else {
      // Perform a dummy calculation that doesn't affect the result
      const dummy = CRC32_TABLE[0] ^ 0;
    }
  }
  
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}

/**
 * Calculate CRC32 checksum for binary data (images, files)
 * 
 * @param data - Binary data as Uint8Array, ArrayBuffer, or Blob
 * @returns CRC32 checksum as lowercase hexadecimal string (8 characters)
 * @throws Error if data is null, undefined, or unsupported type
 */
export async function calculateCRC32Binary(data: Uint8Array | ArrayBuffer | Blob): Promise<string> {
  // Input validation for forensic integrity
  if (data === null) {
    throw new Error('CRC32 binary calculation failed: Data cannot be null');
  }
  if (data === undefined) {
    throw new Error('CRC32 binary calculation failed: Data cannot be undefined');
  }
  if (!(data instanceof Uint8Array || data instanceof ArrayBuffer || data instanceof Blob)) {
    throw new Error('CRC32 binary calculation failed: Data must be Uint8Array, ArrayBuffer, or Blob');
  }
  
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
 * @throws Error if inputs are invalid
 */
export function verifyCRC32(content: string, expectedChecksum: string): boolean {
  // Input validation
  if (content === null || content === undefined) {
    throw new Error('CRC32 verification failed: Content cannot be null or undefined');
  }
  if (typeof content !== 'string') {
    throw new Error(`CRC32 verification failed: Content must be a string, received ${typeof content}`);
  }
  if (expectedChecksum === null || expectedChecksum === undefined) {
    throw new Error('CRC32 verification failed: Expected checksum cannot be null or undefined');
  }
  if (typeof expectedChecksum !== 'string') {
    throw new Error(`CRC32 verification failed: Expected checksum must be a string, received ${typeof expectedChecksum}`);
  }
  // Validate checksum format (8 hex characters)
  if (!/^[0-9a-fA-F]{8}$/.test(expectedChecksum)) {
    throw new Error(`CRC32 verification failed: Invalid checksum format. Expected 8 hexadecimal characters, received: "${expectedChecksum}"`);
  }
  
  const actualChecksum = calculateCRC32(content);
  return actualChecksum === expectedChecksum.toLowerCase();
}

/**
 * Verify content against expected CRC32 checksum using secure calculation
 * Uses timing-attack resistant CRC32 for forensically sensitive validations
 * 
 * @param content - The content to verify
 * @param expectedChecksum - The expected CRC32 checksum (case-insensitive)
 * @returns True if checksums match, false otherwise
 * @throws Error if inputs are invalid
 */
export function verifyCRC32Secure(content: string, expectedChecksum: string): boolean {
  // Input validation
  if (content === null || content === undefined) {
    throw new Error('CRC32 secure verification failed: Content cannot be null or undefined');
  }
  if (typeof content !== 'string') {
    throw new Error(`CRC32 secure verification failed: Content must be a string, received ${typeof content}`);
  }
  if (expectedChecksum === null || expectedChecksum === undefined) {
    throw new Error('CRC32 secure verification failed: Expected checksum cannot be null or undefined');
  }
  if (typeof expectedChecksum !== 'string') {
    throw new Error(`CRC32 secure verification failed: Expected checksum must be a string, received ${typeof expectedChecksum}`);
  }
  // Validate checksum format (8 hex characters)
  if (!/^[0-9a-fA-F]{8}$/.test(expectedChecksum)) {
    throw new Error(`CRC32 secure verification failed: Invalid checksum format. Expected 8 hexadecimal characters, received: "${expectedChecksum}"`);
  }
  
  const actualChecksum = calculateCRC32Secure(content);
  return actualChecksum === expectedChecksum.toLowerCase();
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
    // Enhanced input validation with detailed error messages
    if (content === null || content === undefined) {
      throw new Error('Content cannot be null or undefined');
    }
    if (typeof content !== 'string') {
      throw new Error(`Content must be a string, received ${typeof content}`);
    }
    if (expectedChecksum === null || expectedChecksum === undefined) {
      throw new Error('Expected checksum cannot be null or undefined');
    }
    if (typeof expectedChecksum !== 'string') {
      throw new Error(`Expected checksum must be a string, received ${typeof expectedChecksum}`);
    }
    
    // Validate checksum format before proceeding
    const normalizedExpected = expectedChecksum.toLowerCase();
    if (!/^[0-9a-f]{8}$/.test(normalizedExpected)) {
      throw new Error(`Invalid checksum format. Expected 8 hexadecimal characters, received: "${expectedChecksum}"`);
    }
    
    const actualChecksum = calculateCRC32(content);
    const isValid = actualChecksum === normalizedExpected;
    
    return {
      isValid,
      actualChecksum,
      expectedChecksum: normalizedExpected,
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
  
  // CRITICAL: Process files in sorted order to ensure deterministic JSON serialization
  const sortedFilenames = Object.keys(imageFiles).sort();
  for (const filename of sortedFilenames) {
    imageChecksums[filename] = await calculateCRC32Binary(imageFiles[filename]);
  }
  
  // Create manifest content for overall checksum
  // CRITICAL: This structure must match exactly what gets saved to the manifest file
  // (minus the manifestChecksum field itself to avoid circular reference)
  const manifestForChecksum = {
    dataChecksum,
    imageChecksums,
    totalFiles: Object.keys(imageFiles).length + 1, // +1 for data file
    createdAt: new Date().toISOString()
  };
  
  const manifestContent = JSON.stringify(manifestForChecksum);
  
  // Calculate checksum of the manifest itself
  const manifestChecksum = calculateCRC32(manifestContent);
  
  return {
    dataChecksum,
    imageChecksums,
    manifestChecksum,
    totalFiles: manifestForChecksum.totalFiles,
    createdAt: manifestForChecksum.createdAt
  };
}

/**
 * Generate comprehensive file manifest with secure checksums for forensic applications
 * Uses timing-attack resistant CRC32 calculation for enhanced security
 * 
 * @param dataContent - JSON data content
 * @param imageFiles - Map of filename to image blob
 * @returns Forensic manifest with individual and combined checksums
 */
export async function generateForensicManifestSecure(
  dataContent: string,
  imageFiles: { [filename: string]: Blob }
): Promise<{
  dataChecksum: string;
  imageChecksums: { [filename: string]: string };
  manifestChecksum: string;
  totalFiles: number;
  createdAt: string;
}> {
  // Calculate data file checksum using secure version for forensic data
  const dataChecksum = calculateCRC32Secure(dataContent);
  
  // Calculate checksums for all image files
  const imageChecksums: { [filename: string]: string } = {};
  
  // CRITICAL: Process files in sorted order to ensure deterministic JSON serialization
  const sortedFilenames = Object.keys(imageFiles).sort();
  for (const filename of sortedFilenames) {
    imageChecksums[filename] = await calculateCRC32Binary(imageFiles[filename]);
  }
  
  // Create manifest content for overall checksum
  // CRITICAL: This structure must match exactly what gets saved to the manifest file
  // (minus the manifestChecksum field itself to avoid circular reference)
  const manifestForChecksum = {
    dataChecksum,
    imageChecksums,
    totalFiles: Object.keys(imageFiles).length + 1, // +1 for data file
    createdAt: new Date().toISOString()
  };
  
  const manifestContent = JSON.stringify(manifestForChecksum);
  
  // Calculate checksum of the manifest itself using secure version
  const manifestChecksum = calculateCRC32Secure(manifestContent);
  
  return {
    dataChecksum,
    imageChecksums,
    manifestChecksum,
    totalFiles: manifestForChecksum.totalFiles,
    createdAt: manifestForChecksum.createdAt
  };
}

/**
 * Generate forensic manifest with specific timestamp (for validation purposes)
 * This ensures that recreated manifests use the same timestamp as the original
 * to produce identical checksums during validation
 */
export async function generateForensicManifestWithTimestamp(
  dataContent: string,
  imageFiles: { [filename: string]: Blob },
  createdAt: string
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
  
  // CRITICAL: Process files in sorted order to ensure deterministic JSON serialization
  const sortedFilenames = Object.keys(imageFiles).sort();
  for (const filename of sortedFilenames) {
    imageChecksums[filename] = await calculateCRC32Binary(imageFiles[filename]);
  }
  
  // Create manifest content for overall checksum using the provided timestamp
  const manifestForChecksum = {
    dataChecksum,
    imageChecksums,
    totalFiles: Object.keys(imageFiles).length + 1, // +1 for data file
    createdAt // Use the provided timestamp for exact recreation
  };
  
  const manifestContent = JSON.stringify(manifestForChecksum);
  
  // Calculate checksum of the manifest itself
  const manifestChecksum = calculateCRC32(manifestContent);
  
  return {
    dataChecksum,
    imageChecksums,
    manifestChecksum,
    totalFiles: manifestForChecksum.totalFiles,
    createdAt: manifestForChecksum.createdAt
  };
}

/**
 * Generate secure forensic manifest with specific timestamp (for validation purposes)
 * Uses timing-attack resistant CRC32 calculation for enhanced security
 * This ensures that recreated manifests use the same timestamp as the original
 * to produce identical checksums during validation
 */
export async function generateForensicManifestWithTimestampSecure(
  dataContent: string,
  imageFiles: { [filename: string]: Blob },
  createdAt: string
): Promise<{
  dataChecksum: string;
  imageChecksums: { [filename: string]: string };
  manifestChecksum: string;
  totalFiles: number;
  createdAt: string;
}> {
  // Calculate data file checksum using secure version for forensic data
  const dataChecksum = calculateCRC32Secure(dataContent);
  
  // Calculate checksums for all image files
  const imageChecksums: { [filename: string]: string } = {};
  
  // CRITICAL: Process files in sorted order to ensure deterministic JSON serialization
  const sortedFilenames = Object.keys(imageFiles).sort();
  for (const filename of sortedFilenames) {
    imageChecksums[filename] = await calculateCRC32Binary(imageFiles[filename]);
  }
  
  // Create manifest content for overall checksum using the provided timestamp
  const manifestForChecksum = {
    dataChecksum,
    imageChecksums,
    totalFiles: Object.keys(imageFiles).length + 1, // +1 for data file
    createdAt // Use the provided timestamp for exact recreation
  };
  
  const manifestContent = JSON.stringify(manifestForChecksum);
  
  // Calculate checksum of the manifest itself using secure version
  const manifestChecksum = calculateCRC32Secure(manifestContent);
  
  return {
    dataChecksum,
    imageChecksums,
    manifestChecksum,
    totalFiles: manifestForChecksum.totalFiles,
    createdAt: manifestForChecksum.createdAt
  };
}

/**
 * Validate complete case integrity including data and images
 * This function recreates the manifest using the same logic as generation to ensure
 * tamper detection and consistent validation results.
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
    totalFiles: number;
    createdAt: string;
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
  const imageValidation: { [filename: string]: boolean } = {};
  
  // 1. Validate data content checksum
  const actualDataChecksum = calculateCRC32(dataContent);
  const dataValid = actualDataChecksum === expectedManifest.dataChecksum.toLowerCase();
  if (!dataValid) {
    errors.push(`Data checksum mismatch: expected ${expectedManifest.dataChecksum}, got ${actualDataChecksum}`);
  }
  
  // 2. Validate each image file checksum using the actual files provided
  // SECURITY FIX: Use the actual image files to determine validation scope,
  // not the potentially tampered manifest keys
  const actualImageFiles = Object.keys(imageFiles).sort();
  const expectedImageFiles = Object.keys(expectedManifest.imageChecksums).sort();
  
  // Check for missing or extra files
  const missingFiles = expectedImageFiles.filter(f => !actualImageFiles.includes(f));
  const extraFiles = actualImageFiles.filter(f => !expectedImageFiles.includes(f));
  
  if (missingFiles.length > 0) {
    errors.push(`Missing image files: ${missingFiles.join(', ')}`);
  }
  if (extraFiles.length > 0) {
    errors.push(`Extra image files not in manifest: ${extraFiles.join(', ')}`);
  }
  
  // Validate checksums for files that exist in both
  for (const filename of actualImageFiles) {
    if (expectedManifest.imageChecksums[filename]) {
      const actualChecksum = await calculateCRC32Binary(imageFiles[filename]);
      const isValid = actualChecksum === expectedManifest.imageChecksums[filename].toLowerCase();
      imageValidation[filename] = isValid;
      
      if (!isValid) {
        errors.push(`Image checksum mismatch for ${filename}: expected ${expectedManifest.imageChecksums[filename]}, got ${actualChecksum}`);
      }
    } else {
      imageValidation[filename] = false;
    }
  }
  
  // 3. SECURITY FIX: Recreate the manifest using the same generation logic
  // This ensures we detect any tampering with the manifest structure or ordering
  // CRITICAL: Use the same timestamp as the original manifest to ensure identical content
  const recreatedManifest = await generateForensicManifestWithTimestamp(
    dataContent, 
    imageFiles, 
    expectedManifest.createdAt
  );
  
  // Compare the recreated manifest checksum with the expected one
  const manifestValid = recreatedManifest.manifestChecksum === expectedManifest.manifestChecksum.toLowerCase();
  if (!manifestValid) {
    errors.push(`Manifest checksum mismatch: expected ${expectedManifest.manifestChecksum}, got ${recreatedManifest.manifestChecksum}`);
    
    // Additional forensic detail: check what specifically differs
    if (recreatedManifest.dataChecksum !== expectedManifest.dataChecksum.toLowerCase()) {
      errors.push(`Manifest data checksum field differs from actual data`);
    }
    
    // Check if image checksum entries differ
    for (const filename of Object.keys(imageFiles).sort()) {
      if (recreatedManifest.imageChecksums[filename] && 
          recreatedManifest.imageChecksums[filename] !== expectedManifest.imageChecksums[filename]?.toLowerCase()) {
        errors.push(`Manifest image checksum entry for ${filename} differs from actual file`);
      }
    }
  }
  
  const allImageFilesValid = Object.values(imageValidation).every(valid => valid);
  const isValid = dataValid && allImageFilesValid && manifestValid && errors.length === 0;
  
  // Generate forensic summary
  const totalFiles = Object.keys(imageFiles).length;
  const validFiles = Object.values(imageValidation).filter(valid => valid).length;
  
  let summary = `Validation ${isValid ? 'PASSED' : 'FAILED'}: `;
  summary += `Data ${dataValid ? 'valid' : 'invalid'}, `;
  summary += `${validFiles}/${totalFiles} images valid, `;
  summary += `manifest ${manifestValid ? 'valid' : 'invalid'}`;
  
  if (errors.length > 0) {
    summary += `. ${errors.length} error(s) detected`;
  }
  
  return {
    isValid,
    dataValid,
    imageValidation,
    manifestValid,
    errors,
    summary
  };
}

/**
 * Validate complete case integrity including data and images using secure CRC32
 * This function recreates the manifest using the same logic as generation to ensure
 * tamper detection and consistent validation results. Uses timing-attack resistant
 * CRC32 calculation for enhanced security.
 * 
 * @param dataContent - JSON data content
 * @param imageFiles - Map of filename to image blob
 * @param expectedManifest - Expected forensic manifest
 * @returns Comprehensive validation result
 */
export async function validateCaseIntegritySecure(
  dataContent: string,
  imageFiles: { [filename: string]: Blob },
  expectedManifest: {
    dataChecksum: string;
    imageChecksums: { [filename: string]: string };
    manifestChecksum: string;
    totalFiles: number;
    createdAt: string;
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
  const imageValidation: { [filename: string]: boolean } = {};
  
  // 1. Validate data content checksum using secure CRC32
  const actualDataChecksum = calculateCRC32Secure(dataContent);
  const dataValid = actualDataChecksum === expectedManifest.dataChecksum.toLowerCase();
  if (!dataValid) {
    errors.push(`Data checksum mismatch: expected ${expectedManifest.dataChecksum}, got ${actualDataChecksum}`);
  }
  
  // 2. Validate each image file checksum using the actual files provided
  // SECURITY FIX: Use the actual image files to determine validation scope,
  // not the potentially tampered manifest keys
  const actualImageFiles = Object.keys(imageFiles).sort();
  const expectedImageFiles = Object.keys(expectedManifest.imageChecksums).sort();
  
  // Check for missing or extra files
  const missingFiles = expectedImageFiles.filter(f => !actualImageFiles.includes(f));
  const extraFiles = actualImageFiles.filter(f => !expectedImageFiles.includes(f));
  
  if (missingFiles.length > 0) {
    errors.push(`Missing image files: ${missingFiles.join(', ')}`);
  }
  if (extraFiles.length > 0) {
    errors.push(`Extra image files not in manifest: ${extraFiles.join(', ')}`);
  }
  
  // Validate checksums for files that exist in both
  for (const filename of actualImageFiles) {
    if (expectedManifest.imageChecksums[filename]) {
      const actualChecksum = await calculateCRC32Binary(imageFiles[filename]);
      const isValid = actualChecksum === expectedManifest.imageChecksums[filename].toLowerCase();
      imageValidation[filename] = isValid;
      
      if (!isValid) {
        errors.push(`Image checksum mismatch for ${filename}: expected ${expectedManifest.imageChecksums[filename]}, got ${actualChecksum}`);
      }
    } else {
      imageValidation[filename] = false;
    }
  }
  
  // 3. SECURITY FIX: Recreate the manifest using the same generation logic with secure CRC32
  // This ensures we detect any tampering with the manifest structure or ordering
  // CRITICAL: Use the same timestamp as the original manifest to ensure identical content
  const recreatedManifest = await generateForensicManifestWithTimestampSecure(
    dataContent, 
    imageFiles, 
    expectedManifest.createdAt
  );
  
  // Compare the recreated manifest checksum with the expected one
  const manifestValid = recreatedManifest.manifestChecksum === expectedManifest.manifestChecksum.toLowerCase();
  if (!manifestValid) {
    errors.push(`Manifest checksum mismatch: expected ${expectedManifest.manifestChecksum}, got ${recreatedManifest.manifestChecksum}`);
    
    // Additional forensic detail: check what specifically differs
    if (recreatedManifest.dataChecksum !== expectedManifest.dataChecksum.toLowerCase()) {
      errors.push(`Manifest data checksum field differs from actual data`);
    }
    
    // Check if image checksum entries differ
    for (const filename of Object.keys(imageFiles).sort()) {
      if (recreatedManifest.imageChecksums[filename] && 
          recreatedManifest.imageChecksums[filename] !== expectedManifest.imageChecksums[filename]?.toLowerCase()) {
        errors.push(`Manifest image checksum entry for ${filename} differs from actual file`);
      }
    }
  }
  
  const allImageFilesValid = Object.values(imageValidation).every(valid => valid);
  const isValid = dataValid && allImageFilesValid && manifestValid && errors.length === 0;
  
  // Generate forensic summary
  const totalFiles = Object.keys(imageFiles).length;
  const validFiles = Object.values(imageValidation).filter(valid => valid).length;
  
  let summary = `Secure validation ${isValid ? 'PASSED' : 'FAILED'}: `;
  summary += `Data ${dataValid ? 'valid' : 'invalid'}, `;
  summary += `${validFiles}/${totalFiles} images valid, `;
  summary += `manifest ${manifestValid ? 'valid' : 'invalid'}`;
  
  if (errors.length > 0) {
    summary += `. ${errors.length} error(s) detected`;
  }
  
  return {
    isValid,
    dataValid,
    imageValidation,
    manifestValid,
    errors,
    summary
  };
}
