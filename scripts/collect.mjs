import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const SOURCE_URL = "https://jazzlineup.com/events-nyc.json";
export const MAX_FUTURE_EVENTS = 24;

export function nycDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

export function buildFeed(source, now = new Date()) {
  if (!source || !Array.isArray(source.clubs) || !Array.isArray(source.events)) {
    throw new Error("Jazz Lineup response does not have clubs and events arrays");
  }

  const clubById = new Map(source.clubs.map((club) => [club.id, club]));
  const today = nycDate(now);
  const upcoming = source.events
    .filter((event) => event.date >= today && clubById.has(event.clubId))
    .sort((a, b) => `${a.date} ${a.sets?.[0] ?? "99:99"}`.localeCompare(`${b.date} ${b.sets?.[0] ?? "99:99"}`));
  // The screen promises today's complete listing. Future shows are a small
  // convenience preview, rather than an archive or calendar mirror.
  const events = [
    ...upcoming.filter((event) => event.date === today),
    ...upcoming.filter((event) => event.date > today).slice(0, MAX_FUTURE_EVENTS)
  ]
    .map((event) => {
      const club = clubById.get(event.clubId);
      return {
        title: event.title,
        date: event.date,
        sets: Array.isArray(event.sets) ? event.sets : [],
        venue: club.name,
        neighborhood: club.neighborhood ?? null,
        event_url: event.url,
        price: event.priceText ?? null
      };
    });

  return {
    schema_version: 1,
    generated_at: now.toISOString(),
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
  const response = await fetchImpl(SOURCE_URL, {
    headers: { "User-Agent": "trmnl-jazz-lineup/0.1 (+https://github.com/kip-claw/trmnl-jazz-lineup)" }
  });
  if (!response.ok) throw new Error(`Jazz Lineup responded with HTTP ${response.status}`);
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
