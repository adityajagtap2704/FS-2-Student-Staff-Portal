require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('[✓] Connected to database via Prisma');

    // HOD password (PLAIN TEXT)
    const plainPassword = 'Hod@123';
    console.log(`[✓] Setting HOD password to: ${plainPassword}`);

    // Check if HOD exists
    const hod = await prisma.staff.findUnique({
      where: { email: 'hod@kalnet.edu' },
    });

    if (!hod) {
      console.log('[✗] HOD account not found! Creating it...');

      // Create HOD account
      const newHod = await prisma.staff.create({
        data: {
          name: 'Dr. Venkat Prasad',
          email: 'hod@kalnet.edu',
          password: plainPassword,
          role: 'HOD',
          assignedClass: null,
          isActive: true,
        },
      });
      console.log('[✓] HOD account created successfully');
      console.log(`    ID: ${newHod.id}`);
    } else {
      console.log(`[✓] HOD account found: ${hod.name}`);
      console.log(`    Email: ${hod.email}`);
      console.log(`    Role: ${hod.role}`);
      console.log(`    Active: ${hod.isActive}`);

      // Update password (PLAIN TEXT)
      const updatedHod = await prisma.staff.update({
        where: { email: 'hod@kalnet.edu' },
        data: { password: plainPassword },
      });
      console.log('[✓] HOD password updated successfully');
    }

    // Verify the update
    const verifyHod = await prisma.staff.findUnique({
      where: { email: 'hod@kalnet.edu' },
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
      console.log('\n[✓] Verification:');
      console.log(`    Name: ${verifyHod.name}`);
      console.log(`    Email: ${verifyHod.email}`);
      console.log(`    Role: ${verifyHod.role}`);
      console.log(`    Active: ${verifyHod.isActive}`);
      console.log(`    Password: ${verifyHod.password}`);
    }

    console.log('\n[✓] Done! HOD can now login with:');
    console.log(`    Email: hod@kalnet.edu`);
    console.log(`    Password: Hod@123`);
  } catch (error) {
    console.error('[✗] Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
