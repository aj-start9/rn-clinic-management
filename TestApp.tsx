// Test App without Supabase to isolate the URL polyfill issue
import './src/polyfills';

import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AppRegistry, StyleSheet, Text, View } from 'react-native';
import { Provider } from 'react-redux';
import { Colors } from './src/constants/theme';
// import { AppNavigator } from './src/navigation/AppNavigator';
import { store } from './src/redux/store';

function TestApp() {
  // Test URL polyfill
  React.useEffect(() => {
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
  }, []);

  return (
    <Provider store={store}>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <View style={styles.container}>
        <Text style={styles.text}>URL Polyfill Test</Text>
        <Text style={styles.subtext}>Check console for URL polyfill results</Text>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: Colors.secondary,
    textAlign: 'center',
  },
});

export default TestApp;

// Register the main component
AppRegistry.registerComponent('main', () => TestApp);
