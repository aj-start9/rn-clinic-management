# Migration Guide: From Mock Data to Supabase

This guide explains how to migrate your Doctor Booking App from using mock data to real Supabase integration.

## Overview

The app currently uses mock services for demonstration purposes. This guide shows you how to switch to real Supabase backend services.

## Files to Replace

### 1. Redux Slices

Replace the current Redux slices with the Supabase-enabled versions:

```bash
# Backup current files
mv src/redux/authSlice.ts src/redux/authSlice.mock.ts
mv src/redux/doctorSlice.ts src/redux/doctorSlice.mock.ts
mv src/redux/appointmentSlice.ts src/redux/appointmentSlice.mock.ts

# Use Supabase versions
mv src/redux/authSlice.supabase.ts src/redux/authSlice.ts
mv src/redux/doctorSlice.supabase.ts src/redux/doctorSlice.ts
mv src/redux/appointmentSlice.supabase.ts src/redux/appointmentSlice.ts
```

### 2. Update Login Screen

The login screen may need updates to handle real authentication errors and success states.

**Before (Mock):**
```typescript
import { MockAuthService } from '../../services/mockAuth';
```

**After (Supabase):**
```typescript
// No direct import needed, uses Redux actions
import { signInUser } from '../../redux/authSlice';
```

### 3. Update App Navigator

Add session persistence and authentication state monitoring:

```typescript
// In AppNavigator.tsx
import { useEffect } from 'react';
import { useAppDispatch } from '../hooks/useNavigation';
import { loadUser } from '../redux/authSlice';
import { supabase } from '../services/supabase';

export function AppNavigator() {
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    // Check for existing session
    dispatch(loadUser());
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          dispatch(loadUser());
        } else if (event === 'SIGNED_OUT') {
          // Handle sign out
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [dispatch]);

  // ... rest of component
}
```

## Testing the Migration

### 1. Environment Setup

1. Complete the Supabase setup from `SUPABASE_SETUP.md`
2. Update your `.env` file with real Supabase credentials
3. Run the SQL scripts to create tables and sample data

### 2. Test Authentication

1. **Sign Up Flow:**
   - Create a new account
   - Check if user appears in Supabase Auth dashboard
   - Verify profile is created in `profiles` table

2. **Sign In Flow:**
   - Use existing credentials
   - Verify user data loads correctly
   - Check role-based navigation works

3. **Sign Out Flow:**
   - Sign out and verify session is cleared
   - Check that protected routes redirect to login

### 3. Test Doctor Features

1. **Doctor List:**
   - Verify doctors load from Supabase
   - Test search and filtering
   - Check specialty filtering works

2. **Doctor Details:**
   - Navigate to doctor detail page
   - Verify all information displays correctly
   - Check clinic information loads

### 4. Test Appointment Features

1. **Booking Flow:**
   - Select a doctor and clinic
   - Choose available slot
   - Complete booking process
   - Verify appointment appears in Supabase

2. **Appointment Management:**
   - View appointments for consumers
   - View appointments for doctors
   - Test status updates

## Common Migration Issues

### 1. Type Mismatches

**Issue:** TypeScript errors due to different data structures
**Solution:** Update the type definitions in `src/types/index.ts` to match Supabase data

### 2. Authentication State

**Issue:** App doesn't detect existing login sessions
**Solution:** Add session persistence in App.tsx:

```typescript
useEffect(() => {
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      dispatch(loadUser());
    }
  };
  
  checkSession();
}, []);
```

### 3. Data Loading

**Issue:** Data doesn't load or appears differently
**Solution:** Check the Supabase table structure matches expected data format

### 4. Navigation Issues

**Issue:** Role-based navigation doesn't work
**Solution:** Ensure user role is properly set in the profile table

## Performance Optimizations

### 1. Add Loading States

Update screens to show loading indicators:

```typescript
const { doctors, loading, error } = useAppSelector(state => state.doctors);

if (loading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage error={error} />;
}
```

### 2. Implement Caching

Add data caching to reduce API calls:

```typescript
// In doctor slice
const lastFetch = Date.now();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

if (Date.now() - lastFetch < CACHE_DURATION && state.doctors.length > 0) {
  return; // Skip fetch if data is recent
}
```

### 3. Optimize Queries

Use Supabase query optimization:

```typescript
// Fetch only needed fields
const { data } = await supabase
  .from('doctors')
  .select('id, name, specialty, rating, fee, photo_url')
  .eq('verified', true)
  .order('rating', { ascending: false })
  .limit(20);
```

## Security Considerations

### 1. Row Level Security (RLS)

Ensure all tables have proper RLS policies:

```sql
-- Example: Users can only see their own appointments
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (user_id = auth.uid());
```

### 2. Environment Variables

Never commit actual Supabase keys to version control:

```bash
# Add to .gitignore
.env
.env.local
```

### 3. Input Validation

Add validation for all user inputs:

```typescript
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

## Rollback Plan

If you need to rollback to mock data:

```bash
# Restore mock files
mv src/redux/authSlice.mock.ts src/redux/authSlice.ts
mv src/redux/doctorSlice.mock.ts src/redux/doctorSlice.ts
mv src/redux/appointmentSlice.mock.ts src/redux/appointmentSlice.ts

# Remove Supabase versions
rm src/redux/*.supabase.ts
```

## Monitoring and Debugging

### 1. Supabase Dashboard

Monitor your app through the Supabase dashboard:
- **Auth**: View user registrations and sessions
- **Database**: Check data insertion and updates
- **Logs**: Monitor API calls and errors

### 2. Console Logging

Add debugging logs:

```typescript
console.log('Auth state changed:', { user, session });
console.log('API call result:', { data, error });
```

### 3. Error Handling

Implement comprehensive error handling:

```typescript
try {
  const result = await supabaseCall();
  return result;
} catch (error) {
  console.error('Supabase error:', error);
  throw new Error('Failed to complete operation');
}
```

## Next Steps

After successful migration:

1. **Testing**: Thoroughly test all features
2. **Performance**: Monitor and optimize database queries
3. **Security**: Review and tighten security policies
4. **Backup**: Set up regular database backups
5. **Monitoring**: Implement error tracking and analytics

## Support

If you encounter issues during migration:

1. Check the Supabase documentation
2. Review the error logs in Supabase dashboard
3. Verify your table schema matches the expected structure
4. Test with the Supabase SQL editor to isolate issues
