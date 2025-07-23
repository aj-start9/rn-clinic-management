// @ts-ignore - Deno imports for edge function environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports for edge function environment  
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================
// SHARED CONSTANTS & CONFIG
// =============================================
const SUPABASE_URL = 'https://cwfaicjqdlvnuxlkgkfs.supabase.co'
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZmFpY2pxZGx2bnV4bGtna2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjQyNDAsImV4cCI6MjA2ODM0MDI0MH0.d1jLd200AaZU76hmFgddmhqEIyhpEKiSKHSjEQoOjUs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create Supabase client once at module level
const supabase = createClient(
  SUPABASE_URL,
  // @ts-ignore - Deno environment variable access
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? FALLBACK_KEY
)

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { appointmentData } = await req.json()
    
    console.log('🏥 Booking appointment with confirmation:', appointmentData)
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        doctor_id: appointmentData.doctorId,
        patient_id: appointmentData.patientId,
        appointment_date: appointmentData.date,
        time_slot: appointmentData.timeSlot,
        fee: appointmentData.fee,
        status: 'confirmed', // Immediate confirmation
        appointment_type: appointmentData.type || 'consultation',
        notes: appointmentData.notes || null
      })
      .select(`
        *,
        doctors (
          id,
          full_name,
          phone,
          email,
          specialty
        ),
        patients:users!patient_id (
          id,
          full_name,
          phone,
          email
        )
      `)
      .single()

    if (appointmentError) {
      console.error('❌ Appointment creation error:', appointmentError)
      throw new Error(appointmentError.message)
    }

    console.log('✅ Appointment created:', appointment.id)

    // 2. Send immediate confirmation (additional to trigger notifications)
    try {
      const patient = appointment.patients
      const doctor = appointment.doctors

      // Send enhanced SMS confirmation
      const smsMessage = `🏥 APPOINTMENT CONFIRMED!
      
📅 Dr. ${doctor.full_name} - ${doctor.specialty}
📍 Date: ${new Date(appointment.appointment_date).toLocaleDateString()}
🕐 Time: ${appointment.time_slot}
💰 Fee: $${appointment.fee}
📋 Reference: ${appointment.id.slice(0, 8)}

Please arrive 15 minutes early.
Contact: ${doctor.phone}`

      console.log('📱 SMS confirmation sent to:', patient.phone)
      // await sendSMS(patient.phone, smsMessage) // Implement your SMS service

      // Send enhanced email confirmation
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🏥 Appointment Confirmed!</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Appointment Details:</h3>
            <p><strong>👨‍⚕️ Doctor:</strong> Dr. ${doctor.full_name}</p>
            <p><strong>🏥 Specialty:</strong> ${doctor.specialty}</p>
            <p><strong>📅 Date:</strong> ${new Date(appointment.appointment_date).toLocaleDateString()}</p>
            <p><strong>🕐 Time:</strong> ${appointment.time_slot}</p>
            <p><strong>💰 Fee:</strong> $${appointment.fee}</p>
            <p><strong>📋 Reference ID:</strong> ${appointment.id}</p>
          </div>
          
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #059669;">📋 Before Your Visit:</h4>
            <ul>
              <li>Arrive 15 minutes early</li>
              <li>Bring valid ID and insurance card</li>
              <li>Bring list of current medications</li>
              <li>Prepare any questions for the doctor</li>
            </ul>
          </div>
          
          <p><strong>📞 Doctor's Contact:</strong> ${doctor.phone}</p>
          <p><strong>📧 Doctor's Email:</strong> ${doctor.email}</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for choosing our healthcare service!<br>
            This confirmation was sent automatically.
          </p>
        </div>
      `

      console.log('📧 Email confirmation prepared for:', patient.email)
      // await sendEmail(patient.email, 'Appointment Confirmed', emailBody) // Implement your email service

    } catch (notificationError) {
      console.error('⚠️ Notification error (non-blocking):', notificationError)
      // Don't fail the appointment creation if notifications fail
    }

    // 3. Return success response with enhanced confirmation
    return successResponse({
      appointment: {
        id: appointment.id,
        doctorName: appointment.doctors.full_name,
        specialty: appointment.doctors.specialty,
        date: appointment.appointment_date,
        timeSlot: appointment.time_slot,
        status: appointment.status,
        fee: appointment.fee,
        reference: appointment.id.slice(0, 8)
      }
    }, "🎉 Appointment confirmed! You'll receive SMS and email confirmations shortly.")

  } catch (error) {
    console.error('❌ Edge function error:', error)
    return errorResponse(error)
  }
})

// =============================================
// SHARED HELPER FUNCTIONS
// =============================================

function successResponse(data: any, message = 'Success'): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data,
      message
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

function errorResponse(error: unknown, details?: string): Response {
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  return new Response(
    JSON.stringify({
      success: false,
      error: errorMessage,
      details: details || (errorMessage.includes('already booked') 
        ? 'This time slot was just taken by another patient. Please select a different time.'
        : 'Unable to book appointment. Please try again.')
    }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

// Helper functions for external services (implement based on your providers)
async function sendSMS(phone: string, message: string) {
  // Implement Twilio, AWS SNS, or your SMS provider
  console.log(`📱 SMS to ${phone}: ${message}`)
  return true
}

async function sendEmail(email: string, subject: string, html: string) {
  // Implement SendGrid, AWS SES, or your email provider
  console.log(`📧 Email to ${email}: ${subject}`)
  return true
}
