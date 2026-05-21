require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('[✓] Connected to database via Prisma\n');

    // Define staff passwords (PLAIN TEXT)
    const staffPasswords = {
      'lakshmi@kalnet.edu': 'Lakshmi@123',
      'suresh@kalnet.edu': 'Suresh@123',
      'anita@kalnet.edu': 'Anita@123',
      'ravi@kalnet.edu': 'Ravi@123',
      'preethi@kalnet.edu': 'Preethi@123',
      'karthik@kalnet.edu': 'Karthik@123',
      'sunita@kalnet.edu': 'Sunita@123',
      'hod@kalnet.edu': 'Hod@123',
      'priya.fees@kalnet.edu': 'NonTeaching@2026',
      'rajesh.admissions@kalnet.edu': 'NonTeaching@2026',
      'anjali.finance@kalnet.edu': 'NonTeaching@2026',
      'neha.admissions@kalnet.edu': 'NonTeaching@2026',
      'vikram.fees@kalnet.edu': 'NonTeaching@2026',
    };

    console.log('🔄 Updating staff passwords (PLAIN TEXT)...\n');

    for (const [email, plainPassword] of Object.entries(staffPasswords)) {
      try {
        // Check if staff exists
        const staff = await prisma.staff.findUnique({
          where: { email },
        });

        if (!staff) {
          console.log(`⊘ Not found: ${email}`);
          continue;
        }

        // Store password as plain text
        await prisma.staff.update({
          where: { email },
          data: { password: plainPassword },
        });

        console.log(`✓ Updated: ${staff.name} (${email}) - Password: ${plainPassword}`);
      } catch (error) {
        console.log(`✗ Error updating ${email}: ${error.message}`);
      }
    }

    console.log('\n[✓] All staff passwords updated successfully (PLAIN TEXT)!');

    // Verify a few accounts
    console.log('\n📋 Verification:');
    const hod = await prisma.staff.findUnique({
      where: { email: 'hod@kalnet.edu' },
      select: { name: true, email: true, role: true, password: true },
    });
    if (hod) {
      console.log(`✓ HOD: ${hod.name} - Password: ${hod.password}`);
    }

    const priya = await prisma.staff.findUnique({
      where: { email: 'priya.fees@kalnet.edu' },
      select: { name: true, email: true, role: true, password: true },
    });
    if (priya) {
      console.log(`✓ Non-Teaching: ${priya.name} - Password: ${priya.password}`);
    }

  } catch (error) {
    console.error('[✗] Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
