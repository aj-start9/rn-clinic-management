// @ts-ignore - Deno imports for edge function environment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Shared Supabase client for all edge functions
export const supabase = createClient(
  'https://cwfaicjqdlvnuxlkgkfs.supabase.co',
  // @ts-ignore - Deno environment variable access
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZmFpY2pxZGx2bnV4bGtna2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjQyNDAsImV4cCI6MjA2ODM0MDI0MH0.d1jLd200AaZU76hmFgddmhqEIyhpEKiSKHSjEQoOjUs'
)

// Shared CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to handle CORS
export function handleCORS(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}

// Helper function for error responses
export function createErrorResponse(error: unknown, status = 500) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
  
  return new Response(
    JSON.stringify({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

// Helper function for success responses
export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify({
      success: true,
      ...data,
      timestamp: new Date().toISOString()
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}
