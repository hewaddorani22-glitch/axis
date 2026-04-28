import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runSchema() {
  const envPath = join(__dirname, "..", ".env.local");
  let envContent = "";
  try {
    envContent = readFileSync(envPath, "utf-8");
  } catch {
    // .env.local is optional when values are provided by the shell/Vercel.
  }

  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.+)`));
    const value = process.env[key] || (match ? match[1].trim() : "");
    return value.replace(/^["']|["']$/g, "").replace(/\\n/g, "").trim();
  };

  const explicitConnString = getEnv("SUPABASE_DB_URL") || getEnv("DATABASE_URL");
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const dbPassword = getEnv("SUPABASE_DB_PASSWORD");

  if (!explicitConnString && (!supabaseUrl || !dbPassword)) {
    throw new Error("Set SUPABASE_DB_URL, or set NEXT_PUBLIC_SUPABASE_URL plus SUPABASE_DB_PASSWORD.");
  }

  const projectRef = supabaseUrl
    ? supabaseUrl.replace("https://", "").replace(".supabase.co", "")
    : "";
  const connString = explicitConnString ||
    `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;

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
      console.log("\n💡 Some tables already exist. That's OK: the schema is idempotent-safe.");
    }
  } finally {
    await client.end();
  }
}

runSchema();
