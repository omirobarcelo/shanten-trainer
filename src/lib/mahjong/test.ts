/**
 * Simple test utilities to verify Mahjong functions work correctly
 */

import { parseTenhou, toTenhou, toHand34, fromHand34 } from './tenhou';
import { calculateShanten } from './shanten';
import { generateRandomHand } from './hand-generator';

// Test cases
export function runTests() {
  console.log('Running Mahjong tests...\n');

  // Test 1: Parse Tenhou notation
  console.log('Test 1: Parse Tenhou notation');
  const testHand1 = parseTenhou('123m456p789s11z');
  console.log('Parsed:', testHand1);
  console.log('Back to Tenhou:', toTenhou(testHand1));
  console.log('✓\n');

  // Test 2: Convert to Hand34
  console.log('Test 2: Convert to Hand34');
  const hand34 = toHand34(testHand1);
  console.log('Hand34:', hand34);
  const backToHand = fromHand34(hand34);
  console.log('Back to Hand:', backToHand);
  console.log('✓\n');

  // Test 3: Calculate shanten
  console.log('Test 3: Calculate shanten');
  const shanten = calculateShanten(hand34);
  console.log('Shanten:', shanten);
  console.log('✓\n');

  // Test 4: Generate random hand
  console.log('Test 4: Generate random hand');
  const randomHand = generateRandomHand();
  console.log('Random hand:', toTenhou(randomHand));
  const randomShanten = calculateShanten(toHand34(randomHand));
  console.log('Shanten:', randomShanten);
  console.log('✓\n');

  // Test 5: Known shanten examples
  console.log('Test 5: Known shanten examples');

  // Tenpai example (0 shanten) - one tile away from winning
  const tenpaiHand = parseTenhou('1112345678999m');
  const tenpaiShanten = calculateShanten(toHand34(tenpaiHand));
  console.log('Tenpai hand:', toTenhou(tenpaiHand), 'Shanten:', tenpaiShanten);

  // 1 shanten example
  const oneShantenHand = parseTenhou('123456789m123p');
  const oneShanten = calculateShanten(toHand34(oneShantenHand));
  console.log(
    '1 shanten hand:',
    toTenhou(oneShantenHand),
    'Shanten:',
    oneShanten
  );

  console.log('✓\n');
  console.log('All tests completed!');
}
