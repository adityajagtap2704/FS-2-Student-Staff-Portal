import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("[✓] Connected to database via Prisma");

    // Hash the HOD password
    const plainPassword = "hod123";
    const hashedPassword = await bcryptjs.hash(plainPassword, 10);
    console.log(`[✓] Generated bcrypt hash for password: ${plainPassword}`);
    console.log(`    Hash: ${hashedPassword}`);

    // Check if HOD exists
    const hod = await prisma.staff.findUnique({
      where: { email: "hod@kalnet.edu" },
    });

    if (!hod) {
      console.log("[✗] HOD account not found! Creating it...");

      // Create HOD account
      const newHod = await prisma.staff.create({
        data: {
          name: "Dr. Venkat Prasad",
          email: "hod@kalnet.edu",
          password: hashedPassword,
          role: "HOD",
          assignedClass: null,
          isActive: true,
        },
      });
      console.log("[✓] HOD account created successfully");
      console.log(`    ID: ${newHod.id}`);
    } else {
      console.log(`[✓] HOD account found: ${hod.name}`);
      console.log(`    Email: ${hod.email}`);
      console.log(`    Role: ${hod.role}`);
      console.log(`    Active: ${hod.isActive}`);

      // Update password
      const updatedHod = await prisma.staff.update({
        where: { email: "hod@kalnet.edu" },
        data: { password: hashedPassword },
      });
      console.log("[✓] HOD password updated successfully");
    }

    // Verify the update
    const verifyHod = await prisma.staff.findUnique({
      where: { email: "hod@kalnet.edu" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        password: true,
      },
    });

    if (verifyHod) {
      console.log("\n[✓] Verification:");
      console.log(`    Name: ${verifyHod.name}`);
      console.log(`    Email: ${verifyHod.email}`);
      console.log(`    Role: ${verifyHod.role}`);
      console.log(`    Active: ${verifyHod.isActive}`);
      console.log(`    Password Hash: ${verifyHod.password.substring(0, 20)}...`);
    }

    console.log("\n[✓] Done! HOD can now login with:");
    console.log(`    Email: hod@kalnet.edu`);
    console.log(`    Password: hod123`);
  } catch (error) {
    console.error("[✗] Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
