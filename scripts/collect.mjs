import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const SOURCE_URL = "https://jazzlineup.com/events-nyc.json";
export const MAX_FUTURE_EVENTS = 24;
export const MAX_RESPONSE_BYTES = 3_000_000;
export const REQUEST_TIMEOUT_MS = 15_000;
export const STALE_AFTER_SECONDS = 90 * 60;
export const NIGHT_CUTOFF = "04:00"; // the board day runs from this time today to this time tomorrow

export function nycDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

function nycClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit"
  }).formatToParts(now);
  const hh = parts.find((p) => p.type === "hour").value;
  const mm = parts.find((p) => p.type === "minute").value;
  return `${hh}:${mm}`;
}

function shiftDate(dateStr, deltaDays) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12)); // noon UTC avoids DST edge cases
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

// The "board day" is whichever NIGHT_CUTOFF-to-NIGHT_CUTOFF window we're
// currently inside. Before 4am, we're still inside yesterday's window.
export function boardDay(now = new Date()) {
  const calendarToday = nycDate(now);
  return nycClock(now) < NIGHT_CUTOFF ? shiftDate(calendarToday, -1) : calendarToday;
}

function firstSetTime(event) {
  return event.sets?.[0] ?? "12:00"; // no listed time: treat as an ordinary daytime item
}

// True if `event` falls within [day 04:00, day+1 04:00).
function inBoardWindow(event, day) {
  const time = firstSetTime(event);
  if (event.date === day) return time >= NIGHT_CUTOFF;
  if (event.date === shiftDate(day, 1)) return time < NIGHT_CUTOFF;
  return false;
}

export function buildFeed(source, now = new Date()) {
  if (!source || !Array.isArray(source.clubs) || !Array.isArray(source.events)) {
    throw new Error("Jazz Lineup response does not have clubs and events arrays");
  }

  if (source.clubs.length > 100 || source.events.length > 10_000) throw new Error("Jazz Lineup response exceeds expected limits");
  const clubById = new Map(source.clubs.filter((club) => typeof club.id === "string" && typeof club.name === "string").map((club) => [club.id, club]));
  const today = boardDay(now);
  const tomorrow = shiftDate(today, 1);

  const valid = source.events.filter((event) => /^\d{4}-\d{2}-\d{2}$/.test(event.date ?? "") && typeof event.title === "string" && event.title.trim() && clubById.has(event.clubId) && /^https:\/\//.test(event.url ?? "") && (event.sets == null || (Array.isArray(event.sets) && event.sets.every((set) => /^([01]\d|2[0-3]):[0-5]\d$/.test(set)))));

  const sorted = valid
    .slice()
    .sort((a, b) => `${a.date} ${a.sets?.[0] ?? "99:99"}`.localeCompare(`${b.date} ${b.sets?.[0] ?? "99:99"}`));

  // The screen promises today's complete board: every set from 4am today
  // through 4am tomorrow, including tonight's after-midnight tail. Anything
  // beyond that window is a small convenience preview, not shown on the
  // board itself.
  const boardEvents = sorted.filter((event) => inBoardWindow(event, today));
  const future = sorted
    .filter((event) => event.date > tomorrow || (event.date === tomorrow && firstSetTime(event) >= NIGHT_CUTOFF))
    .slice(0, MAX_FUTURE_EVENTS);

  const events = [
    ...boardEvents.map((event) => ({ ...event, on_board: true })),
    ...future.map((event) => ({ ...event, on_board: false }))
  ].map((event) => {
    const club = clubById.get(event.clubId);
    return {
      title: event.title,
      date: event.date,
      sets: Array.isArray(event.sets) ? event.sets : [],
      venue_id: club.id,
      venue: club.name,
      neighborhood: club.neighborhood ?? null,
      event_url: event.url,
      price: event.priceText ?? null,
      on_board: event.on_board
    };
  });

  const sourceGeneratedAt = Date.parse(source.generatedAt) || now.valueOf();
  return {
    schema_version: 1,
    generated_at: now.toISOString(),
    stale_after_epoch: Math.floor(sourceGeneratedAt / 1000) + STALE_AFTER_SECONDS,
    source: {
      name: "Jazz Lineup",
      url: "https://jazzlineup.com/",
      feed_url: SOURCE_URL,
      generated_at: source.generatedAt ?? null,
      attribution: "Data: Jazz Lineup"
    },
    city: "New York City",
    timezone: "America/New_York",
    today,
    events
  };
}

export async function collect({ fetchImpl = fetch, now = new Date(), outputPath } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const response = await fetchImpl(SOURCE_URL, { headers: { "Accept": "application/json", "User-Agent": "trmnl-jazz-lineup/0.1 (+https://github.com/kip-claw/trmnl-jazz-lineup)" }, signal: controller.signal });
  clearTimeout(timeout);
  if (!response.ok) throw new Error(`Jazz Lineup responded with HTTP ${response.status}`);
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("Jazz Lineup response is not JSON");
  if (Number(response.headers.get("content-length") || 0) > MAX_RESPONSE_BYTES) throw new Error("Jazz Lineup response is too large");
  const feed = buildFeed(await response.json(), now);
  if (outputPath) {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(feed, null, 2)}\n`);
  }
  return feed;
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] === thisFile) {
  const outputPath = path.resolve(path.dirname(thisFile), "../public/nyc.json");
  const feed = await collect({ outputPath });
  console.log(`Wrote ${feed.events.length} upcoming NYC events to ${outputPath}`);
}
