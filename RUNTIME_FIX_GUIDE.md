# React Native Supabase Runtime Fix Guide

This guide addresses the "runtime not ready illegal invocation" and "URL.protocol is not implemented" errors when using Supabase with React Native/Expo and Hermes.

## Problem

When using Supabase with React Native (especially on Hermes), you may encounter:
- `runtime not ready illegal invocation`
- `URL.protocol is not implemented`
- `TypeError: Cannot read property 'protocol' of undefined`

## Root Cause

These errors occur because:
1. The JavaScript runtime (Hermes) isn't fully initialized when Supabase tries to access certain APIs
2. URL polyfills aren't properly set up before Supabase initialization
3. Supabase tries to access URL APIs synchronously during module loading

## Solution Implementation

### 1. Enhanced Polyfills (`src/polyfills.ts`)

```typescript
// React Native polyfills for Supabase
// Import URL polyfill with enhanced error handling
try {
  require('react-native-url-polyfill/auto');
} catch (error) {
  console.warn('Failed to load react-native-url-polyfill:', error);
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
```

### 2. Async Supabase Initialization (`src/services/supabase.ts`)

```typescript
// Lazy initialization to avoid runtime issues
let supabaseClient: any = null;
let initializationPromise: Promise<any> | null = null;

// Wait for JavaScript runtime to be fully ready
const waitForRuntime = () => {
  return new Promise<void>((resolve) => {
    if (typeof global !== 'undefined' && (global as any).HermesInternal) {
      // On Hermes, wait for full initialization
      setTimeout(() => resolve(), 150);
    } else {
      resolve();
    }
  });
};

const initializeSupabaseClient = async () => {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      // Wait for runtime to be ready
      await waitForRuntime();
      
      // Verify required globals are available
      if (typeof global.URL === 'undefined') {
        throw new Error('URL polyfill not ready');
      }
      
      // Test URL functionality
      const testUrl = new global.URL('https://test.com');
      if (!testUrl.protocol) {
        throw new Error('URL.protocol not implemented');
      }

      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          flowType: 'pkce',
        },
        global: {
          headers: {
            'X-Client-Info': 'supabase-js-react-native',
          },
        },
      });

      console.log('✅ Supabase client initialized successfully');
      return supabaseClient;
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      supabaseClient = null;
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
};

const getSupabaseClient = async () => {
  if (!supabaseClient) {
    await initializeSupabaseClient();
  }
  return supabaseClient;
};

// Export async getter
export const getSupabase = async () => {
  return await getSupabaseClient();
};
```

### 3. App Initialization (`App.tsx`)

```typescript
function App() {
  const [isReady, setIsReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Test URL polyfill
        const testUrl = new URL('https://test.com/path?param=value');
        console.log('✅ URL polyfill working');

        // Initialize Supabase
        await getSupabase();
        console.log('✅ Supabase initialized successfully');
        
        setIsReady(true);
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setIsReady(true); // Still show the app, but with error handling
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}
```

## Testing

Use the provided test function to verify everything works:

```typescript
import testSupabaseIntegration from './src/test-supabase';

// In your component
React.useEffect(() => {
  testSupabaseIntegration();
}, []);
```

## Key Points

1. **Load polyfills first**: Import polyfills before any other code
2. **Wait for runtime**: Give Hermes time to fully initialize
3. **Async initialization**: Never initialize Supabase synchronously
4. **Test URL functionality**: Verify polyfills work before using Supabase
5. **Graceful error handling**: Don't crash the app if Supabase fails to initialize

## Troubleshooting

If you still get errors:

1. Clear Metro cache: `npx expo start --clear`
2. Restart the development server completely
3. Check that you're using the latest versions of polyfill packages
4. Verify that polyfills are loaded before any Supabase code
5. Increase the wait time in `waitForRuntime()` if needed

## Alternative: Mock Data Fallback

If Supabase integration continues to fail, the app includes mock data fallbacks that allow full functionality without backend dependencies.

```typescript
// In your Redux slices, use:
import { authSlice } from './authSlice'; // Mock version
// Instead of:
// import { authSlice } from './authSlice.supabase'; // Supabase version
```

This ensures your app works regardless of backend connectivity issues.
