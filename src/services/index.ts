// Re-export all doctor-related functions from a single entry point
export {
    fetchAvailability, getCurrentDoctorProfile, getDoctorAppointments, getDoctorById, getDoctorByUserId, getDoctorClinics, getDoctors, linkDoctorToClinic, updateDoctor
} from './doctorService';

// Export doctor-clinic association functions
export {
    associateDoctorWithClinic, getDoctorClinicAssociations, hasDoctorClinics, removeDoctorFromClinic
} from './doctorClinicService';

