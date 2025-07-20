# Doctor Onboarding Automatic Flag Management

## Overview

The doctor onboarding system has been refactored to use **automatic database triggers** instead of manual frontend flag updates. This ensures that onboarding flags (`profile_completed`, `clinics_added`, `availability_created`) are always accurate and updated in real-time whenever the underlying data changes.

## How It Works

### Database Triggers

**Location:** `sql/onboarding-triggers-automatic.sql`

The system uses PostgreSQL triggers that automatically update onboarding flags whenever relevant data changes:

1. **Profile Completion Trigger**
   - **Table:** `doctors`
   - **Trigger:** `trigger_update_profile_completed`
   - **Updates:** `profile_completed` flag
   - **Condition:** All required fields are present (`specialty_id`, `experience_years`, `license_number`, `bio`)

2. **Clinics Added Trigger**
   - **Table:** `doctor_clinics`
   - **Trigger:** `trigger_update_clinics_added`
   - **Updates:** `clinics_added` flag
   - **Condition:** Doctor has at least one clinic association

3. **Availability Created Trigger**
   - **Table:** `availabilities`
   - **Trigger:** `trigger_update_availability_created`
   - **Updates:** `availability_created` flag
   - **Condition:** Doctor has at least one availability slot

### Frontend Changes

**Location:** `src/services/doctorOnboardingService.ts`

- Removed manual flag update logic from `checkDoctorOnboardingStatus()`
- Made flag update functions (`markProfileCompleted`, `markClinicsAdded`, `markAvailabilityCreated`) into no-ops with deprecation warnings
- The service now reads flag values directly from the database instead of calculating them

**Location:** `src/screens/doctor/ClinicManagementScreen.tsx` and `src/screens/doctor/EnhancedAvailabilityScreen.tsx`

- Removed calls to manual flag update functions
- Added comments indicating that flags are now updated automatically by database triggers

## Installation

### 1. Run the Database Migration

Execute the SQL migration in your Supabase SQL Editor:

```sql
-- Copy and paste the entire content of:
sql/onboarding-triggers-automatic.sql
```

This will:
- Create the trigger functions
- Set up triggers on relevant tables
- Update existing doctor records with correct flag values
- Create performance indexes

### 2. Deploy Frontend Changes

The frontend changes are already in place and compatible with both manual and automatic flag systems.

## Benefits

### 1. **Data Consistency**
- Flags are always accurate and reflect the current state of data
- No risk of frontend bugs causing incorrect flag states
- Automatic updates when data changes from any source (admin panels, direct DB updates, etc.)

### 2. **Performance**
- Reduced frontend complexity
- Fewer API calls needed to update flags
- Database-level optimization with triggers

### 3. **Reliability**
- No dependency on frontend code execution for flag updates
- Works even if users close the app during onboarding steps
- Handles edge cases automatically (data deletion, updates, etc.)

### 4. **Maintenance**
- Centralized logic in database triggers
- Easier to debug and maintain
- Clear separation of concerns

## Migration from Manual System

The migration is backward compatible:

1. **Existing Code:** Manual flag update functions still exist but are now no-ops
2. **Gradual Migration:** You can remove manual calls over time
3. **Immediate Benefits:** Flags are updated automatically even before removing manual calls

## Testing

### Database Level
```sql
-- Test profile completion
INSERT INTO doctors (user_id, specialty_id, experience_years, license_number, bio) 
VALUES ('test-user-id', 1, 5, 'LIC123', 'Test bio');

-- Check if profile_completed is automatically set to true
SELECT profile_completed FROM doctors WHERE user_id = 'test-user-id';

-- Test clinic association
INSERT INTO doctor_clinics (doctor_id, clinic_id) 
VALUES ('doctor-id', 'clinic-id');

-- Check if clinics_added is automatically set to true
SELECT clinics_added FROM doctors WHERE id = 'doctor-id';
```

### Frontend Level
```typescript
// The onboarding service will now read flags directly from database
const status = await checkDoctorOnboardingStatus(userId);
// status.profileCompleted, status.clinicsAdded, status.availabilityCreated
// are now always accurate without manual updates
```

## Monitoring

### Performance
- Check trigger execution time if you notice slow insert/update operations
- Monitor index usage with `EXPLAIN ANALYZE`

### Flag Accuracy
```sql
-- Verify flag accuracy vs actual data
SELECT 
  id,
  profile_completed,
  (specialty_id IS NOT NULL AND experience_years IS NOT NULL AND license_number IS NOT NULL AND bio IS NOT NULL) as actual_profile_complete,
  clinics_added,
  EXISTS(SELECT 1 FROM doctor_clinics WHERE doctor_id = doctors.id) as actual_clinics_added,
  availability_created,
  EXISTS(SELECT 1 FROM availabilities WHERE doctor_id = doctors.id) as actual_availability_created
FROM doctors;
```

## Troubleshooting

### Flags Not Updating
1. Check if triggers are enabled:
   ```sql
   SELECT * FROM information_schema.triggers WHERE trigger_name LIKE '%onboarding%';
   ```

2. Check trigger function exists:
   ```sql
   SELECT * FROM information_schema.routines WHERE routine_name LIKE '%update_%_flag%';
   ```

### Performance Issues
1. Check if indexes are being used:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM doctors WHERE profile_completed = true AND clinics_added = true;
   ```

2. Monitor trigger execution time in slow query logs

### Data Inconsistency
1. Re-run the flag update portion of the migration:
   ```sql
   -- Update all existing doctors to have correct flag values
   UPDATE doctors SET profile_completed = (
       specialty_id IS NOT NULL AND
       experience_years IS NOT NULL AND
       license_number IS NOT NULL AND
       bio IS NOT NULL AND
       trim(bio) != ''
   );
   ```

## Future Enhancements

1. **Audit Trail:** Add trigger logging to track flag changes
2. **Webhooks:** Trigger external notifications when onboarding completes
3. **Advanced Logic:** Add more complex onboarding requirements
4. **Analytics:** Track onboarding completion rates and bottlenecks

## Files Modified

- `sql/onboarding-triggers-automatic.sql` - New trigger system
- `src/services/doctorOnboardingService.ts` - Simplified flag management
- `src/screens/doctor/ClinicManagementScreen.tsx` - Removed manual flag calls
- `src/screens/doctor/EnhancedAvailabilityScreen.tsx` - Removed manual flag calls
- `src/redux/authSlice.supabase.ts` - Fixed service import
- `src/navigation/AppNavigator.tsx` - Added new onboarding screens
