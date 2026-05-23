# KALNET FS-2 — Student & Staff Portal

## 📚 Project Overview

**KALNET FS-2** is a comprehensive student and staff portal system built as part of the KALNET ecosystem. This portal serves as the primary interface for students to manage their academic activities, including fee payments, leave requests, and staying updated with school announcements. Staff members can manage their class, approve student leaves, and track their own leave requests.

### 🎯 Vision
A student opens KALNET on their phone and instantly sees their fee balance. They tap "Leave Request", fill 3 fields, and submit. Their leave triggers an approval chain in the FS-1 system automatically. They check the Announcements board. Their parent fills in the admission enquiry form and gets a reference number. Staff members can manage their assigned class, approve student leaves, and submit their own leave requests. This is the face of KALNET — the first thing a school shows to parents and staff.

---

## 🛠️ Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Frontend** | Next.js | 14.2.3 |
| **Backend** | Next.js API Routes | 14.2.3 |
| **Database** | MySQL | 8.0+ |
| **ORM** | Prisma | 6.19.3 |
| **Authentication** | NextAuth.js | 4.24.7 |
| **Styling** | Tailwind CSS | 3.4.1 |
| **Animations** | Framer Motion | 11.3.31 |
| **Icons** | Lucide React | 0.8.0 |
| **Language** | TypeScript | 5.0+ |

---

## ✨ Features

### 🎓 Student Portal Features
- **📝 Admission Enquiry**: Public form for new student admissions with reference number generation
- **💰 Fee Management**: View fee status, payment history, and outstanding balances
- **📅 Leave Requests**: Submit leave requests with automatic approval chain integration
  - Monthly limit: 2 days
  - Yearly limit: 10 days
  - Real-time balance calculation
  - Pending vs approved leave tracking
- **📢 Announcements Board**: Browse school announcements with category filtering
- **👤 Profile Management**: View and manage personal information
- **📱 Mobile-First Design**: Fully responsive for mobile devices (375px+)

### 👨‍🏫 Staff Portal Features
- **📊 My Dashboard**: Quick overview of class statistics
  - Total students in assigned class
  - Pending student leave requests
  - Personal pending leave requests
- **👥 My Students**: View all students in assigned class with:
  - Student details (name, roll number, parent info, phone)
  - Leave balance (monthly and yearly)
  - Active/Inactive status
  - Real-time leave calculations
- **📋 Student Leaves**: Manage student leave requests
  - View pending, approved, and rejected leaves
  - Approve or reject student leave requests
  - Filter by status
  - See leave balance for each student
- **📅 My Leaves**: Manage personal leave requests
  - View leave balance (monthly and yearly)
  - Monthly breakdown chart
  - Submit new leave requests
  - View leave history
  - Track pending approvals
- **💰 Fees**: View fee status for assigned class
  - Total fees, paid amount, outstanding balance
  - Per-student fee details
  - Payment status tracking
- **💳 Payments**: View recent payment transactions
  - Payment history
  - Receipt numbers
  - Transaction status

### 🔐 Security & Authentication
- **NextAuth.js Integration**: Secure credential-based authentication
- **Route Protection**: All dashboard routes protected with middleware
- **Session Management**: JWT-based session handling
- **Role-Based Access**: Student, Staff (CLASS_TEACHER), and HOD access controls
- **Middleware Protection**: Automatic role-based redirects

---

## 📋 Prerequisites

Before running this project, ensure you have:

### Required Software
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher
- **MySQL**: Version 8.0 or higher
- **Git**: For version control

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 500MB free space

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd FS-2-Student-Staff-Portal
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration
Create a `.env.local` file in the root directory:

```env
DATABASE_URL="mysql://username:password@localhost:3306/kalnet_fs2"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

**Important Notes:**
- Replace `username` and `password` with your MySQL credentials
- Create a database named `kalnet_fs2` in MySQL
- Generate a secure `NEXTAUTH_SECRET` using: `openssl rand -base64 32`

### Step 4: Database Setup
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### Step 5: Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or `http://localhost:3001` if port 3000 is in use).

### Step 6: Access the Application

#### Public Pages (No Login Required)
- **Admission Enquiry**: http://localhost:3000/admissions/enquire
- **Announcements**: http://localhost:3000/announcements

#### Student Portal (Login Required)
- **Login**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/dashboard
- **Fees**: http://localhost:3000/dashboard/fees
- **Leave Requests**: http://localhost:3000/dashboard/leave

#### Staff Portal (Login Required - CLASS_TEACHER or HOD role)
- **Staff Dashboard**: http://localhost:3000/dashboard/staff
- **My Leaves**: http://localhost:3000/dashboard/staff/my-leaves
- **Student Leaves**: http://localhost:3000/dashboard/staff/leaves
- **My Students**: http://localhost:3000/dashboard/staff/students
- **Fees**: http://localhost:3000/dashboard/staff/fees
- **Payments**: http://localhost:3000/dashboard/staff/payments

---

## 🎮 Usage Guide

### For Students

#### 1. First Time Access
1. Visit the admission enquiry page (public)
2. Fill out the admission form with your details
3. Receive a reference number for tracking
4. Wait for approval from the school

#### 2. Regular Usage
1. **Login**: Use your school email and password
2. **Dashboard**: View your activity summary and quick links
3. **Fees**: Check your payment status and outstanding balances
4. **Leave Requests**: 
   - Submit leave requests (max 2 days/month, 10 days/year)
   - View your leave balance
   - Track pending approvals
   - See your leave history
5. **Announcements**: Stay updated with school news and events

#### 3. Leave Request Process
1. Navigate to "Leave Requests" in dashboard
2. Click "Request Leave"
3. Select leave type (Medical, Family, Personal, etc.)
4. Choose from and to dates
5. Provide reason
6. Submit request
7. Wait for HOD approval
8. Check status in "My Leave History"

### For Staff (CLASS_TEACHER)

#### 1. First Time Access
1. Receive login credentials from HOD
2. Login with email and password
3. You'll be assigned to a class

#### 2. Dashboard Overview
1. **My Dashboard**: See quick stats about your class
   - Total students
   - Pending student leave requests
   - Your pending leave requests

#### 3. Managing Students
1. **My Students**: View all students in your class
   - See student details (name, roll number, parent info)
   - Check each student's leave balance
   - View active/inactive status

#### 4. Approving Student Leaves
1. **Student Leaves**: View all leave requests from your class
2. Filter by status (Pending, Approved, Rejected, All)
3. Review each request with student details and leave balance
4. Click "Approve" or "Reject"
5. Approved leaves are recorded in student's history

#### 5. Managing Your Own Leaves
1. **My Leaves**: Manage your personal leave requests
2. View your leave balance (monthly and yearly)
3. See monthly breakdown chart
4. Submit new leave request:
   - Select leave type
   - Choose dates
   - Provide reason
   - Submit for HOD approval
5. Track pending approvals
6. View your leave history

#### 6. Viewing Fees and Payments
1. **Fees**: See fee status for all students in your class
   - Total fees, paid amount, outstanding
   - Per-student fee details
   - Payment status (Paid/Pending/Overdue)
2. **Payments**: View recent payment transactions
   - Payment history
   - Receipt numbers
   - Transaction status

---

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npx prisma studio       # Open Prisma Studio (database GUI)
npx prisma generate     # Generate Prisma client
npx prisma db push      # Push schema changes to database
npx prisma db seed      # Seed database with sample data
npx prisma migrate dev  # Create and apply migrations
```

---

## 📁 Project Structure

```
FS-2-Student-Staff-Portal/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Sample data seeding
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── admissions/        # Public admission pages
│   │   ├── announcements/     # Public announcements
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # Protected student pages
│   │   ├── login/            # Authentication page
│   │   └── globals.css       # Global styles
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Basic UI components
│   │   ├── layout/          # Layout components
│   │   └── motion/          # Animation components
│   ├── lib/                 # Utility libraries
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── db.ts            # Database client
│   │   ├── leaveBalance.ts  # Leave balance calculations
│   │   └── validation.ts    # Form validation
│   └── middleware.ts        # Route protection middleware
├── public/                  # Static assets
├── tailwind.config.ts       # Tailwind configuration
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

---

## 🔌 API Endpoints

### Public Endpoints (No Authentication Required)

#### Admission Enquiry
```
POST /api/admissions
```
- **Purpose**: Submit new student admission enquiry
- **Body**: `{ studentName, parentName, email?, phone, grade, startDate, message? }`

#### Announcements
```
GET /api/announcements
GET /api/announcements?category=Events
GET /api/announcements/[id]
```
- **Purpose**: Fetch announcements with optional category filtering

### Protected Endpoints (Authentication Required)

#### Student Fees Management
```
GET /api/fees
GET /api/fees/[studentId]
```
- **Purpose**: Get fee records for current user

#### Student Leave Requests
```
GET /api/leave
POST /api/leave
GET /api/leave/balance
PATCH /api/leave/[id]
DELETE /api/leave/[id]
```
- **Purpose**: Manage student leave requests
- **POST Body**: `{ type, from, to, reason }`

#### Staff Leave Requests
```
GET /api/staff/leave
POST /api/staff/leave/request
GET /api/staff/leave/balance
```
- **Purpose**: Manage staff leave requests

#### Staff Students Management
```
GET /api/staff/students
```
- **Purpose**: Get all students in staff's assigned class with leave balance

#### Staff Fees Management
```
GET /api/staff/fees
```
- **Purpose**: Get fee status for all students in staff's assigned class

---

## 🐛 Known Issues & Recent Fixes

### Latest Fixes (May 2026)
- ✅ Fixed 405 error on staff leave request endpoint
- ✅ Fixed leave balance calculation for leaves spanning month boundaries
- ✅ Fixed UI not updating after leave submission
- ✅ Fixed inconsistent day calculation between student and staff portals
- ✅ Fixed edge cases with zero leaves remaining
- ✅ Removed middle buttons from staff dashboard (consolidated into sidebar)
- ✅ Separated "My Leaves" (staff's own) from "Student Leaves" (to manage)

### Edge Cases Handled
- ✅ Zero leaves remaining (shows 0, not negative)
- ✅ Leaves spanning month/year boundaries
- ✅ Pending vs approved leaves counted separately
- ✅ Overlapping leave requests prevented
- ✅ Monthly and yearly limits enforced
- ✅ Real-time balance updates after form submission

---

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Check MySQL service
sudo service mysql status

# Test connection
mysql -u username -p -e "SHOW DATABASES;"

# Reset database
npx prisma db push --force-reset
npx prisma db seed
```

### Authentication Issues
- Check `NEXTAUTH_SECRET` in `.env.local`
- Verify `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again
- Ensure user role is correct (STUDENT, CLASS_TEACHER, or HOD)

### Build Issues
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
npm run dev
```

### Leave Balance Not Updating
- Refresh the page after submitting a leave request
- Check that the leave request was successfully created
- Verify the leave status is PENDING or APPROVED

---

## 📞 Support

For technical support or questions:
- **Team Lead**: Aditya Bibhishan Jagtap
- **Project Manager**: Rishav Raj (CTO)
- **Daily Standup**: 9:30 AM - 10:00 AM IST
- **Demo Day**: Friday 4-5 PM IST

---

## 🎯 Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] MySQL 8.0+ installed and running
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created with database credentials
- [ ] Database migrations run (`npx prisma db push`)
- [ ] Database seeded (`npx prisma db seed`)
- [ ] Development server started (`npm run dev`)
- [ ] Application accessible at `http://localhost:3000`
- [ ] Can login with test credentials
- [ ] Can navigate between student and staff portals

---

**KALNET · FS-2 Student & Staff Portal · April 2026 · System 1**
**Last Updated**: May 2026 - Latest fixes and features included
