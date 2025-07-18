// Test file to verify Supabase integration works without runtime errors
import { getSupabase } from './services/supabase';

export const testSupabaseIntegration = async () => {
  console.log('🧪 Testing Supabase integration...');
  
  try {
    // Test 1: Initialize client
    console.log('1. Initializing Supabase client...');
    const client = await getSupabase();
    console.log('✅ Supabase client initialized');

    // Test 2: Test auth methods (don't actually sign up)
    console.log('2. Testing auth methods availability...');
    if (typeof client.auth.signUp === 'function') {
      console.log('✅ auth.signUp available');
    } else {
      throw new Error('auth.signUp not available');
    }

    if (typeof client.auth.signInWithPassword === 'function') {
      console.log('✅ auth.signInWithPassword available');
    } else {
      throw new Error('auth.signInWithPassword not available');
    }

    // Test 3: Test database methods
    console.log('3. Testing database methods...');
    if (typeof client.from === 'function') {
      console.log('✅ client.from available');
    } else {
      throw new Error('client.from not available');
    }

    // Test 4: Test URL parsing (common source of runtime errors)
    console.log('4. Testing URL parsing...');
    const testUrl = new URL('https://test.supabase.co/rest/v1/table');
    if (testUrl.protocol === 'https:' && testUrl.hostname === 'test.supabase.co') {
      console.log('✅ URL parsing works correctly');
    } else {
      throw new Error('URL parsing failed');
    }

    console.log('🎉 All Supabase integration tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Supabase integration test failed:', error);
    return false;
  }
};

// Export for use in screens/components
export default testSupabaseIntegration;
