const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

// Load environment variables (try .env.local first, then .env)
require("dotenv").config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  require("dotenv").config({ path: ".env" });
}

const db = new PrismaClient();

async function seedDatabase() {
  console.log("Reading SQL file...");
  const sqlPath = path.join(__dirname, "../prisma/complete_setup.sql");
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`Error: SQL file not found at ${sqlPath}`);
    process.exit(1);
  }
  
  const sqlContent = fs.readFileSync(sqlPath, "utf-8");

  // Robust line-by-line parsing to avoid issues with trailing spaces or comment blocks
  const statements = [];
  let currentStatement = "";
  const lines = sqlContent.split(/\r?\n/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("--") || trimmed.startsWith("/*")) {
      continue;
    }
    
    currentStatement += "\n" + line;
    
    if (trimmed.endsWith(";")) {
      statements.push(currentStatement.trim());
      currentStatement = "";
    }
  }

  console.log(`Found ${statements.length} total statements in SQL file.`);

  // Filter only INSERT statements
  const insertStatements = statements.filter((s) =>
    s.toUpperCase().startsWith("INSERT")
  );

  console.log(`Found ${insertStatements.length} INSERT statements to execute.`);

  try {
    for (let i = 0; i < insertStatements.length; i++) {
      let statement = insertStatements[i];
      
      // Map SQL columns to Prisma-pushed database columns
      if (statement.includes("student_documents")) {
        statement = statement
          .replace("verifiedBy", "verified_by_staff_id")
          .replace("verifiedAt", "verified_at");
      }
      
      console.log(`Running statement ${i + 1}/${insertStatements.length}...`);
      await db.$executeRawUnsafe(statement);
    }
    console.log("✓ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

seedDatabase();
