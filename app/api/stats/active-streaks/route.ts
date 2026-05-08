import { NextResponse } from "next/server";
import { getActiveStreaksToday } from "@/lib/active-streaks";

// Cache 5 minutes — fresh enough to feel live, cheap enough to scale.
export const revalidate = 300;

export async function GET() {
  const count = await getActiveStreaksToday();
  return NextResponse.json(
    { count },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
