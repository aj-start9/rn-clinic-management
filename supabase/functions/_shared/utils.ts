// =============================================
// SHARED SUPABASE UTILITIES FOR EDGE FUNCTIONS
// =============================================

// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types
export interface AppointmentData {
  doctorId: string
  patientId: string
  date: string
  timeSlot: string
  fee: number
  type?: string
  notes?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Shared Supabase client factory
export function createSupabaseClient() {
  return createClient(
    'https://cwfaicjqdlvnuxlkgkfs.supabase.co',
    // @ts-ignore - Deno environment variable
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZmFpY2pxZGx2bnV4bGtna2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjQyNDAsImV4cCI6MjA2ODM0MDI0MH0.d1jLd200AaZU76hmFgddmhqEIyhpEKiSKHSjEQoOjUs'
  )
}

// Shared CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Shared response helpers
export function successResponse<T>(data: T, message = 'Success'): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      message
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

export function errorResponse(error: unknown, status = 400): Response {
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  return new Response(
    JSON.stringify({
      success: false,
      error: errorMessage
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

// Shared utility functions
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function getTemplateId(templateName: string): string {
  const templates: Record<string, string> = {
    appointment_confirmed: 'd-xyz123',
    appointment_cancelled: 'd-abc456',
    appointment_completed: 'd-def789',
    appointment_reminder: 'd-ghi012'
  }
  return templates[templateName] || 'd-default'
}

// Shared notification functions
export async function sendSMS(phoneNumber: string, message: string): Promise<void> {
  try {
    console.log(`📱 SMS to ${phoneNumber}: ${message}`)
    // Implement your SMS service here
  } catch (error) {
    console.error('SMS error:', error)
  }
}

export async function sendEmail(email: string, subject: string, html: string): Promise<void> {
  try {
    console.log(`📧 Email to ${email}: ${subject}`)
    // Implement your email service here
  } catch (error) {
    console.error('Email error:', error)
  }
}
