import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readEnvFile(fileName) {
  try {
    return readFileSync(join(__dirname, "..", fileName), "utf8");
  } catch {
    return "";
  }
}

const envText = [readEnvFile(".env.local"), readEnvFile(".env.production.local")].join("\n");

function getEnv(key) {
  const fromProcess = process.env[key];
  if (fromProcess) return fromProcess.replace(/\\n/g, "").trim();
  const match = envText.match(new RegExp(`^${key}=(.+)$`, "m"));
  const value = match ? match[1].trim() : "";
  return value.replace(/^["']|["']$/g, "").replace(/\\n/g, "").trim();
}

function buildConnectionString() {
  const explicit = getEnv("SUPABASE_DB_URL") || getEnv("DATABASE_URL");
  if (explicit) return explicit;

  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const dbPassword = getEnv("SUPABASE_DB_PASSWORD");
  if (!supabaseUrl || !dbPassword) {
    throw new Error("Set SUPABASE_DB_URL, or NEXT_PUBLIC_SUPABASE_URL plus SUPABASE_DB_PASSWORD.");
  }

  const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
  return `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
}

const expectedTables = [
  "users",
  "objectives",
  "missions",
  "revenue_streams",
  "revenue_entries",
  "habits",
  "habit_logs",
  "goals",
  "weekly_reviews",
  "partnerships",
  "nudges",
  "achievements",
  "daily_scores",
  "streak_freezes",
  "streak_restores",
  "push_subscriptions",
  "analytics_events",
  "groups",
  "group_members",
  "auth_rate_limits",
];

const client = new pg.Client({
  connectionString: buildConnectionString(),
  ssl: { rejectUnauthorized: false },
});

await client.connect();

try {
  const tables = await client.query(`
    SELECT
      c.relname AS table_name,
      c.relrowsecurity AS rls_enabled,
      COALESCE(policy_counts.policy_count, 0)::int AS policy_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN (
      SELECT schemaname, tablename, count(*) AS policy_count
      FROM pg_policies
      GROUP BY schemaname, tablename
    ) policy_counts
      ON policy_counts.schemaname = n.nspname
      AND policy_counts.tablename = c.relname
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
    ORDER BY c.relname;
  `);

  const tableMap = new Map(tables.rows.map((row) => [row.table_name, row]));
  const failures = [];

  for (const table of expectedTables) {
    const row = tableMap.get(table);
    if (!row) {
      failures.push(`missing table: ${table}`);
      continue;
    }
    if (!row.rls_enabled) {
      failures.push(`RLS disabled: ${table}`);
    }
  }

  const views = await client.query(`
    SELECT table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  const publicRlsSummary = expectedTables.map((table) => {
    const row = tableMap.get(table);
    return {
      table,
      present: Boolean(row),
      rls_enabled: Boolean(row?.rls_enabled),
      policy_count: Number(row?.policy_count ?? 0),
    };
  });

  console.log(JSON.stringify({
    ok: failures.length === 0,
    failures,
    public_tables: publicRlsSummary,
    public_views: views.rows.map((row) => row.table_name),
  }, null, 2));

  if (failures.length > 0) {
    process.exitCode = 1;
  }
} finally {
  await client.end();
}
