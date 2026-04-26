-- KALNET Seed Data
-- Created by Aravind Kurra (DB Developer)
-- 20 Students, 60 Fee Records, 10 Announcements

USE kalnet_db;

-- Clear existing data (optional, but good for clean seed)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE fees;
TRUNCATE TABLE leave_requests;
TRUNCATE TABLE students;
TRUNCATE TABLE admissions;
TRUNCATE TABLE announcements;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert 20 Students
INSERT INTO students (name, email, phone, parentName, classEnrolled, rollNumber, admissionDate, isActive) VALUES
('Aditya Jagtap', 'aditya@example.com', '+91 9876543210', 'Bibhishan Jagtap', 'Class 10', 'KN-2024-001', '2024-01-15', 1),
('Madhan Mohan', 'madhan@example.com', '+91 9876543211', 'Venkata Rao', 'Class 12', 'KN-2024-002', '2024-01-16', 1),
('Aravind Kurra', 'aravind@example.com', '+91 9876543212', 'Srinivas Kurra', 'Class 9', 'KN-2024-003', '2024-01-17', 1),
('Ram Prasad', 'ram@example.com', '+91 9876543213', 'Gharke Rao', 'Class 11', 'KN-2024-004', '2024-01-18', 1),
('Tanoor Kiran', 'tanoor@example.com', '+91 9876543214', 'Ravi Kiran', 'Class 8', 'KN-2024-005', '2024-01-19', 1),
('Abhinay Goud', 'abhinay@example.com', '+91 9876543215', 'Billola Goud', 'Class 10', 'KN-2024-006', '2024-01-20', 1),
('Priya Sharma', 'priya@example.com', '+91 9123456780', 'Rajesh Sharma', 'Class 6', 'KN-2024-007', '2024-02-01', 1),
('Ananya Reddy', 'ananya@example.com', '+91 9123456781', 'Vivek Reddy', 'Class 7', 'KN-2024-008', '2024-02-02', 1),
('Rahul Verma', 'rahul@example.com', '+91 9123456782', 'Sunil Verma', 'Class 8', 'KN-2024-009', '2024-02-03', 1),
('Sneha Nair', 'sneha@example.com', '+91 9123456783', 'Pradeep Nair', 'Class 9', 'KN-2024-010', '2024-02-04', 1),
('Vikram Singh', 'vikram@example.com', '+91 9123456784', 'Manjit Singh', 'Class 10', 'KN-2024-011', '2024-02-05', 1),
('Kavita Das', 'kavita@example.com', '+91 9123456785', 'Arjun Das', 'Class 11', 'KN-2024-012', '2024-02-06', 1),
('Siddharth Malhotra', 'sid@example.com', '+91 9123456786', 'Karan Malhotra', 'Class 12', 'KN-2024-013', '2024-02-07', 1),
('Ishaan Kapur', 'ishaan@example.com', '+91 9123456787', 'Sameer Kapur', 'Class 6', 'KN-2024-014', '2024-02-08', 1),
('Zoya Khan', 'zoya@example.com', '+91 9123456788', 'Farhan Khan', 'Class 7', 'KN-2024-015', '2024-02-09', 1),
('Arjun Mehra', 'arjun.m@example.com', '+91 9123456789', 'Sanjay Mehra', 'Class 8', 'KN-2024-016', '2024-02-10', 1),
('Deepika Padukone', 'deepika@example.com', '+91 9988776655', 'Prakash Padukone', 'Class 9', 'KN-2024-017', '2024-02-11', 1),
('Ranveer Singh', 'ranveer@example.com', '+91 9988776644', 'Jagjit Singh', 'Class 10', 'KN-2024-018', '2024-02-12', 1),
('Alia Bhatt', 'alia@example.com', '+91 9988776633', 'Mahesh Bhatt', 'Class 11', 'KN-2024-019', '2024-02-13', 1),
('Varun Dhawan', 'varun@example.com', '+91 9988776622', 'David Dhawan', 'Class 12', 'KN-2024-020', '2024-02-14', 1);

-- 2. Insert 60 Fee Records (3 per student: Tuition, Transport, Activity)
-- Note: Simplified cross join for seeding
INSERT INTO fees (studentId, term, dueDate, amount, paidAmount, type, status)
SELECT
    id,
    'Term 1 2026',
    '2026-03-31',
    15000.00,
    15000.00,
    'Tuition',
    'PAID'
FROM students;

INSERT INTO fees (studentId, term, dueDate, amount, paidAmount, type, status)
SELECT
    id,
    'Term 2 2026',
    '2026-06-30',
    15000.00,
    5000.00,
    'Tuition',
    'PENDING'
FROM students;

INSERT INTO fees (studentId, term, dueDate, amount, paidAmount, type, status)
SELECT
    id,
    'Activities 2026',
    '2026-04-15',
    2500.00,
    0.00,
    'Activity',
    'OVERDUE'
FROM students LIMIT 10;

INSERT INTO fees (studentId, term, dueDate, amount, paidAmount, type, status)
SELECT
    id,
    'Activities 2026',
    '2026-04-15',
    2500.00,
    2500.00,
    'Activity',
    'PAID'
FROM students WHERE id > 10;

-- 3. Insert 10 Announcements
INSERT INTO announcements (title, category, description, author, date, imageUrl) VALUES
('Annual Sports Meet 2026', 'Events', 'Join us for the Annual Sports Meet with games and prizes. It will be a week-long event starting next Monday. Students from all grades are encouraged to participate in track and field, team sports, and recreational activities. Parents are welcome to attend the opening ceremony.', 'Sports Department', '2026-05-10', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1000'),
('Mid-Term Examination Schedule', 'Exams', 'The mid-term examinations for classes 6 through 12 will commence on June 15th, 2026. The detailed date sheet has been sent to your registered email addresses and is also available on the student portal.', 'Academic Coordinator', '2026-05-12', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000'),
('Summer Vacation Announcement', 'Holidays', 'Please be informed that KALNET will observe summer vacation starting from July 1st, 2026. The school will reopen for regular classes on August 15th, 2026.', 'Principal''s Office', '2026-05-15', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000'),
('Science Fair 2026 Registrations', 'Events', 'The Annual Science Fair is scheduled for August 20th, 2026. Students interested in showcasing their working models or research projects must submit their abstracts by the end of this month.', 'Science Club', '2026-05-18', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=1000'),
('New Bus Routes Added', 'General', 'To accommodate the growing number of students from suburban areas, we have introduced three new bus routes starting next month. The new routes will cover Northville, Eastgate, and Westside neighborhoods.', 'Transport Admin', '2026-05-20', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1000'),
('Quarterly Parents Teacher Meet', 'General', 'The PTM for the first quarter is scheduled for Saturday, 25th May. Individual slots have been assigned to parents. Please check the notifications for your specific timing.', 'Principal''s Office', '2026-05-05', NULL),
('Inter-School Debate Competition', 'Events', 'Our school is hosting the Zonal level Debate Competition on 12th June. Students from Class 9 to 12 can audition for the school team in the auditorium this Thursday.', 'Literary Club', '2026-05-25', NULL),
('Class 10 Special Mock Test', 'Exams', 'A special series of mock tests for Class 10 Board aspirants will begin from Monday. These tests are mandatory and will help in identifying focus areas for the final exams.', 'Evaluation Cell', '2026-05-01', NULL),
('Eid Holiday Notice', 'Holidays', 'The school will remain closed on the occasion of Eid-ul-Fitr. Regular classes will resume from the following day.', 'Admin Office', '2026-04-10', NULL),
('Winter Uniform Distribution', 'General', 'Distribution of winter uniforms for new students and those who ordered replacements will start from the school book-store from next Monday.', 'Store Manager', '2026-09-15', NULL);