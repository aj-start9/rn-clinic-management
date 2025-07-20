// React Native polyfills for Supabase
// Import URL polyfill with enhanced error handling
try {
  require('react-native-url-polyfill/auto');
} catch (error) {
  console.warn('Failed to load react-native-url-polyfill:', error);
}

// Import core-js polyfills for modern JavaScript features
try {
  require('core-js/actual/structured-clone');
} catch (error) {
  console.warn('core-js/structured-clone not available, using custom polyfill');
}

// Wait for runtime to be ready before setting up polyfills
const waitForRuntime = () => {
  return new Promise<void>((resolve) => {
    if (typeof global !== 'undefined' && (global as any).HermesInternal) {
      // On Hermes, wait a bit more for full initialization
      setTimeout(() => resolve(), 100);
    } else {
      resolve();
    }
  });
};

// Enhanced URL polyfill setup
const setupURLPolyfill = async () => {
  await waitForRuntime();
  
  try {
    // Test if URL is working
    const testUrl = new URL('https://test.com');
    if (!testUrl.protocol) {
      throw new Error('URL.protocol not implemented');
    }
  } catch (error) {
    console.log('Setting up URL polyfill...');
    try {
      const { URL, URLSearchParams } = require('react-native-url-polyfill');
      global.URL = URL;
      global.URLSearchParams = URLSearchParams;
    } catch (polyfillError) {
      console.error('Failed to setup URL polyfill:', polyfillError);
    }
  }
};

// Initialize URL polyfill
setupURLPolyfill();

// structuredClone polyfill for React Native
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = function(obj: any) {
    // Enhanced deep clone implementation with better type handling
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof RegExp) return new RegExp(obj);
    if (obj instanceof Array) return obj.map(item => global.structuredClone(item));
    if (obj instanceof Set) return new Set([...obj].map(item => global.structuredClone(item)));
    if (obj instanceof Map) {
      const clonedMap = new Map();
      for (const [key, value] of obj.entries()) {
        clonedMap.set(global.structuredClone(key), global.structuredClone(value));
      }
      return clonedMap;
    }
    if (typeof obj === 'object') {
      const cloned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = global.structuredClone(obj[key]);
        }
      }
      return cloned;
    }
    return obj;
  };
  console.log('✅ structuredClone polyfill added');
}

// Global polyfills
if (typeof global === 'undefined') {
  // @ts-ignore
  global = globalThis;
}

// Fetch is already available in React Native, no need to polyfill

// TextEncoder/TextDecoder polyfill for older React Native versions
if (typeof global.TextEncoder === 'undefined') {
  const textEncoding = require('text-encoding');
  global.TextEncoder = textEncoding.TextEncoder;
  global.TextDecoder = textEncoding.TextDecoder;
}

// Crypto polyfill with Web Crypto API support
if (typeof global.crypto === 'undefined') {
  try {
    const expoCrypto = require('expo-crypto');
    
    // Create a comprehensive crypto polyfill
    global.crypto = {
      getRandomValues: expoCrypto.getRandomValues,
      randomUUID: expoCrypto.randomUUID || (() => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }),
      subtle: {
        digest: async (algorithm: string, data: ArrayBuffer | Uint8Array) => {
          try {
            // Use expo-crypto for SHA-256 digest
            const digest = await expoCrypto.digestStringAsync(
              expoCrypto.CryptoDigestAlgorithm.SHA256,
              new Uint8Array(data).reduce((str, byte) => str + String.fromCharCode(byte), ''),
              { encoding: expoCrypto.CryptoEncoding.HEX }
            );
            
            // Convert hex string to ArrayBuffer
            const result = new Uint8Array(digest.length / 2);
            for (let i = 0; i < digest.length; i += 2) {
              result[i / 2] = parseInt(digest.substr(i, 2), 16);
            }
            return result.buffer;
          } catch (error) {
            console.error('crypto.subtle.digest error:', error);
            // Fallback: return a dummy hash
            const fallback = new Uint8Array(32);
            global.crypto.getRandomValues(fallback);
            return fallback.buffer;
          }
        },
        importKey: async () => {
          throw new Error('crypto.subtle.importKey not implemented');
        },
        sign: async () => {
          throw new Error('crypto.subtle.sign not implemented');
        },
        verify: async () => {
          throw new Error('crypto.subtle.verify not implemented');
        },
        encrypt: async () => {
          throw new Error('crypto.subtle.encrypt not implemented');
        },
        decrypt: async () => {
          throw new Error('crypto.subtle.decrypt not implemented');
        },
        generateKey: async () => {
          throw new Error('crypto.subtle.generateKey not implemented');
        },
        deriveKey: async () => {
          throw new Error('crypto.subtle.deriveKey not implemented');
        },
        deriveBits: async () => {
          throw new Error('crypto.subtle.deriveBits not implemented');
        },
        wrapKey: async () => {
          throw new Error('crypto.subtle.wrapKey not implemented');
        },
        unwrapKey: async () => {
          throw new Error('crypto.subtle.unwrapKey not implemented');
        },
        exportKey: async () => {
          throw new Error('crypto.subtle.exportKey not implemented');
        },
      },
    } as any;
  } catch (error) {
    console.warn('expo-crypto not available, using fallback crypto implementation');
    
    // Fallback crypto implementation without expo-crypto
    global.crypto = {
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
      randomUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      },
      subtle: {
        digest: async (algorithm: string, data: ArrayBuffer | Uint8Array) => {
          // Simple fallback hash function (not cryptographically secure)
          const input = new Uint8Array(data);
          const result = new Uint8Array(32); // SHA-256 output size
          
          let hash = 0;
          for (let i = 0; i < input.length; i++) {
            hash = ((hash << 5) - hash + input[i]) & 0xffffffff;
          }
          
          // Fill result with pseudo-hash
          for (let i = 0; i < 32; i++) {
            result[i] = (hash + i) & 0xff;
          }
          
          return result.buffer;
        },
        importKey: async () => { throw new Error('crypto.subtle.importKey not implemented'); },
        sign: async () => { throw new Error('crypto.subtle.sign not implemented'); },
        verify: async () => { throw new Error('crypto.subtle.verify not implemented'); },
        encrypt: async () => { throw new Error('crypto.subtle.encrypt not implemented'); },
        decrypt: async () => { throw new Error('crypto.subtle.decrypt not implemented'); },
        generateKey: async () => { throw new Error('crypto.subtle.generateKey not implemented'); },
        deriveKey: async () => { throw new Error('crypto.subtle.deriveKey not implemented'); },
        deriveBits: async () => { throw new Error('crypto.subtle.deriveBits not implemented'); },
        wrapKey: async () => { throw new Error('crypto.subtle.wrapKey not implemented'); },
        unwrapKey: async () => { throw new Error('crypto.subtle.unwrapKey not implemented'); },
        exportKey: async () => { throw new Error('crypto.subtle.exportKey not implemented'); },
      },
    } as any;
  }
}

// ArrayBuffer polyfill
if (typeof global.ArrayBuffer === 'undefined') {
  global.ArrayBuffer = ArrayBuffer;
}

// Uint8Array polyfill
if (typeof global.Uint8Array === 'undefined') {
  global.Uint8Array = Uint8Array;
}

export { };

