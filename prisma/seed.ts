import { PrismaClient, FeeType, FeeStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.fee.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.student.deleteMany();
  await prisma.admission.deleteMany();
  await prisma.announcement.deleteMany();

  // Insert 20 Students
  const students = await prisma.student.createMany({
    data: [
      { name: 'Aditya Jagtap', email: 'aditya@example.com', phone: '+91 9876543210', parentName: 'Bibhishan Jagtap', classEnrolled: 'Class 10', rollNumber: 'KN-2024-001', admissionDate: new Date('2024-01-15'), isActive: true },
      { name: 'Madhan Mohan', email: 'madhan@example.com', phone: '+91 9876543211', parentName: 'Venkata Rao', classEnrolled: 'Class 12', rollNumber: 'KN-2024-002', admissionDate: new Date('2024-01-16'), isActive: true },
      { name: 'Aravind Kurra', email: 'aravind@example.com', phone: '+91 9876543212', parentName: 'Srinivas Kurra', classEnrolled: 'Class 9', rollNumber: 'KN-2024-003', admissionDate: new Date('2024-01-17'), isActive: true },
      { name: 'Ram Prasad', email: 'ram@example.com', phone: '+91 9876543213', parentName: 'Gharke Rao', classEnrolled: 'Class 11', rollNumber: 'KN-2024-004', admissionDate: new Date('2024-01-18'), isActive: true },
      { name: 'Tanoor Kiran', email: 'tanoor@example.com', phone: '+91 9876543214', parentName: 'Ravi Kiran', classEnrolled: 'Class 8', rollNumber: 'KN-2024-005', admissionDate: new Date('2024-01-19'), isActive: true },
      { name: 'Abhinay Goud', email: 'abhinay@example.com', phone: '+91 9876543215', parentName: 'Billola Goud', classEnrolled: 'Class 10', rollNumber: 'KN-2024-006', admissionDate: new Date('2024-01-20'), isActive: true },
      { name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 9123456780', parentName: 'Rajesh Sharma', classEnrolled: 'Class 6', rollNumber: 'KN-2024-007', admissionDate: new Date('2024-02-01'), isActive: true },
      { name: 'Ananya Reddy', email: 'ananya@example.com', phone: '+91 9123456781', parentName: 'Vivek Reddy', classEnrolled: 'Class 7', rollNumber: 'KN-2024-008', admissionDate: new Date('2024-02-02'), isActive: true },
      { name: 'Rahul Verma', email: 'rahul@example.com', phone: '+91 9123456782', parentName: 'Sunil Verma', classEnrolled: 'Class 8', rollNumber: 'KN-2024-009', admissionDate: new Date('2024-02-03'), isActive: true },
      { name: 'Sneha Nair', email: 'sneha@example.com', phone: '+91 9123456783', parentName: 'Pradeep Nair', classEnrolled: 'Class 9', rollNumber: 'KN-2024-010', admissionDate: new Date('2024-02-04'), isActive: true },
      { name: 'Vikram Singh', email: 'vikram@example.com', phone: '+91 9123456784', parentName: 'Manjit Singh', classEnrolled: 'Class 10', rollNumber: 'KN-2024-011', admissionDate: new Date('2024-02-05'), isActive: true },
      { name: 'Kavita Das', email: 'kavita@example.com', phone: '+91 9123456785', parentName: 'Arjun Das', classEnrolled: 'Class 11', rollNumber: 'KN-2024-012', admissionDate: new Date('2024-02-06'), isActive: true },
      { name: 'Siddharth Malhotra', email: 'sid@example.com', phone: '+91 9123456786', parentName: 'Karan Malhotra', classEnrolled: 'Class 12', rollNumber: 'KN-2024-013', admissionDate: new Date('2024-02-07'), isActive: true },
      { name: 'Ishaan Kapur', email: 'ishaan@example.com', phone: '+91 9123456787', parentName: 'Sameer Kapur', classEnrolled: 'Class 6', rollNumber: 'KN-2024-014', admissionDate: new Date('2024-02-08'), isActive: true },
      { name: 'Zoya Khan', email: 'zoya@example.com', phone: '+91 9123456788', parentName: 'Farhan Khan', classEnrolled: 'Class 7', rollNumber: 'KN-2024-015', admissionDate: new Date('2024-02-09'), isActive: true },
      { name: 'Arjun Mehra', email: 'arjun.m@example.com', phone: '+91 9123456789', parentName: 'Sanjay Mehra', classEnrolled: 'Class 8', rollNumber: 'KN-2024-016', admissionDate: new Date('2024-02-10'), isActive: true },
      { name: 'Deepika Padukone', email: 'deepika@example.com', phone: '+91 9988776655', parentName: 'Prakash Padukone', classEnrolled: 'Class 9', rollNumber: 'KN-2024-017', admissionDate: new Date('2024-02-11'), isActive: true },
      { name: 'Ranveer Singh', email: 'ranveer@example.com', phone: '+91 9988776644', parentName: 'Jagjit Singh', classEnrolled: 'Class 10', rollNumber: 'KN-2024-018', admissionDate: new Date('2024-02-12'), isActive: true },
      { name: 'Alia Bhatt', email: 'alia@example.com', phone: '+91 9988776633', parentName: 'Mahesh Bhatt', classEnrolled: 'Class 11', rollNumber: 'KN-2024-019', admissionDate: new Date('2024-02-13'), isActive: true },
      { name: 'Varun Dhawan', email: 'varun@example.com', phone: '+91 9988776622', parentName: 'David Dhawan', classEnrolled: 'Class 12', rollNumber: 'KN-2024-020', admissionDate: new Date('2024-02-14'), isActive: true },
    ],
  });

  // Get all students
  const allStudents = await prisma.student.findMany();

  // Insert fees
  const fees = [];
  for (const student of allStudents) {
    fees.push(
      { studentId: student.id, term: 'Term 1 2026', dueDate: new Date('2026-03-31'), amount: 15000, paidAmount: 15000, type: FeeType.Tuition, status: FeeStatus.PAID },
      { studentId: student.id, term: 'Term 2 2026', dueDate: new Date('2026-06-30'), amount: 15000, paidAmount: 5000, type: FeeType.Tuition, status: FeeStatus.PENDING },
      { studentId: student.id, term: 'Activities 2026', dueDate: new Date('2026-04-15'), amount: 2500, paidAmount: student.id <= 10 ? 0 : 2500, type: FeeType.Activity, status: student.id <= 10 ? FeeStatus.OVERDUE : FeeStatus.PAID }
    );
  }
  await prisma.fee.createMany({ data: fees });

  // Insert announcements
  await prisma.announcement.createMany({
    data: [
      { title: 'Annual Sports Meet 2026', category: 'Events', description: 'Join us for the Annual Sports Meet with games and prizes. It will be a week-long event starting next Monday. Students from all grades are encouraged to participate in track and field, team sports, and recreational activities. Parents are welcome to attend the opening ceremony.', author: 'Sports Department', date: new Date('2026-05-10'), imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1000' },
      { title: 'Mid-Term Examination Schedule', category: 'Exams', description: 'The mid-term examinations for classes 6 through 12 will commence on June 15th, 2026. The detailed date sheet has been sent to your registered email addresses and is also available on the student portal.', author: 'Academic Coordinator', date: new Date('2026-05-12'), imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000' },
      { title: 'Summer Vacation Announcement', category: 'Holidays', description: 'Please be informed that KALNET will observe summer vacation starting from July 1st, 2026. The school will reopen for regular classes on August 15th, 2026.', author: 'Principal\'s Office', date: new Date('2026-05-15'), imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000' },
      { title: 'Science Fair 2026 Registrations', category: 'Events', description: 'The Annual Science Fair is scheduled for August 20th, 2026. Students interested in showcasing their working models or research projects must submit their abstracts by the end of this month.', author: 'Science Club', date: new Date('2026-05-18'), imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=1000' },
      { title: 'New Bus Routes Added', category: 'General', description: 'To accommodate the growing number of students from suburban areas, we have introduced three new bus routes starting next month. The new routes will cover Northville, Eastgate, and Westside neighborhoods.', author: 'Transport Admin', date: new Date('2026-05-20'), imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1000' },
      { title: 'Quarterly Parents Teacher Meet', category: 'General', description: 'The PTM for the first quarter is scheduled for Saturday, 25th May. Individual slots have been assigned to parents. Please check the notifications for your specific timing.', author: 'Principal\'s Office', date: new Date('2026-05-05') },
      { title: 'Inter-School Debate Competition', category: 'Events', description: 'Our school is hosting the Zonal level Debate Competition on 12th June. Students from Class 9 to 12 can audition for the school team in the auditorium this Thursday.', author: 'Literary Club', date: new Date('2026-05-25') },
      { title: 'Class 10 Special Mock Test', category: 'Exams', description: 'A special series of mock tests for Class 10 Board aspirants will begin from Monday. These tests are mandatory and will help in identifying focus areas for the final exams.', author: 'Evaluation Cell', date: new Date('2026-05-01') },
      { title: 'Eid Holiday Notice', category: 'Holidays', description: 'The school will remain closed on the occasion of Eid-ul-Fitr. Regular classes will resume from the following day.', author: 'Admin Office', date: new Date('2026-04-10') },
      { title: 'Winter Uniform Distribution', category: 'General', description: 'Distribution of winter uniforms for new students and those who ordered replacements will start from the school book-store from next Monday.', author: 'Store Manager', date: new Date('2026-09-15') },
    ],
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });