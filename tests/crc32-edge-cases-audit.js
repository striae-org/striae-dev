/**
 * CRC32 Error Handling and Edge Cases Audit
 */

// Import the CRC32 functions (simulated for Node.js testing)
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

function verifyCRC32(content, expectedChecksum) {
  const actualChecksum = calculateCRC32(content);
  return actualChecksum === expectedChecksum.toLowerCase();
}

function validateCRC32(content, expectedChecksum) {
  try {
    const actualChecksum = calculateCRC32(content);
    const normalizedExpected = expectedChecksum.toLowerCase();
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

console.log('CRC32 Error Handling and Edge Cases Audit');
console.log('==========================================');

// Test 1: Null and undefined inputs
console.log('Test 1: Null/Undefined handling');
try {
  const result1 = calculateCRC32(null);
  console.log('Null input result:', result1);
} catch (error) {
  console.log('Null input error:', error.message);
}

try {
  const result2 = calculateCRC32(undefined);
  console.log('Undefined input result:', result2);
} catch (error) {
  console.log('Undefined input error:', error.message);
}

// Test 2: Empty string
console.log('\nTest 2: Empty string handling');
const emptyResult = calculateCRC32('');
console.log('Empty string result:', emptyResult);
console.log('Empty string matches expected:', emptyResult === '00000000' ? 'PASS' : 'FAIL');

// Test 3: Very large strings (memory stress test)
console.log('\nTest 3: Large input handling');
try {
  const largeString = 'A'.repeat(10000000); // 10MB
  const start = performance.now();
  const largeResult = calculateCRC32(largeString);
  const time = performance.now() - start;
  console.log(`Large string (10MB): ${largeResult} (${time.toFixed(2)}ms)`);
  console.log('Large string handling: PASS');
} catch (error) {
  console.log('Large string error:', error.message);
}

// Test 4: Case sensitivity in validation
console.log('\nTest 4: Case sensitivity');
const testString = 'test';
const checksum = calculateCRC32(testString);
console.log('Original checksum:', checksum);
console.log('Uppercase verification:', verifyCRC32(testString, checksum.toUpperCase()));
console.log('Lowercase verification:', verifyCRC32(testString, checksum.toLowerCase()));
console.log('Mixed case verification:', verifyCRC32(testString, checksum.toUpperCase().slice(0,4) + checksum.toLowerCase().slice(4)));

// Test 5: Invalid checksum formats
console.log('\nTest 5: Invalid checksum format handling');
const invalidFormats = ['', 'invalid', '123', 'gggggggg', '12345678901234567890'];
for (const invalid of invalidFormats) {
  const validation = validateCRC32('test', invalid);
  console.log(`Format "${invalid}": valid=${validation.isValid}, error="${validation.error || 'none'}"`);
}

// Test 6: Unicode handling
console.log('\nTest 6: Unicode and special character handling');
const unicodeTests = [
  '🦄', // Emoji
  'café', // Accented characters  
  '日本語', // Japanese
  '🏳️‍🌈', // Complex emoji with modifiers
  '\u0000\u0001\u0002', // Control characters
  'test\n\r\t', // Newlines and tabs
];

for (const test of unicodeTests) {
  try {
    const result = calculateCRC32(test);
    console.log(`"${test}" -> ${result}`);
  } catch (error) {
    console.log(`"${test}" -> ERROR: ${error.message}`);
  }
}

// Test 7: Timing attack resistance (simplified test)
console.log('\nTest 7: Timing consistency');
const testInputs = ['a'.repeat(100), 'b'.repeat(100), 'c'.repeat(100)];
const times = [];

for (const input of testInputs) {
  const iterations = 1000;
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    calculateCRC32(input);
  }
  
  const avgTime = (performance.now() - start) / iterations;
  times.push(avgTime);
  console.log(`Input "${input.charAt(0)}x100": ${avgTime.toFixed(6)}ms avg`);
}

const maxTime = Math.max(...times);
const minTime = Math.min(...times);
const variance = ((maxTime - minTime) / minTime) * 100;
console.log(`Timing variance: ${variance.toFixed(2)}%`);
console.log(`Timing consistency: ${variance < 10 ? 'GOOD' : 'WARNING - High variance'}`);

// Test 8: Collision resistance (basic test)
console.log('\nTest 8: Basic collision resistance');
const testStrings = [
  'test1', 'test2', 'test3', 'test4', 'test5',
  'hello world', 'hello world!', 'Hello World',
  '123456789', '987654321', '123456780'
];

const checksums = new Set();
let collisions = 0;

for (const str of testStrings) {
  const checksum = calculateCRC32(str);
  if (checksums.has(checksum)) {
    collisions++;
    console.log(`COLLISION DETECTED: "${str}" has same checksum as previous input`);
  }
  checksums.add(checksum);
}

console.log(`Collision test: ${collisions === 0 ? 'PASS' : `WARNING - ${collisions} collisions found`}`);