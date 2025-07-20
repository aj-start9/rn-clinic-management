# Doctor Booking App

A full-featured Doctor Booking application built with React Native (Expo), Redux Toolkit, and designed for both patients and doctors.

## 🚀 Features

### For Patients (Consumers)
- **Home Dashboard**: Personalized welcome screen with quick actions
- **Doctor Search**: Search and filter doctors by specialty, rating, and experience
- **Doctor Profiles**: Detailed doctor information with ratings, experience, and clinic locations
- **Appointment Booking**: Easy appointment scheduling with available time slots
- **Appointment Management**: View upcoming and past appointments
- **Profile Management**: Edit personal information and preferences

### For Doctors
- **Dashboard**: Overview of daily appointments and statistics
- **Appointment Management**: View and manage patient appointments
- **Availability Management**: Set working hours and available time slots
- **Patient Information**: Access to patient details and appointment history

## 🛠 Tech Stack

- **Frontend**: React Native with Expo
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation v6
- **UI Components**: Custom component library
- **TypeScript**: For type safety
- **Icons**: Expo Vector Icons

## 📱 Screenshots

### Consumer App
- Beautiful home screen with quick actions
- Advanced doctor search and filtering
- Intuitive appointment booking flow
- Clean appointment management interface

### Doctor App
- Professional dashboard with statistics
- Comprehensive appointment management
- Easy-to-use availability settings

## 🎨 Design System

### Color Palette
- **Primary**: #3AAFA9 (Teal)
- **Accent**: #2B7A78 (Dark Teal)
- **Text**: #17252A (Dark Blue)
- **Background**: #FFFFFF (White)
- **Secondary**: #DEF2F1 (Light Teal)

### Typography
- Font sizes: 12, 14, 16, 18, 24, 32px
- Font weights: Regular, Medium, Semibold, Bold

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or later)
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expo-dr-appointment-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   npm run ios     # iOS
   npm run android # Android
   ```

## 🔐 Demo Credentials

### Patient Account
- **Email**: patient@test.com
- **Password**: password

### Doctor Account
- **Email**: doctor@test.com
- **Password**: password

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── DoctorCard.tsx
│   ├── SearchBar.tsx
│   ├── SlotButton.tsx
│   └── AppointmentCard.tsx
├── screens/            # Screen components
│   ├── auth/           # Authentication screens
│   ├── consumer/       # Patient screens
│   ├── doctor/         # Doctor screens
│   └── ProfileScreen.tsx
├── navigation/         # Navigation configuration
│   ├── AppNavigator.tsx
│   └── TabNavigator.tsx
├── redux/             # State management
│   ├── store.ts
│   ├── authSlice.ts
│   ├── doctorSlice.ts
│   └── appointmentSlice.ts
├── services/          # API services
│   └── mockAuth.ts
├── constants/         # Constants and dummy data
│   ├── theme.ts
│   └── dummyData.ts
└── types/            # TypeScript type definitions
    └── index.ts
```

## 🔧 Configuration

The app currently uses mock services for demonstration purposes. In production, you would:

1. Set up Supabase project
2. Configure authentication
3. Run the SQL scripts from the `sql/` folder (see `sql/README.md`)
4. Replace mock services with real API calls

### Database Schema (for production)

The complete database schema is available in the `sql/` folder. Key tables include:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  role TEXT CHECK (role IN ('consumer', 'doctor')),
  full_name TEXT,
  avatar_url TEXT,
  location TEXT,
  PRIMARY KEY (id)
);

-- Doctors table
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  experience_years INTEGER,
  rating DECIMAL(2,1),
  fee INTEGER,
  photo_url TEXT,
  clinics JSONB,
  available_slots JSONB,
  bio TEXT,
  verified BOOLEAN DEFAULT false
);

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id),
  user_id UUID REFERENCES profiles(id),
  clinic JSONB,
  date DATE,
  slot JSONB,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎯 Key Features Implemented

### Authentication System
- User registration with role selection (Patient/Doctor)
- Secure login/logout functionality
- Persistent authentication state
- Role-based navigation

### Doctor Discovery
- Search doctors by name or specialty
- Filter by rating and experience
- View detailed doctor profiles
- See clinic locations and availability

### Appointment System
- Real-time slot availability
- Easy date and time selection
- Appointment confirmation
- Status tracking (pending, confirmed, completed, cancelled)

### User Experience
- Intuitive navigation
- Beautiful, modern UI
- Responsive design
- Smooth animations and transitions

## 🚀 Production Deployment

For production deployment:

1. **Set up Supabase**
   - Create a new Supabase project
   - Set up authentication
   - Run SQL scripts from the `sql/` folder in the following order:
     1. `sql/supabase-setup.sql` - Database schema
     2. `sql/fix-rls-policies.sql` - Security policies
     3. `sql/QUICK_FIX.sql` - Database triggers
     4. `sql/sample_data.sql` - Test data (optional)
   - See `sql/README.md` for detailed instructions

2. **Environment Variables**
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Build and Deploy**
   ```bash
   expo build:android
   expo build:ios
   ```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@docbooking.app or join our Slack channel.

---

Built with ❤️ using React Native and Expo
# rn-clinic-management
