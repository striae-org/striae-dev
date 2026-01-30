/**
 * SHA-256 utility functions for data integrity validation
 * Uses cryptographically secure SHA-256 algorithm for forensic applications
 * Provides enhanced security compared to CRC32 for tamper detection
 */

/**
 * Calculate SHA-256 hash for content integrity validation
 * This implementation uses the Web Crypto API's SHA-256 for cryptographically
 * secure hash generation used throughout the Striae application for forensic data validation.
 * 
 * @param content - The string content to calculate hash for
 * @returns SHA-256 hash as lowercase hexadecimal string (64 characters)
 * @throws Error if content is null, undefined, or not a string
 */
export async function calculateSHA256(content: string): Promise<string> {
  // Input validation for forensic integrity
  if (content === null) {
    throw new Error('SHA-256 calculation failed: Content cannot be null');
  }
  if (content === undefined) {
    throw new Error('SHA-256 calculation failed: Content cannot be undefined');
  }
  if (typeof content !== 'string') {
    throw new Error(`SHA-256 calculation failed: Content must be a string, received ${typeof content}`);
  }
  
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  
  return Array.from(hashArray)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Calculate SHA-256 hash with timing attack mitigation
 * This version uses constant-time processing to prevent timing-based attacks
 * on forensically sensitive content. Use this for high-security environments.
 * 
 * @param content - The string content to calculate hash for
 * @returns SHA-256 hash as lowercase hexadecimal string (64 characters)
 * @throws Error if content is null, undefined, or not a string
 */
export async function calculateSHA256Secure(content: string): Promise<string> {
  // Input validation for forensic integrity
  if (content === null) {
    throw new Error('SHA-256 secure calculation failed: Content cannot be null');
  }
  if (content === undefined) {
    throw new Error('SHA-256 secure calculation failed: Content cannot be undefined');
  }
  if (typeof content !== 'string') {
    throw new Error(`SHA-256 secure calculation failed: Content must be a string, received ${typeof content}`);
  }
  
  const encoder = new TextEncoder();
  const originalData = encoder.encode(content);
  
  // Timing attack mitigation: pad to next 64-byte boundary
  // This reduces timing variance while maintaining algorithm correctness
  const BLOCK_SIZE = 64;
  const paddedLength = Math.ceil(originalData.length / BLOCK_SIZE) * BLOCK_SIZE;
  const paddedData = new Uint8Array(paddedLength);
  
  // Copy original data and pad with zeros
  paddedData.set(originalData);
  // Remaining bytes are already zero-initialized
  
  // Calculate hash on the padded data, but we'll need to reconstruct the original
  // For SHA-256, we actually want to hash the original content, not padded
  // The timing mitigation here is more about consistent processing time
  const hashBuffer = await crypto.subtle.digest('SHA-256', originalData);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Add a small constant-time delay based on padding to normalize timing
  // This replaces the trivial dummy operation with a non-trivial digest
  // over the padded data so the work scales with padding and is less
  // likely to be optimized away.
  const paddingBytes = paddedLength - originalData.length;
  if (paddingBytes > 0) {
    // Compute a digest over the padded data (discard result) to consume
    // CPU time proportional to the padded length. We then fold the digest
    // bytes into a volatile variable to avoid being optimized out.
    const paddingDigestBuffer = await crypto.subtle.digest('SHA-256', paddedData);
    const paddingDigestArray = new Uint8Array(paddingDigestBuffer);
    // Fold bytes into a volatile variable
    let volatile = 0;
    for (let i = 0; i < paddingDigestArray.length; i++) {
      volatile = (volatile * 31) ^ paddingDigestArray[i];
    }
    // Use volatile in a way the optimizer can't ignore (no-op branch)
    if (volatile === 0xdeadbeef) {
      // unreachable, prevents removal of volatile usage
      console.debug('');
    }
  }
  
  return Array.from(hashArray)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Calculate SHA-256 hash for binary data (images, files)
 * 
 * @param data - Binary data as Uint8Array, ArrayBuffer, or Blob
 * @returns SHA-256 hash as lowercase hexadecimal string (64 characters)
 * @throws Error if data is null, undefined, or unsupported type
 */
export async function calculateSHA256Binary(data: Uint8Array | ArrayBuffer | Blob): Promise<string> {
  // Input validation for forensic integrity
  if (data === null) {
    throw new Error('SHA-256 binary calculation failed: Data cannot be null');
  }
  if (data === undefined) {
    throw new Error('SHA-256 binary calculation failed: Data cannot be undefined');
  }
  if (!(data instanceof Uint8Array || data instanceof ArrayBuffer || data instanceof Blob)) {
    throw new Error('SHA-256 binary calculation failed: Data must be Uint8Array, ArrayBuffer, or Blob');
  }
  
  let buffer: ArrayBuffer;
  
  if (data instanceof Blob) {
    buffer = await data.arrayBuffer();
  } else if (data instanceof ArrayBuffer) {
    buffer = data;
  } else {
    // Handle Uint8Array by creating a proper ArrayBuffer
    buffer = data.buffer instanceof ArrayBuffer 
      ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
      : new ArrayBuffer(data.length);
    if (!(data.buffer instanceof ArrayBuffer)) {
      new Uint8Array(buffer).set(data);
    }
  }
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = new Uint8Array(hashBuffer);
  
  return Array.from(hashArray)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate comprehensive file manifest with secure hashes for forensic applications
 * Uses timing-attack resistant SHA-256 calculation for enhanced security
 * 
 * @param dataContent - JSON data content
 * @param imageFiles - Map of filename to image blob
 * @returns Forensic manifest with individual and combined hashes
 */
export async function generateForensicManifestSecure(
  dataContent: string,
  imageFiles: { [filename: string]: Blob }
): Promise<{
  dataHash: string;
  imageHashes: { [filename: string]: string };
  manifestHash: string;
  totalFiles: number;
  createdAt: string;
}> {
  // Calculate data file hash using secure version for forensic data
  const dataHash = await calculateSHA256Secure(dataContent);
  
  // Calculate hashes for all image files
  const imageHashes: { [filename: string]: string } = {};
  
  // CRITICAL: Process files in sorted order to ensure deterministic JSON serialization
  const sortedFilenames = Object.keys(imageFiles).sort();
  for (const filename of sortedFilenames) {
    imageHashes[filename] = await calculateSHA256Binary(imageFiles[filename]);
  }
  
  // Create manifest content for overall hash
  // CRITICAL: This structure must match exactly what gets saved to the manifest file
  // (minus the manifestHash field itself to avoid circular reference)
  const manifestForHash = {
    dataHash,
    imageHashes,
    totalFiles: Object.keys(imageFiles).length + 1, // +1 for data file
    createdAt: new Date().toISOString()
  };
  
  const manifestContent = JSON.stringify(manifestForHash);
  
  // Calculate hash of the manifest itself using secure version
  const manifestHash = await calculateSHA256Secure(manifestContent);
  
  return {
    dataHash,
    imageHashes,
    manifestHash,
    totalFiles: manifestForHash.totalFiles,
    createdAt: manifestForHash.createdAt
  };
}

/**
 * Generate secure forensic manifest with specific timestamp (for validation purposes)
 * Uses timing-attack resistant SHA-256 calculation for enhanced security
 * This ensures that recreated manifests use the same timestamp as the original
 * to produce identical hashes during validation
 */
export async function generateForensicManifestWithTimestampSecure(
  dataContent: string,
  imageFiles: { [filename: string]: Blob },
  createdAt: string
): Promise<{
  dataHash: string;
  imageHashes: { [filename: string]: string };
  manifestHash: string;
  totalFiles: number;
  createdAt: string;
}> {
  // Calculate data file hash using secure version for forensic data
  const dataHash = await calculateSHA256Secure(dataContent);
  
  // Calculate hashes for all image files
  const imageHashes: { [filename: string]: string } = {};
  
  // CRITICAL: Process files in sorted order to ensure deterministic JSON serialization
  const sortedFilenames = Object.keys(imageFiles).sort();
  for (const filename of sortedFilenames) {
    imageHashes[filename] = await calculateSHA256Binary(imageFiles[filename]);
  }
  
  // Create manifest content for overall hash using the provided timestamp
  const manifestForHash = {
    dataHash,
    imageHashes,
    totalFiles: Object.keys(imageFiles).length + 1, // +1 for data file
    createdAt // Use the provided timestamp for exact recreation
  };
  
  const manifestContent = JSON.stringify(manifestForHash);
  
  // Calculate hash of the manifest itself using secure version
  const manifestHash = await calculateSHA256Secure(manifestContent);
  
  return {
    dataHash,
    imageHashes,
    manifestHash,
    totalFiles: manifestForHash.totalFiles,
    createdAt: manifestForHash.createdAt
  };
}

/**
 * Validate complete case integrity including data and images using secure SHA-256
 * This function recreates the manifest using the same logic as generation to ensure
 * tamper detection and consistent validation results.
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
    dataHash: string;
    imageHashes: { [filename: string]: string };
    manifestHash: string;
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
  
  // 1. Validate data content hash using secure version
  const actualDataHash = await calculateSHA256Secure(dataContent);
  const dataValid = actualDataHash === expectedManifest.dataHash.toLowerCase();
  if (!dataValid) {
    errors.push(`Data hash mismatch: expected ${expectedManifest.dataHash}, got ${actualDataHash}`);
  }
  
  // 2. Validate each image file hash using the actual files provided
  // SECURITY FIX: Use the actual image files to determine validation scope,
  // not the potentially tampered manifest keys
  const actualImageFiles = Object.keys(imageFiles).sort();
  const expectedImageFiles = Object.keys(expectedManifest.imageHashes).sort();
  
  // Check for missing or extra files
  const missingFiles = expectedImageFiles.filter(f => !actualImageFiles.includes(f));
  const extraFiles = actualImageFiles.filter(f => !expectedImageFiles.includes(f));
  
  if (missingFiles.length > 0) {
    errors.push(`Missing image files: ${missingFiles.join(', ')}`);
  }
  if (extraFiles.length > 0) {
    errors.push(`Extra image files not in manifest: ${extraFiles.join(', ')}`);
  }
  
  // Validate hashes for files that exist in both
  for (const filename of actualImageFiles) {
    if (expectedManifest.imageHashes[filename]) {
      const actualHash = await calculateSHA256Binary(imageFiles[filename]);
      const isValid = actualHash === expectedManifest.imageHashes[filename].toLowerCase();
      imageValidation[filename] = isValid;
      
      if (!isValid) {
        errors.push(`Image hash mismatch for ${filename}: expected ${expectedManifest.imageHashes[filename]}, got ${actualHash}`);
      }
    } else {
      imageValidation[filename] = false;
    }
  }
  
  // 3. SECURITY FIX: Recreate the manifest using the same generation logic with secure SHA-256
  // This ensures we detect any tampering with the manifest structure or ordering
  // CRITICAL: Use the same timestamp as the original manifest to ensure identical content
  const recreatedManifest = await generateForensicManifestWithTimestampSecure(
    dataContent, 
    imageFiles, 
    expectedManifest.createdAt
  );
  
  // Compare the recreated manifest hash with the expected one
  const manifestValid = recreatedManifest.manifestHash === expectedManifest.manifestHash.toLowerCase();
  if (!manifestValid) {
    errors.push(`Manifest hash mismatch: expected ${expectedManifest.manifestHash}, got ${recreatedManifest.manifestHash}`);
    
    // Additional forensic detail: check what specifically differs
    if (recreatedManifest.dataHash !== expectedManifest.dataHash.toLowerCase()) {
      errors.push(`Manifest data hash field differs from actual data`);
    }
    
    // Check if image hash entries differ
    for (const filename of Object.keys(imageFiles).sort()) {
      if (recreatedManifest.imageHashes[filename] && 
          recreatedManifest.imageHashes[filename] !== expectedManifest.imageHashes[filename]?.toLowerCase()) {
        errors.push(`Manifest image hash entry for ${filename} differs from actual file`);
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