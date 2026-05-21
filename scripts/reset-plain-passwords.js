require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

const updates = [
  { email: "lakshmi@kalnet.edu",           password: "lakshmi123"       },
  { email: "suresh@kalnet.edu",            password: "suresh123"        },
  { email: "anita@kalnet.edu",             password: "anita123"         },
  { email: "ravi@kalnet.edu",              password: "ravi123"          },
  { email: "preethi@kalnet.edu",           password: "preethi123"       },
  { email: "karthik@kalnet.edu",           password: "karthik123"       },
  { email: "sunita@kalnet.edu",            password: "sunita123"        },
  { email: "hod@kalnet.edu",               password: "hod123"           },
  { email: "priya.fees@kalnet.edu",        password: "NonTeaching@2026" },
  { email: "rajesh.admissions@kalnet.edu", password: "NonTeaching@2026" },
  { email: "anjali.finance@kalnet.edu",    password: "NonTeaching@2026" },
  { email: "neha.admissions@kalnet.edu",   password: "NonTeaching@2026" },
  { email: "vikram.fees@kalnet.edu",       password: "NonTeaching@2026" },
];

async function run() {
  console.log("Resetting all staff passwords to plain text...\n");
  for (const u of updates) {
    try {
      await db.staff.update({
        where: { email: u.email },
        data:  { password: u.password },
      });
      console.log("✓", u.email, "->", u.password);
    } catch (e) {
      console.log("✗ Not found (skipped):", u.email);
    }
  }
  await db.$disconnect();
  console.log("\nDone. All passwords are now plain text.");
}

run().catch((e) => { console.error(e); process.exit(1); });
