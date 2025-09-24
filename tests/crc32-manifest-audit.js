/**
 * CRC32 Manifest Security Audit Script
 * Tests the deterministic nature and security aspects of the forensic manifest generation
 */

// Simulate the manifest generation logic
function generateForensicManifest(dataContent, imageFiles) {
  // Calculate data file checksum
  const dataChecksum = calculateCRC32(dataContent);
  
  // Calculate checksums for all image files
  const imageChecksums = {};
  
  // CRITICAL: Process files in sorted order to ensure deterministic JSON serialization
  const sortedFilenames = Object.keys(imageFiles).sort();
  for (const filename of sortedFilenames) {
    imageChecksums[filename] = `checksum_${filename}`; // Simulated for testing
  }
  
  // Create manifest content for overall checksum
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

// CRC32 implementation for testing
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function calculateCRC32(content) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  let crc = 0xFFFFFFFF;
  
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}

console.log('CRC32 Forensic Manifest Security Audit');
console.log('======================================');

// Test 1: Deterministic ordering
console.log('Test 1: File ordering determinism');
const testData = "Sample forensic data";
const imageFiles1 = { 'c.jpg': 'data', 'a.png': 'data', 'b.gif': 'data' };
const imageFiles2 = { 'b.gif': 'data', 'c.jpg': 'data', 'a.png': 'data' };

// Create manifests with same files in different order
const fixedTimestamp = '2024-01-01T00:00:00.000Z';
const manifest1 = generateForensicManifestWithTimestamp(testData, imageFiles1, fixedTimestamp);
const manifest2 = generateForensicManifestWithTimestamp(testData, imageFiles2, fixedTimestamp);

console.log('Files 1 order:', Object.keys(imageFiles1));
console.log('Files 2 order:', Object.keys(imageFiles2));
console.log('Manifest 1 checksum:', manifest1.manifestChecksum);
console.log('Manifest 2 checksum:', manifest2.manifestChecksum);
console.log('Deterministic ordering:', manifest1.manifestChecksum === manifest2.manifestChecksum ? 'PASS' : 'FAIL');

// Test 2: Timestamp sensitivity
console.log('\nTest 2: Timestamp sensitivity');
const timestamp1 = '2024-01-01T00:00:00.000Z';
const timestamp2 = '2024-01-01T00:00:01.000Z';

const manifestTime1 = generateForensicManifestWithTimestamp(testData, imageFiles1, timestamp1);
const manifestTime2 = generateForensicManifestWithTimestamp(testData, imageFiles1, timestamp2);

console.log('Timestamp 1:', timestamp1);
console.log('Timestamp 2:', timestamp2);
console.log('Manifest 1 checksum:', manifestTime1.manifestChecksum);
console.log('Manifest 2 checksum:', manifestTime2.manifestChecksum);
console.log('Timestamp affects checksum:', manifestTime1.manifestChecksum !== manifestTime2.manifestChecksum ? 'PASS' : 'FAIL');

// Test 3: Content tampering detection
console.log('\nTest 3: Content tampering detection');
const originalData = "Original forensic data";
const tamperedData = "Tampered forensic data";

const originalManifest = generateForensicManifestWithTimestamp(originalData, imageFiles1, fixedTimestamp);
const tamperedManifest = generateForensicManifestWithTimestamp(tamperedData, imageFiles1, fixedTimestamp);

console.log('Original checksum:', originalManifest.manifestChecksum);
console.log('Tampered checksum:', tamperedManifest.manifestChecksum);
console.log('Tampering detection:', originalManifest.manifestChecksum !== tamperedManifest.manifestChecksum ? 'PASS' : 'FAIL');

// Test 4: JSON serialization consistency
console.log('\nTest 4: JSON serialization consistency');
const testObj = {
  z: 'last',
  a: 'first', 
  m: 'middle'
};

const json1 = JSON.stringify(testObj);
const json2 = JSON.stringify(testObj);
console.log('JSON consistency:', json1 === json2 ? 'PASS' : 'FAIL');

// Test with different object creation order
const obj1 = { a: 1, b: 2, c: 3 };
const obj2 = { c: 3, a: 1, b: 2 };
console.log('Object 1 JSON:', JSON.stringify(obj1));
console.log('Object 2 JSON:', JSON.stringify(obj2));
console.log('Property order preserved:', JSON.stringify(obj1) !== JSON.stringify(obj2) ? 'PASS (different)' : 'FAIL (same)');

function generateForensicManifestWithTimestamp(dataContent, imageFiles, createdAt) {
  const dataChecksum = calculateCRC32(dataContent);
  const imageChecksums = {};
  
  const sortedFilenames = Object.keys(imageFiles).sort();
  for (const filename of sortedFilenames) {
    imageChecksums[filename] = `checksum_${filename}`;
  }
  
  const manifestForChecksum = {
    dataChecksum,
    imageChecksums,
    totalFiles: Object.keys(imageFiles).length + 1,
    createdAt
  };
  
  const manifestContent = JSON.stringify(manifestForChecksum);
  const manifestChecksum = calculateCRC32(manifestContent);
  
  return {
    dataChecksum,
    imageChecksums,
    manifestChecksum,
    totalFiles: manifestForChecksum.totalFiles,
    createdAt: manifestForChecksum.createdAt
  };
}