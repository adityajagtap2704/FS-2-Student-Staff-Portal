-- ============================================================================
-- KALNET COMPLETE DATABASE - FRESH SETUP WITH TABLES AND DATA
-- CONSOLIDATED, CLEANED & PRODUCTION READY
-- ============================================================================

-- Drop existing database if it exists
DROP DATABASE IF EXISTS kalnet_db;

-- Create fresh database
CREATE DATABASE kalnet_db;
USE kalnet_db;

-- ============================================================================
-- TABLE 1: ADMISSIONS
-- ============================================================================
CREATE TABLE admissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referenceNumber VARCHAR(191) UNIQUE NOT NULL,
  studentName VARCHAR(191) NOT NULL,
  parentName VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  phone VARCHAR(191) NOT NULL,
  classApplied VARCHAR(191) NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  submittedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  approvedAt DATETIME(3),
  approvedBy VARCHAR(191),
  rejectionReason VARCHAR(191),
  KEY idx_admissions_status (status),
  KEY idx_admissions_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 2: STAFF
-- ============================================================================
CREATE TABLE staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191) UNIQUE NOT NULL,
  password VARCHAR(191) NOT NULL,
  role ENUM('STUDENT','CLASS_TEACHER','NON_TEACHING_STAFF','HOD') DEFAULT 'CLASS_TEACHER',
  assignedClass VARCHAR(191),
  isActive BOOLEAN DEFAULT TRUE,
  approvedBy VARCHAR(191),
  approvedAt DATETIME,
  rejectionReason VARCHAR(500),
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_staff_email (email),
  KEY idx_staff_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 3: STUDENTS
-- ============================================================================
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191),
  email VARCHAR(191) UNIQUE NOT NULL,
  password VARCHAR(191) NOT NULL,
  phone VARCHAR(191),
  parentName VARCHAR(191),
  parentEmail VARCHAR(191),
  classEnrolled VARCHAR(191),
  rollNumber VARCHAR(191) UNIQUE,
  officialEmail VARCHAR(191) UNIQUE,
  admissionDate DATETIME(3),
  isActive BOOLEAN DEFAULT TRUE,
  status ENUM('PRE_APPLICANT','APPLICANT','STUDENT','REJECTED') DEFAULT 'STUDENT',
  enquiryNumber VARCHAR(191) UNIQUE,
  admissionId INT,
  documentsUploaded LONGTEXT,
  applicationFeePaid BOOLEAN DEFAULT FALSE,
  applicationFeeAmount DECIMAL(10,2),
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3),
  KEY idx_students_email (email),
  KEY idx_students_status (status),
  KEY idx_students_classEnrolled (classEnrolled),
  FOREIGN KEY (admissionId) REFERENCES admissions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 4: FEES
-- ============================================================================
CREATE TABLE fees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  term VARCHAR(191) NOT NULL,
  dueDate DATETIME(3) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paidAmount DECIMAL(10,2) DEFAULT 0.00,
  paidAt DATETIME,
  paymentMethod VARCHAR(50),
  type ENUM('Tuition','Transport','Activity','Outstanding') NOT NULL,
  status ENUM('PAID','PENDING','OVERDUE') DEFAULT 'PENDING',
  penaltyAmount DECIMAL(10,2) DEFAULT 0.00,
  penaltyAppliedAt DATETIME,
  penaltyPercentage DECIMAL(5,2) DEFAULT 5.00,
  KEY idx_fees_studentId (studentId),
  KEY idx_fees_status (status),
  KEY idx_fees_dueDate (dueDate),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 4A: INSTALLMENT_REQUESTS
-- ============================================================================
CREATE TABLE installment_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  feeId INT NOT NULL UNIQUE,
  studentId INT NOT NULL,
  numberOfInstallments INT NOT NULL,
  reason LONGTEXT NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  approvedBy VARCHAR(191),
  approvedAt DATETIME,
  rejectionReason VARCHAR(500),
  requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (feeId) REFERENCES fees(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  KEY idx_studentId (studentId),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 4B: INSTALLMENTS
-- ============================================================================
CREATE TABLE installments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  feeId INT NOT NULL,
  studentId INT NOT NULL,
  installmentNumber INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  dueDate DATETIME NOT NULL,
  paidAmount DECIMAL(10,2) DEFAULT 0.00,
  paidAt DATETIME,
  status ENUM('PENDING','PAID','OVERDUE') DEFAULT 'PENDING',
  paymentMethod VARCHAR(50),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (feeId) REFERENCES fees(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  KEY idx_feeId (feeId),
  KEY idx_studentId (studentId),
  KEY idx_status (status),
  UNIQUE KEY unique_fee_installment (feeId, installmentNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 4C: PENALTY_LOGS
-- ============================================================================
CREATE TABLE penalty_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  feeId INT NOT NULL,
  studentId INT NOT NULL,
  penaltyAmount DECIMAL(10,2) NOT NULL,
  penaltyPercentage DECIMAL(5,2) NOT NULL,
  daysOverdue INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feeId) REFERENCES fees(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  KEY idx_feeId (feeId),
  KEY idx_studentId (studentId),
  KEY idx_appliedAt (appliedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 5: ANNOUNCEMENTS
-- ============================================================================
CREATE TABLE announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(191) NOT NULL,
  category ENUM('Events','Exams','Holidays','General') NOT NULL,
  target ENUM('STAFF','STUDENT','NON_TEACHING_STAFF','BOTH') DEFAULT 'BOTH',
  description TEXT NOT NULL,
  author VARCHAR(191) NOT NULL,
  date DATETIME(3) NOT NULL,
  imageUrl VARCHAR(1000),
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_announcements_category (category),
  KEY idx_announcements_date (date),
  KEY idx_announcements_target (target)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 6: LEAVE_REQUESTS
-- ============================================================================
CREATE TABLE leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT,
  staffId INT,
  leaveType VARCHAR(191) NOT NULL,
  fromDate DATETIME(3) NOT NULL,
  toDate DATETIME(3) NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  rejectionReason VARCHAR(500),
  approvedBy INT,
  approvedAt DATETIME,
  submittedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_leave_requests_studentId (studentId),
  KEY idx_leave_requests_staffId (staffId),
  KEY idx_leave_requests_status (status),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (staffId) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 7: NOTIFICATIONS
-- ============================================================================
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  type ENUM('LEAVE_APPROVED','LEAVE_REJECTED','ADMISSION_APPROVED','ADMISSION_REJECTED','BONAFIDE_APPROVED','BONAFIDE_REJECTED','GENERAL') NOT NULL,
  title VARCHAR(191) NOT NULL,
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  readAt DATETIME,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_notifications_studentId (studentId),
  KEY idx_notifications_isRead (isRead),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 8: OTPS
-- ============================================================================
CREATE TABLE otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) NOT NULL,
  code VARCHAR(191) UNIQUE NOT NULL,
  status ENUM('PENDING','VERIFIED','EXPIRED') DEFAULT 'PENDING',
  expiresAt DATETIME(3) NOT NULL,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_otps_email (email),
  KEY idx_otps_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 9: EMAIL_VERIFICATIONS
-- ============================================================================
CREATE TABLE email_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  token VARCHAR(191) UNIQUE NOT NULL,
  expiresAt DATETIME(3) NOT NULL,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 10: STAFF_SIGNUP_TEMP
-- ============================================================================
CREATE TABLE staff_signup_temp (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  name VARCHAR(191) NOT NULL,
  password VARCHAR(191) NOT NULL,
  role ENUM('STUDENT','CLASS_TEACHER','NON_TEACHING_STAFF','HOD') DEFAULT 'CLASS_TEACHER',
  assignedClass VARCHAR(191),
  expiresAt DATETIME(3) NOT NULL,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 11: PAYMENT_ORDERS
-- ============================================================================
CREATE TABLE payment_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fee_id INT NOT NULL,
  student_id INT NOT NULL,
  amount_paise INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  razorpay_order_id VARCHAR(255) NOT NULL UNIQUE,
  status ENUM('CREATED','PAID','FAILED') DEFAULT 'CREATED',
  receipt VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fee_id (fee_id),
  INDEX idx_student_id (student_id),
  INDEX idx_razorpay_order_id (razorpay_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 12: PAYMENT_TRANSACTIONS
-- ============================================================================
CREATE TABLE payment_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  razorpay_order_id VARCHAR(255) NOT NULL UNIQUE,
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  raw_response LONGTEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_razorpay_order_id (razorpay_order_id),
  INDEX idx_razorpay_payment_id (razorpay_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 13: FEE_RECEIPTS
-- ============================================================================
CREATE TABLE fee_receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  razorpay_order_id VARCHAR(255) NOT NULL UNIQUE,
  receipt_number VARCHAR(255),
  issued_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_razorpay_order_id (razorpay_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 14: STUDENT_DOCUMENTS
-- ============================================================================
CREATE TABLE student_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  documentType VARCHAR(100) NOT NULL,
  fileName VARCHAR(255) NOT NULL,
  fileUrl VARCHAR(500) NOT NULL,
  fileSize INT,
  uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'PENDING',
  verifiedBy INT,
  verifiedAt DATETIME,
  rejectionReason VARCHAR(500),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_studentId (studentId),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 15: FEE_PAYMENT_TRANSACTIONS
-- ============================================================================
CREATE TABLE fee_payment_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  feeId INT NOT NULL,
  studentId INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paymentMethod VARCHAR(50) NOT NULL,
  transactionId VARCHAR(255),
  paymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  razorpayOrderId VARCHAR(255),
  razorpayPaymentId VARCHAR(255),
  status VARCHAR(50) DEFAULT 'SUCCESS',
  notes VARCHAR(500),
  FOREIGN KEY (feeId) REFERENCES fees(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_feeId (feeId),
  INDEX idx_studentId (studentId),
  INDEX idx_paymentDate (paymentDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 18: CLASS_ASSIGNMENTS
-- ============================================================================
CREATE TABLE class_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staffId INT NOT NULL,
  classEnrolled VARCHAR(191) NOT NULL,
  assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  unassignedAt DATETIME,
  reason VARCHAR(255),
  FOREIGN KEY (staffId) REFERENCES staff(id) ON DELETE CASCADE,
  INDEX idx_staffId (staffId),
  INDEX idx_classEnrolled (classEnrolled),
  INDEX idx_assignedAt (assignedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 19: STAFF_LEAVE_BALANCE
-- ============================================================================
CREATE TABLE staff_leave_balance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staffId INT NOT NULL UNIQUE,
  year INT NOT NULL,
  totalYearlyLeave INT DEFAULT 20,
  usedLeave INT DEFAULT 0,
  remainingLeave INT DEFAULT 20,
  monthlyUsed INT DEFAULT 0,
  lastUpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (staffId) REFERENCES staff(id) ON DELETE CASCADE,
  UNIQUE KEY unique_staff_year (staffId, year),
  INDEX idx_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 21: SUBJECTS
-- ============================================================================
CREATE TABLE subjects (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(191) NOT NULL,
  code       VARCHAR(191) NOT NULL UNIQUE,
  color      VARCHAR(191) NOT NULL DEFAULT '#10b981',
  classLevel VARCHAR(191) NOT NULL,
  createdAt  DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_subjects_classLevel (classLevel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 22: CLASSROOMS
-- ============================================================================
CREATE TABLE classrooms (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(191) NOT NULL UNIQUE,
  capacity  INT NOT NULL DEFAULT 40,
  building  VARCHAR(191),
  floor     VARCHAR(191),
  isActive  BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 23: TIMETABLE SLOTS
-- ============================================================================
CREATE TABLE timetable_slots (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  slotNumber INT NOT NULL,
  startTime  VARCHAR(191) NOT NULL,
  endTime    VARCHAR(191) NOT NULL,
  isBreak    BOOLEAN NOT NULL DEFAULT FALSE,
  breakLabel VARCHAR(191),
  createdAt  DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_slotNumber (slotNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 24: TIMETABLE ENTRIES
-- ============================================================================
CREATE TABLE timetable_entries (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  classEnrolled VARCHAR(191) NOT NULL,
  section       VARCHAR(191) NOT NULL DEFAULT 'A',
  dayOfWeek     INT NOT NULL,
  slotId        INT NOT NULL,
  subjectId     INT,
  staffId       INT,
  classroomId   INT,
  isPublished   BOOLEAN NOT NULL DEFAULT FALSE,
  academicYear  VARCHAR(191) NOT NULL DEFAULT '2025-26',
  createdAt     DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt     DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (slotId)      REFERENCES timetable_slots(id) ON DELETE CASCADE,
  FOREIGN KEY (subjectId)   REFERENCES subjects(id)        ON DELETE SET NULL,
  FOREIGN KEY (staffId)     REFERENCES staff(id)           ON DELETE SET NULL,
  FOREIGN KEY (classroomId) REFERENCES classrooms(id)      ON DELETE SET NULL,
  INDEX idx_tt_class_section_day (classEnrolled, section, dayOfWeek),
  INDEX idx_tt_staffId      (staffId),
  INDEX idx_tt_classroomId  (classroomId),
  INDEX idx_tt_slotId       (slotId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 25: SPECIAL SCHEDULES
-- ============================================================================
CREATE TABLE special_schedules (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  date          DATETIME(3) NOT NULL,
  title         VARCHAR(191) NOT NULL,
  description   TEXT,
  type          VARCHAR(191) NOT NULL DEFAULT 'EVENT',
  classEnrolled VARCHAR(191),
  section       VARCHAR(191),
  createdBy     INT,
  createdAt     DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_ss_date          (date),
  INDEX idx_ss_classEnrolled (classEnrolled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 26: SUBSTITUTE ASSIGNMENTS
-- ============================================================================
CREATE TABLE substitute_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  absentStaffId INT NOT NULL,
  substituteStaffId INT NOT NULL,
  classEnrolled VARCHAR(191) NOT NULL,
  assignedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_absent_staff (absentStaffId),
  INDEX idx_substitute_staff (substituteStaffId),
  INDEX idx_class (classEnrolled),
  FOREIGN KEY (absentStaffId) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (substituteStaffId) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX idx_staff_approvedBy ON staff(approvedBy);
CREATE INDEX idx_student_admissionDate ON students(admissionDate);


-- ============================================================================
-- NOW INSERT INITIAL SEED DATA
-- ============================================================================

-- ============================================================================
-- INSERT ADMISSIONS (5 records)
-- ============================================================================
INSERT INTO admissions (referenceNumber, studentName, parentName, email, phone, classApplied, status, submittedAt, approvedAt, approvedBy)
VALUES
('ADM-2026-001', 'Rohan Mehta', 'Sunil Mehta', 'sunil.mehta@gmail.com', '9876501234', 'Class 6', 'APPROVED', NOW(), NOW(), 'hod@kalnet.edu'),
('ADM-2026-002', 'Nisha Patel', 'Ramesh Patel', 'ramesh.patel@gmail.com', '9876502345', 'Class 8', 'APPROVED', NOW(), NOW(), 'hod@kalnet.edu'),
('ADM-2026-003', 'Karan Joshi', 'Vijay Joshi', 'vijay.joshi@gmail.com', '9876503456', 'Class 10', 'PENDING', NOW(), NULL, NULL),
('ADM-2026-004', 'Meera Iyer', 'Krishnan Iyer', 'krishnan.iyer@gmail.com', '9876504567', 'Class 7', 'REJECTED', NOW(), NOW(), 'hod@kalnet.edu'),
('ADM-2026-005', 'Aryan Kapoor', 'Rajiv Kapoor', 'rajiv.kapoor@gmail.com', '9876505678', 'Class 11', 'PENDING', NOW(), NULL, NULL);

-- ============================================================================
-- INSERT STAFF (13 records)
-- All passwords stored as plain text
-- HOD password       : hod123
-- Class Teacher passwords: [firstname]123  (e.g. lakshmi123)
-- Non-Teaching Staff : NonTeaching@2026
-- ============================================================================
INSERT INTO staff (name, email, password, role, assignedClass, isActive, approvedBy, approvedAt, createdAt, updatedAt)
VALUES
-- Class Teachers (staffId 1-7)
('Mrs. Lakshmi Devi',  'lakshmi@kalnet.edu',          'lakshmi123',      'CLASS_TEACHER',      'Class 6',  1, 'hod@kalnet.edu', NOW(), NOW(), NOW()),
('Mr. Suresh Babu',    'suresh@kalnet.edu',            'suresh123',       'CLASS_TEACHER',      'Class 7',  1, 'hod@kalnet.edu', NOW(), NOW(), NOW()),
('Mrs. Anita Sharma',  'anita@kalnet.edu',             'anita123',        'CLASS_TEACHER',      'Class 8',  1, 'hod@kalnet.edu', NOW(), NOW(), NOW()),
('Mr. Ravi Teja',      'ravi@kalnet.edu',              'ravi123',         'CLASS_TEACHER',      'Class 9',  1, 'hod@kalnet.edu', NOW(), NOW(), NOW()),
('Mrs. Preethi Nair',  'preethi@kalnet.edu',           'preethi123',      'CLASS_TEACHER',      'Class 10', 1, 'hod@kalnet.edu', NOW(), NOW(), NOW()),
('Mr. Karthik Reddy',  'karthik@kalnet.edu',           'karthik123',      'CLASS_TEACHER',      'Class 11', 1, 'hod@kalnet.edu', NOW(), NOW(), NOW()),
('Mrs. Sunita Rao',    'sunita@kalnet.edu',            'sunita123',       'CLASS_TEACHER',      'Class 12', 1, 'hod@kalnet.edu', NOW(), NOW(), NOW()),
-- HOD (staffId 8)
('Dr. Venkat Prasad',  'hod@kalnet.edu',               'hod123',          'HOD',                NULL,       1, NULL,             NULL,  NOW(), NOW()),
-- Non-Teaching Staff (staffId 9-13)
-- These staff handle Admissions and Document Verification
('Ms. Priya Sharma',   'priya.fees@kalnet.edu',        'NonTeaching@2026','NON_TEACHING_STAFF', NULL,       1, 'hod@kalnet.edu', NOW(), NOW(), NOW()),
('Mr. Rajesh Kumar',   'rajesh.admissions@kalnet.edu', 'NonTeaching@2026','NON_TEACHING_STAFF', NULL,       1, 'hod@kalnet.edu', NOW(), NOW(), NOW()),
('Mrs. Anjali Verma',  'anjali.finance@kalnet.edu',    'NonTeaching@2026','NON_TEACHING_STAFF', NULL,       1, 'hod@kalnet.edu', NOW(), NOW(), NOW()),
('Ms. Neha Patel',     'neha.admissions@kalnet.edu',   'NonTeaching@2026','NON_TEACHING_STAFF', NULL,       1, 'hod@kalnet.edu', NOW(), NOW(), NOW()),
('Mr. Vikram Singh',   'vikram.fees@kalnet.edu',       'NonTeaching@2026','NON_TEACHING_STAFF', NULL,       1, 'hod@kalnet.edu', NOW(), NOW(), NOW());

-- ============================================================================
-- INSERT STUDENTS (70 records - 10 per Class for Classes 6-12)
-- ============================================================================
INSERT INTO students (name, email, password, phone, parentName, parentEmail, classEnrolled, rollNumber, officialEmail, admissionDate, isActive, status, enquiryNumber, admissionId, applicationFeePaid, applicationFeeAmount, createdAt, updatedAt)
VALUES
-- Class 6 (10 students)
('Priya Sharma', 'priya@example.com', 'priya123', '9100000001', 'Rajesh Sharma', 'rajesh.sharma@gmail.com', 'Class 6', 'KN-6-001', 'priya.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-001', 1, 1, 5000.00, NOW(), NOW()),
('Ishaan Kapur', 'ishaan@example.com', 'ishaan123', '9100000002', 'Sameer Kapur', 'sameer.kapur@gmail.com', 'Class 6', 'KN-6-002', 'ishaan.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-002', 1, 1, 5000.00, NOW(), NOW()),
('Riya Gupta', 'riya@example.com', 'riya123', '9100000003', 'Mohan Gupta', 'mohan.gupta@gmail.com', 'Class 6', 'KN-6-003', 'riya.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-003', 1, 1, 5000.00, NOW(), NOW()),
('Aarav Joshi', 'aarav@example.com', 'aarav123', '9100000004', 'Sunil Joshi', 'sunil.joshi@gmail.com', 'Class 6', 'KN-6-004', 'aarav.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-004', 1, 1, 5000.00, NOW(), NOW()),
('Diya Patel', 'diya@example.com', 'diya123', '9100000005', 'Nilesh Patel', 'nilesh.patel@gmail.com', 'Class 6', 'KN-6-005', 'diya.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-005', 1, 1, 5000.00, NOW(), NOW()),
('Kabir Malhotra', 'kabir@example.com', 'kabir123', '9100000006', 'Rohit Malhotra', 'rohit.malhotra@gmail.com', 'Class 6', 'KN-6-006', 'kabir.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-006', 1, 1, 5000.00, NOW(), NOW()),
('Anvi Singh', 'anvi@example.com', 'anvi123', '9100000007', 'Harpreet Singh', 'harpreet.singh@gmail.com', 'Class 6', 'KN-6-007', 'anvi.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-007', 1, 1, 5000.00, NOW(), NOW()),
('Vivaan Mehta', 'vivaan@example.com', 'vivaan123', '9100000008', 'Deepak Mehta', 'deepak.mehta@gmail.com', 'Class 6', 'KN-6-008', 'vivaan.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-008', 1, 1, 5000.00, NOW(), NOW()),
('Myra Nair', 'myra@example.com', 'myra123', '9100000009', 'Suresh Nair', 'suresh.nair@gmail.com', 'Class 6', 'KN-6-009', 'myra.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-009', 1, 1, 5000.00, NOW(), NOW()),
('Rehan Khan', 'rehan@example.com', 'rehan123', '9100000010', 'Imran Khan', 'imran.khan@gmail.com', 'Class 6', 'KN-6-010', 'rehan.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-010', 1, 1, 5000.00, NOW(), NOW()),

-- Class 7 (10 students)
('Ananya Reddy', 'ananya@example.com', 'ananya123', '9100000011', 'Vivek Reddy', 'vivek.reddy@gmail.com', 'Class 7', 'KN-7-001', 'ananya.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-011', 1, 1, 5000.00, NOW(), NOW()),
('Zoya Khan', 'zoya@example.com', 'zoya123', '9100000012', 'Farhan Khan', 'farhan.khan@gmail.com', 'Class 7', 'KN-7-002', 'zoya.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-012', 1, 1, 5000.00, NOW(), NOW()),
('Aryan Verma', 'aryan@example.com', 'aryan123', '9100000013', 'Rakesh Verma', 'rakesh.verma@gmail.com', 'Class 7', 'KN-7-003', 'aryan.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-013', 1, 1, 5000.00, NOW(), NOW()),
('Saanvi Iyer', 'saanvi@example.com', 'saanvi123', '9100000014', 'Krishnan Iyer', 'krishnan.iyer@gmail.com', 'Class 7', 'KN-7-004', 'saanvi.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-014', 1, 1, 5000.00, NOW(), NOW()),
('Dev Kapoor', 'dev@example.com', 'dev123', '9100000015', 'Anil Kapoor', 'anil.kapoor@gmail.com', 'Class 7', 'KN-7-005', 'dev.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-015', 1, 1, 5000.00, NOW(), NOW()),
('Tara Bose', 'tara@example.com', 'tara123', '9100000016', 'Subhash Bose', 'subhash.bose@gmail.com', 'Class 7', 'KN-7-006', 'tara.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-016', 1, 1, 5000.00, NOW(), NOW()),
('Krish Pillai', 'krish@example.com', 'krish123', '9100000017', 'Nair Pillai', 'nair.pillai@gmail.com', 'Class 7', 'KN-7-007', 'krish.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-017', 1, 1, 5000.00, NOW(), NOW()),
('Naina Saxena', 'naina@example.com', 'naina123', '9100000018', 'Vinod Saxena', 'vinod.saxena@gmail.com', 'Class 7', 'KN-7-008', 'naina.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-018', 1, 1, 5000.00, NOW(), NOW()),
('Rohan Das', 'rohan@example.com', 'rohan123', '9100000019', 'Arjun Das', 'arjun.das@gmail.com', 'Class 7', 'KN-7-009', 'rohan.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-019', 1, 1, 5000.00, NOW(), NOW()),
('Sia Choudhary', 'sia@example.com', 'sia123', '9100000020', 'Ramesh Choudhary', 'ramesh.choudhary@gmail.com', 'Class 7', 'KN-7-010', 'sia.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-020', 1, 1, 5000.00, NOW(), NOW()),

-- Class 8 (10 students)
('Tanoor Kiran', 'tanoor@example.com', 'tanoor123', '9100000021', 'Ravi Kiran', 'ravi.kiran@gmail.com', 'Class 8', 'KN-8-001', 'tanoor.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-021', 1, 1, 5000.00, NOW(), NOW()),
('Rahul Verma', 'rahul@example.com', 'rahul123', '9100000022', 'Sunil Verma', 'sunil.verma@gmail.com', 'Class 8', 'KN-8-002', 'rahul.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-022', 1, 1, 5000.00, NOW(), NOW()),
('Arjun Mehra', 'arjun@example.com', 'arjun123', '9100000023', 'Sanjay Mehra', 'sanjay.mehra@gmail.com', 'Class 8', 'KN-8-003', 'arjun.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-023', 1, 1, 5000.00, NOW(), NOW()),
('Pooja Tiwari', 'pooja@example.com', 'pooja123', '9100000024', 'Ramesh Tiwari', 'ramesh.tiwari@gmail.com', 'Class 8', 'KN-8-004', 'pooja.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-024', 1, 1, 5000.00, NOW(), NOW()),
('Nikhil Rao', 'nikhil@example.com', 'nikhil123', '9100000025', 'Venkat Rao', 'venkat.rao@gmail.com', 'Class 8', 'KN-8-005', 'nikhil.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-025', 1, 1, 5000.00, NOW(), NOW()),
('Shreya Mishra', 'shreya@example.com', 'shreya123', '9100000026', 'Anil Mishra', 'anil.mishra@gmail.com', 'Class 8', 'KN-8-006', 'shreya.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-026', 1, 1, 5000.00, NOW(), NOW()),
('Aditya Kumar', 'aditya.k@example.com', 'aditya123', '9100000027', 'Suresh Kumar', 'suresh.kumar@gmail.com', 'Class 8', 'KN-8-007', 'aditya.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-027', 1, 1, 5000.00, NOW(), NOW()),
('Meghna Pillai', 'meghna@example.com', 'meghna123', '9100000028', 'Rajan Pillai', 'rajan.pillai@gmail.com', 'Class 8', 'KN-8-008', 'meghna.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-028', 1, 1, 5000.00, NOW(), NOW()),
('Yash Trivedi', 'yash@example.com', 'yash123', '9100000029', 'Dinesh Trivedi', 'dinesh.trivedi@gmail.com', 'Class 8', 'KN-8-009', 'yash.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-029', 1, 1, 5000.00, NOW(), NOW()),
('Prachi Desai', 'prachi@example.com', 'prachi123', '9100000030', 'Hemant Desai', 'hemant.desai@gmail.com', 'Class 8', 'KN-8-010', 'prachi.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-030', 1, 1, 5000.00, NOW(), NOW()),

-- Class 9 (10 students)
('Aravind Kurra', 'aravind@example.com', 'aravind123', '9100000031', 'Srinivas Kurra', 'srinivas.kurra@gmail.com', 'Class 9', 'KN-9-001', 'aravind.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-031', 1, 1, 5000.00, NOW(), NOW()),
('Sneha Nair', 'sneha@example.com', 'sneha123', '9100000032', 'Pradeep Nair', 'pradeep.nair@gmail.com', 'Class 9', 'KN-9-002', 'sneha.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-032', 1, 1, 5000.00, NOW(), NOW()),
('Deepika P', 'deepika@example.com', 'deepika123', '9100000033', 'Prakash Padukone', 'prakash.padukone@gmail.com', 'Class 9', 'KN-9-003', 'deepika.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-033', 1, 1, 5000.00, NOW(), NOW()),
('Harsh Pandey', 'harsh@example.com', 'harsh123', '9100000034', 'Rajesh Pandey', 'rajesh.pandey@gmail.com', 'Class 9', 'KN-9-004', 'harsh.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-034', 1, 1, 5000.00, NOW(), NOW()),
('Simran Kaur', 'simran@example.com', 'simran123', '9100000035', 'Gurpreet Kaur', 'gurpreet.kaur@gmail.com', 'Class 9', 'KN-9-005', 'simran.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-035', 1, 1, 5000.00, NOW(), NOW()),
('Akash Dubey', 'akash@example.com', 'akash123', '9100000036', 'Manoj Dubey', 'manoz.dubey@gmail.com', 'Class 9', 'KN-9-006', 'akash.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-036', 1, 1, 5000.00, NOW(), NOW()),
('Pallavi Jain', 'pallavi@example.com', 'pallavi123', '9100000037', 'Suresh Jain', 'suresh.jain@gmail.com', 'Class 9', 'KN-9-007', 'pallavi.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-037', 1, 1, 5000.00, NOW(), NOW()),
('Saurabh Ghosh', 'saurabh@example.com', 'saurabh123', '9100000038', 'Tapan Ghosh', 'tapan.ghosh@gmail.com', 'Class 9', 'KN-9-008', 'saurabh.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-038', 1, 1, 5000.00, NOW(), NOW()),
('Tanvi Kulkarni', 'tanvi@example.com', 'tanvi123', '9100000039', 'Pramod Kulkarni', 'pramod.kulkarni@gmail.com', 'Class 9', 'KN-9-009', 'tanvi.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-039', 1, 1, 5000.00, NOW(), NOW()),
('Mohit Bansal', 'mohit@example.com', 'mohit123', '9100000040', 'Pawan Bansal', 'pawan.bansal@gmail.com', 'Class 9', 'KN-9-010', 'mohit.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-040', 1, 1, 5000.00, NOW(), NOW()),

-- Class 10 (10 students)
('Aditya Jagtap', 'aditya.j@example.com', 'aditya123', '9100000041', 'Bibhishan Jagtap', 'bibhishan.jagtap@gmail.com', 'Class 10', 'KN-10-001', 'aditya.j.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-041', 1, 1, 5000.00, NOW(), NOW()),
('Abhinay Goud', 'abhinay@example.com', 'abhinay123', '9100000042', 'Billola Goud', 'billola.goud@gmail.com', 'Class 10', 'KN-10-002', 'abhinay.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-042', 1, 1, 5000.00, NOW(), NOW()),
('Vikram Singh', 'vikram@example.com', 'vikram123', '9100000043', 'Manjit Singh', 'manjit.singh@gmail.com', 'Class 10', 'KN-10-003', 'vikram.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-043', 1, 1, 5000.00, NOW(), NOW()),
('Ranveer Singh', 'ranveer@example.com', 'ranveer123', '9100000044', 'Jagjit Singh', 'jagjit.singh@gmail.com', 'Class 10', 'KN-10-004', 'ranveer.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-044', 1, 1, 5000.00, NOW(), NOW()),
('Neha Sharma', 'neha.s@example.com', 'neha123', '9100000045', 'Vijay Sharma', 'vijay.sharma@gmail.com', 'Class 10', 'KN-10-005', 'neha.s.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-045', 1, 1, 5000.00, NOW(), NOW()),
('Kunal Bajaj', 'kunal@example.com', 'kunal123', '9100000046', 'Rakesh Bajaj', 'rakesh.bajaj@gmail.com', 'Class 10', 'KN-10-006', 'kunal.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-046', 1, 1, 5000.00, NOW(), NOW()),
('Divya Menon', 'divya@example.com', 'divya123', '9100000047', 'Suresh Menon', 'suresh.menon@gmail.com', 'Class 10', 'KN-10-007', 'divya.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-047', 1, 1, 5000.00, NOW(), NOW()),
('Siddharth Roy', 'sid.r@example.com', 'siddharth123', '9100000048', 'Biplab Roy', 'biplab.roy@gmail.com', 'Class 10', 'KN-10-008', 'siddharth.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-048', 1, 1, 5000.00, NOW(), NOW()),
('Ankita Yadav', 'ankita@example.com', 'ankita123', '9100000049', 'Ramesh Yadav', 'ramesh.yadav@gmail.com', 'Class 10', 'KN-10-009', 'ankita.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-049', 1, 1, 5000.00, NOW(), NOW()),
('Farhan Qureshi', 'farhan.q@example.com', 'farhan123', '9100000050', 'Salim Qureshi', 'salim.qureshi@gmail.com', 'Class 10', 'KN-10-010', 'farhan.q.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-050', 1, 1, 5000.00, NOW(), NOW()),

-- Class 11 (10 students)
('Ram Prasad', 'ram@example.com', 'ram123', '9100000051', 'Gharke Rao', 'gharke.rao@gmail.com', 'Class 11', 'KN-11-001', 'ram.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-051', 1, 1, 5000.00, NOW(), NOW()),
('Kavita Das', 'kavita@example.com', 'kavita123', '9100000052', 'Arjun Das', 'arjun.das2@gmail.com', 'Class 11', 'KN-11-002', 'kavita.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-052', 1, 1, 5000.00, NOW(), NOW()),
('Alia Bhatt', 'alia@example.com', 'alia123', '9100000053', 'Mahesh Bhatt', 'mahesh.bhatt@gmail.com', 'Class 11', 'KN-11-003', 'alia.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-053', 1, 1, 5000.00, NOW(), NOW()),
('Gaurav Tiwari', 'gaurav@example.com', 'gaurav123', '9100000054', 'Suresh Tiwari', 'suresh.tiwari@gmail.com', 'Class 11', 'KN-11-004', 'gaurav.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-054', 1, 1, 5000.00, NOW(), NOW()),
('Swati Agarwal', 'swati@example.com', 'swati123', '9100000055', 'Pankaj Agarwal', 'pankaj.agarwal@gmail.com', 'Class 11', 'KN-11-005', 'swati.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-055', 1, 1, 5000.00, NOW(), NOW()),
('Rohit Shetty', 'rohit.s@example.com', 'rohit123', '9100000056', 'Sunil Shetty', 'sunil.shetty@gmail.com', 'Class 11', 'KN-11-006', 'rohit.s.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-056', 1, 1, 5000.00, NOW(), NOW()),
('Preeti Kumari', 'preeti@example.com', 'preeti123', '9100000057', 'Ramesh Kumar', 'ramesh.kumar2@gmail.com', 'Class 11', 'KN-11-007', 'preeti.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-057', 1, 1, 5000.00, NOW(), NOW()),
('Manish Chauhan', 'manish@example.com', 'manish123', '9100000058', 'Dinesh Chauhan', 'dinesh.chauhan@gmail.com', 'Class 11', 'KN-11-008', 'manish.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-058', 1, 1, 5000.00, NOW(), NOW()),
('Ritu Verma', 'ritu@example.com', 'ritu123', '9100000059', 'Anil Verma', 'anil.verma@gmail.com', 'Class 11', 'KN-11-009', 'ritu.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-059', 1, 1, 5000.00, NOW(), NOW()),
('Sumit Bhatia', 'sumit@example.com', 'sumit123', '9100000060', 'Rajiv Bhatia', 'rajiv.bhatia@gmail.com', 'Class 11', 'KN-11-010', 'sumit.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-060', 1, 1, 5000.00, NOW(), NOW()),

-- Class 12 (10 students)
('Madhan Mohan', 'madhan@example.com', 'madhan123', '9100000061', 'Venkata Rao', 'venkata.rao@gmail.com', 'Class 12', 'KN-12-001', 'madhan.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-061', 1, 1, 5000.00, NOW(), NOW()),
('Siddharth M', 'sid.m@example.com', 'siddharth123', '9100000062', 'Karan Malhotra', 'karan.malhotra@gmail.com', 'Class 12', 'KN-12-002', 'siddharth.m.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-062', 1, 1, 5000.00, NOW(), NOW()),
('Varun Dhawan', 'varun@example.com', 'varun123', '9100000063', 'David Dhawan', 'david.dhawan@gmail.com', 'Class 12', 'KN-12-003', 'varun.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-063', 1, 1, 5000.00, NOW(), NOW()),
('Priyanka C', 'priyanka@example.com', 'priyanka123', '9100000064', 'Ashok Chopra', 'ashok.chopra@gmail.com', 'Class 12', 'KN-12-004', 'priyanka.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-064', 1, 1, 5000.00, NOW(), NOW()),
('Shahid Kapoor', 'shahid@example.com', 'shahid123', '9100000065', 'Pankaj Kapoor', 'pankaj.kapoor@gmail.com', 'Class 12', 'KN-12-005', 'shahid.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-065', 1, 1, 5000.00, NOW(), NOW()),
('Katrina Kaif', 'katrina@example.com', 'katrina123', '9100000066', 'Mohammed Kaif', 'mohammed.kaif@gmail.com', 'Class 12', 'KN-12-006', 'katrina.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-066', 1, 1, 5000.00, NOW(), NOW()),
('Ranbir Kapoor', 'ranbir@example.com', 'ranbir123', '9100000067', 'Rishi Kapoor', 'rishi.kapoor@gmail.com', 'Class 12', 'KN-12-007', 'ranbir.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-067', 1, 1, 5000.00, NOW(), NOW()),
('Anushka Sharma', 'anushka@example.com', 'anushka123', '9100000068', 'Ajay Sharma', 'ajay.sharma@gmail.com', 'Class 12', 'KN-12-008', 'anushka.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-068', 1, 1, 5000.00, NOW(), NOW()),
('Tiger Shroff', 'tiger@example.com', 'tiger123', '9100000069', 'Jackie Shroff', 'jackie.shroff@gmail.com', 'Class 12', 'KN-12-009', 'tiger.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-069', 1, 1, 5000.00, NOW(), NOW()),
('Shraddha Kapoor', 'shraddha@example.com', 'shraddha123', '9100000070', 'Shakti Kapoor', 'shakti.kapoor@gmail.com', 'Class 12', 'KN-12-010', 'shraddha.official@kalnet.edu', '2024-06-01', 1, 'STUDENT', 'ENQ-2026-070', 1, 1, 5000.00, NOW(), NOW());

-- ============================================================================
-- INSERT FEES (140 records - 2 per Student dynamically generated)
-- ============================================================================
-- Term 1 2026 - All PAID
INSERT INTO fees (studentId, term, dueDate, amount, paidAmount, paidAt, paymentMethod, type, status)
SELECT id, 'Term 1 2026', '2026-03-31',
  CASE classEnrolled
    WHEN 'Class 6' THEN 15000.00
    WHEN 'Class 7' THEN 20000.00
    WHEN 'Class 8' THEN 22500.00
    WHEN 'Class 9' THEN 25000.00
    WHEN 'Class 10' THEN 30000.00
    WHEN 'Class 11' THEN 35000.00
    WHEN 'Class 12' THEN 45000.00
    ELSE 15000.00
  END,
  CASE classEnrolled
    WHEN 'Class 6' THEN 15000.00
    WHEN 'Class 7' THEN 20000.00
    WHEN 'Class 8' THEN 22500.00
    WHEN 'Class 9' THEN 25000.00
    WHEN 'Class 10' THEN 30000.00
    WHEN 'Class 11' THEN 35000.00
    WHEN 'Class 12' THEN 45000.00
    ELSE 15000.00
  END,
  '2026-03-15', 'ONLINE', 'Tuition', 'PAID' FROM students;

-- Term 2 2026 - All PENDING (No partial payments without corresponding payment records)
INSERT INTO fees (studentId, term, dueDate, amount, paidAmount, paidAt, paymentMethod, type, status)
SELECT id, 'Term 2 2026', '2026-06-30',
  CASE classEnrolled
    WHEN 'Class 6' THEN 15000.00
    WHEN 'Class 7' THEN 20000.00
    WHEN 'Class 8' THEN 22500.00
    WHEN 'Class 9' THEN 25000.00
    WHEN 'Class 10' THEN 30000.00
    WHEN 'Class 11' THEN 35000.00
    WHEN 'Class 12' THEN 45000.00
    ELSE 15000.00
  END,
  0.00, NULL, NULL, 'Tuition', 'PENDING' FROM students;

-- ============================================================================
-- INSERT ANNOUNCEMENTS (5 records)
-- ============================================================================
INSERT INTO announcements (title, category, target, description, author, date, imageUrl, createdAt)
VALUES
('Annual Sports Meet 2026', 'Events', 'BOTH', 'Join us for the Annual Sports Meet with games and prizes for all classes.', 'Sports Department', NOW(), 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1000', NOW()),
('Mid-Term Examination Schedule', 'Exams', 'BOTH', 'The mid-term examinations for classes 6 through 12 will commence on June 15th, 2026. Please prepare accordingly.', 'Academic Coordinator', NOW(), 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000', NOW()),
('Summer Vacation Announcement', 'Holidays', 'BOTH', 'Please be informed that KALNET will observe summer vacation starting from July 1st, 2026 to August 31st, 2026.', 'Principal Office', NOW(), 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000', NOW()),
('Science Fair 2026 Registrations', 'Events', 'STUDENT', 'The Annual Science Fair is scheduled for August 20th, 2026. Students can register their projects from June 1st.', 'Science Club', NOW(), 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=1000', NOW()),
('New Bus Routes Added', 'General', 'BOTH', 'To accommodate the growing number of students from suburban areas, we have introduced three new bus routes starting next month.', 'Transport Admin', NOW(), 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1000', NOW());

-- ============================================================================
-- INSERT NOTIFICATIONS (70 records - 1 per Student dynamically generated)
-- ============================================================================
INSERT INTO notifications (studentId, type, title, message, isRead, readAt, createdAt)
SELECT id, 'GENERAL', 'Welcome to KALNET', 'Welcome to KALNET Student Portal. Please complete your profile.', 1, NOW(), NOW() FROM students;

-- ============================================================================
-- INSERT LEAVE REQUESTS (15 records)
-- ============================================================================
-- Student leave requests (studentId set, staffId NULL)
INSERT INTO leave_requests (studentId, leaveType, fromDate, toDate, reason, status, submittedAt)
VALUES
(1, 'Medical', '2026-04-01', '2026-04-03', 'Medical checkup', 'APPROVED', NOW()),
(2, 'Casual', '2026-05-15', '2026-05-17', 'Family event', 'PENDING', NOW()),
(3, 'Medical', '2026-06-01', '2026-06-05', 'Hospitalization', 'REJECTED', NOW()),
(4, 'Casual', '2026-07-10', '2026-07-12', 'Vacation', 'APPROVED', NOW()),
(5, 'Medical', '2026-08-01', '2026-08-02', 'Doctor appointment', 'PENDING', NOW()),
(6, 'Casual', '2026-04-20', '2026-04-22', 'Family function', 'APPROVED', NOW()),
(7, 'Medical', '2026-05-05', '2026-05-07', 'Dental treatment', 'PENDING', NOW()),
(8, 'Casual', '2026-06-15', '2026-06-17', 'Wedding', 'APPROVED', NOW()),
(9, 'Medical', '2026-07-01', '2026-07-03', 'Surgery recovery', 'REJECTED', NOW()),
(10, 'Casual', '2026-08-10', '2026-08-12', 'Relative visit', 'PENDING', NOW()),
(11, 'Medical', '2026-04-10', '2026-04-12', 'Fever', 'APPROVED', NOW()),
(12, 'Casual', '2026-05-25', '2026-05-27', 'Festival', 'APPROVED', NOW()),
(13, 'Medical', '2026-06-20', '2026-06-22', 'Eye checkup', 'PENDING', NOW()),
(14, 'Casual', '2026-07-20', '2026-07-22', 'Coaching', 'APPROVED', NOW()),
(15, 'Medical', '2026-08-05', '2026-08-07', 'Vaccination', 'APPROVED', NOW());

-- ============================================================================
-- Staff leave requests (staffId set, studentId NULL)
-- Class Teachers (staffId 1-7) and Non-Teaching Staff (staffId 9-13)
-- ============================================================================
INSERT INTO leave_requests (staffId, leaveType, fromDate, toDate, reason, status, submittedAt)
VALUES
-- Class Teacher leaves
(1, 'Medical / Health',  '2026-05-01', '2026-05-02', 'Fever and rest',           'APPROVED', NOW()),
(2, 'Family Function',   '2026-05-10', '2026-05-11', 'Sister wedding',            'PENDING',  NOW()),
(3, 'Personal Work',     '2026-05-15', '2026-05-15', 'Bank work',                 'APPROVED', NOW()),
(4, 'Medical / Health',  '2026-05-20', '2026-05-21', 'Dental appointment',        'REJECTED', NOW()),
(5, 'Bereavement',       '2026-05-22', '2026-05-24', 'Family bereavement',        'APPROVED', NOW()),
(6, 'Academic Event',    '2026-05-28', '2026-05-29', 'Training workshop',         'PENDING',  NOW()),
(7, 'Personal Work',     '2026-06-02', '2026-06-02', 'Personal errand',           'PENDING',  NOW()),
-- Non-Teaching Staff leaves (staffId 9-13)
(9,  'Medical / Health', '2026-05-05', '2026-05-06', 'Doctor visit',              'PENDING',  NOW()),
(9,  'Family Function',  '2026-05-18', '2026-05-19', 'Family function',           'PENDING',  NOW()),
(10, 'Medical / Health', '2026-05-08', '2026-05-09', 'Health checkup',            'PENDING',  NOW()),
(10, 'Personal Work',    '2026-05-25', '2026-05-25', 'Personal work',             'APPROVED', NOW()),
(11, 'Bereavement',      '2026-05-12', '2026-05-14', 'Relative passed away',      'APPROVED', NOW()),
(12, 'Medical / Health', '2026-05-16', '2026-05-17', 'Eye treatment',             'PENDING',  NOW()),
(13, 'Family Function',  '2026-05-21', '2026-05-22', 'Engagement ceremony',       'PENDING',  NOW());

-- ============================================================================
-- INSERT OTP RECORDS (5 records)
-- ============================================================================
INSERT INTO otps (email, code, status, expiresAt, createdAt)
VALUES
('priya@example.com', '123456', 'VERIFIED', DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW()),
('ishaan@example.com', '234567', 'VERIFIED', DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW()),
('riya@example.com', '345678', 'PENDING', DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW()),
('aarav@example.com', '456789', 'VERIFIED', DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW()),
('diya@example.com', '567890', 'EXPIRED', DATE_SUB(NOW(), INTERVAL 15 MINUTE), NOW());

-- ============================================================================
-- INSERT EMAIL VERIFICATIONS (5 records)
-- ============================================================================
INSERT INTO email_verifications (email, token, expiresAt, createdAt)
VALUES
('priya@example.com', 'token_priya_001', DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW()),
('ishaan@example.com', 'token_ishaan_001', DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW()),
('riya@example.com', 'token_riya_001', DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW()),
('aarav@example.com', 'token_aarav_001', DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW()),
('diya@example.com', 'token_diya_001', DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW());

-- ============================================================================
-- INSERT STUDENT DOCUMENTS (20 records)
-- ============================================================================
INSERT INTO student_documents (studentId, documentType, fileName, fileUrl, fileSize, uploadedAt, status, verifiedBy, verifiedAt)
VALUES
(1, 'Aadhar', 'priya_aadhar.pdf', 'https://storage.example.com/docs/priya_aadhar.pdf', 2048000, NOW(), 'VERIFIED', 1, NOW()),
(1, 'Birth Certificate', 'priya_birth.pdf', 'https://storage.example.com/docs/priya_birth.pdf', 1024000, NOW(), 'VERIFIED', 1, NOW()),
(2, 'Aadhar', 'ishaan_aadhar.pdf', 'https://storage.example.com/docs/ishaan_aadhar.pdf', 2048000, NOW(), 'PENDING', NULL, NULL),
(2, 'Passport', 'ishaan_passport.pdf', 'https://storage.example.com/docs/ishaan_passport.pdf', 3072000, NOW(), 'VERIFIED', 1, NOW()),
(3, 'Aadhar', 'riya_aadhar.pdf', 'https://storage.example.com/docs/riya_aadhar.pdf', 2048000, NOW(), 'REJECTED', 1, NOW()),
(3, 'Birth Certificate', 'riya_birth.pdf', 'https://storage.example.com/docs/riya_birth.pdf', 1024000, NOW(), 'PENDING', NULL, NULL),
(4, 'Aadhar', 'aarav_aadhar.pdf', 'https://storage.example.com/docs/aarav_aadhar.pdf', 2048000, NOW(), 'VERIFIED', 1, NOW()),
(4, 'School Transfer Certificate', 'aarav_tc.pdf', 'https://storage.example.com/docs/aarav_tc.pdf', 512000, NOW(), 'VERIFIED', 1, NOW()),
(5, 'Aadhar', 'diya_aadhar.pdf', 'https://storage.example.com/docs/diya_aadhar.pdf', 2048000, NOW(), 'PENDING', NULL, NULL),
(5, 'Birth Certificate', 'diya_birth.pdf', 'https://storage.example.com/docs/diya_birth.pdf', 1024000, NOW(), 'VERIFIED', 1, NOW()),
(6, 'Aadhar', 'kabir_aadhar.pdf', 'https://storage.example.com/docs/kabir_aadhar.pdf', 2048000, NOW(), 'VERIFIED', 1, NOW()),
(6, 'Passport', 'kabir_passport.pdf', 'https://storage.example.com/docs/kabir_passport.pdf', 3072000, NOW(), 'VERIFIED', 1, NOW()),
(7, 'Aadhar', 'anvi_aadhar.pdf', 'https://storage.example.com/docs/anvi_aadhar.pdf', 2048000, NOW(), 'PENDING', NULL, NULL),
(7, 'Birth Certificate', 'anvi_birth.pdf', 'https://storage.example.com/docs/anvi_birth.pdf', 1024000, NOW(), 'PENDING', NULL, NULL),
(8, 'Aadhar', 'vivaan_aadhar.pdf', 'https://storage.example.com/docs/vivaan_aadhar.pdf', 2048000, NOW(), 'VERIFIED', 1, NOW()),
(8, 'School Transfer Certificate', 'vivaan_tc.pdf', 'https://storage.example.com/docs/vivaan_tc.pdf', 512000, NOW(), 'VERIFIED', 1, NOW()),
(9, 'Aadhar', 'myra_aadhar.pdf', 'https://storage.example.com/docs/myra_aadhar.pdf', 2048000, NOW(), 'REJECTED', 1, NOW()),
(9, 'Birth Certificate', 'myra_birth.pdf', 'https://storage.example.com/docs/myra_birth.pdf', 1024000, NOW(), 'VERIFIED', 1, NOW()),
(10, 'Aadhar', 'rehan_aadhar.pdf', 'https://storage.example.com/docs/rehan_aadhar.pdf', 2048000, NOW(), 'VERIFIED', 1, NOW()),
(10, 'Passport', 'rehan_passport.pdf', 'https://storage.example.com/docs/rehan_passport.pdf', 3072000, NOW(), 'PENDING', NULL, NULL);

-- ============================================================================
-- INSERT STAFF LEAVE BALANCE (13 records - all staff including non-teaching)
-- ============================================================================
INSERT INTO staff_leave_balance (staffId, year, totalYearlyLeave, usedLeave, remainingLeave, monthlyUsed)
VALUES
(1,  2026, 20, 3, 17, 1),
(2,  2026, 20, 0, 20, 0),
(3,  2026, 20, 5, 15, 2),
(4,  2026, 20, 2, 18, 1),
(5,  2026, 20, 4, 16, 1),
(6,  2026, 20, 1, 19, 0),
(7,  2026, 20, 6, 14, 2),
(8,  2026, 20, 8, 12, 3),
(9,  2026, 20, 0, 20, 0),
(10, 2026, 20, 0, 20, 0),
(11, 2026, 20, 0, 20, 0),
(12, 2026, 20, 0, 20, 0),
(13, 2026, 20, 0, 20, 0);

-- ============================================================================
-- INSERT CLASS ASSIGNMENTS (7 records)
-- ============================================================================
INSERT INTO class_assignments (staffId, classEnrolled, assignedAt)
VALUES
(1, 'Class 6', NOW()),
(2, 'Class 7', NOW()),
(3, 'Class 8', NOW()),
(4, 'Class 9', NOW()),
(5, 'Class 10', NOW()),
(6, 'Class 11', NOW()),
(7, 'Class 12', NOW());

-- ============================================================================
-- INSERT PAYMENT ORDERS (35 records - for paid fees)
-- ============================================================================
INSERT INTO payment_orders (fee_id, student_id, amount_paise, currency, razorpay_order_id, status, receipt, created_at, updated_at)
SELECT f.id, f.studentId, 1500000, 'INR', CONCAT('order_', f.id, '_', f.studentId), 'PAID', CONCAT('fee_', f.id, '_', UNIX_TIMESTAMP()), NOW(), NOW()
FROM fees f
WHERE f.status = 'PAID'
LIMIT 35;

-- ============================================================================
-- INSERT PAYMENT TRANSACTIONS (35 records)
-- ============================================================================
INSERT INTO payment_transactions (razorpay_order_id, razorpay_payment_id, razorpay_signature, raw_response, created_at)
SELECT CONCAT('order_', f.id, '_', f.studentId), CONCAT('pay_', f.id, '_', f.studentId), CONCAT('sig_', f.id, '_', f.studentId), '{"status":"captured"}', NOW()
FROM fees f
WHERE f.status = 'PAID'
LIMIT 35;

-- ============================================================================
-- INSERT FEE RECEIPTS (35 records)
-- ============================================================================
INSERT INTO fee_receipts (razorpay_order_id, receipt_number, issued_at, created_at)
SELECT CONCAT('order_', f.id, '_', f.studentId), CONCAT('RCPT-2026-', f.id), NOW(), NOW()
FROM fees f
WHERE f.status = 'PAID'
LIMIT 35;

-- ============================================================================
-- INSERT FEE PAYMENT TRANSACTIONS (35 records)
-- ============================================================================
INSERT INTO fee_payment_transactions (feeId, studentId, amount, paymentMethod, transactionId, paymentDate, razorpayOrderId, razorpayPaymentId, status, notes)
SELECT f.id, f.studentId, f.paidAmount, 'ONLINE', CONCAT('txn_', f.id), NOW(), CONCAT('order_', f.id, '_', f.studentId), CONCAT('pay_', f.id, '_', f.studentId), 'SUCCESS', 'Fee payment successful'
FROM fees f
WHERE f.status = 'PAID'
LIMIT 35;

-- ============================================================================
-- INSERT INSTALLMENT REQUESTS (sample data - 3 requests)
-- Flow: Student submits → Non-Teaching Staff reviews → Approve/Reject
-- Approved requests also have installment records created
-- ============================================================================
-- 3 sample requests: 1 PENDING, 1 APPROVED (with installments), 1 REJECTED
INSERT INTO installment_requests (feeId, studentId, numberOfInstallments, reason, status, approvedBy, approvedAt, rejectionReason, requestedAt, updatedAt)
VALUES
-- PENDING: Student 1 (Priya Sharma) requesting installment for fee id 2
(2,  1, 1, 'Financial hardship due to medical expenses in the family. Requesting to split the fee into two installments.', 'PENDING',  NULL,                          NULL,    NULL,                                    NOW(), NOW()),
-- APPROVED: Student 2 (Ishaan Kapur) - approved by non-teaching staff
(12, 2, 1, 'Job loss in family. Unable to pay full amount at once.',                                                       'APPROVED', 'priya.fees@kalnet.edu',       NOW(),   NULL,                                    NOW(), NOW()),
-- REJECTED: Student 3 (Riya Gupta) - rejected with reason
(22, 3, 1, 'Requesting installment for convenience.',                                                                      'REJECTED', 'rajesh.admissions@kalnet.edu', NOW(),  'Installment plans are only for genuine financial hardship cases.', NOW(), NOW());

-- Installments for the APPROVED request (feeId=12, studentId=2)
INSERT INTO installments (feeId, studentId, installmentNumber, amount, dueDate, paidAmount, status, createdAt, updatedAt)
VALUES
(12, 2, 1, 7500.00, NOW(),                                    0.00, 'PENDING', NOW(), NOW()),
(12, 2, 2, 7500.00, DATE_ADD(NOW(), INTERVAL 30 DAY),         0.00, 'PENDING', NOW(), NOW());

-- ============================================================================
-- INSERT TIMETABLE SLOTS (Time Periods)
-- ============================================================================
INSERT INTO timetable_slots (slotNumber, startTime, endTime, isBreak, breakLabel) VALUES
(1, '09:00', '09:45', 0, NULL),
(2, '09:45', '10:30', 0, NULL),
(3, '10:30', '11:15', 1, 'Short Break'),
(4, '11:15', '12:00', 0, NULL),
(5, '12:00', '12:45', 0, NULL),
(6, '12:45', '13:30', 1, 'Lunch Break'),
(7, '13:30', '14:15', 0, NULL),
(8, '14:15', '15:00', 0, NULL);

-- ============================================================================
-- INSERT CLASSROOMS
-- ============================================================================
INSERT INTO classrooms (name, capacity, building, floor, isActive) VALUES
('Room 101', 40, 'Main Block', '1st Floor', 1),
('Room 102', 40, 'Main Block', '1st Floor', 1),
('Room 103', 40, 'Main Block', '1st Floor', 1),
('Room 201', 40, 'Main Block', '2nd Floor', 1),
('Room 202', 40, 'Main Block', '2nd Floor', 1),
('Room 203', 40, 'Main Block', '2nd Floor', 1),
('Lab 1', 30, 'Science Block', '1st Floor', 1),
('Lab 2', 30, 'Science Block', '1st Floor', 1),
('Computer Lab', 35, 'Tech Block', '1st Floor', 1),
('Art Room', 25, 'Main Block', '2nd Floor', 1);

-- ============================================================================
-- INSERT SUBJECTS (Both format sets to support all potential frontend codes)
-- ============================================================================
-- Set A: Format (ENG-6, MATH-6, etc.)
INSERT INTO subjects (name, code, color, classLevel) VALUES
-- Class 6 Subjects
('English', 'ENG-6', '#3b82f6', 'Class 6'),
('Hindi', 'HIN-6', '#ef4444', 'Class 6'),
('Mathematics', 'MATH-6', '#10b981', 'Class 6'),
('Science', 'SCI-6', '#f59e0b', 'Class 6'),
('Social Studies', 'SS-6', '#8b5cf6', 'Class 6'),
('Physical Education', 'PE-6', '#ec4899', 'Class 6'),
('Art', 'ART-6', '#06b6d4', 'Class 6'),
-- Class 7 Subjects
('English', 'ENG-7', '#3b82f6', 'Class 7'),
('Hindi', 'HIN-7', '#ef4444', 'Class 7'),
('Mathematics', 'MATH-7', '#10b981', 'Class 7'),
('Science', 'SCI-7', '#f59e0b', 'Class 7'),
('Social Studies', 'SS-7', '#8b5cf6', 'Class 7'),
('Physical Education', 'PE-7', '#ec4899', 'Class 7'),
('Art', 'ART-7', '#06b6d4', 'Class 7'),
-- Class 8 Subjects
('English', 'ENG-8', '#3b82f6', 'Class 8'),
('Hindi', 'HIN-8', '#ef4444', 'Class 8'),
('Mathematics', 'MATH-8', '#10b981', 'Class 8'),
('Science', 'SCI-8', '#f59e0b', 'Class 8'),
('Social Studies', 'SS-8', '#8b5cf6', 'Class 8'),
('Physical Education', 'PE-8', '#ec4899', 'Class 8'),
('Art', 'ART-8', '#06b6d4', 'Class 8');

-- Set B: Format (C6-MATH, C7-ENG, etc.)
INSERT INTO subjects (name, code, color, classLevel) VALUES
('Mathematics',      'C6-MATH',  '#6366f1', 'Class 6'),
('English',          'C6-ENG',   '#0ea5e9', 'Class 6'),
('Science',          'C6-SCI',   '#10b981', 'Class 6'),
('Social Studies',   'C6-SST',   '#f59e0b', 'Class 6'),
('Hindi',            'C6-HIN',   '#ef4444', 'Class 6'),
('Mathematics',      'C7-MATH',  '#6366f1', 'Class 7'),
('English',          'C7-ENG',   '#0ea5e9', 'Class 7'),
('Science',          'C7-SCI',   '#10b981', 'Class 7'),
('Social Studies',   'C7-SST',   '#f59e0b', 'Class 7'),
('Hindi',            'C7-HIN',   '#ef4444', 'Class 7'),
('Mathematics',      'C8-MATH',  '#6366f1', 'Class 8'),
('English',          'C8-ENG',   '#0ea5e9', 'Class 8'),
('Science',          'C8-SCI',   '#10b981', 'Class 8'),
('Social Studies',   'C8-SST',   '#f59e0b', 'Class 8'),
('Hindi',            'C8-HIN',   '#ef4444', 'Class 8'),
('Mathematics',      'C9-MATH',  '#6366f1', 'Class 9'),
('English',          'C9-ENG',   '#0ea5e9', 'Class 9'),
('Physics',          'C9-PHY',   '#10b981', 'Class 9'),
('Chemistry',        'C9-CHEM',  '#8b5cf6', 'Class 9'),
('Biology',          'C9-BIO',   '#22c55e', 'Class 9'),
('Social Studies',   'C9-SST',   '#f59e0b', 'Class 9'),
('Hindi',            'C9-HIN',   '#ef4444', 'Class 9'),
('Mathematics',      'C10-MATH', '#6366f1', 'Class 10'),
('English',          'C10-ENG',  '#0ea5e9', 'Class 10'),
('Physics',          'C10-PHY',  '#10b981', 'Class 10'),
('Chemistry',        'C10-CHEM', '#8b5cf6', 'Class 10'),
('Biology',          'C10-BIO',  '#22c55e', 'Class 10'),
('Social Studies',   'C10-SST',  '#f59e0b', 'Class 10'),
('Hindi',            'C10-HIN',  '#ef4444', 'Class 10'),
('Mathematics',      'C11-MATH', '#6366f1', 'Class 11'),
('English',          'C11-ENG',  '#0ea5e9', 'Class 11'),
('Physics',          'C11-PHY',  '#10b981', 'Class 11'),
('Chemistry',        'C11-CHEM', '#8b5cf6', 'Class 11'),
('Biology',          'C11-BIO',  '#22c55e', 'Class 11'),
('Computer Science', 'C11-CS',   '#f97316', 'Class 11'),
('Mathematics',      'C12-MATH', '#6366f1', 'Class 12'),
('English',          'C12-ENG',  '#0ea5e9', 'Class 12'),
('Physics',          'C12-PHY',  '#10b981', 'Class 12'),
('Chemistry',        'C12-CHEM', '#8b5cf6', 'Class 12'),
('Biology',          'C12-BIO',  '#22c55e', 'Class 12'),
('Computer Science', 'C12-CS',   '#f97316', 'Class 12');

-- ============================================================================
-- INSERT TIMETABLE ENTRIES FOR CLASS 6 SECTION A (Weekly Schedule)
-- ============================================================================

-- Monday (dayOfWeek = 1)
INSERT INTO timetable_entries (classEnrolled, section, dayOfWeek, slotId, subjectId, staffId, classroomId, isPublished, academicYear) VALUES
('Class 6', 'A', 1, 1, (SELECT id FROM subjects WHERE code='ENG-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 1, 2, (SELECT id FROM subjects WHERE code='MATH-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 1, 3, NULL, NULL, 1, 1, '2025-26'), -- Break
('Class 6', 'A', 1, 4, (SELECT id FROM subjects WHERE code='SCI-6' LIMIT 1), NULL, 7, 1, '2025-26'),
('Class 6', 'A', 1, 5, (SELECT id FROM subjects WHERE code='HIN-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 1, 6, NULL, NULL, 1, 1, '2025-26'), -- Lunch Break
('Class 6', 'A', 1, 7, (SELECT id FROM subjects WHERE code='SS-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 1, 8, (SELECT id FROM subjects WHERE code='PE-6' LIMIT 1), NULL, 1, 1, '2025-26');

-- Tuesday (dayOfWeek = 2)
INSERT INTO timetable_entries (classEnrolled, section, dayOfWeek, slotId, subjectId, staffId, classroomId, isPublished, academicYear) VALUES
('Class 6', 'A', 2, 1, (SELECT id FROM subjects WHERE code='MATH-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 2, 2, (SELECT id FROM subjects WHERE code='ENG-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 2, 3, NULL, NULL, 1, 1, '2025-26'), -- Break
('Class 6', 'A', 2, 4, (SELECT id FROM subjects WHERE code='HIN-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 2, 5, (SELECT id FROM subjects WHERE code='SCI-6' LIMIT 1), NULL, 7, 1, '2025-26'),
('Class 6', 'A', 2, 6, NULL, NULL, 1, 1, '2025-26'), -- Lunch Break
('Class 6', 'A', 2, 7, (SELECT id FROM subjects WHERE code='ART-6' LIMIT 1), NULL, 10, 1, '2025-26'),
('Class 6', 'A', 2, 8, (SELECT id FROM subjects WHERE code='SS-6' LIMIT 1), NULL, 1, 1, '2025-26');

-- Wednesday (dayOfWeek = 3)
INSERT INTO timetable_entries (classEnrolled, section, dayOfWeek, slotId, subjectId, staffId, classroomId, isPublished, academicYear) VALUES
('Class 6', 'A', 3, 1, (SELECT id FROM subjects WHERE code='SCI-6' LIMIT 1), NULL, 7, 1, '2025-26'),
('Class 6', 'A', 3, 2, (SELECT id FROM subjects WHERE code='MATH-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 3, 3, NULL, NULL, 1, 1, '2025-26'), -- Break
('Class 6', 'A', 3, 4, (SELECT id FROM subjects WHERE code='ENG-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 3, 5, (SELECT id FROM subjects WHERE code='SS-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 3, 6, NULL, NULL, 1, 1, '2025-26'), -- Lunch Break
('Class 6', 'A', 3, 7, (SELECT id FROM subjects WHERE code='HIN-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 3, 8, (SELECT id FROM subjects WHERE code='PE-6' LIMIT 1), NULL, 1, 1, '2025-26');

-- Thursday (dayOfWeek = 4)
INSERT INTO timetable_entries (classEnrolled, section, dayOfWeek, slotId, subjectId, staffId, classroomId, isPublished, academicYear) VALUES
('Class 6', 'A', 4, 1, (SELECT id FROM subjects WHERE code='ENG-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 4, 2, (SELECT id FROM subjects WHERE code='SCI-6' LIMIT 1), NULL, 7, 1, '2025-26'),
('Class 6', 'A', 4, 3, NULL, NULL, 1, 1, '2025-26'), -- Break
('Class 6', 'A', 4, 4, (SELECT id FROM subjects WHERE code='MATH-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 4, 5, (SELECT id FROM subjects WHERE code='HIN-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 4, 6, NULL, NULL, 1, 1, '2025-26'), -- Lunch Break
('Class 6', 'A', 4, 7, (SELECT id FROM subjects WHERE code='ART-6' LIMIT 1), NULL, 10, 1, '2025-26'),
('Class 6', 'A', 4, 8, (SELECT id FROM subjects WHERE code='SS-6' LIMIT 1), NULL, 1, 1, '2025-26');

-- Friday (dayOfWeek = 5)
INSERT INTO timetable_entries (classEnrolled, section, dayOfWeek, slotId, subjectId, staffId, classroomId, isPublished, academicYear) VALUES
('Class 6', 'A', 5, 1, (SELECT id FROM subjects WHERE code='MATH-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 5, 2, (SELECT id FROM subjects WHERE code='HIN-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 5, 3, NULL, NULL, 1, 1, '2025-26'), -- Break
('Class 6', 'A', 5, 4, (SELECT id FROM subjects WHERE code='ENG-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 5, 5, (SELECT id FROM subjects WHERE code='SS-6' LIMIT 1), NULL, 1, 1, '2025-26'),
('Class 6', 'A', 5, 6, NULL, NULL, 1, 1, '2025-26'), -- Lunch Break
('Class 6', 'A', 5, 7, (SELECT id FROM subjects WHERE code='SCI-6' LIMIT 1), NULL, 7, 1, '2025-26'),
('Class 6', 'A', 5, 8, (SELECT id FROM subjects WHERE code='PE-6' LIMIT 1), NULL, 1, 1, '2025-26');


-- ============================================================================
-- TIMETABLE ENTRIES FOR CLASS 7 (staffId=2 = Mr. Suresh Babu, Room 102)
-- ============================================================================
INSERT INTO timetable_entries (classEnrolled,section,dayOfWeek,slotId,subjectId,staffId,classroomId,isPublished,academicYear) VALUES
('Class 7','A',1,1,(SELECT id FROM subjects WHERE code='ENG-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',1,2,(SELECT id FROM subjects WHERE code='MATH-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',1,4,(SELECT id FROM subjects WHERE code='SCI-7' LIMIT 1),2,8,1,'2025-26'),
('Class 7','A',1,5,(SELECT id FROM subjects WHERE code='HIN-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',1,7,(SELECT id FROM subjects WHERE code='SS-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',1,8,(SELECT id FROM subjects WHERE code='PE-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',2,1,(SELECT id FROM subjects WHERE code='MATH-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',2,2,(SELECT id FROM subjects WHERE code='SCI-7' LIMIT 1),2,8,1,'2025-26'),
('Class 7','A',2,4,(SELECT id FROM subjects WHERE code='ENG-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',2,5,(SELECT id FROM subjects WHERE code='SS-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',2,7,(SELECT id FROM subjects WHERE code='HIN-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',2,8,(SELECT id FROM subjects WHERE code='ART-7' LIMIT 1),2,10,1,'2025-26'),
('Class 7','A',3,1,(SELECT id FROM subjects WHERE code='SCI-7' LIMIT 1),2,8,1,'2025-26'),
('Class 7','A',3,2,(SELECT id FROM subjects WHERE code='ENG-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',3,4,(SELECT id FROM subjects WHERE code='MATH-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',3,5,(SELECT id FROM subjects WHERE code='HIN-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',3,7,(SELECT id FROM subjects WHERE code='PE-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',3,8,(SELECT id FROM subjects WHERE code='SS-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',4,1,(SELECT id FROM subjects WHERE code='HIN-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',4,2,(SELECT id FROM subjects WHERE code='MATH-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',4,4,(SELECT id FROM subjects WHERE code='SCI-7' LIMIT 1),2,8,1,'2025-26'),
('Class 7','A',4,5,(SELECT id FROM subjects WHERE code='ENG-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',4,7,(SELECT id FROM subjects WHERE code='ART-7' LIMIT 1),2,10,1,'2025-26'),
('Class 7','A',4,8,(SELECT id FROM subjects WHERE code='SS-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',5,1,(SELECT id FROM subjects WHERE code='SS-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',5,2,(SELECT id FROM subjects WHERE code='HIN-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',5,4,(SELECT id FROM subjects WHERE code='ENG-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',5,5,(SELECT id FROM subjects WHERE code='MATH-7' LIMIT 1),2,2,1,'2025-26'),
('Class 7','A',5,7,(SELECT id FROM subjects WHERE code='SCI-7' LIMIT 1),2,8,1,'2025-26'),
('Class 7','A',5,8,(SELECT id FROM subjects WHERE code='PE-7' LIMIT 1),2,2,1,'2025-26');

-- ============================================================================
-- TIMETABLE ENTRIES FOR CLASS 8 (staffId=3 = Mrs. Anita Sharma, Room 103)
-- ============================================================================
INSERT INTO timetable_entries (classEnrolled,section,dayOfWeek,slotId,subjectId,staffId,classroomId,isPublished,academicYear) VALUES
('Class 8','A',1,1,(SELECT id FROM subjects WHERE code='ENG-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',1,2,(SELECT id FROM subjects WHERE code='MATH-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',1,4,(SELECT id FROM subjects WHERE code='SCI-8' LIMIT 1),3,7,1,'2025-26'),
('Class 8','A',1,5,(SELECT id FROM subjects WHERE code='HIN-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',1,7,(SELECT id FROM subjects WHERE code='SS-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',1,8,(SELECT id FROM subjects WHERE code='PE-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',2,1,(SELECT id FROM subjects WHERE code='MATH-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',2,2,(SELECT id FROM subjects WHERE code='SCI-8' LIMIT 1),3,7,1,'2025-26'),
('Class 8','A',2,4,(SELECT id FROM subjects WHERE code='ENG-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',2,5,(SELECT id FROM subjects WHERE code='SS-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',2,7,(SELECT id FROM subjects WHERE code='HIN-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',2,8,(SELECT id FROM subjects WHERE code='ART-8' LIMIT 1),3,10,1,'2025-26'),
('Class 8','A',3,1,(SELECT id FROM subjects WHERE code='SCI-8' LIMIT 1),3,7,1,'2025-26'),
('Class 8','A',3,2,(SELECT id FROM subjects WHERE code='ENG-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',3,4,(SELECT id FROM subjects WHERE code='MATH-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',3,5,(SELECT id FROM subjects WHERE code='HIN-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',3,7,(SELECT id FROM subjects WHERE code='PE-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',3,8,(SELECT id FROM subjects WHERE code='SS-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',4,1,(SELECT id FROM subjects WHERE code='HIN-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',4,2,(SELECT id FROM subjects WHERE code='MATH-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',4,4,(SELECT id FROM subjects WHERE code='SCI-8' LIMIT 1),3,7,1,'2025-26'),
('Class 8','A',4,5,(SELECT id FROM subjects WHERE code='ENG-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',4,7,(SELECT id FROM subjects WHERE code='ART-8' LIMIT 1),3,10,1,'2025-26'),
('Class 8','A',4,8,(SELECT id FROM subjects WHERE code='SS-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',5,1,(SELECT id FROM subjects WHERE code='SS-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',5,2,(SELECT id FROM subjects WHERE code='HIN-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',5,4,(SELECT id FROM subjects WHERE code='ENG-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',5,5,(SELECT id FROM subjects WHERE code='MATH-8' LIMIT 1),3,3,1,'2025-26'),
('Class 8','A',5,7,(SELECT id FROM subjects WHERE code='SCI-8' LIMIT 1),3,7,1,'2025-26'),
('Class 8','A',5,8,(SELECT id FROM subjects WHERE code='PE-8' LIMIT 1),3,3,1,'2025-26');

-- ============================================================================
-- TIMETABLE ENTRIES FOR CLASS 9 (staffId=4 = Mr. Ravi Teja, Room 201)
-- ============================================================================
INSERT INTO timetable_entries (classEnrolled,section,dayOfWeek,slotId,subjectId,staffId,classroomId,isPublished,academicYear) VALUES
('Class 9','A',1,1,(SELECT id FROM subjects WHERE code='C9-ENG' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',1,2,(SELECT id FROM subjects WHERE code='C9-MATH' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',1,4,(SELECT id FROM subjects WHERE code='C9-PHY' LIMIT 1),4,7,1,'2025-26'),
('Class 9','A',1,5,(SELECT id FROM subjects WHERE code='C9-CHEM' LIMIT 1),4,8,1,'2025-26'),
('Class 9','A',1,7,(SELECT id FROM subjects WHERE code='C9-SST' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',1,8,(SELECT id FROM subjects WHERE code='C9-HIN' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',2,1,(SELECT id FROM subjects WHERE code='C9-MATH' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',2,2,(SELECT id FROM subjects WHERE code='C9-PHY' LIMIT 1),4,7,1,'2025-26'),
('Class 9','A',2,4,(SELECT id FROM subjects WHERE code='C9-BIO' LIMIT 1),4,8,1,'2025-26'),
('Class 9','A',2,5,(SELECT id FROM subjects WHERE code='C9-ENG' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',2,7,(SELECT id FROM subjects WHERE code='C9-HIN' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',2,8,(SELECT id FROM subjects WHERE code='C9-SST' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',3,1,(SELECT id FROM subjects WHERE code='C9-CHEM' LIMIT 1),4,8,1,'2025-26'),
('Class 9','A',3,2,(SELECT id FROM subjects WHERE code='C9-ENG' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',3,4,(SELECT id FROM subjects WHERE code='C9-MATH' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',3,5,(SELECT id FROM subjects WHERE code='C9-BIO' LIMIT 1),4,8,1,'2025-26'),
('Class 9','A',3,7,(SELECT id FROM subjects WHERE code='C9-PHY' LIMIT 1),4,7,1,'2025-26'),
('Class 9','A',3,8,(SELECT id FROM subjects WHERE code='C9-SST' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',4,1,(SELECT id FROM subjects WHERE code='C9-HIN' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',4,2,(SELECT id FROM subjects WHERE code='C9-CHEM' LIMIT 1),4,8,1,'2025-26'),
('Class 9','A',4,4,(SELECT id FROM subjects WHERE code='C9-ENG' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',4,5,(SELECT id FROM subjects WHERE code='C9-MATH' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',4,7,(SELECT id FROM subjects WHERE code='C9-BIO' LIMIT 1),4,8,1,'2025-26'),
('Class 9','A',4,8,(SELECT id FROM subjects WHERE code='C9-PHY' LIMIT 1),4,7,1,'2025-26'),
('Class 9','A',5,1,(SELECT id FROM subjects WHERE code='C9-PHY' LIMIT 1),4,7,1,'2025-26'),
('Class 9','A',5,2,(SELECT id FROM subjects WHERE code='C9-HIN' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',5,4,(SELECT id FROM subjects WHERE code='C9-SST' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',5,5,(SELECT id FROM subjects WHERE code='C9-CHEM' LIMIT 1),4,8,1,'2025-26'),
('Class 9','A',5,7,(SELECT id FROM subjects WHERE code='C9-MATH' LIMIT 1),4,4,1,'2025-26'),
('Class 9','A',5,8,(SELECT id FROM subjects WHERE code='C9-ENG' LIMIT 1),4,4,1,'2025-26');

-- ============================================================================
-- TIMETABLE ENTRIES FOR CLASS 10 (staffId=5 = Mrs. Preethi Nair, Room 202)
-- ============================================================================
INSERT INTO timetable_entries (classEnrolled,section,dayOfWeek,slotId,subjectId,staffId,classroomId,isPublished,academicYear) VALUES
('Class 10','A',1,1,(SELECT id FROM subjects WHERE code='C10-ENG' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',1,2,(SELECT id FROM subjects WHERE code='C10-MATH' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',1,4,(SELECT id FROM subjects WHERE code='C10-PHY' LIMIT 1),5,7,1,'2025-26'),
('Class 10','A',1,5,(SELECT id FROM subjects WHERE code='C10-CHEM' LIMIT 1),5,8,1,'2025-26'),
('Class 10','A',1,7,(SELECT id FROM subjects WHERE code='C10-SST' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',1,8,(SELECT id FROM subjects WHERE code='C10-HIN' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',2,1,(SELECT id FROM subjects WHERE code='C10-MATH' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',2,2,(SELECT id FROM subjects WHERE code='C10-PHY' LIMIT 1),5,7,1,'2025-26'),
('Class 10','A',2,4,(SELECT id FROM subjects WHERE code='C10-BIO' LIMIT 1),5,8,1,'2025-26'),
('Class 10','A',2,5,(SELECT id FROM subjects WHERE code='C10-ENG' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',2,7,(SELECT id FROM subjects WHERE code='C10-HIN' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',2,8,(SELECT id FROM subjects WHERE code='C10-SST' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',3,1,(SELECT id FROM subjects WHERE code='C10-CHEM' LIMIT 1),5,8,1,'2025-26'),
('Class 10','A',3,2,(SELECT id FROM subjects WHERE code='C10-ENG' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',3,4,(SELECT id FROM subjects WHERE code='C10-MATH' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',3,5,(SELECT id FROM subjects WHERE code='C10-BIO' LIMIT 1),5,8,1,'2025-26'),
('Class 10','A',3,7,(SELECT id FROM subjects WHERE code='C10-PHY' LIMIT 1),5,7,1,'2025-26'),
('Class 10','A',3,8,(SELECT id FROM subjects WHERE code='C10-SST' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',4,1,(SELECT id FROM subjects WHERE code='C10-HIN' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',4,2,(SELECT id FROM subjects WHERE code='C10-CHEM' LIMIT 1),5,8,1,'2025-26'),
('Class 10','A',4,4,(SELECT id FROM subjects WHERE code='C10-ENG' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',4,5,(SELECT id FROM subjects WHERE code='C10-MATH' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',4,7,(SELECT id FROM subjects WHERE code='C10-BIO' LIMIT 1),5,8,1,'2025-26'),
('Class 10','A',4,8,(SELECT id FROM subjects WHERE code='C10-PHY' LIMIT 1),5,7,1,'2025-26'),
('Class 10','A',5,1,(SELECT id FROM subjects WHERE code='C10-PHY' LIMIT 1),5,7,1,'2025-26'),
('Class 10','A',5,2,(SELECT id FROM subjects WHERE code='C10-HIN' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',5,4,(SELECT id FROM subjects WHERE code='C10-SST' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',5,5,(SELECT id FROM subjects WHERE code='C10-CHEM' LIMIT 1),5,8,1,'2025-26'),
('Class 10','A',5,7,(SELECT id FROM subjects WHERE code='C10-MATH' LIMIT 1),5,5,1,'2025-26'),
('Class 10','A',5,8,(SELECT id FROM subjects WHERE code='C10-ENG' LIMIT 1),5,5,1,'2025-26');

-- ============================================================================
-- TIMETABLE ENTRIES FOR CLASS 11 (staffId=6 = Mr. Karthik Reddy, Room 203)
-- ============================================================================
INSERT INTO timetable_entries (classEnrolled,section,dayOfWeek,slotId,subjectId,staffId,classroomId,isPublished,academicYear) VALUES
('Class 11','A',1,1,(SELECT id FROM subjects WHERE code='C11-ENG' LIMIT 1),6,6,1,'2025-26'),
('Class 11','A',1,2,(SELECT id FROM subjects WHERE code='C11-MATH' LIMIT 1),6,6,1,'2025-26'),
('Class 11','A',1,4,(SELECT id FROM subjects WHERE code='C11-PHY' LIMIT 1),6,7,1,'2025-26'),
('Class 11','A',1,5,(SELECT id FROM subjects WHERE code='C11-CHEM' LIMIT 1),6,8,1,'2025-26'),
('Class 11','A',1,7,(SELECT id FROM subjects WHERE code='C11-CS' LIMIT 1),6,9,1,'2025-26'),
('Class 11','A',1,8,(SELECT id FROM subjects WHERE code='C11-BIO' LIMIT 1),6,8,1,'2025-26'),
('Class 11','A',2,1,(SELECT id FROM subjects WHERE code='C11-MATH' LIMIT 1),6,6,1,'2025-26'),
('Class 11','A',2,2,(SELECT id FROM subjects WHERE code='C11-PHY' LIMIT 1),6,7,1,'2025-26'),
('Class 11','A',2,4,(SELECT id FROM subjects WHERE code='C11-CS' LIMIT 1),6,9,1,'2025-26'),
('Class 11','A',2,5,(SELECT id FROM subjects WHERE code='C11-ENG' LIMIT 1),6,6,1,'2025-26'),
('Class 11','A',2,7,(SELECT id FROM subjects WHERE code='C11-CHEM' LIMIT 1),6,8,1,'2025-26'),
('Class 11','A',2,8,(SELECT id FROM subjects WHERE code='C11-BIO' LIMIT 1),6,8,1,'2025-26'),
('Class 11','A',3,1,(SELECT id FROM subjects WHERE code='C11-CHEM' LIMIT 1),6,8,1,'2025-26'),
('Class 11','A',3,2,(SELECT id FROM subjects WHERE code='C11-ENG' LIMIT 1),6,6,1,'2025-26'),
('Class 11','A',3,4,(SELECT id FROM subjects WHERE code='C11-MATH' LIMIT 1),6,6,1,'2025-26'),
('Class 11','A',3,5,(SELECT id FROM subjects WHERE code='C11-BIO' LIMIT 1),6,8,1,'2025-26'),
('Class 11','A',3,7,(SELECT id FROM subjects WHERE code='C11-PHY' LIMIT 1),6,7,1,'2025-26'),
('Class 11','A',3,8,(SELECT id FROM subjects WHERE code='C11-CS' LIMIT 1),6,9,1,'2025-26'),
('Class 11','A',4,1,(SELECT id FROM subjects WHERE code='C11-BIO' LIMIT 1),6,8,1,'2025-26'),
('Class 11','A',4,2,(SELECT id FROM subjects WHERE code='C11-CHEM' LIMIT 1),6,8,1,'2025-26'),
('Class 11','A',4,4,(SELECT id FROM subjects WHERE code='C11-ENG' LIMIT 1),6,6,1,'2025-26'),
('Class 11','A',4,5,(SELECT id FROM subjects WHERE code='C11-MATH' LIMIT 1),6,6,1,'2025-26'),
('Class 11','A',4,7,(SELECT id FROM subjects WHERE code='C11-CS' LIMIT 1),6,9,1,'2025-26'),
('Class 11','A',4,8,(SELECT id FROM subjects WHERE code='C11-PHY' LIMIT 1),6,7,1,'2025-26'),
('Class 11','A',5,1,(SELECT id FROM subjects WHERE code='C11-PHY' LIMIT 1),6,7,1,'2025-26'),
('Class 11','A',5,2,(SELECT id FROM subjects WHERE code='C11-CS' LIMIT 1),6,9,1,'2025-26'),
('Class 11','A',5,4,(SELECT id FROM subjects WHERE code='C11-CHEM' LIMIT 1),6,8,1,'2025-26'),
('Class 11','A',5,5,(SELECT id FROM subjects WHERE code='C11-BIO' LIMIT 1),6,8,1,'2025-26'),
('Class 11','A',5,7,(SELECT id FROM subjects WHERE code='C11-MATH' LIMIT 1),6,6,1,'2025-26'),
('Class 11','A',5,8,(SELECT id FROM subjects WHERE code='C11-ENG' LIMIT 1),6,6,1,'2025-26');

-- ============================================================================
-- TIMETABLE ENTRIES FOR CLASS 12 (staffId=7 = Mrs. Sunita Rao, Room 201)
-- ============================================================================
INSERT INTO timetable_entries (classEnrolled,section,dayOfWeek,slotId,subjectId,staffId,classroomId,isPublished,academicYear) VALUES
('Class 12','A',1,1,(SELECT id FROM subjects WHERE code='C12-ENG' LIMIT 1),7,4,1,'2025-26'),
('Class 12','A',1,2,(SELECT id FROM subjects WHERE code='C12-MATH' LIMIT 1),7,4,1,'2025-26'),
('Class 12','A',1,4,(SELECT id FROM subjects WHERE code='C12-PHY' LIMIT 1),7,7,1,'2025-26'),
('Class 12','A',1,5,(SELECT id FROM subjects WHERE code='C12-CHEM' LIMIT 1),7,8,1,'2025-26'),
('Class 12','A',1,7,(SELECT id FROM subjects WHERE code='C12-CS' LIMIT 1),7,9,1,'2025-26'),
('Class 12','A',1,8,(SELECT id FROM subjects WHERE code='C12-BIO' LIMIT 1),7,8,1,'2025-26'),
('Class 12','A',2,1,(SELECT id FROM subjects WHERE code='C12-MATH' LIMIT 1),7,4,1,'2025-26'),
('Class 12','A',2,2,(SELECT id FROM subjects WHERE code='C12-PHY' LIMIT 1),7,7,1,'2025-26'),
('Class 12','A',2,4,(SELECT id FROM subjects WHERE code='C12-CS' LIMIT 1),7,9,1,'2025-26'),
('Class 12','A',2,5,(SELECT id FROM subjects WHERE code='C12-ENG' LIMIT 1),7,4,1,'2025-26'),
('Class 12','A',2,7,(SELECT id FROM subjects WHERE code='C12-CHEM' LIMIT 1),7,8,1,'2025-26'),
('Class 12','A',2,8,(SELECT id FROM subjects WHERE code='C12-BIO' LIMIT 1),7,8,1,'2025-26'),
('Class 12','A',3,1,(SELECT id FROM subjects WHERE code='C12-CHEM' LIMIT 1),7,8,1,'2025-26'),
('Class 12','A',3,2,(SELECT id FROM subjects WHERE code='C12-ENG' LIMIT 1),7,4,1,'2025-26'),
('Class 12','A',3,4,(SELECT id FROM subjects WHERE code='C12-MATH' LIMIT 1),7,4,1,'2025-26'),
('Class 12','A',3,5,(SELECT id FROM subjects WHERE code='C12-BIO' LIMIT 1),7,8,1,'2025-26'),
('Class 12','A',3,7,(SELECT id FROM subjects WHERE code='C12-PHY' LIMIT 1),7,7,1,'2025-26'),
('Class 12','A',3,8,(SELECT id FROM subjects WHERE code='C12-CS' LIMIT 1),7,9,1,'2025-26'),
('Class 12','A',4,1,(SELECT id FROM subjects WHERE code='C12-BIO' LIMIT 1),7,8,1,'2025-26'),
('Class 12','A',4,2,(SELECT id FROM subjects WHERE code='C12-CHEM' LIMIT 1),7,8,1,'2025-26'),
('Class 12','A',4,4,(SELECT id FROM subjects WHERE code='C12-ENG' LIMIT 1),7,4,1,'2025-26'),
('Class 12','A',4,5,(SELECT id FROM subjects WHERE code='C12-MATH' LIMIT 1),7,4,1,'2025-26'),
('Class 12','A',4,7,(SELECT id FROM subjects WHERE code='C12-CS' LIMIT 1),7,9,1,'2025-26'),
('Class 12','A',4,8,(SELECT id FROM subjects WHERE code='C12-PHY' LIMIT 1),7,7,1,'2025-26'),
('Class 12','A',5,1,(SELECT id FROM subjects WHERE code='C12-PHY' LIMIT 1),7,7,1,'2025-26'),
('Class 12','A',5,2,(SELECT id FROM subjects WHERE code='C12-CS' LIMIT 1),7,9,1,'2025-26'),
('Class 12','A',5,4,(SELECT id FROM subjects WHERE code='C12-CHEM' LIMIT 1),7,8,1,'2025-26'),
('Class 12','A',5,5,(SELECT id FROM subjects WHERE code='C12-BIO' LIMIT 1),7,8,1,'2025-26'),
('Class 12','A',5,7,(SELECT id FROM subjects WHERE code='C12-MATH' LIMIT 1),7,4,1,'2025-26'),
('Class 12','A',5,8,(SELECT id FROM subjects WHERE code='C12-ENG' LIMIT 1),7,4,1,'2025-26');

-- Assign Class 6 teacher to existing entries
UPDATE timetable_entries SET staffId=1 WHERE classEnrolled='Class 6' AND staffId IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
SELECT 'admissions'         AS table_name, COUNT(*) AS total_rows FROM admissions
UNION ALL SELECT 'staff',                 COUNT(*) FROM staff
UNION ALL SELECT 'students',              COUNT(*) FROM students
UNION ALL SELECT 'fees',                  COUNT(*) FROM fees
UNION ALL SELECT 'announcements',         COUNT(*) FROM announcements
UNION ALL SELECT 'notifications',         COUNT(*) FROM notifications
UNION ALL SELECT 'leave_requests',        COUNT(*) FROM leave_requests
UNION ALL SELECT 'otps',                  COUNT(*) FROM otps
UNION ALL SELECT 'email_verifications',   COUNT(*) FROM email_verifications
UNION ALL SELECT 'student_documents',     COUNT(*) FROM student_documents
UNION ALL SELECT 'staff_leave_balance',   COUNT(*) FROM staff_leave_balance
UNION ALL SELECT 'class_assignments',     COUNT(*) FROM class_assignments
UNION ALL SELECT 'payment_orders',        COUNT(*) FROM payment_orders
UNION ALL SELECT 'payment_transactions',  COUNT(*) FROM payment_transactions
UNION ALL SELECT 'fee_receipts',          COUNT(*) FROM fee_receipts
UNION ALL SELECT 'fee_payment_transactions', COUNT(*) FROM fee_payment_transactions
UNION ALL SELECT 'timetable_slots',       COUNT(*) FROM timetable_slots
UNION ALL SELECT 'classrooms',            COUNT(*) FROM classrooms
UNION ALL SELECT 'subjects',              COUNT(*) FROM subjects
UNION ALL SELECT 'timetable_entries',     COUNT(*) FROM timetable_entries
UNION ALL SELECT 'special_schedules',     COUNT(*) FROM special_schedules
UNION ALL SELECT 'substitute_assignments', COUNT(*) FROM substitute_assignments;


-- ============================================================================
-- TABLE 27: BONAFIDE_REQUESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS bonafide_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  reason LONGTEXT NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  approvedBy INT,
  rejectionReason LONGTEXT,
  requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  approvedAt DATETIME,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_studentId (studentId),
  INDEX idx_status (status),
  INDEX idx_requestedAt (requestedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 28: PAYMENT_WEBHOOK_LOGS (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_webhook_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event VARCHAR(100) NOT NULL,
  razorpayOrderId VARCHAR(255),
  razorpayPaymentId VARCHAR(255),
  payload LONGTEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  errorMessage VARCHAR(500),
  processedAt DATETIME,
  receivedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_razorpayOrderId (razorpayOrderId),
  INDEX idx_event (event),
  INDEX idx_receivedAt (receivedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE 28: EMAIL_LOGS (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipientEmail VARCHAR(191) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  emailType VARCHAR(100) NOT NULL,
  relatedEntityType VARCHAR(100),
  relatedEntityId INT,
  status VARCHAR(50) DEFAULT 'SENT',
  errorMessage VARCHAR(500),
  sentAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recipientEmail (recipientEmail),
  INDEX idx_emailType (emailType),
  INDEX idx_sentAt (sentAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
