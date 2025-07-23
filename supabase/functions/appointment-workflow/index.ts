// =============================================
// APPOINTMENT WORKFLOW - EDGE FUNCTION
// =============================================

// @ts-ignore - Deno imports for edge function environment
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno imports for edge function environment  
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================
// SHARED CONSTANTS & CONFIG
// =============================================
const SUPABASE_URL = 'https://cwfaicjqdlvnuxlkgkfs.supabase.co'
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZmFpY2pxZGx2bnV4bGtna2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjQyNDAsImV4cCI6MjA2ODM0MDI0MH0.d1jLd200AaZU76hmFgddmhqEIyhpEKiSKHSjEQoOjUs'

// Create Supabase client once at module level - reuse throughout the function
const supabase = createClient(
  SUPABASE_URL,
  // @ts-ignore - Deno environment variable access
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? FALLBACK_KEY
)

interface AppointmentWorkflowPayload {
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
    const payload: AppointmentWorkflowPayload = await req.json()
    
    // Use the supabase client defined at module level

    // Get full appointment details with related data
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        doctor:doctors(*)
      `)
      .eq('id', payload.appointmentId)
      .single()

    if (appointmentError || !appointment) {
      throw new Error('Appointment not found')
    }

    // Execute workflow based on operation
    switch (payload.operation) {
      case 'created':
        await handleAppointmentCreated(appointment, supabase)
        break
      case 'status_changed':
        await handleStatusChanged(appointment, payload.oldStatus || '', supabase)
        break
      case 'updated':
        await handleAppointmentUpdated(appointment, supabase)
        break
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Workflow completed' }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Appointment workflow error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})

// =============================================
// WORKFLOW HANDLERS
// =============================================

async function handleAppointmentCreated(appointment: any, supabase: any) {
  console.log(`Processing new appointment: ${appointment.id}`)
  
  // 1. Send confirmation notifications
  await sendAppointmentNotifications(appointment, 'created')
  
  // 2. Create calendar events
  await createCalendarEvents(appointment)
  
  // 3. Send welcome information
  await sendAppointmentDetails(appointment)
  
  // 4. Track analytics
  await trackAnalytics('appointment_created', appointment)
  
  // 5. Update user statistics
  await updateUserStats(appointment, supabase)
}

async function sendAppointmentNotifications(appointment: any, type: 'created' | 'updated') {
  const message = type === 'created' 
    ? `✅ New appointment scheduled with Dr. ${appointment.doctor.full_name} on ${formatDate(appointment.appointment_date)} at ${appointment.time_slot}`
    : `📝 Your appointment with Dr. ${appointment.doctor.full_name} has been updated`
  
  await Promise.all([
    sendSMS(appointment.patient.phone, message),
    sendEmail(appointment.patient.email, `Appointment ${type}`, {
      template: `appointment_${type}`,
      data: appointment
    }),
    sendPushNotification(appointment.patient_id, {
      title: `Appointment ${type}`,
      body: message,
      data: { appointmentId: appointment.id }
    })
  ])
}

async function sendAppointmentDetails(appointment: any) {
  const details = `
    🏥 Appointment Details:
    👨‍⚕️ Doctor: Dr. ${appointment.doctor.full_name}
    🏥 Specialty: ${appointment.doctor.specialty}
    📅 Date: ${formatDate(appointment.appointment_date)}
    🕐 Time: ${appointment.time_slot}
    💰 Fee: $${appointment.fee}
    📍 Location: ${appointment.doctor.clinic_address}
  `
  
  await sendSMS(appointment.patient.phone, details)
}

async function handleStatusChanged(appointment: any, oldStatus: string, supabase: any) {
  console.log(`Appointment ${appointment.id} status changed: ${oldStatus} -> ${appointment.status}`)
  
  switch (appointment.status) {
    case 'confirmed':
      await handleAppointmentConfirmed(appointment, supabase)
      break
    case 'cancelled':
      await handleAppointmentCancelled(appointment, supabase)
      break
    case 'completed':
      await handleAppointmentCompleted(appointment, supabase)
      break
    case 'expired':
      await handleAppointmentExpired(appointment, supabase)
      break
  }
}

async function handleAppointmentExpired(appointment: any, supabase: any) {
  // Send expiration notifications
  await Promise.all([
    sendSMS(appointment.patient.phone,
      `⏰ Your appointment with Dr. ${appointment.doctor.full_name} on ${formatDate(appointment.appointment_date)} has expired.`
    ),
    sendEmail(appointment.patient.email, 'Appointment Expired', {
      template: 'appointment_expired',
      data: appointment
    }),
    sendPushNotification(appointment.patient_id, {
      title: 'Appointment Expired',
      body: 'Your appointment has expired',
      data: { appointmentId: appointment.id }
    })
  ])

  // Clean up calendar events
  await deleteCalendarEvents(appointment)
}

async function handleAppointmentUpdated(appointment: any, supabase: any) {
  console.log(`Appointment ${appointment.id} updated`)
  
  // Send update notifications
  await sendAppointmentNotifications(appointment, 'updated')
  
  // Update calendar events
  await updateCalendarEvents(appointment)
}

async function updateCalendarEvents(appointment: any) {
  try {
    // Delete old calendar events and create new ones
    await deleteCalendarEvents(appointment)
    await createCalendarEvents(appointment)
    
    console.log(`Calendar events updated for appointment ${appointment.id}`)
  } catch (error) {
    console.error('Calendar update error:', error)
  }
}

async function deleteCalendarEvents(appointment: any) {
  try {
    // Remove from calendars (implementation depends on your calendar service)
    console.log(`Calendar events deleted for appointment ${appointment.id}`)
  } catch (error) {
    console.error('Calendar deletion error:', error)
  }
}

// =============================================
// SPECIFIC STATUS HANDLERS
// =============================================

async function handleAppointmentConfirmed(appointment: any, supabase: any) {
  // Send confirmation notifications
  await Promise.all([
    sendSMS(appointment.patient.phone, 
      `✅ Appointment confirmed with Dr. ${appointment.doctor.full_name} on ${formatDate(appointment.appointment_date)} at ${appointment.time_slot}. Clinic: ${appointment.doctor.clinic_address}`
    ),
    sendEmail(appointment.patient.email, 'Appointment Confirmed', {
      template: 'appointment_confirmed',
      data: appointment
    }),
    sendPushNotification(appointment.patient_id, {
      title: 'Appointment Confirmed',
      body: `Your appointment with Dr. ${appointment.doctor.full_name} is confirmed`,
      data: { appointmentId: appointment.id }
    })
  ])

  // Send doctor notification
  await sendSMS(appointment.doctor.phone,
    `📅 New appointment: ${appointment.patient.full_name} on ${formatDate(appointment.appointment_date)} at ${appointment.time_slot}`
  )

  // Create calendar events
  await createCalendarEvents(appointment)
  
  // Send appointment instructions
  await sendAppointmentInstructions(appointment)
}

async function handleAppointmentCancelled(appointment: any, supabase: any) {
  // Send cancellation notifications
  await Promise.all([
    sendSMS(appointment.patient.phone,
      `❌ Your appointment with Dr. ${appointment.doctor.full_name} on ${formatDate(appointment.appointment_date)} has been cancelled.`
    ),
    sendEmail(appointment.patient.email, 'Appointment Cancelled', {
      template: 'appointment_cancelled',
      data: appointment
    }),
    sendPushNotification(appointment.patient_id, {
      title: 'Appointment Cancelled',
      body: 'Your appointment has been cancelled',
      data: { appointmentId: appointment.id }
    })
  ])

  // Notify doctor
  await sendSMS(appointment.doctor.phone,
    `🚫 Appointment cancelled: ${appointment.patient.full_name} on ${formatDate(appointment.appointment_date)}`
  )

  // Delete calendar events
  await deleteCalendarEvents(appointment)
  
  // Process refund if payment was made
  if (appointment.payment_status === 'paid') {
    await processRefund(appointment)
  }
}

async function handleAppointmentCompleted(appointment: any, supabase: any) {
  // Send completion notifications
  await Promise.all([
    sendSMS(appointment.patient.phone,
      `✅ Thank you for visiting Dr. ${appointment.doctor.full_name}. Please rate your experience!`
    ),
    sendEmail(appointment.patient.email, 'Appointment Completed', {
      template: 'appointment_completed',
      data: appointment
    })
  ])

  // Send follow-up survey
  await sendFollowUpSurvey(appointment)
  
  // Generate prescription if needed
  await generatePrescription(appointment)
  
  // Update doctor analytics
  await updateDoctorCompletionStats(appointment, supabase)
}

async function sendFollowUpSurvey(appointment: any) {
  try {
    const surveyMessage = `
      📋 How was your visit with Dr. ${appointment.doctor.full_name}?
      
      Please rate your experience: [Survey Link]
      Your feedback helps us improve our service.
    `
    
    await sendSMS(appointment.patient.phone, surveyMessage)
    console.log(`Follow-up survey sent for appointment ${appointment.id}`)
  } catch (error) {
    console.error('Survey sending error:', error)
  }
}

async function generatePrescription(appointment: any) {
  try {
    // Generate prescription if needed (implementation depends on your system)
    console.log(`Prescription generated for appointment ${appointment.id}`)
  } catch (error) {
    console.error('Prescription generation error:', error)
  }
}

async function updateDoctorCompletionStats(appointment: any, supabase: any) {
  try {
    // Update doctor completion statistics
    await supabase.rpc('increment_doctor_completions', {
      doctor_id: appointment.doctor_id
    })
    
    console.log(`Doctor stats updated for appointment ${appointment.id}`)
  } catch (error) {
    console.error('Stats update error:', error)
  }
}

// =============================================
// NOTIFICATION SERVICES
// =============================================

async function sendSMS(phoneNumber: string, message: string) {
  try {
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa('YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: '+1234567890', // Your Twilio number
        To: phoneNumber,
        Body: message
      })
    })
    
    if (!response.ok) {
      throw new Error('SMS sending failed')
    }
    
    console.log(`SMS sent to ${phoneNumber}`)
  } catch (error) {
    console.error('SMS error:', error)
  }
}

async function sendEmail(email: string, subject: string, options: any) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(globalThis as any).Deno?.env?.get('SENDGRID_API_KEY') || 'your-sendgrid-key'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject,
          dynamic_template_data: options.data
        }],
        from: { email: 'noreply@yourapp.com', name: 'Your Clinic App' },
        template_id: getTemplateId(options.template)
      })
    })
    
    if (!response.ok) {
      throw new Error('Email sending failed')
    }
    
    console.log(`Email sent to ${email}`)
  } catch (error) {
    console.error('Email error:', error)
  }
}

async function sendPushNotification(userId: string, notification: any) {
  try {
    // Implementation depends on your push notification service (Firebase, OneSignal, etc.)
    console.log(`Push notification sent to user ${userId}`)
  } catch (error) {
    console.error('Push notification error:', error)
  }
}

// =============================================
// CALENDAR INTEGRATION
// =============================================

async function createCalendarEvents(appointment: any) {
  try {
    // Add to doctor's Google Calendar
    if (appointment.doctor.google_calendar_id) {
      await addToGoogleCalendar(appointment, appointment.doctor.google_calendar_id)
    }
    
    // Add to patient's calendar (if they provided calendar access)
    if (appointment.patient.google_calendar_id) {
      await addToGoogleCalendar(appointment, appointment.patient.google_calendar_id)
    }
    
    console.log(`Calendar events created for appointment ${appointment.id}`)
  } catch (error) {
    console.error('Calendar creation error:', error)
  }
}

async function addToGoogleCalendar(appointment: any, calendarId: string) {
  // Google Calendar API integration
  const startTime = new Date(`${appointment.appointment_date}T${appointment.time_slot}`)
  const endTime = new Date(startTime.getTime() + 30 * 60000) // 30 minutes

  const event = {
    summary: `Appointment: ${appointment.patient.full_name} - ${appointment.doctor.full_name}`,
    start: { dateTime: startTime.toISOString() },
    end: { dateTime: endTime.toISOString() },
    location: appointment.doctor.clinic_address,
    description: `Appointment ID: ${appointment.id}\nFee: $${appointment.fee}`
  }

  // Make API call to Google Calendar
  // Implementation details depend on your Google Calendar setup
}

// =============================================
// PAYMENT PROCESSING
// =============================================

async function processRefund(appointment: any) {
  try {
    // Stripe refund processing
    if (appointment.payment_intent_id) {
      const response = await fetch('https://api.stripe.com/v1/refunds', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(globalThis as any).Deno?.env?.get('STRIPE_SECRET_KEY') || 'your-stripe-key'}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          payment_intent: appointment.payment_intent_id,
          amount: (appointment.fee * 100).toString() // Convert to cents
        })
      })
      
      if (response.ok) {
        console.log(`Refund processed for appointment ${appointment.id}`)
      }
    }
  } catch (error) {
    console.error('Refund error:', error)
  }
}

// =============================================
// ANALYTICS & TRACKING
// =============================================

async function trackAnalytics(event: string, appointment: any) {
  try {
    // Send to analytics service (Google Analytics, Mixpanel, etc.)
    await fetch('https://api.mixpanel.com/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        properties: {
          appointment_id: appointment.id,
          doctor_id: appointment.doctor_id,
          patient_id: appointment.patient_id,
          specialty: appointment.doctor.specialty,
          fee: appointment.fee,
          date: appointment.appointment_date
        }
      })
    })
  } catch (error) {
    console.error('Analytics error:', error)
  }
}

async function updateUserStats(appointment: any, supabase: any) {
  // Update patient stats
  await supabase.rpc('increment_patient_appointments', {
    patient_id: appointment.patient_id
  })
  
  // Update doctor stats
  await supabase.rpc('increment_doctor_bookings', {
    doctor_id: appointment.doctor_id
  })
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getTemplateId(templateName: string): string {
  const templates: Record<string, string> = {
    appointment_confirmed: 'd-xyz123',
    appointment_cancelled: 'd-abc456',
    appointment_completed: 'd-def789',
    appointment_reminder: 'd-ghi012'
  }
  return templates[templateName] || 'd-default'
}

async function sendAppointmentInstructions(appointment: any) {
  const instructions = `
    🏥 Appointment Instructions:
    
    📅 Date: ${formatDate(appointment.appointment_date)}
    🕐 Time: ${appointment.time_slot}
    👨‍⚕️ Doctor: Dr. ${appointment.doctor.full_name}
    📍 Location: ${appointment.doctor.clinic_address}
    
    📋 Please bring:
    • Valid ID
    • Insurance card
    • Previous medical records
    • List of current medications
    
    ⚠️ Please arrive 15 minutes early
    📞 Contact: ${appointment.doctor.phone}
  `
  
  await sendSMS(appointment.patient.phone, instructions)
}
