require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const bcryptjs = require("bcryptjs");

const db = new PrismaClient();

async function migratePasswords() {
  console.log("Starting password migration...");

  try {
    // Migrate Staff passwords
    const staff = await db.staff.findMany();
    console.log(`Found ${staff.length} staff members to migrate`);

    for (const s of staff) {
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (!s.password.startsWith("$2")) {
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(s.password, salt);
        await db.staff.update({
          where: { id: s.id },
          data: { password: hashedPassword },
        });
        console.log(`✓ Migrated staff: ${s.email}`);
      } else {
        console.log(`⊘ Already hashed: ${s.email}`);
      }
    }

    // Migrate Student passwords
    const students = await db.student.findMany();
    console.log(`Found ${students.length} students to migrate`);

    for (const student of students) {
      if (student.password && !student.password.startsWith("$2")) {
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(student.password, salt);
        await db.student.update({
          where: { id: student.id },
          data: { password: hashedPassword },
        });
        console.log(`✓ Migrated student: ${student.email}`);
      } else if (student.password) {
        console.log(`⊘ Already hashed: ${student.email}`);
      }
    }

    console.log("✓ Password migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

migratePasswords();
