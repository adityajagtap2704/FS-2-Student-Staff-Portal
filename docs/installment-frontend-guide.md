# Installment System - Frontend Guide

## Overview
The balanced installment system allows students to request payment plans for fees, which HOD can approve or reject. Penalties are only applied if installments are missed.

---

## 📍 Frontend Locations

### 1. **Student Dashboard - Request Installment**

**URL:** `/dashboard/fees`

**Components:**
- `src/components/fees/InstallmentRequestModal.tsx` - Modal for creating requests
- `src/app/dashboard/fees/FeesClient.tsx` - Main fees page

**What You'll See:**
- In the fees table, each unpaid fee has a **"Request Installment"** button
- Clicking opens a modal where students can:
  - Select number of installments (2-12)
  - See the amount per installment
  - Provide a reason for the request
  - Submit for HOD approval

**Flow:**
```
Student Dashboard → Fees Tab → Unpaid Fee Row → "Request Installment" Button
```

---

### 2. **Student Dashboard - Check Request Status**

**URL:** `/dashboard/fees`

**Components:**
- `src/components/fees/InstallmentStatus.tsx` - Status display component
- `src/app/dashboard/fees/FeesClient.tsx` - Main fees page

**What You'll See:**
- Below each fee with an active installment request:
  - **Status Badge:** PENDING / APPROVED / REJECTED
  - **Installment Schedule:** Shows each installment with:
    - Installment number
    - Amount (₹)
    - Due date
    - Payment status (PENDING/PAID)
  - **Status Messages:**
    - ⏳ PENDING: "Your request is under review..."
    - ✅ APPROVED: Shows installment schedule
    - ❌ REJECTED: "Your installment request was not approved..."

**Flow:**
```
Student Dashboard → Fees Tab → Fee with Request → View Status & Schedule
```

---

### 3. **HOD Dashboard - Manage Installment Requests**

**URL:** `/dashboard/hod?tab=fees`

**Components:**
- `src/components/fees/InstallmentRequestsManager.tsx` - NEW! Installment management
- `src/app/dashboard/hod/HodClient.tsx` - HOD dashboard

**What You'll See:**
- **Installment Requests Card** (at the top of Fees tab)
- **Filter Options:**
  - PENDING (shows count badge)
  - ALL (shows total count)
- **Table with columns:**
  - Student Name
  - Class
  - Fee Term
  - Amount (₹)
  - Number of Installments
  - Reason (truncated)
  - Status (badge)
  - Actions (Approve/Reject buttons)

**Actions:**
- **Approve Button:** Creates individual installment records with staggered due dates
- **Reject Button:** Opens modal to enter rejection reason

**Flow:**
```
HOD Dashboard → Fees Tab → Installment Requests Card → Approve/Reject
```

---

## 🔄 Complete User Flow

### Student Perspective:
1. **View Fees** → `/dashboard/fees`
2. **See unpaid fee** → Click "Request Installment"
3. **Fill form** → Select installments, add reason
4. **Submit** → Status becomes PENDING
5. **Wait for approval** → Check status regularly
6. **If approved** → See installment schedule with due dates
7. **Pay installments** → On each due date

### HOD Perspective:
1. **Go to HOD Dashboard** → `/dashboard/hod?tab=fees`
2. **See Installment Requests** → Card at top of Fees tab
3. **Review pending requests** → Filter by PENDING
4. **Approve or Reject** → Click action buttons
5. **If approved** → Installments created automatically
6. **If rejected** → Student sees rejection message

---

## 📊 Data Flow

### Request Creation:
```
Student Form → POST /api/installments/request
→ Creates InstallmentRequest (PENDING)
→ Stored in database
```

### Approval:
```
HOD Clicks Approve → POST /api/installments/[id]
→ Creates individual Installment records
→ Sets staggered due dates (monthly)
→ Updates request status to APPROVED
```

### Rejection:
```
HOD Clicks Reject → POST /api/installments/[id]
→ Updates request status to REJECTED
→ Stores rejection reason
→ Student sees rejection message
```

---

## 🎨 UI Components Used

### Student Side:
- `InstallmentRequestModal.tsx` - Modal form
- `InstallmentStatus.tsx` - Status display
- `Badge` - Status badges
- `Button` - Action buttons

### HOD Side:
- `InstallmentRequestsManager.tsx` - Complete management interface
- `Card` - Container
- `Badge` - Status indicators
- `Button` - Approve/Reject actions
- `Textarea` - Rejection reason input

---

## ✅ Features Implemented

### Student Features:
- ✅ Request installment plan
- ✅ View request status (PENDING/APPROVED/REJECTED)
- ✅ See installment schedule with due dates
- ✅ Track payment status per installment
- ✅ See rejection reason if rejected

### HOD Features:
- ✅ View all pending installment requests
- ✅ Filter by status (PENDING/ALL)
- ✅ Approve requests (creates installments)
- ✅ Reject requests (with reason)
- ✅ Pagination for large lists
- ✅ See student details and fee information

### System Features:
- ✅ Penalties NOT applied if installment approved
- ✅ Penalties ONLY applied if installments missed
- ✅ Automatic staggered due dates (monthly)
- ✅ Installment amount calculated automatically

---

## 🔐 Access Control

- **Students:** Can only see/manage their own requests
- **HOD:** Can see all pending requests and approve/reject
- **Other roles:** No access (401 Unauthorized)

---

## 📝 API Endpoints Used

### Student Endpoints:
- `POST /api/installments/request` - Create request
- `GET /api/installments/request` - Get own requests

### HOD Endpoints:
- `GET /api/installments/request` - Get all pending requests
- `POST /api/installments/[id]` - Approve/Reject request

---

## 🐛 Troubleshooting

### 401 Unauthorized Error:
- **Student:** Make sure you're logged in as a STUDENT
- **HOD:** Make sure you're logged in as an HOD

### Request not showing:
- Refresh the page
- Check if request status is PENDING
- Verify student is logged in

### Installments not created:
- Check if HOD clicked "Approve" button
- Verify fee exists and is not already paid
- Check browser console for errors

---

## 📱 Responsive Design

All components are fully responsive:
- Mobile: Single column, stacked buttons
- Tablet: Optimized spacing
- Desktop: Full table view with all columns

---

## 🎯 Next Steps

To test the system:
1. Login as a **Student**
2. Go to `/dashboard/fees`
3. Click "Request Installment" on an unpaid fee
4. Fill the form and submit
5. Login as **HOD**
6. Go to `/dashboard/hod?tab=fees`
7. See the request in "Installment Requests" card
8. Click "Approve" or "Reject"
9. Login back as Student to see the result
