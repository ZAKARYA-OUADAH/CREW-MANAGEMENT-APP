# Test Credentials for Crew Management Platform

## How to Populate Database

1. **Via Admin Interface:**
   - Login as admin (see credentials below)
   - Go to Settings → Development tab
   - Click "Seed Database" button
   - Copy the provided credentials

2. **Via Direct API Call:**
   ```bash
   curl -X POST https://nifjfixcsmfvycyropej.supabase.co/functions/v1/make-server-9fd39b98/seed/seed \
   -H "Content-Type: application/json"
   ```

## Test User Credentials

### 🔐 Administrator
- **Email:** `admin@crewtech.fr`
- **Password:** `admin123!`
- **Name:** Sophie Laurent
- **Role:** Operations Manager
- **Access:** Full administrative interface with all features

### 👨‍✈️ Internal Staff
- **Email:** `internal@crewtech.fr`
- **Password:** `internal123!`
- **Name:** Pierre Dubois
- **Role:** Internal Captain
- **Access:** Freelancer interface but with company employee status

### 👩‍✈️ Freelancer #1 (Flight Attendant)
- **Email:** `freelancer@aviation.com`
- **Password:** `freelancer123!`
- **Name:** Lisa Anderson
- **Role:** Flight Attendant
- **Access:** Freelancer interface with limited permissions

### 👨‍✈️ Freelancer #2 (Captain)
- **Email:** `captain@freelance.eu`
- **Password:** `captain123!`
- **Name:** Marco Rossi
- **Role:** Freelance Captain
- **Access:** Freelancer interface with captain qualifications

### 👩‍✈️ Freelancer #3 (First Officer)
- **Email:** `sarah@crewaviation.com`
- **Password:** `sarah123!`
- **Name:** Sarah Mitchell
- **Role:** First Officer
- **Access:** Freelancer interface with first officer qualifications

## Test Data Included

### ✈️ Sample Missions
1. **Approved Mission** - Lisa Anderson (Flight Attendant)
2. **Pending Mission** - Pierre Dubois (Internal Captain) with owner approval
3. **Rejected Mission** - Marco Rossi (Freelance Captain)

### 🔔 Sample Notifications
- Mission approval/rejection notifications
- Profile update reminders
- New mission assignments

### ✈️ Aircraft Fleet
- Citation CJ3 (F-HBCD)
- King Air 350 (F-GXYZ)
- Phenom 300 (F-HABC)
- Citation CJ3 (F-HDEF)
- King Air 350 (F-HGHJ)

## Testing Features

### Admin Interface (`admin@crewtech.fr`)
- ✅ Dashboard with flight overview and crew statistics
- ✅ Mission request creation with owner approval (extra day)
- ✅ Mission management (approve/reject)
- ✅ Crew management and profiles
- ✅ Settings and pay matrix configuration
- ✅ Database seeding tools

### Freelancer Interface (all freelancer accounts)
- ✅ Personal dashboard with upcoming missions
- ✅ Profile management with document upload simulation
- ✅ Mission history and current assignments
- ✅ Mission order documents (PDF-like view)
- ✅ Notification center

### Key Features to Test
1. **Owner Approval Flow** - Create extra day missions as admin
2. **Mission Lifecycle** - From creation to approval/rejection
3. **Real-time Notifications** - Cross-user notification system
4. **Role-based Access** - Different interfaces for admin vs freelancer
5. **Data Persistence** - All data stored in Supabase backend

## API Health Check
- **Endpoint:** `https://nifjfixcsmfvycyropej.supabase.co/functions/v1/make-server-9fd39b98/health`
- **Expected Response:** `{"status": "ok", "env_check": {...}}`