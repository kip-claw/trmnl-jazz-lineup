import { readFile } from "node:fs/promises";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function hasOnlyKeys(value, keys) {
  return Object.keys(value).every((key) => keys.includes(key));
}

/**
 * Validates the published v1 contract without a runtime dependency. The
 * machine-readable JSON Schema lives alongside this implementation for other
 * consumers and validators.
 */
export function validateFeed(feed) {
  const errors = [];
  const add = (message) => errors.push(message);
  if (!feed || typeof feed !== "object" || Array.isArray(feed)) return ["feed must be an object"];

  const required = [
    "schema_version",
    "generated_at",
    "stale_after_epoch",
    "source",
    "city",
    "timezone",
    "today",
    "events"
  ];
  for (const key of required) if (!(key in feed)) add(`missing top-level ${key}`);
  if (!hasOnlyKeys(feed, required)) add("feed has unsupported top-level fields");
  if (feed.schema_version !== 1) add("schema_version must be 1");
  if (Number.isNaN(Date.parse(feed.generated_at))) add("generated_at must be an ISO timestamp");
  if (!Number.isInteger(feed.stale_after_epoch) || feed.stale_after_epoch < 0)
    add("stale_after_epoch must be a non-negative integer");
  if (feed.city !== "New York City") add("city must be New York City");
  if (feed.timezone !== "America/New_York") add("timezone must be America/New_York");
  if (!datePattern.test(feed.today ?? "")) add("today must be YYYY-MM-DD");

  const sourceKeys = ["name", "url", "feed_url", "generated_at", "attribution"];
  if (!feed.source || typeof feed.source !== "object" || Array.isArray(feed.source))
    add("source must be an object");
  else {
    for (const key of sourceKeys) if (!(key in feed.source)) add(`source is missing ${key}`);
    if (!hasOnlyKeys(feed.source, sourceKeys)) add("source has unsupported fields");
    if (feed.source.name !== "Jazz Lineup") add("source.name must be Jazz Lineup");
    if (!isHttpsUrl(feed.source.url)) add("source.url must be an HTTPS URL");
    if (!isHttpsUrl(feed.source.feed_url)) add("source.feed_url must be an HTTPS URL");
    if (feed.source.generated_at !== null && typeof feed.source.generated_at !== "string")
      add("source.generated_at must be a string or null");
    if (feed.source.attribution !== "Data: Jazz Lineup")
      add("source.attribution must be Data: Jazz Lineup");
  }

  if (!Array.isArray(feed.events)) add("events must be an array");
  else
    feed.events.forEach((event, index) => {
      const prefix = `events[${index}]`;
      const keys = [
        "title",
        "date",
        "sets",
        "venue_id",
        "venue",
        "neighborhood",
        "event_url",
        "price",
        "on_board"
      ];
      if (!event || typeof event !== "object" || Array.isArray(event))
        return add(`${prefix} must be an object`);
      for (const key of keys) if (!(key in event)) add(`${prefix} is missing ${key}`);
      if (!hasOnlyKeys(event, keys)) add(`${prefix} has unsupported fields`);
      if (typeof event.title !== "string" || !event.title.trim())
        add(`${prefix}.title must be a non-empty string`);
      if (!datePattern.test(event.date ?? "")) add(`${prefix}.date must be YYYY-MM-DD`);
      if (
        !Array.isArray(event.sets) ||
        !event.sets.every((set) => typeof set === "string" && timePattern.test(set))
      )
        add(`${prefix}.sets must contain 24-hour HH:MM times`);
      if (typeof event.venue_id !== "string" || !event.venue_id)
        add(`${prefix}.venue_id must be a non-empty string`);
      if (typeof event.venue !== "string" || !event.venue)
        add(`${prefix}.venue must be a non-empty string`);
      if (event.neighborhood !== null && typeof event.neighborhood !== "string")
        add(`${prefix}.neighborhood must be a string or null`);
      if (!isHttpsUrl(event.event_url)) add(`${prefix}.event_url must be an HTTPS URL`);
      if (event.price !== null && typeof event.price !== "string")
        add(`${prefix}.price must be a string or null`);
      if (typeof event.on_board !== "boolean") add(`${prefix}.on_board must be a boolean`);
    });
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input =
    process.argv[2] === "-"
      ? await new Response(process.stdin).text()
      : await readFile(process.argv[2] ?? "public/nyc.json", "utf8");
  let feed;
  try {
    feed = JSON.parse(input);
  } catch {
    console.error("Feed is not valid JSON");
    process.exitCode = 1;
  }
  if (feed) {
    const errors = validateFeed(feed);
    if (errors.length) {
      console.error(`Feed contract failed:\n- ${errors.join("\n- ")}`);
      process.exitCode = 1;
    } else console.log("Feed satisfies the v1 public contract.");
  }
}
