import { Doctor } from '../types';

export const dummyDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Emma Kathrin',
    specialty: 'Cardiologist',
    experience_years: 4,
    rating: 4.8,
    fee: 500,
    photo_url: 'https://randomuser.me/api/portraits/women/44.jpg',
    bio: 'Dr. Emma Kathrin is a highly skilled cardiologist with 4 years of experience in treating heart conditions. She specializes in preventive cardiology and non-invasive cardiac procedures.',
    verified: true,
    clinics: [
      {
        id: 'c1',
        name: 'Heart Care Center',
        address: '123 Medical District, Downtown',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      },
      {
        id: 'c2',
        name: 'City Medical Plaza',
        address: '456 Health Ave, Midtown',
        location: {
          latitude: 37.7849,
          longitude: -122.4094,
        },
      },
    ],
    available_slots: [
      {
        date: '2025-07-18',
        slots: [
          { id: 's1', time: '09:00 AM', isAvailable: true, clinic_id: 'c1' },
          { id: 's2', time: '10:00 AM', isAvailable: true, clinic_id: 'c1' },
          { id: 's3', time: '11:00 AM', isAvailable: false, clinic_id: 'c1' },
          { id: 's4', time: '02:00 PM', isAvailable: true, clinic_id: 'c2' },
          { id: 's5', time: '03:00 PM', isAvailable: true, clinic_id: 'c2' },
        ],
      },
      {
        date: '2025-07-19',
        slots: [
          { id: 's6', time: '09:00 AM', isAvailable: true, clinic_id: 'c1' },
          { id: 's7', time: '10:00 AM', isAvailable: true, clinic_id: 'c1' },
          { id: 's8', time: '11:00 AM', isAvailable: true, clinic_id: 'c1' },
          { id: 's9', time: '02:00 PM', isAvailable: false, clinic_id: 'c2' },
          { id: 's10', time: '03:00 PM', isAvailable: true, clinic_id: 'c2' },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'Dr. Ahmed Khan',
    specialty: 'Cardiologist',
    experience_years: 2,
    rating: 4.7,
    fee: 500,
    photo_url: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Dr. Ahmed Khan is a dedicated cardiologist with 2 years of focused experience in cardiac care. He has a special interest in interventional cardiology and cardiac rehabilitation.',
    verified: true,
    clinics: [
      {
        id: 'c3',
        name: 'Metropolitan Heart Institute',
        address: '789 Cardiac Way, Uptown',
        location: {
          latitude: 37.7949,
          longitude: -122.3994,
        },
      },
    ],
    available_slots: [
      {
        date: '2025-07-18',
        slots: [
          { id: 's11', time: '08:00 AM', isAvailable: true, clinic_id: 'c3' },
          { id: 's12', time: '09:00 AM', isAvailable: false, clinic_id: 'c3' },
          { id: 's13', time: '10:00 AM', isAvailable: true, clinic_id: 'c3' },
          { id: 's14', time: '01:00 PM', isAvailable: true, clinic_id: 'c3' },
          { id: 's15', time: '02:00 PM', isAvailable: true, clinic_id: 'c3' },
        ],
      },
      {
        date: '2025-07-19',
        slots: [
          { id: 's16', time: '08:00 AM', isAvailable: true, clinic_id: 'c3' },
          { id: 's17', time: '09:00 AM', isAvailable: true, clinic_id: 'c3' },
          { id: 's18', time: '10:00 AM', isAvailable: false, clinic_id: 'c3' },
          { id: 's19', time: '01:00 PM', isAvailable: true, clinic_id: 'c3' },
          { id: 's20', time: '02:00 PM', isAvailable: true, clinic_id: 'c3' },
        ],
      },
    ],
  },
  {
    id: '3',
    name: 'Dr. Emy Branton',
    specialty: 'Cardiologist',
    experience_years: 3,
    rating: 4.9,
    fee: 500,
    photo_url: 'https://randomuser.me/api/portraits/women/65.jpg',
    bio: 'Dr. Emy Branton is an experienced cardiologist with 3 years of practice in comprehensive cardiac care. She specializes in cardiac imaging and women\'s heart health.',
    verified: true,
    clinics: [
      {
        id: 'c4',
        name: 'Advanced Cardiology Clinic',
        address: '321 Wellness Blvd, Southside',
        location: {
          latitude: 37.7649,
          longitude: -122.4294,
        },
      },
      {
        id: 'c5',
        name: 'Heart & Vascular Center',
        address: '654 Medical Campus, Eastside',
        location: {
          latitude: 37.7549,
          longitude: -122.3894,
        },
      },
    ],
    available_slots: [
      {
        date: '2025-07-18',
        slots: [
          { id: 's21', time: '09:30 AM', isAvailable: true, clinic_id: 'c4' },
          { id: 's22', time: '10:30 AM', isAvailable: true, clinic_id: 'c4' },
          { id: 's23', time: '11:30 AM', isAvailable: true, clinic_id: 'c4' },
          { id: 's24', time: '01:30 PM', isAvailable: false, clinic_id: 'c5' },
          { id: 's25', time: '02:30 PM', isAvailable: true, clinic_id: 'c5' },
          { id: 's26', time: '03:30 PM', isAvailable: true, clinic_id: 'c5' },
        ],
      },
      {
        date: '2025-07-19',
        slots: [
          { id: 's27', time: '09:30 AM', isAvailable: false, clinic_id: 'c4' },
          { id: 's28', time: '10:30 AM', isAvailable: true, clinic_id: 'c4' },
          { id: 's29', time: '11:30 AM', isAvailable: true, clinic_id: 'c4' },
          { id: 's30', time: '01:30 PM', isAvailable: true, clinic_id: 'c5' },
          { id: 's31', time: '02:30 PM', isAvailable: true, clinic_id: 'c5' },
          { id: 's32', time: '03:30 PM', isAvailable: false, clinic_id: 'c5' },
        ],
      },
    ],
  },
];

export const specialties = [
  'Cardiologist',
  'Neurologist',
  'Dermatologist',
  'Orthopedic',
  'Pediatrician',
  'Gynecologist',
  'Psychiatrist',
  'ENT Specialist',
];
