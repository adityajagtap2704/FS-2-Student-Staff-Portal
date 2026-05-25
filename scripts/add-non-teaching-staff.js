require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const bcryptjs = require("bcryptjs");

const db = new PrismaClient();

async function addNonTeachingStaff() {
  console.log("🔄 Adding Non-Teaching Staff Members...\n");

  try {
    // Hash password: "NonTeaching@2026"
    const password = "NonTeaching@2026";
    const hashedPassword = await bcryptjs.hash(password, 10);

    const staffMembers = [
      {
        name: "Ms. Priya Sharma",
        email: "priya.fees@kalnet.edu",
        role: "NON_TEACHING_STAFF",
        description: "Fees Manager - Manages fee collection and payments",
      },
      {
        name: "Mr. Rajesh Kumar",
        email: "rajesh.admissions@kalnet.edu",
        role: "NON_TEACHING_STAFF",
        description: "Admissions Coordinator - Handles admission enquiries",
      },
      {
        name: "Mrs. Anjali Verma",
        email: "anjali.finance@kalnet.edu",
        role: "NON_TEACHING_STAFF",
        description: "Finance Officer - Oversees financial operations",
      },
      {
        name: "Ms. Neha Patel",
        email: "neha.admissions@kalnet.edu",
        role: "NON_TEACHING_STAFF",
        description: "Admissions Assistant - Supports admission process",
      },
      {
        name: "Mr. Vikram Singh",
        email: "vikram.fees@kalnet.edu",
        role: "NON_TEACHING_STAFF",
        description: "Fees Collector - Collects and processes fees",
      },
    ];

    for (const member of staffMembers) {
      // Check if staff already exists
      const existingStaff = await db.staff.findUnique({
        where: { email: member.email },
      });

      if (existingStaff) {
        console.log(`⊘ Already exists: ${member.name} (${member.email})`);
        continue;
      }

      // Create staff member
      const staff = await db.staff.create({
        data: {
          name: member.name,
          email: member.email,
          password: hashedPassword,
          role: member.role,
          assignedClass: null,
          isActive: true,
          approvedBy: "hod@kalnet.edu",
          approvedAt: new Date(),
        },
      });

      console.log(`✅ Created: ${member.name}`);
      console.log(`   📧 Email: ${member.email}`);
      console.log(`   👤 Role: ${member.role}`);
      console.log(`   📝 ${member.description}\n`);
    }

    console.log("✨ Non-Teaching Staff Setup Complete!\n");
    console.log("📋 Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("All staff members can login with:");
    console.log(`  Password: ${password}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("👥 Staff Members Added:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    staffMembers.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name}`);
      console.log(`   Email: ${member.email}`);
      console.log(`   Role: ${member.description}`);
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding non-teaching staff:", error);
    process.exit(1);
  }
}

addNonTeachingStaff();
