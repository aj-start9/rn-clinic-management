// Load polyfills first, before any other imports
import './src/polyfills';

import React from 'react';
import { AppRegistry, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { Colors } from './src/constants/theme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { store } from './src/redux/store';
import { getSupabase } from './src/services/supabase';
import testSupabaseIntegration from './src/test-supabase';

function App() {
  const [isReady, setIsReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Test URL polyfill
        const testUrl = new URL('https://test.com/path?param=value');
        console.log('✅ URL polyfill working:', {
          protocol: testUrl.protocol,
          hostname: testUrl.hostname,
          pathname: testUrl.pathname,
          search: testUrl.search
        });

        // Test structuredClone polyfill
        if (typeof global.structuredClone === 'function') {
          const testObj = { 
            name: 'test', 
            nested: { value: 42 }, 
            array: [1, 2, { deep: true }],
            date: new Date()
          };
          const cloned = global.structuredClone(testObj);
          console.log('✅ structuredClone polyfill working:', {
            original: testObj,
            cloned: cloned,
            isDeepCopy: cloned !== testObj && cloned.nested !== testObj.nested
          });
        } else {
          throw new Error('structuredClone polyfill not available');
        }

        // Initialize Supabase
        await getSupabase();
        console.log('✅ Supabase initialized successfully');
        
        // Run integration tests
        await testSupabaseIntegration();
        
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
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    console.warn('App started with initialization error:', error);
  }

  return (
    <Provider store={store}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <AppNavigator />
      </SafeAreaView>
    </Provider>
  );
}

export default App;

// Register the main component
AppRegistry.registerComponent('main', () => App);
