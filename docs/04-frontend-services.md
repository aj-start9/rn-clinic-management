# 📱 Frontend Services Documentation

## Overview

Frontend services handle **simple queries**, **real-time data**, and **user interactions** in React Native. They provide the fastest user experience while leveraging Supabase's real-time capabilities and Row Level Security.

## 🎯 Why Handle Operations in Frontend?

### ✅ **Performance**
- Direct database connection (50-100ms response)
- No additional network hops
- Real-time subscriptions
- Optimistic UI updates

### ✅ **User Experience**
- Instant feedback
- Offline capabilities
- Real-time updates
- Smooth interactions

### ✅ **Simplicity**
- No server management
- Direct SQL queries
- TypeScript integration
- Automatic caching

## 📁 Our Frontend Services

### 1. Hybrid Appointment Service

**File:** `src/services/hybridAppointmentService.ts`

```typescript
**File:** `src/services/appointmentService.ts`

This consolidated service implements our hybrid architecture approach:

class AppointmentService {
  
  // =============================================
  // FRONTEND QUERIES (Simple, Fast)
  // =============================================
  
  // ✅ Simple data fetching - keep in frontend
  async getAppointments(userId: string, userRole: 'doctor' | 'patient') {
    const filterField = userRole === 'doctor' ? 'doctor_id' : 'patient_id'
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors (*),
        patients:users!patient_id (*)
      `)
      .eq(filterField, userId)
      .order('appointment_date', { ascending: true })

    if (error) throw new Error(error.message)
    return data
  }

  // ✅ Simple filtering - keep in frontend
  async getDoctorsBySpecialty(specialty?: string) {
    let query = supabase
      .from('doctors')
      .select('*, users(*)')
      .eq('is_active', true)

    if (specialty) {
      query = query.eq('specialty', specialty)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data
  }

  // ✅ Real-time availability - keep in frontend for speed
  async getAvailableSlots(doctorId: string, date: string) {
    const { data, error } = await supabase
      .from('doctor_availability')
      .select('time_slot')
      .eq('doctor_id', doctorId)
      .eq('date', date)
      .eq('is_available', true)
      .order('time_slot')

    if (error) throw new Error(error.message)
    return data?.map(slot => slot.time_slot) || []
  }

  // ✅ Simple status updates - triggers handle the rest
  async updateAppointmentStatus(appointmentId: string, status: string, userId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ 
        status,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }
}
```

**Purpose:** Handle simple, fast operations in frontend  
**Performance:** 50-100ms response time  
**Use cases:** Queries, basic CRUD, real-time data  

---

### 2. Doctor Service

**File:** `src/services/doctorService.ts`

```typescript
class DoctorService {
  
  // ✅ Get doctors with filtering
  async getDoctors(filters?: {
    specialty?: string
    rating?: number
    experience?: number
    location?: string
  }) {
    let query = supabase
      .from('doctors')
      .select(`
        *,
        users!inner(
          id,
          full_name,
          email,
          phone,
          profile_image_url
        ),
        specialties!inner(
          id,
          name,
          icon
        )
      `)
      .eq('is_active', true)

    // Apply filters
    if (filters?.specialty) {
      query = query.eq('specialties.name', filters.specialty)
    }
    if (filters?.rating) {
      query = query.gte('average_rating', filters.rating)
    }
    if (filters?.experience) {
      query = query.gte('experience_years', filters.experience)
    }

    const { data, error } = await query.order('average_rating', { ascending: false })
    
    if (error) throw new Error(error.message)
    return data
  }

  // ✅ Get doctor availability
  async getDoctorAvailability(doctorId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('is_available', true)
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true })

    if (error) throw new Error(error.message)
    return data
  }

  // ✅ Search doctors
  async searchDoctors(searchTerm: string) {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        users!inner(*),
        specialties!inner(*)
      `)
      .or(`users.full_name.ilike.%${searchTerm}%,specialties.name.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .limit(20)

    if (error) throw new Error(error.message)
    return data
  }
}

export const doctorService = new DoctorService()
```

**Purpose:** Doctor-related queries and searches  
**Performance:** 50-150ms response time  
**Use cases:** Doctor listings, search, availability  

---

### 3. Real-time Hooks

**File:** `src/hooks/useRealTimeAppointments.ts`

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../config/supabase'

export const useRealTimeAppointments = (userId: string, userRole: 'doctor' | 'patient') => {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Initial fetch
    fetchAppointments()
    
    // Set up real-time subscription
    const channel = supabase
      .channel('appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: userRole === 'doctor' ? `doctor_id=eq.${userId}` : `patient_id=eq.${userId}`
        },
        (payload) => {
          console.log('Real-time appointment update:', payload)
          handleRealTimeUpdate(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, userRole])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const filterField = userRole === 'doctor' ? 'doctor_id' : 'patient_id'
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors(*),
          patients:users!patient_id(*)
        `)
        .eq(filterField, userId)
        .order('appointment_date', { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRealTimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    setAppointments(current => {
      switch (eventType) {
        case 'INSERT':
          return [...current, newRecord].sort((a, b) => 
            new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
          )
        
        case 'UPDATE':
          return current.map(appointment => 
            appointment.id === newRecord.id ? newRecord : appointment
          )
        
        case 'DELETE':
          return current.filter(appointment => appointment.id !== oldRecord.id)
        
        default:
          return current
      }
    })
  }

  return { appointments, loading, refetch: fetchAppointments }
}
```

**Purpose:** Real-time appointment updates  
**Performance:** Instant updates via WebSocket  
**Use cases:** Live appointment status, notifications  

---

### 4. Optimistic UI Hook

**File:** `src/hooks/useOptimisticUpdate.ts`

```typescript
import { useState, useCallback } from 'react'

export const useOptimisticUpdate = <T>(initialData: T[]) => {
  const [data, setData] = useState<T[]>(initialData)
  const [isUpdating, setIsUpdating] = useState(false)

  const optimisticUpdate = useCallback(async (
    updateFn: (data: T[]) => T[],
    asyncOperation: () => Promise<T[]>
  ) => {
    // Immediate UI update
    const optimisticData = updateFn(data)
    setData(optimisticData)
    setIsUpdating(true)

    try {
      // Perform actual operation
      const result = await asyncOperation()
      setData(result)
    } catch (error) {
      // Revert on error
      setData(data)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [data])

  return { data, setData, optimisticUpdate, isUpdating }
}

// Usage example:
export const useOptimisticAppointments = (initialAppointments: Appointment[]) => {
  const { data: appointments, optimisticUpdate } = useOptimisticUpdate(initialAppointments)

  const cancelAppointment = useCallback(async (appointmentId: string) => {
    await optimisticUpdate(
      // Optimistic update
      (current) => current.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'cancelled' } 
          : apt
      ),
      // Actual operation
      () => appointmentService.updateAppointmentStatus(appointmentId, 'cancelled', userId)
    )
  }, [])

  return { appointments, cancelAppointment }
}
```

**Purpose:** Instant UI feedback with error recovery  
**Performance:** 0ms UI update + async backend  
**Use cases:** Status updates, form submissions  

---

### 5. Infinite Scroll Hook

**File:** `src/hooks/useInfiniteScroll.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'

export const useInfiniteScroll = <T>(
  fetchFunction: (page: number, limit: number) => Promise<T[]>,
  limit: number = 20
) => {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const newData = await fetchFunction(page, limit)
      
      if (newData.length < limit) {
        setHasMore(false)
      }
      
      setData(current => [...current, ...newData])
      setPage(current => current + 1)
    } catch (error) {
      console.error('Error loading more data:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, page, limit, loading, hasMore])

  const refresh = useCallback(async () => {
    setData([])
    setPage(0)
    setHasMore(true)
    await loadMore()
  }, [loadMore])

  useEffect(() => {
    loadMore()
  }, []) // Only run on mount

  return { data, loading, hasMore, loadMore, refresh }
}

// Usage example:
const { data: doctors, loading, hasMore, loadMore } = useInfiniteScroll(
  (page, limit) => doctorService.getDoctors({ page, limit }),
  10
)
```

**Purpose:** Efficient pagination for large datasets  
**Performance:** Load data as needed  
**Use cases:** Doctor lists, appointment history  

---

## 🔄 React Native Integration

### 1. BookAppointmentScreen

```typescript
// src/screens/consumer/BookAppointmentScreen.tsx
export const BookAppointmentScreen: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth)
  const { modalState, showError, showSuccess, hideModal } = useModal()
  
  const handleBookAppointment = async () => {
    try {
      // Option 1: Edge function for complex workflow
      const result = await appointmentService.createAppointmentWithConfirmation({
        doctor_id: doctor.id,
        patient_id: user.id,
        appointment_date: date,
        time_slot: slot.time,
        fee: 100,
        appointment_type: 'consultation'
      })

      showSuccess('Appointment Confirmed!', result.message)
      
    } catch (error) {
      // Fallback: Simple appointment creation
      try {
        const result = await appointmentService.createAppointment({
          doctor_id: doctor.id,
          patient_id: user.id,
          appointment_date: date,
          time_slot: slot.time,
          fee: 100,
          appointment_type: 'consultation'
        })

        showSuccess('Appointment Booked!', 'Confirmation will be sent shortly.')
      } catch (fallbackError) {
        showError('Error', fallbackError.message)
      }
    }
  }

  return (
    <ScrollView>
      {/* UI components */}
      <Button
        title="Confirm Booking"
        onPress={handleBookAppointment}
        loading={loading}
      />
    </ScrollView>
  )
}
```

### 2. DoctorListScreen with Real-time

```typescript
// src/screens/consumer/DoctorListScreen.tsx
export const DoctorListScreen: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  
  // Real-time subscription to doctor availability
  useEffect(() => {
    const channel = supabase
      .channel('doctor_availability')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'doctor_availability'
      }, (payload) => {
        // Update doctor availability in real-time
        updateDoctorAvailability(payload)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      const data = await doctorService.getDoctors()
      setDoctors(data)
    } catch (error) {
      console.error('Error fetching doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <FlatList
      data={doctors}
      renderItem={({ item }) => <DoctorCard doctor={item} />}
      onRefresh={fetchDoctors}
      refreshing={loading}
    />
  )
}
```

## 📊 Performance Optimization

### 1. Query Optimization

```typescript
// ✅ Good: Specific fields only
const { data } = await supabase
  .from('appointments')
  .select('id, appointment_date, time_slot, status')
  .eq('patient_id', userId)

// ❌ Bad: Select all fields
const { data } = await supabase
  .from('appointments')
  .select('*')
  .eq('patient_id', userId)
```

### 2. Caching Strategy

```typescript
// src/hooks/useCachedQuery.ts
export const useCachedQuery = <T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes
) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const cacheRef = useRef<{ data: T; timestamp: number } | null>(null)

  const fetchData = useCallback(async (force = false) => {
    // Check cache first
    if (!force && cacheRef.current) {
      const isStale = Date.now() - cacheRef.current.timestamp > ttl
      if (!isStale) {
        setData(cacheRef.current.data)
        setLoading(false)
        return
      }
    }

    try {
      setLoading(true)
      const result = await queryFn()
      cacheRef.current = { data: result, timestamp: Date.now() }
      setData(result)
    } catch (error) {
      console.error('Query error:', error)
    } finally {
      setLoading(false)
    }
  }, [queryFn, ttl])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, refetch: () => fetchData(true) }
}
```

### 3. Debounced Search

```typescript
// src/hooks/useDebouncedSearch.ts
export const useDebouncedSearch = (
  searchFn: (term: string) => Promise<any[]>,
  delay: number = 300
) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, delay)

  useEffect(() => {
    if (debouncedSearchTerm) {
      setLoading(true)
      searchFn(debouncedSearchTerm)
        .then(setResults)
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setResults([])
    }
  }, [debouncedSearchTerm, searchFn])

  return { searchTerm, setSearchTerm, results, loading }
}
```

## 🎯 Best Practices

### ✅ **Do**
- Use specific field selection in queries
- Implement proper loading states
- Cache frequently accessed data
- Use real-time subscriptions for live data
- Handle errors gracefully
- Implement optimistic updates
- Use TypeScript for type safety

### ❌ **Don't**
- Select all fields when only few are needed
- Ignore loading and error states
- Make unnecessary API calls
- Forget to unsubscribe from real-time channels
- Block UI for non-critical operations
- Ignore offline scenarios
- Skip input validation

---

**Next:** [Decision Matrix](./05-decision-matrix.md)
