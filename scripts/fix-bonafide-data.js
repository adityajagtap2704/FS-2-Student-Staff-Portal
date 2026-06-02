const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  console.log("Updating existing APPROVED bonafide requests...");
  const result = await db.bonafideRequest.updateMany({
    where: { status: "APPROVED" },
    data: {
      approvedByStaffId: 9,
      approvedByStaffName: "Priya Sharma",
      approvedAt: new Date("2026-05-31T10:00:00Z")
    }
  });
  console.log(`Updated ${result.count} requests successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
