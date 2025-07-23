# ⚡ Edge Functions Documentation

## Overview

Edge Functions are **serverless TypeScript/JavaScript functions** that run on Supabase's global edge network. They handle **complex business logic** and **external integrations** that can't be done in database triggers or shouldn't be done in the frontend.

## 🎯 Why Use Edge Functions?

### ✅ **External API Integration**
- SMS, Email, Push notifications
- Payment processing (Stripe, PayPal)
- Calendar sync (Google, Outlook)
- File processing and storage

### ✅ **Complex Business Logic**
- Multi-step workflows
- Data aggregation and analytics
- Report generation
- Complex validation rules

### ✅ **Security**
- Server-side operations with secrets
- API key management
- Secure payment processing
- Rate limiting and abuse prevention

## 📁 Our Edge Functions

### 1. Appointment Workflow

**File:** `supabase/functions/appointment-workflow/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AppointmentWorkflowRequest {
  appointmentId: string
  operation: 'created' | 'status_changed' | 'updated'
  oldStatus?: string
  newStatus: string
  doctorId: string
  patientId: string
  appointmentDate: string
  timeSlot: string
}

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestData: AppointmentWorkflowRequest = await req.json()
    const { appointmentId, operation } = requestData

    // Get full appointment details
    const { data: appointment } = await supabase
      .from('appointments')
      .select(`*, patients(*), doctors(*)`)
      .eq('id', appointmentId)
      .single()

    // Handle different operations
    switch (operation) {
      case 'created':
        await handleAppointmentCreated(supabase, appointment)
        break
      case 'status_changed':
        await handleStatusChanged(supabase, appointment)
        break
    }

    return new Response(JSON.stringify({ success: true }))
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})

async function handleAppointmentCreated(supabase: any, appointment: any) {
  // Send multiple notifications in parallel
  await Promise.all([
    sendSMS(appointment.patients?.phone, `Appointment confirmed with Dr. ${appointment.doctors?.full_name}`),
    sendEmail(appointment.patients?.email, 'Appointment Confirmation', generateEmailTemplate(appointment)),
    sendPushNotification(appointment.patient_id, 'Appointment Confirmed'),
    addToCalendar(appointment),
    createInternalNotifications(supabase, appointment)
  ])
}
```

**Purpose:** Handle all appointment-related workflows  
**Triggered by:** Database trigger after appointment changes  
**Operations:** SMS, Email, Push notifications, Calendar sync  

---

### 2. Book Appointment with Confirmation

**File:** `supabase/functions/book-appointment-with-confirmation/index.ts`

```typescript
serve(async (req: Request) => {
  try {
    const { appointmentData } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Create appointment (triggers will handle validation)
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        doctor_id: appointmentData.doctorId,
        patient_id: appointmentData.patientId,
        appointment_date: appointmentData.date,
        time_slot: appointmentData.timeSlot,
        fee: appointmentData.fee,
        status: 'pending'
      })
      .select(`*, doctors(*), patients:users!patient_id(*)`)
      .single()

    if (error) throw new Error(error.message)

    // 2. Send immediate confirmation
    await Promise.all([
      sendSMS(appointment.patients.phone, `Appointment booked! Reference: ${appointment.id.slice(0, 8)}`),
      sendEmail(appointment.patients.email, 'Appointment Confirmation', generateConfirmationEmail(appointment))
    ])

    return new Response(JSON.stringify({
      success: true,
      appointment: {
        id: appointment.id,
        doctorName: appointment.doctors.full_name,
        date: appointment.appointment_date,
        timeSlot: appointment.time_slot
      },
      message: "Appointment booked successfully! Confirmation sent."
    }))

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
```

**Purpose:** Book appointment with immediate user feedback  
**Called by:** React Native app when user wants instant confirmation  
**Operations:** Appointment creation + immediate SMS/Email  

---

### 3. Payment Processing

**File:** `supabase/functions/process-payment/index.ts`

```typescript
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req: Request) => {
  try {
    const { appointmentId, paymentMethodId, amount } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      return_url: 'https://your-app.com/payment-success'
    })

    // 2. Update appointment with payment info
    const { error } = await supabase
      .from('appointments')
      .update({
        payment_status: 'paid',
        payment_intent_id: paymentIntent.id,
        status: 'confirmed' // Auto-confirm when paid
      })
      .eq('id', appointmentId)

    if (error) throw new Error(error.message)

    // 3. Send payment confirmation
    await sendPaymentConfirmation(appointmentId, paymentIntent.id)

    return new Response(JSON.stringify({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status
      }
    }))

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
```

**Purpose:** Secure payment processing with Stripe  
**Called by:** React Native app during payment flow  
**Operations:** Payment processing, appointment confirmation, receipts  

---

### 4. Send Appointment Reminders

**File:** `supabase/functions/send-reminders/index.ts`

```typescript
serve(async (req: Request) => {
  try {
    const { date } = await req.json() // Date to send reminders for
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get tomorrow's appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select(`*, patients(*), doctors(*)`)
      .eq('appointment_date', date)
      .eq('status', 'confirmed')

    if (!appointments) return new Response('No appointments found')

    // Send reminders in batches
    const reminderPromises = appointments.map(async (appointment) => {
      const message = `Reminder: You have an appointment with Dr. ${appointment.doctors.full_name} tomorrow at ${appointment.time_slot}. Please arrive 15 minutes early.`
      
      return Promise.all([
        sendSMS(appointment.patients.phone, message),
        sendPushNotification(appointment.patient_id, 'Appointment Reminder', message)
      ])
    })

    await Promise.all(reminderPromises)

    return new Response(JSON.stringify({
      success: true,
      remindersSent: appointments.length,
      message: `Sent ${appointments.length} appointment reminders`
    }))

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
```

**Purpose:** Automated appointment reminders  
**Triggered by:** Cron job (scheduled daily)  
**Operations:** Bulk SMS and push notifications  

---

### 5. Generate Doctor Reports

**File:** `supabase/functions/generate-report/index.ts`

```typescript
serve(async (req: Request) => {
  try {
    const { doctorId, period } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - (period === 'month' ? 1 : 3))

    // Get appointment data
    const { data: appointments } = await supabase
      .from('appointments')
      .select(`*, patients(*)`)
      .eq('doctor_id', doctorId)
      .gte('appointment_date', startDate.toISOString().split('T')[0])
      .lte('appointment_date', endDate.toISOString().split('T')[0])

    // Calculate analytics
    const analytics = {
      totalAppointments: appointments?.length || 0,
      completedAppointments: appointments?.filter(a => a.status === 'completed').length || 0,
      cancelledAppointments: appointments?.filter(a => a.status === 'cancelled').length || 0,
      totalRevenue: appointments?.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.fee, 0) || 0,
      averageRating: 4.5, // Would calculate from reviews
      patientRetention: 0.85, // Would calculate from repeat patients
    }

    // Generate PDF report (would use a PDF library)
    const reportData = {
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      analytics,
      appointments: appointments?.slice(0, 10) // Recent appointments
    }

    return new Response(JSON.stringify({
      success: true,
      reportData,
      downloadUrl: 'https://your-storage.com/report.pdf' // Would generate actual PDF
    }))

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
```

**Purpose:** Generate comprehensive doctor performance reports  
**Called by:** Doctor dashboard when requesting analytics  
**Operations:** Data aggregation, calculations, PDF generation  

---

## 🔧 Helper Functions

### SMS Integration (Twilio)

```typescript
async function sendSMS(phone: string, message: string) {
  try {
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_SID/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa('YOUR_SID:YOUR_TOKEN')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: Deno.env.get('TWILIO_PHONE_NUMBER') || '',
        To: phone,
        Body: message
      })
    })
    
    if (!response.ok) throw new Error('SMS sending failed')
    console.log(`SMS sent to ${phone}`)
  } catch (error) {
    console.error('SMS error:', error)
    // Don't throw - notifications should be non-blocking
  }
}
```

### Email Integration (SendGrid)

```typescript
async function sendEmail(email: string, subject: string, html: string) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: 'noreply@yourapp.com', name: 'Your App' },
        subject,
        content: [{ type: 'text/html', value: html }]
      })
    })
    
    if (!response.ok) throw new Error('Email sending failed')
    console.log(`Email sent to ${email}`)
  } catch (error) {
    console.error('Email error:', error)
  }
}
```

### Push Notifications (Firebase)

```typescript
async function sendPushNotification(userId: string, title: string, body: string) {
  try {
    // Get user's FCM token from database
    const { data: user } = await supabase
      .from('users')
      .select('fcm_token')
      .eq('id', userId)
      .single()

    if (!user?.fcm_token) return

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: user.fcm_token,
        notification: { title, body },
        data: { type: 'appointment_update' }
      })
    })
    
    console.log(`Push notification sent to ${userId}`)
  } catch (error) {
    console.error('Push notification error:', error)
  }
}
```

## 🚀 Deployment

### Deploy All Functions
```bash
# Deploy all edge functions
supabase functions deploy

# Deploy specific function
supabase functions deploy appointment-workflow
```

### Set Environment Variables
```bash
# Set secrets for edge functions
supabase secrets set TWILIO_ACCOUNT_SID=your_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_token
supabase secrets set SENDGRID_API_KEY=your_key
supabase secrets set STRIPE_SECRET_KEY=your_key
```

### Test Functions Locally
```bash
# Start local development
supabase functions serve

# Test specific function
curl -X POST 'http://localhost:54321/functions/v1/appointment-workflow' \
  -H 'Content-Type: application/json' \
  -d '{"appointmentId": "123", "operation": "created"}'
```

## 📊 Performance Monitoring

### Function Execution Time
```typescript
// Add timing to your functions
const startTime = Date.now()
// ... function logic ...
const executionTime = Date.now() - startTime
console.log(`Function executed in ${executionTime}ms`)
```

### Error Tracking
```typescript
// Structured error logging
try {
  // ... function logic ...
} catch (error) {
  console.error({
    error: error.message,
    function: 'appointment-workflow',
    timestamp: new Date().toISOString(),
    requestData: JSON.stringify(requestData)
  })
  
  return new Response(JSON.stringify({ 
    error: 'Internal server error',
    requestId: crypto.randomUUID()
  }), { status: 500 })
}
```

## 🎯 Best Practices

### ✅ **Do**
- Keep functions focused on single responsibility
- Use environment variables for secrets
- Implement proper error handling
- Log important events for debugging
- Use TypeScript for type safety
- Test functions thoroughly

### ❌ **Don't**
- Store secrets in code
- Make functions too complex
- Ignore error handling
- Block on non-critical operations
- Forget to handle CORS
- Use functions for simple database queries

---

**Next:** [Frontend Services](./04-frontend-services.md)
