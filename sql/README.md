# SQL Scripts for Doctor Appointment App

This folder contains all SQL scripts needed to set up and maintain the Supabase database for the Doctor Appointment App.

## Files Overview

### `supabase-setup.sql`
- **Purpose**: Initial database schema setup
- **Contains**: Table definitions, relationships, and basic structure
- **When to run**: First time setting up the database
- **Dependencies**: None

### `fix-rls-policies.sql`
- **Purpose**: Row Level Security (RLS) policies configuration
- **Contains**: Security policies for all tables to ensure proper data access control
- **When to run**: After initial setup or when updating security policies
- **Dependencies**: Requires `supabase-setup.sql` to be run first

### `QUICK_FIX.sql`
- **Purpose**: Database triggers for automatic profile creation
- **Contains**: Triggers that automatically create user profiles after signup
- **When to run**: After RLS policies are set up
- **Dependencies**: Requires both setup and RLS files

### `sample_data.sql`
- **Purpose**: Test data for development and testing
- **Contains**: Sample doctors, clinics, and appointments for testing the app
- **When to run**: After all other scripts (optional for development)
- **Dependencies**: Requires all other scripts to be run first

## Recommended Execution Order

1. `supabase-setup.sql` - Create the database schema
2. `fix-rls-policies.sql` - Set up security policies
3. `QUICK_FIX.sql` - Add automatic triggers
4. `sample_data.sql` - Add test data (optional)

## How to Run

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the content of each file in the recommended order
4. Execute each script one by one

## Notes

- Always backup your database before running any scripts
- Test scripts on a development database first
- Some scripts may need to be modified based on your specific requirements
- Make sure to enable RLS on all tables for security

## Troubleshooting

If you encounter errors:
1. Check that tables exist before running policies
2. Ensure you have proper permissions in Supabase
3. Verify the execution order
4. Check the Supabase logs for detailed error messages
