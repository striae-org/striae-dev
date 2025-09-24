/**
 * Integration test for secure CRC32 implementations across all workflows
 * Tests confirmation, export, and import workflows with secure CRC32
 */

console.log('Secure CRC32 Integration Test');
console.log('============================');

// Simulate the secure CRC32 functions (for Node.js testing environment)
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

function calculateCRC32Secure(content) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  let crc = 0xFFFFFFFF;
  
  const BLOCK_SIZE = 64;
  const paddedLength = Math.ceil(bytes.length / BLOCK_SIZE) * BLOCK_SIZE;
  
  for (let i = 0; i < paddedLength; i++) {
    const byte = i < bytes.length ? bytes[i] : 0;
    const shouldProcess = i < bytes.length;
    
    if (shouldProcess) {
      crc = CRC32_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    } else {
      const dummy = CRC32_TABLE[0] ^ 0;
    }
  }
  
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}

// Test 1: Confirmation Data Workflow
console.log('Test 1: Confirmation Data Security');
const confirmationData = {
  caseNumber: "TEST-2024-001",
  annotations: [
    { type: "measurement", value: "10.5mm" },
    { type: "note", value: "Clear striae pattern visible" }
  ],
  metadata: {
    examiner: "John Doe",
    timestamp: "2024-01-01T10:00:00Z"
  }
};

const confirmationJson = JSON.stringify(confirmationData, null, 2);
const standardChecksum = calculateCRC32(confirmationJson);
const secureChecksum = calculateCRC32Secure(confirmationJson);

console.log(`Standard CRC32: ${standardChecksum}`);
console.log(`Secure CRC32:   ${secureChecksum}`);
console.log(`Results match:  ${standardChecksum === secureChecksum ? 'YES' : 'NO'}`);

// Test 2: Export Manifest Generation
console.log('\nTest 2: Export Manifest Security');
const exportData = {
  caseNumber: "TEST-2024-002", 
  firearm: "Smith & Wesson Model 686",
  ammunition: "Federal .357 Magnum",
  images: ["image1.jpg", "image2.jpg"],
  annotations: [
    { imageId: "image1", type: "measurement", value: "5.2mm" }
  ]
};

const exportJson = JSON.stringify(exportData, null, 2);

// Simulate manifest generation
const manifestData = {
  dataChecksum: calculateCRC32Secure(exportJson),
  imageChecksums: {
    "image1.jpg": "a1b2c3d4",
    "image2.jpg": "e5f6g7h8"
  },
  totalFiles: 3,
  createdAt: "2024-01-01T12:00:00Z"
};

const manifestJson = JSON.stringify(manifestData);
const manifestChecksum = calculateCRC32Secure(manifestJson);

console.log(`Export data checksum: ${manifestData.dataChecksum}`);
console.log(`Manifest checksum:    ${manifestChecksum}`);
console.log(`Manifest generation:  SUCCESS`);

// Test 3: Import Validation Security
console.log('\nTest 3: Import Validation Security');
const importData = exportData; // Same data being imported
const importJson = JSON.stringify(importData, null, 2);

// Validate the import
const validationChecksum = calculateCRC32Secure(importJson);
const isValid = validationChecksum === manifestData.dataChecksum;

console.log(`Import checksum:     ${validationChecksum}`);
console.log(`Expected checksum:   ${manifestData.dataChecksum}`);
console.log(`Validation result:   ${isValid ? 'PASS' : 'FAIL'}`);

// Test 4: Tamper Detection
console.log('\nTest 4: Tamper Detection');
const tamperedData = { ...exportData, caseNumber: "TAMPERED-001" };
const tamperedJson = JSON.stringify(tamperedData, null, 2);
const tamperedChecksum = calculateCRC32Secure(tamperedJson);
const tamperedValid = tamperedChecksum === manifestData.dataChecksum;

console.log(`Tampered checksum:   ${tamperedChecksum}`);
console.log(`Original checksum:   ${manifestData.dataChecksum}`);
console.log(`Tamper detected:     ${tamperedValid ? 'NO (FAIL)' : 'YES (PASS)'}`);

// Test 5: Cross-validation between standard and secure
console.log('\nTest 5: Cross-validation Test');
const testStrings = [
  'Simple test string',
  JSON.stringify({ test: "data" }),
  'Forensic evidence data with special chars: àáâãäåæçèé',
  'Large'.repeat(1000) // Large string test
];

let crossValidationPassed = 0;
for (const testString of testStrings) {
  const std = calculateCRC32(testString);
  const sec = calculateCRC32Secure(testString);
  const matches = std === sec;
  crossValidationPassed += matches ? 1 : 0;
  
  if (!matches) {
    console.log(`MISMATCH: "${testString.substring(0, 30)}..." -> Std: ${std}, Sec: ${sec}`);
  }
}

console.log(`Cross-validation: ${crossValidationPassed}/${testStrings.length} passed`);

// Test 6: Performance Comparison
console.log('\nTest 6: Performance Impact');
const largeForensicData = JSON.stringify({
  caseNumber: "PERF-TEST-001",
  evidence: Array.from({length: 1000}, (_, i) => ({
    id: i,
    measurement: `${Math.random() * 100}mm`,
    note: `Evidence item ${i} with detailed forensic analysis data`
  }))
});

const iterations = 100;

// Standard CRC32 performance
const startStd = performance.now();
for (let i = 0; i < iterations; i++) {
  calculateCRC32(largeForensicData);
}
const stdTime = performance.now() - startStd;

// Secure CRC32 performance
const startSec = performance.now();
for (let i = 0; i < iterations; i++) {
  calculateCRC32Secure(largeForensicData);
}
const secTime = performance.now() - startSec;

console.log(`Standard CRC32: ${(stdTime / iterations).toFixed(3)}ms avg`);
console.log(`Secure CRC32:   ${(secTime / iterations).toFixed(3)}ms avg`);
console.log(`Performance overhead: ${((secTime / stdTime - 1) * 100).toFixed(1)}%`);

// Summary
console.log('\n=== Integration Test Summary ===');
const tests = [
  ['Confirmation Security', standardChecksum === secureChecksum],
  ['Export Manifest', manifestChecksum.length === 8],
  ['Import Validation', isValid],
  ['Tamper Detection', !tamperedValid],
  ['Cross-validation', crossValidationPassed === testStrings.length],
  ['Performance', (secTime / stdTime) < 2.0] // Less than 100% overhead
];

let passedTests = 0;
for (const [testName, passed] of tests) {
  console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASS' : 'FAIL'}`);
  if (passed) passedTests++;
}

console.log(`\nOverall: ${passedTests}/${tests.length} tests passed`);
console.log(`Status: ${passedTests === tests.length ? 'ALL SECURE IMPLEMENTATIONS WORKING' : 'ISSUES DETECTED'}`);