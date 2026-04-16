import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
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
    await client.connect();
    
    // Fix existing users by copying them from auth.users to public.users!
    await client.query(`
      INSERT INTO public.users (id, email)
      SELECT id, email FROM auth.users
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("Migrated existing missed users!");

    // Create Trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user() 
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.users (id, email)
        VALUES (new.id, new.email)
        ON CONFLICT (id) DO NOTHING;
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);
    console.log("Trigger added!");

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}
run();
