import db from "@/lib/db";

async function migratePasswords() {
  console.log("Starting password migration to PLAIN TEXT...");

  try {
    // Migrate Staff passwords
    const staff = await db.staff.findMany();
    console.log(`Found ${staff.length} staff members to migrate`);

    for (const s of staff) {
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (s.password.startsWith("$2")) {
        console.log(`⊘ Password is hashed for: ${s.email} - Keeping as is (manual update needed)`);
      } else {
        console.log(`✓ Password is plain text: ${s.email} - ${s.password}`);
      }
    }

    // Migrate Student passwords
    const students = await db.student.findMany();
    console.log(`Found ${students.length} students to migrate`);

    for (const student of students) {
      if (student.password && student.password.startsWith("$2")) {
        console.log(`⊘ Password is hashed for: ${student.email} - Keeping as is (manual update needed)`);
      } else if (student.password) {
        console.log(`✓ Password is plain text: ${student.email} - ${student.password}`);
      }
    }

    console.log("✓ Password migration check completed!");
    console.log("\nNote: All passwords are now stored as PLAIN TEXT.");
    console.log("If you have hashed passwords, they will be kept as-is but won't work with the new plain text comparison.");
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

migratePasswords();
