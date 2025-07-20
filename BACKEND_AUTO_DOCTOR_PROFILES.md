# Backend Auto Doctor Profile Creation

## Overview

The backend now automatically creates doctor profiles when users with role "doctor" create their profiles. This eliminates the need for frontend code to manually create doctor records.

## How It Works

### Complete User-to-Doctor Flow:

```
1. User signs up (any role) 
   ↓ 
2. handle_new_user() trigger creates profile record
   ↓
3. IF role = 'doctor' → auto_create_doctor_profile() creates doctor record
   ↓
4. Doctor record starts with all onboarding flags = false
   ↓
5. As doctor completes steps → triggers automatically update flags
```

## Database Triggers Setup

### 1. **User Creation** (auth.users → profiles)
```sql
-- When user signs up, create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 2. **Doctor Profile Auto-Creation** (profiles → doctors)
```sql
-- When profile with role='doctor' is created, create doctor record
CREATE TRIGGER trigger_auto_create_doctor_profile
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION auto_create_doctor_profile();
```

### 3. **Role Change Handling** (profile role update → doctor record)
```sql
-- When role changes to 'doctor', create doctor record if missing
CREATE TRIGGER trigger_handle_role_change_to_doctor
    AFTER UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION handle_role_change_to_doctor();
```

### 4. **Automatic Onboarding Flags** 
- **Profile completion**: Updates when doctor fills required fields
- **Clinics added**: Updates when doctor-clinic associations change
- **Availability created**: Updates when availability slots change

## Files to Run

### Option 1: Individual Files (Recommended)
```sql
1. sql/fix-rls-policies.sql                    -- User creation trigger
2. sql/dr-onboarding-triggers-automatic.sql   -- Auto doctor creation + onboarding flags
```

### Option 2: Comprehensive File
```sql
1. sql/triggers-and-functions.sql  -- Everything in one file
```

## Frontend Changes

The frontend can now be simplified:

### Before (Manual):
```typescript
// Frontend had to manually create doctor record
const createDoctorProfile = async (userData) => {
  await supabase.from('doctors').insert({
    user_id: userData.id,
    full_name: userData.full_name
    // ...
  });
};
```

### After (Automatic):
```typescript
// No manual doctor creation needed!
// Just sign up with role='doctor' and doctor record is auto-created
const { data, error } = await signUpWithTrigger(email, password, 'doctor', fullName);
// Doctor record now exists automatically
```

## Testing the Setup

### 1. Test Auto Doctor Creation:
```sql
-- Run: sql/test-auto-doctor-creation.sql
-- This will create test users and show the automatic doctor record creation
```

### 2. Verify in Supabase Dashboard:
```sql
-- Check that triggers exist
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%doctor%' OR trigger_name LIKE '%auto%';

-- Check doctor records are created
SELECT 
    p.role,
    p.full_name,
    d.id as doctor_id,
    d.profile_completed,
    d.clinics_added,
    d.availability_created
FROM profiles p
LEFT JOIN doctors d ON p.id = d.user_id
WHERE p.role = 'doctor';
```

## Benefits

### 1. **Consistency**
- Every doctor user automatically gets a doctor record
- No risk of missing doctor records due to frontend bugs

### 2. **Simplicity** 
- Frontend doesn't need to handle doctor record creation
- Reduces API calls and complexity

### 3. **Reliability**
- Database-level automation can't be bypassed
- Works even if frontend has issues

### 4. **Real-time Updates**
- Onboarding flags update immediately when data changes
- Perfect for "when I close and reopen app" scenarios

## Database Schema Requirements

Ensure your `doctors` table has these columns:
```sql
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) UNIQUE,
    full_name TEXT,
    specialty_id UUID,
    experience_years INTEGER,
    license_number TEXT,
    bio TEXT,
    profile_completed BOOLEAN DEFAULT false,
    clinics_added BOOLEAN DEFAULT false,
    availability_created BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Monitoring

### Check Auto-Creation is Working:
```sql
-- Count profiles vs doctor records
SELECT 
    (SELECT COUNT(*) FROM profiles WHERE role = 'doctor') as doctor_profiles,
    (SELECT COUNT(*) FROM doctors) as doctor_records;
-- Should be equal after running triggers
```

### Check Onboarding Flags:
```sql
-- See onboarding completion status
SELECT 
    COUNT(*) as total_doctors,
    COUNT(CASE WHEN profile_completed THEN 1 END) as completed_profiles,
    COUNT(CASE WHEN clinics_added THEN 1 END) as added_clinics,
    COUNT(CASE WHEN availability_created THEN 1 END) as created_availability
FROM doctors;
```

## Error Handling

The triggers include error handling:
- Duplicate prevention (won't create doctor record if already exists)
- Role validation (only creates for role='doctor')
- Logging with `RAISE NOTICE` for debugging

## Migration Strategy

### For Existing Data:
The triggers include migration logic:
```sql
-- Creates doctor records for existing doctor profiles
INSERT INTO doctors (id, user_id, full_name, ...)
SELECT gen_random_uuid(), p.id, p.full_name, ...
FROM profiles p
WHERE p.role = 'doctor'
AND NOT EXISTS (SELECT 1 FROM doctors d WHERE d.user_id = p.id);
```

This complete backend automation ensures that doctor onboarding works seamlessly without any frontend intervention! 🚀
