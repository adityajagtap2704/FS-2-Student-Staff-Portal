# 🔧 Fix: Database Authentication Error

## Root Cause
All 500 errors (`PrismaClientInitializationError: Authentication failed`) happen because
the `.env` file had a hardcoded MySQL password (`rishi`) that only works on the original
developer's machine. You need to set your own MySQL password.

---

## Step-by-Step Fix

### 1. Find your MySQL root password
- Open **MySQL Workbench**
- Go to **Edit → Preferences → Connections**, or check the password you set during installation.
- If you've forgotten it, reset it via the MySQL installer or run:
  ```
  mysql -u root -p
  ```
  and try your remembered password.

### 2. Update the `.env` file
Open `.env` in the project root and change:
```
DATABASE_URL="mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/kalnet_db"
```
Replace `YOUR_MYSQL_PASSWORD` with your actual MySQL root password. For example:
```
DATABASE_URL="mysql://root:mypassword123@localhost:3306/kalnet_db"
```

### 3. Create the database (if it doesn't exist)
In MySQL Workbench or the MySQL CLI:
```sql
CREATE DATABASE IF NOT EXISTS kalnet_db;
```

### 4. Run Prisma migrations
```bash
npx prisma migrate deploy
# or if using dev mode:
npx prisma db push
```

### 5. Restart the dev server
```bash
npm run dev
```

All 500 errors should now be resolved.

---

## What Was Fixed in the Code

### Bug 1: Database credential error
- **File:** `.env`
- **Fix:** Replaced hardcoded password `rishi` with `YOUR_MYSQL_PASSWORD` placeholder

### Bug 2: Approved staff "Assigned Class" column
- **File:** `src/app/dashboard/hod/HodClient.tsx`
- **Before:** Newly approved staff (no class yet) showed nothing or same blue badge as assigned staff
- **After:** Shows a gray **"Unassigned"** badge for staff with no class, clearly distinguishing them

### Bug 3: Staff on leave — class column shows substitute
- **File:** `src/app/dashboard/hod/HodClient.tsx`
- **Before:** A staff member on leave still showed only their class name in the Class column
- **After:** When a staff is on approved leave AND a substitute has been assigned, the Class column shows:
  - The staff's own class (blue badge)
  - Below it: `Sub: [Substitute Name]` (orange badge)
  
  This makes it immediately clear who is covering the class that day.
