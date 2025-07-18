// Test crypto polyfill functionality
import '../src/polyfills';

const testCryptoPolyfill = async () => {
  console.log('=== Testing Crypto Polyfill ===');
  
  try {
    // Test if crypto is available
    if (typeof global.crypto === 'undefined') {
      console.error('❌ global.crypto is not defined');
      return false;
    }
    
    console.log('✅ global.crypto is available');
    
    // Test getRandomValues
    const randomArray = new Uint8Array(16);
    global.crypto.getRandomValues(randomArray);
    console.log('✅ crypto.getRandomValues works:', randomArray.slice(0, 4));
    
    // Test randomUUID
    const uuid = global.crypto.randomUUID();
    console.log('✅ crypto.randomUUID works:', uuid);
    
    // Test crypto.subtle
    if (!global.crypto.subtle) {
      console.error('❌ crypto.subtle is not available');
      return false;
    }
    
    console.log('✅ crypto.subtle is available');
    
    // Test crypto.subtle.digest
    const testData = new Uint8Array([1, 2, 3, 4, 5]);
    const digest = await global.crypto.subtle.digest('SHA-256', testData);
    console.log('✅ crypto.subtle.digest works:', new Uint8Array(digest).slice(0, 4));
    
    console.log('🎉 All crypto polyfill tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Crypto polyfill test failed:', error);
    return false;
  }
};

// Run the test
testCryptoPolyfill();
