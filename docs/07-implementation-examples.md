# 🚀 Implementation Examples

## Overview

This document provides complete, copy-paste implementation examples for the hybrid architecture, showing how **Frontend**, **Database Triggers**, and **Edge Functions** work together in real scenarios.

## 🏥 Complete Appointment Booking Example

### 1. Frontend Implementation

```typescript
// services/appointmentService.ts
import { supabase } from '../lib/supabase'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface AppointmentBookingRequest {
  doctorId: string
  patientId: string
  appointmentDate: string
  symptoms: string
  appointmentType: 'consultation' | 'followup' | 'emergency'
}

export class AppointmentService {
  // Frontend: Simple read operations
  static async getDoctorAvailability(doctorId: string, date: string) {
    const { data, error } = await supabase
      .from('doctor_availability')
      .select('time_slot, is_available')
      .eq('doctor_id', doctorId)
      .eq('date', date)
      .eq('is_available', true)
    
    if (error) throw error
    return data
  }

  // Frontend: Real-time subscriptions
  static subscribeToAppointmentUpdates(patientId: string, callback: Function) {
    return supabase
      .channel('appointment_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `patient_id=eq.${patientId}`
      }, callback)
      .subscribe()
  }

  // Hybrid: Complex booking via Edge Function
  static async bookAppointment(request: AppointmentBookingRequest) {
    const { data, error } = await supabase.functions.invoke('appointment-workflow', {
      body: request
    })
    
    if (error) throw error
    return data
  }

  // Frontend: Optimistic updates
  static async cancelAppointment(appointmentId: string) {
    // Optimistically update UI
    const queryClient = useQueryClient()
    queryClient.setQueryData(['appointments'], (old: any) => 
      old?.map((apt: any) => 
        apt.id === appointmentId 
          ? { ...apt, status: 'cancelled' }
          : apt
      )
    )

    try {
      // Database triggers will handle the rest
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)
      
      if (error) throw error
    } catch (error) {
      // Revert optimistic update on error
      queryClient.invalidateQueries(['appointments'])
      throw error
    }
  }
}
```

### 2. React Native Hooks

```typescript
// hooks/useAppointments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppointmentService } from '../services/appointmentService'
import { useEffect } from 'react'

export function useAppointments(patientId: string) {
  const queryClient = useQueryClient()

  // Query appointments
  const appointmentsQuery = useQuery({
    queryKey: ['appointments', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, appointment_date, status, symptoms,
          doctor:doctors(id, name, specialization),
          prescription:prescriptions(id, medications)
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: true })
      
      if (error) throw error
      return data
    }
  })

  // Real-time subscription
  useEffect(() => {
    const subscription = AppointmentService.subscribeToAppointmentUpdates(
      patientId,
      (payload) => {
        queryClient.setQueryData(['appointments', patientId], (old: any) => {
          if (!old) return [payload.new]
          
          const updated = old.map((apt: any) => 
            apt.id === payload.new.id ? payload.new : apt
          )
          
          // Add new appointment if not found
          if (!updated.find((apt: any) => apt.id === payload.new.id)) {
            updated.push(payload.new)
          }
          
          return updated
        })
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [patientId, queryClient])

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: AppointmentService.bookAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments', patientId])
    }
  })

  return {
    appointments: appointmentsQuery.data || [],
    isLoading: appointmentsQuery.isLoading,
    error: appointmentsQuery.error,
    bookAppointment: bookAppointmentMutation.mutate,
    isBooking: bookAppointmentMutation.isPending
  }
}

export function useDoctorAvailability(doctorId: string, date: string) {
  return useQuery({
    queryKey: ['doctor-availability', doctorId, date],
    queryFn: () => AppointmentService.getDoctorAvailability(doctorId, date),
    enabled: !!doctorId && !!date,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}
```

### 3. React Native Component

```typescript
// components/AppointmentBooking.tsx
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { useAppointments, useDoctorAvailability } from '../hooks/useAppointments'

interface Props {
  doctorId: string
  patientId: string
}

export function AppointmentBooking({ doctorId, patientId }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [symptoms, setSymptoms] = useState('')

  const { bookAppointment, isBooking } = useAppointments(patientId)
  const { data: availability, isLoading } = useDoctorAvailability(doctorId, selectedDate)

  const handleBooking = async () => {
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time slot')
      return
    }

    try {
      await bookAppointment({
        doctorId,
        patientId,
        appointmentDate: `${selectedDate}T${selectedTime}:00`,
        symptoms,
        appointmentType: 'consultation'
      })
      
      Alert.alert('Success', 'Appointment booked successfully!')
    } catch (error) {
      Alert.alert('Error', 'Failed to book appointment. Please try again.')
    }
  }

  if (isLoading) {
    return <Text>Loading availability...</Text>
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Book Appointment
      </Text>

      {/* Time Slots */}
      <Text style={{ marginBottom: 10 }}>Available Times:</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
        {availability?.map((slot) => (
          <TouchableOpacity
            key={slot.time_slot}
            style={{
              padding: 10,
              margin: 5,
              backgroundColor: selectedTime === slot.time_slot ? '#007AFF' : '#F0F0F0',
              borderRadius: 5
            }}
            onPress={() => setSelectedTime(slot.time_slot)}
          >
            <Text style={{ 
              color: selectedTime === slot.time_slot ? 'white' : 'black' 
            }}>
              {slot.time_slot}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Symptoms Input */}
      <TextInput
        style={{ 
          borderWidth: 1, 
          borderColor: '#DDD', 
          padding: 10, 
          marginBottom: 20,
          borderRadius: 5
        }}
        placeholder="Describe your symptoms..."
        multiline
        numberOfLines={3}
        value={symptoms}
        onChangeText={setSymptoms}
      />

      {/* Book Button */}
      <TouchableOpacity
        style={{
          backgroundColor: isBooking ? '#CCC' : '#007AFF',
          padding: 15,
          borderRadius: 5,
          alignItems: 'center'
        }}
        onPress={handleBooking}
        disabled={isBooking}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {isBooking ? 'Booking...' : 'Book Appointment'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
```

### 4. Database Triggers Implementation

```sql
-- Database: Complete trigger system for appointments

-- 1. Prevent double booking
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for existing appointment at same time
    IF EXISTS (
        SELECT 1 FROM appointments 
        WHERE doctor_id = NEW.doctor_id 
        AND appointment_date = NEW.appointment_date 
        AND status NOT IN ('cancelled', 'completed')
        AND id != COALESCE(NEW.id, '')
    ) THEN
        RAISE EXCEPTION 'Doctor already has an appointment at this time';
    END IF;

    -- Check patient doesn't have overlapping appointment
    IF EXISTS (
        SELECT 1 FROM appointments 
        WHERE patient_id = NEW.patient_id 
        AND appointment_date BETWEEN NEW.appointment_date - INTERVAL '1 hour' 
                                 AND NEW.appointment_date + INTERVAL '1 hour'
        AND status NOT IN ('cancelled', 'completed')
        AND id != COALESCE(NEW.id, '')
    ) THEN
        RAISE EXCEPTION 'Patient has a conflicting appointment';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Manage doctor availability
CREATE OR REPLACE FUNCTION manage_doctor_availability()
RETURNS TRIGGER AS $$
DECLARE
    slot_time TIME;
    slot_date DATE;
BEGIN
    slot_time := NEW.appointment_date::TIME;
    slot_date := NEW.appointment_date::DATE;

    IF TG_OP = 'INSERT' THEN
        -- Mark slot as unavailable
        UPDATE doctor_availability 
        SET is_available = FALSE,
            appointment_id = NEW.id
        WHERE doctor_id = NEW.doctor_id 
        AND date = slot_date 
        AND time_slot = slot_time;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status != NEW.status THEN
            CASE NEW.status
                WHEN 'cancelled' THEN
                    -- Free up the slot
                    UPDATE doctor_availability 
                    SET is_available = TRUE,
                        appointment_id = NULL
                    WHERE doctor_id = NEW.doctor_id 
                    AND date = slot_date 
                    AND time_slot = slot_time;
                    
                WHEN 'confirmed' THEN
                    -- Ensure slot is blocked
                    UPDATE doctor_availability 
                    SET is_available = FALSE,
                        appointment_id = NEW.id
                    WHERE doctor_id = NEW.doctor_id 
                    AND date = slot_date 
                    AND time_slot = slot_time;
            END CASE;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Free up the slot
        UPDATE doctor_availability 
        SET is_available = TRUE,
            appointment_id = NULL
        WHERE appointment_id = OLD.id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Appointment workflow automation
CREATE OR REPLACE FUNCTION appointment_workflow_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-confirm appointments booked less than 24 hours in advance
    IF NEW.appointment_date <= CURRENT_TIMESTAMP + INTERVAL '24 hours' THEN
        NEW.status := 'confirmed';
    END IF;

    -- Set default values
    NEW.created_at := COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
    NEW.updated_at := CURRENT_TIMESTAMP;

    -- Generate appointment reference
    IF NEW.appointment_ref IS NULL THEN
        NEW.appointment_ref := 'APT-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || NEW.id;
    END IF;

    -- Call edge function for complex operations (async)
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
        PERFORM net.http_post(
            url := current_setting('app.edge_function_url') || '/appointment-workflow',
            headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
            body := jsonb_build_object(
                'event_type', TG_OP,
                'appointment', row_to_json(NEW),
                'old_appointment', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS prevent_double_booking_trigger ON appointments;
CREATE TRIGGER prevent_double_booking_trigger
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION prevent_double_booking();

DROP TRIGGER IF EXISTS manage_doctor_availability_trigger ON appointments;
CREATE TRIGGER manage_doctor_availability_trigger
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION manage_doctor_availability();

DROP TRIGGER IF EXISTS appointment_workflow_trigger ON appointments;
CREATE TRIGGER appointment_workflow_trigger
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION appointment_workflow_trigger();
```

### 5. Edge Function Implementation

```typescript
// supabase/functions/appointment-workflow/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AppointmentWorkflowRequest {
  event_type: 'INSERT' | 'UPDATE'
  appointment: Appointment
  old_appointment?: Appointment
}

interface Appointment {
  id: string
  doctor_id: string
  patient_id: string
  appointment_date: string
  status: string
  symptoms?: string
  appointment_ref: string
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  try {
    const { event_type, appointment, old_appointment }: AppointmentWorkflowRequest = await req.json()
    
    console.log(`Processing ${event_type} for appointment ${appointment.id}`)

    // Get related data
    const [doctorResult, patientResult] = await Promise.all([
      supabase.from('doctors').select('name, email, phone').eq('id', appointment.doctor_id).single(),
      supabase.from('patients').select('name, email, phone').eq('id', appointment.patient_id).single()
    ])

    if (doctorResult.error || patientResult.error) {
      throw new Error('Failed to fetch doctor or patient data')
    }

    const doctor = doctorResult.data
    const patient = patientResult.data

    // Handle different scenarios
    if (event_type === 'INSERT') {
      await handleNewAppointment(appointment, doctor, patient)
    } else if (event_type === 'UPDATE' && old_appointment) {
      await handleAppointmentUpdate(appointment, old_appointment, doctor, patient)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in appointment workflow:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function handleNewAppointment(appointment: Appointment, doctor: any, patient: any) {
  console.log(`Handling new appointment ${appointment.id}`)

  // Parallel processing of notifications
  const promises = []

  // 1. Send confirmation SMS to patient
  promises.push(
    sendSMS(patient.phone, `
      Appointment booked successfully!
      Doctor: ${doctor.name}
      Date: ${new Date(appointment.appointment_date).toLocaleDateString()}
      Time: ${new Date(appointment.appointment_date).toLocaleTimeString()}
      Reference: ${appointment.appointment_ref}
    `)
  )

  // 2. Send email confirmation to patient
  promises.push(
    sendEmail(patient.email, 'Appointment Confirmation', `
      <h2>Appointment Confirmed</h2>
      <p>Your appointment has been successfully booked:</p>
      <ul>
        <li><strong>Doctor:</strong> ${doctor.name}</li>
        <li><strong>Date:</strong> ${new Date(appointment.appointment_date).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${new Date(appointment.appointment_date).toLocaleTimeString()}</li>
        <li><strong>Reference:</strong> ${appointment.appointment_ref}</li>
      </ul>
      <p>Please arrive 15 minutes early for your appointment.</p>
    `)
  )

  // 3. Notify doctor
  promises.push(
    sendEmail(doctor.email, 'New Appointment', `
      <h2>New Appointment Scheduled</h2>
      <p><strong>Patient:</strong> ${patient.name}</p>
      <p><strong>Date:</strong> ${new Date(appointment.appointment_date).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${new Date(appointment.appointment_date).toLocaleTimeString()}</p>
      <p><strong>Symptoms:</strong> ${appointment.symptoms || 'Not specified'}</p>
      <p><strong>Reference:</strong> ${appointment.appointment_ref}</p>
    `)
  )

  // 4. Add to calendar
  promises.push(
    addToCalendar({
      title: `Appointment with ${patient.name}`,
      start: appointment.appointment_date,
      duration: 30, // minutes
      attendees: [doctor.email, patient.email],
      description: `Symptoms: ${appointment.symptoms || 'Not specified'}`
    })
  )

  // 5. Generate and store appointment documents
  promises.push(
    generateAppointmentDocuments(appointment, doctor, patient)
  )

  // Wait for all operations to complete
  await Promise.allSettled(promises)
}

async function handleAppointmentUpdate(
  appointment: Appointment, 
  oldAppointment: Appointment, 
  doctor: any, 
  patient: any
) {
  console.log(`Handling appointment update ${appointment.id}: ${oldAppointment.status} -> ${appointment.status}`)

  const statusChanged = oldAppointment.status !== appointment.status

  if (!statusChanged) return

  switch (appointment.status) {
    case 'confirmed':
      await handleAppointmentConfirmation(appointment, doctor, patient)
      break
    case 'cancelled':
      await handleAppointmentCancellation(appointment, doctor, patient)
      break
    case 'completed':
      await handleAppointmentCompletion(appointment, doctor, patient)
      break
    case 'rescheduled':
      await handleAppointmentReschedule(appointment, oldAppointment, doctor, patient)
      break
  }
}

async function handleAppointmentConfirmation(appointment: Appointment, doctor: any, patient: any) {
  await Promise.allSettled([
    sendSMS(patient.phone, `Your appointment with ${doctor.name} has been confirmed for ${new Date(appointment.appointment_date).toLocaleString()}`),
    sendSMS(doctor.phone, `Appointment with ${patient.name} confirmed for ${new Date(appointment.appointment_date).toLocaleString()}`)
  ])
}

async function handleAppointmentCancellation(appointment: Appointment, doctor: any, patient: any) {
  await Promise.allSettled([
    sendSMS(patient.phone, `Your appointment with ${doctor.name} has been cancelled. Reference: ${appointment.appointment_ref}`),
    sendEmail(doctor.email, 'Appointment Cancelled', `Appointment with ${patient.name} on ${new Date(appointment.appointment_date).toLocaleString()} has been cancelled.`),
    removeFromCalendar(appointment.id)
  ])
}

async function handleAppointmentCompletion(appointment: Appointment, doctor: any, patient: any) {
  await Promise.allSettled([
    sendSMS(patient.phone, `Thank you for visiting ${doctor.name}. Please rate your experience.`),
    generateAppointmentSummary(appointment),
    updatePatientHistory(appointment)
  ])
}

// Helper functions for external services
async function sendSMS(phone: string, message: string) {
  console.log(`Sending SMS to ${phone}: ${message}`)
  // Implement Twilio or similar SMS service
  return true
}

async function sendEmail(email: string, subject: string, html: string) {
  console.log(`Sending email to ${email}: ${subject}`)
  // Implement SendGrid or similar email service
  return true
}

async function addToCalendar(event: any) {
  console.log(`Adding to calendar:`, event)
  // Implement Google Calendar or similar service
  return true
}

async function removeFromCalendar(appointmentId: string) {
  console.log(`Removing from calendar: ${appointmentId}`)
  return true
}

async function generateAppointmentDocuments(appointment: Appointment, doctor: any, patient: any) {
  console.log(`Generating documents for appointment ${appointment.id}`)
  // Generate PDF reports, consent forms, etc.
  return true
}

async function generateAppointmentSummary(appointment: Appointment) {
  console.log(`Generating summary for appointment ${appointment.id}`)
  return true
}

async function updatePatientHistory(appointment: Appointment) {
  console.log(`Updating patient history for appointment ${appointment.id}`)
  return true
}
```

## 🔄 Real-time Updates Example

### Frontend Real-time Component

```typescript
// components/AppointmentList.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, RefreshControl } from 'react-native'
import { supabase } from '../lib/supabase'

export function AppointmentList({ patientId }: { patientId: string }) {
  const [appointments, setAppointments] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  // Initial load
  useEffect(() => {
    loadAppointments()
  }, [patientId])

  // Real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('appointment_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `patient_id=eq.${patientId}`
      }, (payload) => {
        console.log('Real-time update:', payload)
        
        if (payload.eventType === 'INSERT') {
          setAppointments(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setAppointments(prev => 
            prev.map(apt => 
              apt.id === payload.new.id ? payload.new : apt
            )
          )
        } else if (payload.eventType === 'DELETE') {
          setAppointments(prev => 
            prev.filter(apt => apt.id !== payload.old.id)
          )
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [patientId])

  const loadAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctors(name, specialization)
      `)
      .eq('patient_id', patientId)
      .order('appointment_date')

    if (error) {
      console.error('Error loading appointments:', error)
    } else {
      setAppointments(data || [])
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAppointments()
    setRefreshing(false)
  }

  const renderAppointment = ({ item }) => (
    <View style={{ padding: 15, backgroundColor: 'white', marginVertical: 5, borderRadius: 8 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.doctor.name}</Text>
      <Text style={{ color: '#666' }}>{item.doctor.specialization}</Text>
      <Text style={{ marginTop: 5 }}>
        {new Date(item.appointment_date).toLocaleDateString()} at{' '}
        {new Date(item.appointment_date).toLocaleTimeString()}
      </Text>
      <Text style={{ 
        marginTop: 5, 
        color: item.status === 'confirmed' ? 'green' : 
              item.status === 'cancelled' ? 'red' : 'orange',
        fontWeight: 'bold'
      }}>
        {item.status.toUpperCase()}
      </Text>
    </View>
  )

  return (
    <FlatList
      data={appointments}
      renderItem={renderAppointment}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{ padding: 10 }}
    />
  )
}
```

## 📱 Error Handling Examples

### Frontend Error Boundaries

```typescript
// components/ErrorBoundary.tsx
import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Log to error reporting service
    // logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: 20, color: '#666' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 8 }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return this.props.children
  }
}

// Usage
export function App() {
  return (
    <ErrorBoundary>
      <AppointmentList patientId="123" />
    </ErrorBoundary>
  )
}
```

### Database Error Handling

```sql
-- Error handling in triggers
CREATE OR REPLACE FUNCTION safe_appointment_trigger()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        -- Your trigger logic here
        PERFORM validate_appointment_business_rules(NEW);
        
    EXCEPTION
        WHEN check_violation THEN
            RAISE EXCEPTION 'Appointment validation failed: %', SQLERRM;
        WHEN unique_violation THEN
            RAISE EXCEPTION 'Appointment conflict detected';
        WHEN OTHERS THEN
            -- Log error details
            INSERT INTO error_logs (
                table_name, 
                operation, 
                error_message, 
                error_detail,
                appointment_data
            ) VALUES (
                TG_TABLE_NAME,
                TG_OP,
                SQLERRM,
                SQLSTATE,
                row_to_json(NEW)
            );
            
            -- Re-raise with user-friendly message
            RAISE EXCEPTION 'Unable to process appointment. Please try again or contact support.';
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Edge Function Error Handling

```typescript
// Error handling in edge functions
export default async function appointmentWorkflow(req: Request) {
  try {
    const requestData = await req.json()
    
    // Validate input
    const validation = validateAppointmentRequest(requestData)
    if (!validation.valid) {
      return new Response(JSON.stringify({
        error: 'Validation failed',
        details: validation.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Process appointment
    const result = await processAppointment(requestData)
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Edge function error:', error)
    
    // Log error details
    await logError({
      function: 'appointment-workflow',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })

    // Return appropriate error response
    if (error.message.includes('conflict')) {
      return new Response(JSON.stringify({
        error: 'Appointment conflict',
        message: 'The selected time slot is no longer available'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: 'Please try again later'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

function validateAppointmentRequest(data: any): { valid: boolean, errors: string[] } {
  const errors = []
  
  if (!data.doctorId) errors.push('Doctor ID is required')
  if (!data.patientId) errors.push('Patient ID is required')
  if (!data.appointmentDate) errors.push('Appointment date is required')
  
  const appointmentDate = new Date(data.appointmentDate)
  if (appointmentDate < new Date()) {
    errors.push('Appointment date cannot be in the past')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

---

**Next:** [Best Practices](./08-best-practices.md)
