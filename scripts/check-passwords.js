require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function run() {
  const staff = await db.staff.findMany({
    select: { id: true, name: true, email: true, password: true, role: true },
    orderBy: { id: "asc" },
  });

  console.log("Current passwords in DB:\n");
  for (const s of staff) {
    console.log(`[${s.id}] ${s.email}`);
    console.log(`     password: "${s.password}"`);
    console.log(`     length  : ${s.password.length}`);
    console.log();
  }

  await db.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
