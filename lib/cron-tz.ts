/**
 * Helpers for timezone-aware cron filtering.
 *
 * The crons run hourly in UTC. Every job iterates the user table once per run
 * and filters by the user's *local* hour / day-of-week / date so a user in
 * Berlin gets their morning briefing at ~8 local instead of 8 UTC (= 9 Berlin
 * in winter, 10 in summer) and a user in LA does not get pinged at midnight.
 */

const FALLBACK_TIMEZONE = "UTC";

/**
 * Compute a user's local hour, day-of-week (0=Sun..6=Sat), and ISO date string.
 *
 * Implementation note: we lean on Intl.DateTimeFormat with a fixed `en-CA`
 * locale because en-CA emits the YYYY-MM-DD format Postgres expects without
 * needing manual zero-padding. Hour is parsed from a 24-hour formatter.
 */
export type UserLocalContext = {
  hour: number;
  dow: number;
  dateIso: string;
  timezone: string;
};

export function getUserLocalContext(
  timezone: string | null | undefined,
  now: Date = new Date(),
): UserLocalContext {
  const tz = timezone && timezone.length > 0 ? timezone : FALLBACK_TIMEZONE;

  let dateIso: string;
  let hour: number;
  let dow: number;

  try {
    const dateFmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dateIso = dateFmt.format(now);

    const hourFmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      hour12: false,
    });
    hour = parseInt(hourFmt.format(now), 10);
    if (Number.isNaN(hour)) hour = 0;
    if (hour === 24) hour = 0;

    const dowFmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
    });
    const weekday = dowFmt.format(now);
    const dowMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    dow = dowMap[weekday] ?? 0;
  } catch {
    // Bad timezone string — fall back to UTC defaults so we still process
    // this user rather than skipping them forever.
    return {
      hour: now.getUTCHours(),
      dow: now.getUTCDay(),
      dateIso: now.toISOString().split("T")[0],
      timezone: FALLBACK_TIMEZONE,
    };
  }

  return { hour, dow, dateIso, timezone: tz };
}

/**
 * Helper: is this user's local time inside the half-open hour window [start, end)?
 * Use a 1- or 2-hour window so an hourly cron can never miss a user due to
 * scheduling jitter.
 */
export function isInLocalHourWindow(
  ctx: { hour: number },
  startHour: number,
  endHour: number,
) {
  return ctx.hour >= startHour && ctx.hour < endHour;
}
