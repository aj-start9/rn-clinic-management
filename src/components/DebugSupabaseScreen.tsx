// Create this test component and run it to debug signup issues
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { debugSignUpProcess, signUp, testSupabaseConnection } from '../services/supabase';

export const DebugSupabaseScreen: React.FC = () => {
  const [result, setResult] = useState<string>('');

  const testConnection = async () => {
    setResult('Testing connection...');
    const test = await testSupabaseConnection();
    setResult(`Connection: ${test.success ? 'SUCCESS' : 'FAILED'}\nError: ${test.error || 'None'}`);
  };

  const testDebugSignup = async () => {
    setResult('Testing debug signup...');
    const debug = await debugSignUpProcess(
      'test@example.com',
      'testpassword123',
      'consumer',
      'Test User'
    );
    setResult(`Debug Signup:
Step: ${debug.step}
Success: ${debug.success}
Error: ${debug.error?.message || 'None'}
Details: ${JSON.stringify(debug.details, null, 2)}`);
  };

  const testRealSignup = async () => {
    setResult('Testing real signup...');
    try {
      const result = await signUp(
        'test@example.com',
        'testpassword123',
        'consumer',
        'Test User'
      );
      setResult(`Real Signup:
Success: ${!result.error}
User: ${result.data?.user ? 'Created' : 'Not created'}
Error: ${result.error?.message || 'None'}`);
    } catch (error) {
      setResult(`Real Signup Exception: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Debug</Text>
      
      <TouchableOpacity style={styles.button} onPress={testConnection}>
        <Text style={styles.buttonText}>Test Connection</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testDebugSignup}>
        <Text style={styles.buttonText}>Debug Signup</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testRealSignup}>
        <Text style={styles.buttonText}>Test Real Signup</Text>
      </TouchableOpacity>
      
      <Text style={styles.result}>{result}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  result: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
