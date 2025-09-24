/**
 * CRC32 Audit Test Script
 * This script validates the CRC32 implementation against known test vectors
 */

// Test vectors from various CRC32 references
const testVectors = [
  { input: '', expected: '00000000' },
  { input: 'a', expected: 'e8b7be43' },
  { input: 'abc', expected: '352441c2' },
  { input: 'message digest', expected: '20159d7f' },
  { input: 'abcdefghijklmnopqrstuvwxyz', expected: '4c2750bd' },
  { input: '1234567890', expected: '261daee5' },
  { input: 'The quick brown fox jumps over the lazy dog', expected: '414fa339' }
];

// Implementation of CRC32 for testing (copied from the utility)
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

function calculateCRC32(content) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  let crc = 0xFFFFFFFF;
  
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}

// Test the implementation
console.log('CRC32 Implementation Audit');
console.log('==========================');

let allPassed = true;

for (const { input, expected } of testVectors) {
  const actual = calculateCRC32(input);
  const passed = actual === expected;
  
  console.log(`Input: "${input}"`);
  console.log(`Expected: ${expected}`);
  console.log(`Actual:   ${actual}`);
  console.log(`Result:   ${passed ? 'PASS' : 'FAIL'}`);
  console.log('---');
  
  if (!passed) {
    allPassed = false;
  }
}

console.log(`Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

// Test edge cases
console.log('\nEdge Case Tests');
console.log('===============');

// Test very long string
const longString = 'A'.repeat(1000000);
const longStart = performance.now();
const longResult = calculateCRC32(longString);
const longTime = performance.now() - longStart;
console.log(`Long string (1M chars): ${longResult} (${longTime.toFixed(2)}ms)`);

// Test with special characters
const unicodeString = 'Hello 🌍 World! 日本語 test';
const unicodeResult = calculateCRC32(unicodeString);
console.log(`Unicode string: ${unicodeResult}`);

// Test binary-like content
const binaryString = String.fromCharCode(...Array(256).keys());
const binaryResult = calculateCRC32(binaryString);
console.log(`Binary content: ${binaryResult}`);