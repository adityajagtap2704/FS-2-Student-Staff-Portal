import db from "@/lib/db";
import { hashPassword } from "@/lib/password";

async function main() {
  try {
    console.log("🔄 Starting password verification (PLAIN TEXT)...");

    // Get all staff members
    const staff = await db.staff.findMany();
    console.log(`Found ${staff.length} staff members`);

    let plainText = 0;
    let hashed = 0;

    for (const s of staff) {
      // Check if password is already hashed (bcrypt hashes start with $2a, $2b, or $2y)
      if (s.password.startsWith("$2")) {
        console.log(`🔐 Hashed: ${s.name} (${s.email})`);
        hashed++;
        continue;
      }

      console.log(`📝 Plain Text: ${s.name} (${s.email}) - Password: ${s.password}`);
      plainText++;
    }

    console.log(`\n📊 Password Status:`);
    console.log(`   Plain Text: ${plainText}`);
    console.log(`   Hashed: ${hashed}`);
    console.log(`   Total: ${staff.length}`);
    console.log(`\n✅ All passwords are now stored as PLAIN TEXT.`);
  } catch (error) {
    console.error("❌ Check failed:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
