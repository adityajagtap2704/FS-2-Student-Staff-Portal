-- ============================================================================
-- TIMETABLE DATA QUERY - View all inserted timetable data
-- ============================================================================

-- 1. VIEW ALL TIMETABLE ENTRIES WITH COMPLETE DETAILS
-- Shows class, day, time, subject, teacher, and room for each period
SELECT 
    te.id,
    te.classEnrolled AS 'Class',
    te.section AS 'Section',
    CASE te.dayOfWeek
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END AS 'Day',
    ts.slotNumber AS 'Period',
    ts.startTime AS 'Start Time',
    ts.endTime AS 'End Time',
    s.name AS 'Subject',
    s.code AS 'Subject Code',
    st.name AS 'Teacher',
    c.name AS 'Classroom',
    te.isPublished AS 'Published',
    te.academicYear AS 'Academic Year'
FROM timetable_entries te
LEFT JOIN timetable_slots ts ON te.slotId = ts.id
LEFT JOIN subjects s ON te.subjectId = s.id
LEFT JOIN staff st ON te.staffId = st.id
LEFT JOIN classrooms c ON te.classroomId = c.id
ORDER BY te.classEnrolled, te.dayOfWeek, ts.slotNumber;

-- ============================================================================

-- 2. COUNT OF TIMETABLE ENTRIES BY CLASS
-- Shows how many periods are scheduled for each class
SELECT 
    classEnrolled AS 'Class',
    COUNT(*) AS 'Total Periods'
FROM timetable_entries
GROUP BY classEnrolled
ORDER BY classEnrolled;

-- ============================================================================

-- 3. TIMETABLE FOR A SPECIFIC CLASS (Class 6 example)
-- Shows the complete weekly schedule for one class
SELECT 
    CASE te.dayOfWeek
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END AS 'Day',
    ts.slotNumber AS 'Period',
    ts.startTime AS 'Start',
    ts.endTime AS 'End',
    s.name AS 'Subject',
    st.name AS 'Teacher',
    c.name AS 'Room'
FROM timetable_entries te
LEFT JOIN timetable_slots ts ON te.slotId = ts.id
LEFT JOIN subjects s ON te.subjectId = s.id
LEFT JOIN staff st ON te.staffId = st.id
LEFT JOIN classrooms c ON te.classroomId = c.id
WHERE te.classEnrolled = 'Class 6' AND te.section = 'A'
ORDER BY te.dayOfWeek, ts.slotNumber;

-- ============================================================================

-- 4. TEACHER SCHEDULE - View all periods assigned to a specific teacher
-- Shows all classes and times a teacher is teaching
SELECT 
    te.classEnrolled AS 'Class',
    CASE te.dayOfWeek
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END AS 'Day',
    ts.slotNumber AS 'Period',
    ts.startTime AS 'Start',
    ts.endTime AS 'End',
    s.name AS 'Subject',
    c.name AS 'Room'
FROM timetable_entries te
LEFT JOIN timetable_slots ts ON te.slotId = ts.id
LEFT JOIN subjects s ON te.subjectId = s.id
LEFT JOIN classrooms c ON te.classroomId = c.id
WHERE te.staffId = 1  -- Change 1 to any teacher ID
ORDER BY te.dayOfWeek, ts.slotNumber;

-- ============================================================================

-- 5. CLASSROOM USAGE - View which classes use each classroom
-- Shows room allocation across the week
SELECT 
    c.name AS 'Classroom',
    c.building AS 'Building',
    c.floor AS 'Floor',
    COUNT(DISTINCT te.classEnrolled) AS 'Classes Using',
    COUNT(*) AS 'Total Periods'
FROM timetable_entries te
LEFT JOIN classrooms c ON te.classroomId = c.id
GROUP BY c.id, c.name, c.building, c.floor
ORDER BY c.name;

-- ============================================================================

-- 6. SUBJECT DISTRIBUTION - How many periods for each subject per class
-- Shows curriculum distribution
SELECT 
    te.classEnrolled AS 'Class',
    s.name AS 'Subject',
    s.code AS 'Code',
    COUNT(*) AS 'Periods Per Week'
FROM timetable_entries te
LEFT JOIN subjects s ON te.subjectId = s.id
GROUP BY te.classEnrolled, s.id, s.name, s.code
ORDER BY te.classEnrolled, s.name;

-- ============================================================================

-- 7. PUBLISHED VS UNPUBLISHED TIMETABLES
-- Shows which class timetables are visible to students
SELECT 
    classEnrolled AS 'Class',
    isPublished AS 'Published',
    COUNT(*) AS 'Entries'
FROM timetable_entries
GROUP BY classEnrolled, isPublished
ORDER BY classEnrolled, isPublished;

-- ============================================================================

-- 8. TIMETABLE SLOTS CONFIGURATION
-- Shows all available time slots in the system
SELECT 
    slotNumber AS 'Period',
    startTime AS 'Start Time',
    endTime AS 'End Time',
    CASE 
        WHEN isBreak = 1 THEN 'Break'
        ELSE 'Teaching'
    END AS 'Type',
    breakLabel AS 'Break Name'
FROM timetable_slots
ORDER BY slotNumber;

-- ============================================================================

-- 9. SUMMARY STATISTICS
-- Overall timetable statistics
SELECT 
    'Total Timetable Entries' AS 'Metric',
    COUNT(*) AS 'Count'
FROM timetable_entries
UNION ALL
SELECT 'Total Classes', COUNT(DISTINCT classEnrolled) FROM timetable_entries
UNION ALL
SELECT 'Total Teachers Assigned', COUNT(DISTINCT staffId) FROM timetable_entries
UNION ALL
SELECT 'Total Classrooms Used', COUNT(DISTINCT classroomId) FROM timetable_entries
UNION ALL
SELECT 'Total Subjects Assigned', COUNT(DISTINCT subjectId) FROM timetable_entries
UNION ALL
SELECT 'Published Timetables', COUNT(DISTINCT classEnrolled) FROM timetable_entries WHERE isPublished = 1;

-- ============================================================================

-- 10. DETAILED EXPORT - All timetable data for backup/analysis
-- Complete dataset with all relationships
SELECT 
    te.id AS 'Entry ID',
    te.classEnrolled AS 'Class',
    te.section AS 'Section',
    te.dayOfWeek AS 'Day (1-6)',
    CASE te.dayOfWeek
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END AS 'Day Name',
    ts.slotNumber AS 'Period',
    ts.startTime AS 'Start Time',
    ts.endTime AS 'End Time',
    s.name AS 'Subject',
    s.code AS 'Subject Code',
    st.name AS 'Teacher',
    st.email AS 'Teacher Email',
    c.name AS 'Classroom',
    c.building AS 'Building',
    c.floor AS 'Floor',
    te.isPublished AS 'Published (0/1)',
    te.academicYear AS 'Academic Year',
    te.createdAt AS 'Created At',
    te.updatedAt AS 'Updated At'
FROM timetable_entries te
LEFT JOIN timetable_slots ts ON te.slotId = ts.id
LEFT JOIN subjects s ON te.subjectId = s.id
LEFT JOIN staff st ON te.staffId = st.id
LEFT JOIN classrooms c ON te.classroomId = c.id
ORDER BY te.classEnrolled, te.dayOfWeek, ts.slotNumber;

-- ============================================================================
-- NOTES:
-- - Replace 'Class 6' with any class name in query #3
-- - Replace staffId = 1 with any teacher ID in query #4
-- - All queries use LEFT JOIN to show NULL values if relationships are missing
-- - Academic Year: 2025-26 (default)
-- - Day numbers: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
-- ============================================================================
