import { signUp, testSupabaseConnection } from '../src/services/supabase';

const debugSignUp = async () => {
  console.log('=== Debugging Supabase SignUp ===');
  
  // First test the connection
  console.log('\n1. Testing Supabase connection...');
  const connectionTest = await testSupabaseConnection();
  
  if (!connectionTest.success) {
    console.error('Connection test failed:', connectionTest.error);
    return;
  }
  
  // Test signup with dummy data
  console.log('\n2. Testing signup functionality...');
  try {
    const result = await signUp(
      'test@example.com',
      'testpassword123',
      'consumer',
      'Test User'
    );
    
    console.log('SignUp result:', {
      success: !result.error,
      user: result.data?.user ? 'Created' : 'Not created',
      session: result.data?.session ? 'Created' : 'Not created',
      error: result.error?.message || 'None'
    });
    
  } catch (error) {
    console.error('SignUp test failed with exception:', error);
  }
};

// Run the debug function
debugSignUp().catch(console.error);
