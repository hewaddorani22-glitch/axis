import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
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
    await client.connect();
    
    const sql = readFileSync(join(__dirname, "011-prod-sanity-and-fix.sql"), "utf-8");
    const result = await client.query(sql);
    const rows = Array.isArray(result) ? result.at(-1)?.rows : result.rows;
    console.log("Production sanity + auth-user fix completed.");
    console.log(JSON.stringify(rows ?? [], null, 2));

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}
run();
