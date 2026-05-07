import { redirect } from "next/navigation";
import { getTtPreset } from "@/lib/tt-presets";
import { UTM_KEYS } from "@/lib/tiktok";

type SearchParams = Record<string, string | string[] | undefined>;

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function TtSlugPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: SearchParams;
}) {
  const preset = getTtPreset(params.slug);

  // Pass all incoming UTMs straight through to /start so the pixel can capture
  // them on the funnel page itself (no data loss from server redirect).
  const out = new URLSearchParams();
  out.set("from", "tt");
  out.set("slug", params.slug);

  if (preset) {
    out.set("goal", preset.goal);
    if (preset.age != null) out.set("age", String(preset.age));
    if (preset.timeWaster) out.set("tw", preset.timeWaster);
    if (preset.startStage) out.set("stage", preset.startStage);
  }

  for (const key of UTM_KEYS) {
    const value = pickFirst(searchParams[key]);
    if (value) out.set(key, value);
  }

  redirect(`/start?${out.toString()}`);
}
