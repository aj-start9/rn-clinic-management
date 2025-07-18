// Simple test for URL polyfill
import './src/polyfills';

// Test if URL is working
try {
  const testUrl = new URL('https://test.com/path?param=value');
  console.log('✅ URL polyfill working:', {
    protocol: testUrl.protocol,
    hostname: testUrl.hostname,
    pathname: testUrl.pathname,
    search: testUrl.search
  });
} catch (error) {
  console.error('❌ URL polyfill failed:', error);
}

// Test if URLSearchParams is working
try {
  const params = new URLSearchParams('param1=value1&param2=value2');
  console.log('✅ URLSearchParams working:', params.get('param1'));
} catch (error) {
  console.error('❌ URLSearchParams failed:', error);
}

export { };

