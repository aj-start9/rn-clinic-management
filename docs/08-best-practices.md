# 🎯 Best Practices

## Overview

This document outlines best practices for implementing and maintaining the hybrid architecture with **Frontend**, **Database Triggers**, and **Edge Functions**.

## 🏗️ Architecture Best Practices

### 1. Separation of Concerns

```typescript
// ✅ GOOD: Clear separation
class AppointmentService {
  // Frontend: Fast reads
  static async getAppointments(patientId: string) {
    return supabase.from('appointments').select('*').eq('patient_id', patientId)
  }

  // Edge Function: Complex business logic
  static async bookAppointment(data: BookingData) {
    return supabase.functions.invoke('appointment-workflow', { body: data })
  }

  // Database Triggers: Data integrity (automatic)
  // No frontend code needed - handled by triggers
}

// ❌ BAD: Mixed concerns
class BadAppointmentService {
  static async bookAppointment(data: BookingData) {
    // Don't do business logic in frontend
    const conflicts = await this.checkConflicts(data)
    const availability = await this.updateAvailability(data)
    const notifications = await this.sendNotifications(data)
    // This should be in edge function or triggers
  }
}
```

### 2. Error Handling Strategy

```typescript
// ✅ GOOD: Layered error handling
export class ErrorHandler {
  // Frontend: User-friendly errors
  static handleFrontendError(error: any) {
    if (error.code === 'PGRST116') {
      return 'No data found'
    }
    if (error.message.includes('conflict')) {
      return 'Time slot no longer available'
    }
    return 'Something went wrong. Please try again.'
  }

  // Database: Business rule violations
  static createBusinessError(message: string) {
    throw new Error(`BUSINESS_RULE: ${message}`)
  }

  // Edge Function: Integration errors
  static handleIntegrationError(service: string, error: any) {
    console.error(`${service} integration failed:`, error)
    // Fallback logic or retry
  }
}
```

### 3. Performance Optimization

```typescript
// ✅ GOOD: Optimized queries
const optimizedQuery = supabase
  .from('appointments')
  .select('id, appointment_date, status, doctor:doctors(name)') // Only needed fields
  .eq('patient_id', userId)
  .range(0, 19) // Pagination
  .order('appointment_date')

// ✅ GOOD: Caching strategy
const { data, error } = await supabase
  .from('doctors')
  .select('*')
  .cache(300) // 5 minute cache for static data

// ❌ BAD: Over-fetching
const badQuery = supabase
  .from('appointments')
  .select('*, doctor:doctors(*), patient:patients(*), prescriptions(*)') // Too much data
  .eq('patient_id', userId)
```

## 📊 Database Best Practices

### 1. Trigger Design

```sql
-- ✅ GOOD: Efficient trigger
CREATE OR REPLACE FUNCTION efficient_appointment_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Early return for unchanged data
    IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Minimal processing
    CASE NEW.status
        WHEN 'confirmed' THEN
            UPDATE counters SET confirmed_count = confirmed_count + 1;
        WHEN 'cancelled' THEN
            UPDATE counters SET cancelled_count = cancelled_count + 1;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ❌ BAD: Heavy trigger
CREATE OR REPLACE FUNCTION bad_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Don't do heavy operations in triggers
    PERFORM complex_calculation_function();
    PERFORM send_immediate_notification(); -- Use edge functions instead
    PERFORM generate_large_report(); -- Too heavy for triggers
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Index Strategy

```sql
-- ✅ GOOD: Strategic indexing
CREATE INDEX CONCURRENTLY idx_appointments_patient_date 
ON appointments(patient_id, appointment_date);

CREATE INDEX CONCURRENTLY idx_appointments_doctor_status 
ON appointments(doctor_id, status) 
WHERE status IN ('confirmed', 'pending');

-- Partial index for active appointments only
CREATE INDEX CONCURRENTLY idx_active_appointments 
ON appointments(doctor_id, appointment_date) 
WHERE status NOT IN ('cancelled', 'completed');

-- ❌ BAD: Over-indexing
CREATE INDEX ON appointments(patient_id); -- Redundant with composite index
CREATE INDEX ON appointments(created_at); -- Rarely queried alone
CREATE INDEX ON appointments(id); -- Primary key already indexed
```

### 3. Data Validation

```sql
-- ✅ GOOD: Comprehensive validation
CREATE OR REPLACE FUNCTION validate_appointment()
RETURNS TRIGGER AS $$
BEGIN
    -- Business hours check
    IF EXTRACT(hour FROM NEW.appointment_date) < 9 OR 
       EXTRACT(hour FROM NEW.appointment_date) > 17 THEN
        RAISE EXCEPTION 'Appointments only available 9 AM - 5 PM';
    END IF;

    -- Weekend check
    IF EXTRACT(dow FROM NEW.appointment_date) IN (0, 6) THEN
        RAISE EXCEPTION 'No appointments on weekends';
    END IF;

    -- Future date check
    IF NEW.appointment_date < CURRENT_TIMESTAMP + INTERVAL '1 hour' THEN
        RAISE EXCEPTION 'Appointments must be booked at least 1 hour in advance';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## ⚡ Edge Function Best Practices

### 1. Function Structure

```typescript
// ✅ GOOD: Well-structured edge function
export default async function appointmentWorkflow(req: Request) {
  // 1. Input validation
  const validation = await validateInput(req)
  if (!validation.valid) {
    return errorResponse(400, validation.errors)
  }

  // 2. Authentication check
  const user = await authenticateRequest(req)
  if (!user) {
    return errorResponse(401, 'Unauthorized')
  }

  // 3. Business logic
  try {
    const result = await processAppointment(validation.data, user)
    return successResponse(result)
  } catch (error) {
    return handleError(error)
  }
}

// Helper functions
async function validateInput(req: Request) {
  const data = await req.json()
  const errors = []
  
  if (!data.doctorId) errors.push('Doctor ID required')
  if (!data.appointmentDate) errors.push('Date required')
  
  return { valid: errors.length === 0, errors, data }
}

async function processAppointment(data: any, user: any) {
  // Parallel processing where possible
  const [doctor, availability] = await Promise.all([
    getDoctor(data.doctorId),
    checkAvailability(data.doctorId, data.appointmentDate)
  ])

  if (!availability.available) {
    throw new Error('Time slot not available')
  }

  // Sequential operations that depend on each other
  const appointment = await createAppointment(data, user)
  await sendNotifications(appointment, doctor)
  
  return appointment
}
```

### 2. Error Handling

```typescript
// ✅ GOOD: Comprehensive error handling
function handleError(error: any): Response {
  console.error('Function error:', error)

  // Business logic errors
  if (error.message.includes('not available')) {
    return errorResponse(409, 'Time slot no longer available')
  }

  // Validation errors
  if (error.message.includes('required')) {
    return errorResponse(400, error.message)
  }

  // External service errors
  if (error.message.includes('SMS service')) {
    // Continue without SMS, don't fail the whole operation
    console.warn('SMS failed but appointment created')
    return successResponse({ warning: 'Appointment created but SMS failed' })
  }

  // Database errors
  if (error.code?.startsWith('23')) {
    return errorResponse(409, 'Data conflict occurred')
  }

  // Default error
  return errorResponse(500, 'Internal server error')
}

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

function successResponse(data: any): Response {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### 3. Performance Optimization

```typescript
// ✅ GOOD: Optimized edge function
const supabaseClient = createClient(url, key, {
  db: { schema: 'public' },
  auth: { persistSession: false }, // Don't need sessions in edge functions
  global: { headers: { 'x-client-info': 'edge-function' } }
})

// Connection reuse
let cachedConnections = new Map()

async function getOptimizedConnection() {
  const key = 'default'
  if (!cachedConnections.has(key)) {
    cachedConnections.set(key, supabaseClient)
  }
  return cachedConnections.get(key)
}

// Batch operations
async function processMultipleAppointments(appointments: any[]) {
  // ✅ Batch insert instead of individual inserts
  const { data, error } = await supabase
    .from('appointments')
    .insert(appointments)

  if (error) throw error

  // ✅ Parallel notification sending
  await Promise.allSettled(
    appointments.map(apt => sendNotification(apt))
  )
}

// ❌ BAD: Sequential processing
async function badProcessing(appointments: any[]) {
  for (const apt of appointments) {
    await supabase.from('appointments').insert(apt) // One by one
    await sendNotification(apt) // Blocking
  }
}
```

## 📱 Frontend Best Practices

### 1. React Query Integration

```typescript
// ✅ GOOD: Optimized React Query setup
export function useAppointments(patientId: string) {
  return useQuery({
    queryKey: ['appointments', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, appointment_date, status, doctor:doctors(name)')
        .eq('patient_id', patientId)
        .order('appointment_date')
      
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error.status >= 400 && error.status < 500) return false
      return failureCount < 3
    }
  })
}

// ✅ GOOD: Optimistic updates
export function useCancelAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)
      
      if (error) throw error
    },
    onMutate: async (appointmentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['appointments'])

      // Optimistically update
      queryClient.setQueryData(['appointments'], (old: any) =>
        old?.map((apt: any) => 
          apt.id === appointmentId 
            ? { ...apt, status: 'cancelled' }
            : apt
        )
      )
    },
    onError: (err, appointmentId, context) => {
      // Revert optimistic update
      queryClient.invalidateQueries(['appointments'])
    }
  })
}
```

### 2. Real-time Updates

```typescript
// ✅ GOOD: Efficient real-time subscriptions
export function useRealtimeAppointments(patientId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const subscription = supabase
      .channel(`appointments:${patientId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `patient_id=eq.${patientId}`
      }, (payload) => {
        // Update specific query data
        queryClient.setQueryData(['appointments', patientId], (old: any) => {
          if (!old) return old

          switch (payload.eventType) {
            case 'INSERT':
              return [...old, payload.new]
            case 'UPDATE':
              return old.map((apt: any) => 
                apt.id === payload.new.id ? payload.new : apt
              )
            case 'DELETE':
              return old.filter((apt: any) => apt.id !== payload.old.id)
            default:
              return old
          }
        })
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [patientId, queryClient])
}

// ❌ BAD: Too many subscriptions
function badRealtimeSetup() {
  // Don't create multiple subscriptions for the same data
  useEffect(() => {
    const sub1 = supabase.channel('all_appointments').subscribe()
    const sub2 = supabase.channel('doctor_updates').subscribe()
    const sub3 = supabase.channel('patient_updates').subscribe()
    // This creates unnecessary overhead
  }, [])
}
```

### 3. State Management

```typescript
// ✅ GOOD: Simple state management with React Query
export function AppointmentProvider({ children }: { children: React.ReactNode }) {
  // No need for complex state management when using React Query
  // React Query handles caching, sync, and updates
  return (
    <QueryClient>
      {children}
    </QueryClient>
  )
}

// ✅ GOOD: Local state for UI only
export function BookingForm() {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  
  // Server state managed by React Query
  const { data: availability } = useDoctorAvailability(doctorId, selectedDate)
  const bookingMutation = useBookAppointment()

  return (
    // Form UI
  )
}

// ❌ BAD: Duplicating server state in local state
function badStateManagement() {
  const [appointments, setAppointments] = useState([]) // Duplicates server state
  const [loading, setLoading] = useState(false) // React Query handles this
  const [error, setError] = useState(null) // React Query handles this
  
  // Don't manually manage what React Query already handles
}
```

## 🔒 Security Best Practices

### 1. Row Level Security (RLS)

```sql
-- ✅ GOOD: Comprehensive RLS policies
-- Patients can only see their own appointments
CREATE POLICY "Patients can view own appointments" ON appointments
    FOR SELECT USING (
        auth.uid()::text = patient_id 
        OR 
        auth.uid() IN (
            SELECT user_id FROM doctors WHERE id = doctor_id
        )
    );

-- Patients can only create appointments for themselves
CREATE POLICY "Patients can create own appointments" ON appointments
    FOR INSERT WITH CHECK (
        auth.uid()::text = patient_id
        AND 
        appointment_date > CURRENT_TIMESTAMP + INTERVAL '1 hour'
    );

-- Only doctors can update appointment status to completed
CREATE POLICY "Doctors can complete appointments" ON appointments
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM doctors WHERE id = doctor_id
        )
        AND 
        OLD.status != 'completed'
    ) WITH CHECK (
        NEW.status IN ('confirmed', 'completed', 'cancelled')
    );
```

### 2. Input Validation

```typescript
// ✅ GOOD: Comprehensive validation
import { z } from 'zod'

const AppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  patientId: z.string().uuid(),
  appointmentDate: z.string().datetime(),
  symptoms: z.string().min(1).max(500),
  appointmentType: z.enum(['consultation', 'followup', 'emergency'])
})

export function validateAppointmentRequest(data: unknown) {
  try {
    return AppointmentSchema.parse(data)
  } catch (error) {
    throw new Error(`Validation failed: ${error.message}`)
  }
}

// ✅ GOOD: Sanitize user input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS chars
    .substring(0, 500) // Limit length
}
```

### 3. API Security

```typescript
// ✅ GOOD: Secure edge function
export default async function secureFunction(req: Request) {
  // 1. Verify JWT token
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const user = await verifyJWT(token)
    
    // 2. Check permissions
    if (!await hasPermission(user, 'book_appointment')) {
      return new Response('Forbidden', { status: 403 })
    }

    // 3. Rate limiting
    if (!await checkRateLimit(user.id)) {
      return new Response('Rate limit exceeded', { status: 429 })
    }

    // 4. Process request
    return await processSecureRequest(req, user)
    
  } catch (error) {
    return new Response('Unauthorized', { status: 401 })
  }
}

async function checkRateLimit(userId: string): Promise<boolean> {
  // Implement rate limiting logic
  const key = `rate_limit:${userId}`
  const current = await redis.get(key) || 0
  
  if (current > 10) return false // 10 requests per minute
  
  await redis.setex(key, 60, current + 1)
  return true
}
```

## 📊 Monitoring and Observability

### 1. Logging Strategy

```typescript
// ✅ GOOD: Structured logging
export class Logger {
  static info(message: string, context: any = {}) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }))
  }

  static error(message: string, error: Error, context: any = {}) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: {
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString(),
      ...context
    }))
  }
}

// Usage in edge function
export default async function(req: Request) {
  const requestId = crypto.randomUUID()
  
  Logger.info('Function started', { 
    requestId, 
    url: req.url,
    method: req.method
  })

  try {
    const result = await processRequest(req)
    
    Logger.info('Function completed', { 
      requestId,
      duration: Date.now() - startTime
    })
    
    return result
  } catch (error) {
    Logger.error('Function failed', error, { requestId })
    throw error
  }
}
```

### 2. Performance Monitoring

```typescript
// ✅ GOOD: Performance tracking
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()

  static trackOperation(name: string, duration: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const operations = this.metrics.get(name)!
    operations.push(duration)
    
    // Keep only last 100 measurements
    if (operations.length > 100) {
      operations.shift()
    }

    // Alert on slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration}ms`)
    }
  }

  static getAverageTime(name: string): number {
    const operations = this.metrics.get(name) || []
    return operations.reduce((sum, time) => sum + time, 0) / operations.length
  }

  static getMetrics() {
    const result: Record<string, any> = {}
    
    for (const [name, operations] of this.metrics) {
      result[name] = {
        count: operations.length,
        average: this.getAverageTime(name),
        min: Math.min(...operations),
        max: Math.max(...operations)
      }
    }
    
    return result
  }
}

// Usage
const startTime = Date.now()
await processAppointment(data)
PerformanceMonitor.trackOperation('process_appointment', Date.now() - startTime)
```

### 3. Health Checks

```typescript
// ✅ GOOD: Comprehensive health checks
export default async function healthCheck(req: Request) {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkExternalServices(),
    checkMemoryUsage()
  ])

  const results = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'error', error: checks[0].reason },
      external: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'error', error: checks[1].reason },
      memory: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'error', error: checks[2].reason }
    }
  }

  const hasErrors = Object.values(results.checks).some(check => check.status === 'error')
  if (hasErrors) {
    results.status = 'unhealthy'
  }

  return new Response(JSON.stringify(results), {
    status: hasErrors ? 503 : 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

async function checkDatabase() {
  const start = Date.now()
  const { error } = await supabase.from('appointments').select('id').limit(1)
  
  return {
    status: error ? 'error' : 'healthy',
    responseTime: Date.now() - start,
    error: error?.message
  }
}
```

## 🚀 Deployment Best Practices

### 1. Environment Configuration

```typescript
// ✅ GOOD: Environment-specific configuration
export const config = {
  supabase: {
    url: Deno.env.get('SUPABASE_URL')!,
    anonKey: Deno.env.get('SUPABASE_ANON_KEY')!,
    serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  },
  external: {
    twilioSid: Deno.env.get('TWILIO_SID')!,
    twilioToken: Deno.env.get('TWILIO_AUTH_TOKEN')!,
    sendgridKey: Deno.env.get('SENDGRID_API_KEY')!
  },
  app: {
    environment: Deno.env.get('ENVIRONMENT') || 'development',
    logLevel: Deno.env.get('LOG_LEVEL') || 'info'
  }
}

// Validate required environment variables
function validateConfig() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  for (const key of required) {
    if (!Deno.env.get(key)) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }
}

validateConfig()
```

### 2. Database Migrations

```sql
-- ✅ GOOD: Safe migration pattern
BEGIN;

-- 1. Create new column with default value
ALTER TABLE appointments 
ADD COLUMN appointment_ref VARCHAR(50) 
DEFAULT 'APT-' || EXTRACT(epoch FROM CURRENT_TIMESTAMP)::text;

-- 2. Update existing records in batches
DO $$
DECLARE
    batch_size INTEGER := 1000;
    done BOOLEAN := FALSE;
BEGIN
    WHILE NOT done LOOP
        UPDATE appointments 
        SET appointment_ref = 'APT-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || id::text
        WHERE appointment_ref LIKE 'APT-%'
        AND id IN (
            SELECT id FROM appointments 
            WHERE appointment_ref LIKE 'APT-%'
            LIMIT batch_size
        );
        
        IF NOT FOUND THEN
            done := TRUE;
        END IF;
        
        COMMIT;
    END LOOP;
END $$;

-- 3. Add constraints after data is migrated
ALTER TABLE appointments 
ALTER COLUMN appointment_ref SET NOT NULL;

CREATE UNIQUE INDEX CONCURRENTLY idx_appointments_ref 
ON appointments(appointment_ref);

COMMIT;
```

---

**Next:** [FAQ and Troubleshooting](./09-faq-troubleshooting.md)
