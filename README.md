# KALNET FS-2 — Student & Staff Portal

## 📚 Project Overview

**KALNET FS-2** is a comprehensive student and staff portal system built as part of the KALNET ecosystem. This portal serves as the primary interface for students to manage their academic activities, including fee payments, leave requests, and staying updated with school announcements.

### 🎯 Vision
A student opens KALNET on their phone and instantly sees their fee balance. They tap "Leave Request", fill 3 fields, and submit. Their leave triggers an approval chain in the FS-1 system automatically. They check the Announcements board. Their parent fills in the admission enquiry form and gets a reference number. This is the face of KALNET — the first thing a school shows to parents.

### 🏗️ System Architecture
- **System**: System 1 (Full Stack)
- **Track**: Full Stack Development
- **Demo Deadline**: Week 4, April 2026

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
- **📢 Announcements Board**: Browse school announcements with category filtering
- **👤 Profile Management**: View and manage personal information
- **📱 Mobile-First Design**: Fully responsive for mobile devices (375px+)

### 🔐 Security & Authentication
- **NextAuth.js Integration**: Secure credential-based authentication
- **Route Protection**: All dashboard routes protected with middleware
- **Session Management**: JWT-based session handling
- **Role-Based Access**: Student-specific access controls

### 🎨 User Experience
- **Modern UI**: Clean, professional design with KALNET branding
- **Smooth Animations**: Framer Motion powered transitions
- **Loading States**: Proper loading indicators throughout the app
- **Error Handling**: Comprehensive error messages and validation
- **Toast Notifications**: User feedback for all actions

---

## 👥 Team Members

| Role | Name | Focus Area |
|------|------|------------|
| **Team Lead** | Aditya Bibhishan Jagtap | Architecture, PR review, daily standup, CTO reports |
| **UI Developer 1** | K. Venkata Madham Mohan | Admission forms, Announcements board |
| **API Developer** | Gharke Ram Prasad | Backend APIs, database integration |
| **DB Developer** | Aravind Kurra | Database schema, seeding, migrations |
| **UI Developer 2** | Tanoor Kiran | Fee status, Leave requests, responsive design |
| **QA + Integration** | Billola Abhinay Goud | Testing, FS-1 integration, documentation |

---

## 📋 Prerequisites

Before running this project, ensure you have the following installed:

### Required Software
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
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
# Navigate to your desired directory
cd your-projects-folder

# Clone the repository
git clone <repository-url>
cd FS-2-Student-Staff-Portal
```

### Step 2: Install Dependencies
```bash
# Install all required packages
npm install
```

### Step 3: Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/kalnet_fs2"

# NextAuth Configuration
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Optional: For production deployment
# NEXTAUTH_URL="https://your-domain.com"
```

**Important Notes:**
- Replace `username` and `password` with your MySQL credentials
- Create a database named `kalnet_fs2` in MySQL
- Generate a secure `NEXTAUTH_SECRET` (use `openssl rand -base64 32`)

### Step 4: Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database with sample data
npx prisma db seed
```

### Step 5: Start Development Server
```bash
# Start the development server
npm run dev
```

### Step 6: Access the Application
Open your browser and navigate to:
- **Local Development**: [http://localhost:3000](http://localhost:3000)
- **Admission Enquiry** (Public): [http://localhost:3000/admissions/enquire](http://localhost:3000/admissions/enquire)
- **Announcements** (Public): [http://localhost:3000/announcements](http://localhost:3000/announcements)

---

## 🗄️ Database Schema

### Core Tables

#### Students Table
```sql
- id (Primary Key)
- name (Student full name)
- email (Unique, for login)
- phone (+91 format)
- parentName
- classEnrolled (Class 6-12)
- rollNumber (Unique, KN-2024-XXX format)
- admissionDate
- isActive (Boolean)
```

#### Fees Table
```sql
- id (Primary Key)
- studentId (Foreign Key)
- term (e.g., "Term 1 2026")
- dueDate
- amount (Decimal)
- paidAmount (Decimal, nullable)
- type (Tuition/Transport/Activity)
- status (PAID/PENDING/OVERDUE)
```

#### Leave Requests Table
```sql
- id (Primary Key)
- studentId (Foreign Key)
- leaveType
- fromDate
- toDate
- reason (Text)
- status (PENDING/APPROVED/REJECTED)
- submittedAt
```

#### Announcements Table
```sql
- id (Primary Key)
- title
- category (Events/Exams/Holidays/General)
- description (Text)
- author
- date
- imageUrl (Optional)
- createdAt
```

#### Admissions Table
```sql
- id (Primary Key)
- referenceNumber (ENQ-YYYYMM-XXXX format)
- studentName
- parentName
- phone
- classApplied
- status (PENDING/APPROVED/REJECTED)
- submittedAt
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
- **Response**: `{ id, referenceNumber, ... }`

#### Announcements
```
GET /api/announcements
GET /api/announcements?category=Events
GET /api/announcements/[id]
```
- **Purpose**: Fetch announcements with optional category filtering
- **Response**: Array of announcements or single announcement object

### Protected Endpoints (Authentication Required)

#### Fees Management
```
GET /api/fees
GET /api/fees/[studentId]
```
- **Purpose**: Get fee records for current user or specific student
- **Response**: `{ records: [...], summary: { totalDue, totalPaid, outstanding } }`

#### Leave Requests
```
POST /api/leave
```
- **Purpose**: Submit new leave request
- **Body**: `{ type, from, to, reason }`
- **Response**: Leave request object with ID

#### Authentication
```
POST /api/auth/[...nextauth]
```
- **Purpose**: NextAuth.js authentication handler
- **Methods**: Sign in, sign out, session management

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
│   └── lib/                 # Utility libraries
│       ├── auth.ts          # NextAuth configuration
│       ├── db.ts            # Database client
│       └── data.ts          # Sample data (if any)
├── public/                  # Static assets
├── tailwind.config.ts       # Tailwind configuration
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

---

## 🎮 Usage Guide

### For Students

#### 1. First Time Access
1. Visit the admission enquiry page (public)
2. Fill out the admission form
3. Receive a reference number for tracking

#### 2. Regular Usage
1. **Login**: Use your school email and roll number as password
2. **Dashboard**: View your activity summary and quick links
3. **Fees**: Check your payment status and outstanding balances
4. **Leave Requests**: Submit leave requests (integrates with FS-1 approval system)
5. **Announcements**: Stay updated with school news and events

#### 3. Mobile Usage
- Fully responsive design optimized for mobile devices
- Touch-friendly buttons (minimum 44px)
- Swipe gestures for navigation
- Offline-capable static content

### For Administrators

#### Database Management
```bash
# View current data
npx prisma studio

# Reset and reseed database
npx prisma db push --force-reset
npx prisma db seed
```

#### User Management
- Students authenticate using email + roll number
- All dashboard routes are protected
- Session management via NextAuth.js

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

# Testing
npm run build           # Test production build
# Open http://localhost:3000 in browser for manual testing
```

---

## 🚀 Deployment

### For Production Deployment

1. **Environment Variables**:
   ```env
   DATABASE_URL="mysql://prod-user:prod-pass@prod-host:3306/kalnet_fs2"
   NEXTAUTH_SECRET="your-production-secret"
   NEXTAUTH_URL="https://your-domain.com"
   ```

2. **Build and Deploy**:
   ```bash
   npm run build
   npm run start
   ```

3. **Recommended Platforms**:
   - **Vercel**: Easiest for Next.js (automatic deployments)
   - **Railway**: Full-stack with database
   - **AWS**: EC2 + RDS for custom infrastructure

### Mobile Testing
- Test on real devices using Chrome DevTools Device Mode
- Minimum supported width: 375px (iPhone SE)
- All interactive elements: minimum 44px touch targets

---

## 🔗 Integration Points

### FS-1 System Integration
- **Leave Requests**: POST to FS-1 `/api/approvals` for approval chain
- **Shared Users Table**: Students table shared between FS-1 and FS-2
- **Authentication**: Unified login system across KALNET systems

### External Services
- **Payment Gateway**: Ready for integration (Stripe/Razorpay)
- **Email Service**: For notifications (SendGrid/Mailgun)
- **SMS Service**: For alerts (Twilio/AWS SNS)

---

## 📖 Documentation

### Student Guide
Located at `/docs/student-guide.md` - Plain English guide for students using the portal for the first time.

### API Documentation
- All API endpoints documented above
- Request/response examples provided
- Error handling documented

### Development Guide
- Component library usage
- Styling guidelines (KALNET colors)
- Database schema documentation

---

## 🤝 Contributing

### Development Workflow
1. **Branching**: Create feature branches from `main`
2. **Commits**: Use descriptive commit messages
3. **Pull Requests**: Required for all changes
4. **Code Review**: All PRs reviewed by Team Lead
5. **Testing**: Manual testing required before merge

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: All linting rules must pass
- **Prettier**: Code formatting consistency
- **Component Naming**: PascalCase for components
- **File Naming**: kebab-case for files

### Daily Standup Format
Send to Team Lead by 9:30 AM daily:
```
Done: [what you completed yesterday]
Doing: [what you are working on today]
Blocked: [anything stopping you — write NONE if nothing]
```

---

## 📄 License

**Confidential** - KALNET Internal Project
April 2026 - All Rights Reserved

---

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check MySQL service
sudo service mysql status

# Test connection
mysql -u username -p -e "SHOW DATABASES;"

# Reset database
npx prisma db push --force-reset
npx prisma db seed
```

#### Authentication Issues
- Check `NEXTAUTH_SECRET` in `.env.local`
- Verify `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

#### Build Issues
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

#### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
npm run dev
```

---

## 📞 Support

For technical support or questions:
- **Team Lead**: Aditya Bibhishan Jagtap
- **Project Manager**: Rishav Raj (CTO)
- **Daily Standup**: 9:30 AM - 10:00 AM IST
- **Demo Day**: Friday 4-5 PM IST

---

**KALNET · FS-2 Student & Staff Portal · April 2026 · System 1**
