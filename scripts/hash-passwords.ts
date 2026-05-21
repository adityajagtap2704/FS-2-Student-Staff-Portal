import db from "@/lib/db";
import { hashPassword } from "@/lib/password";

async function main() {
  try {
<<<<<<< HEAD
    console.log("🔄 Starting password verification (PLAIN TEXT)...");
=======
    console.log("🔄 Starting password hashing migration...");
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d

    // Get all staff members
    const staff = await db.staff.findMany();
    console.log(`Found ${staff.length} staff members`);

<<<<<<< HEAD
    let plainText = 0;
    let hashed = 0;
=======
    let updated = 0;
    let skipped = 0;
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d

    for (const s of staff) {
      // Check if password is already hashed (bcrypt hashes start with $2a, $2b, or $2y)
      if (s.password.startsWith("$2")) {
<<<<<<< HEAD
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
=======
        console.log(`⏭️  Skipping ${s.name} (already hashed)`);
        skipped++;
        continue;
      }

      try {
        const hashedPassword = await hashPassword(s.password);
        await db.staff.update({
          where: { id: s.id },
          data: { password: hashedPassword },
        });
        console.log(`✅ Hashed password for ${s.name}`);
        updated++;
      } catch (error) {
        console.error(`❌ Error hashing password for ${s.name}:`, error);
      }
    }

    console.log(`\n📊 Migration complete:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${staff.length}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
>>>>>>> c529c5b0c617371b0eb19f3790fece2d3b31c17d
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
