// Shared Supabase utilities to avoid creating client everywhere
import { createClient } from '@supabase/supabase-js'

// Your Supabase configuration
const supabaseUrl = 'https://cwfaicjqdlvnuxlkgkfs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZmFpY2pxZGx2bnV4bGtna2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjQyNDAsImV4cCI6MjA2ODM0MDI0MH0.d1jLd200AaZU76hmFgddmhqEIyhpEKiSKHSjEQoOjUs'

// Create single Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Edge function URLs - centralized configuration
export const EDGE_FUNCTIONS = {
  bookAppointmentWithConfirmation: `${supabaseUrl}/functions/v1/book-appointment-with-confirmation`,
  appointmentWorkflow: `${supabaseUrl}/functions/v1/appointment-workflow`,
} as const

// Helper function to call edge functions with proper headers
export const callEdgeFunction = async (
  functionName: keyof typeof EDGE_FUNCTIONS,
  payload: any,
  token?: string
) => {
  try {
    const response = await fetch(EDGE_FUNCTIONS[functionName], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || supabaseAnonKey}`,
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Edge function ${functionName} error:`, error)
    throw error
  }
}

// Specific edge function helpers
export const edgeFunctions = {
  // Book appointment with immediate confirmation
  bookAppointment: async (appointmentData: any) => {
    return callEdgeFunction('bookAppointmentWithConfirmation', { appointmentData })
  },

  // Trigger appointment workflow
  triggerWorkflow: async (workflowData: any) => {
    return callEdgeFunction('appointmentWorkflow', workflowData)
  }
}
