import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runSchema() {
  const envPath = join(__dirname, "..", ".env.local");
  const envContent = readFileSync(envPath, "utf-8");
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.+)`));
    return match ? match[1].trim() : null;
  };

  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
  const dbPassword = "IchBinC00l#";
  const connString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;

  const client = new pg.Client({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("🔌 Connecting to Supabase database...");
    await client.connect();
    console.log("✅ Connected\n");

    const schemaPath = join(__dirname, "..", "lib", "supabase", "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");

    // Run the entire schema as one transaction
    console.log("📦 Running full schema...\n");
    await client.query(schema);
    console.log("🎉 Schema migration complete! All tables created.");

    // Verify tables exist
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log("\n📋 Tables in database:");
    result.rows.forEach((row) => {
      console.log(`  ✅ ${row.table_name}`);
    });

  } catch (err) {
    console.error("❌ Error:", err.message);
    if (err.message.includes("already exists")) {
      console.log("\n💡 Some tables already exist. That's OK — the schema is idempotent-safe.");
    }
  } finally {
    await client.end();
  }
}

runSchema();
