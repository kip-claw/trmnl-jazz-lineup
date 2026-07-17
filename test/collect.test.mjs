import test from "node:test";
import assert from "node:assert/strict";
import { buildFeed } from "../scripts/collect.mjs";

const source = {
  generatedAt: "2026-07-17T12:00:00Z",
  clubs: [{ id: "club", name: "Example Club", neighborhood: "Village" }],
  events: [
    { clubId: "club", title: "Later Set", date: "2026-07-17", sets: ["21:00"], url: "https://example.test/later" },
    { clubId: "club", title: "Early Set", date: "2026-07-17", sets: ["19:00"], url: "https://example.test/early", priceText: "$20" },
    { clubId: "club", title: "Tomorrow", date: "2026-07-18", sets: ["20:00"], url: "https://example.test/tomorrow" },
    { clubId: "missing", title: "Discard", date: "2026-07-17", sets: [], url: "https://example.test/discard" }
  ]
};

test("buildFeed keeps only upcoming events with known venues and sorts by set time", () => {
  const feed = buildFeed(source, new Date("2026-07-17T14:00:00Z"));
  assert.equal(feed.schema_version, 1);
  assert.equal(feed.city, "New York City");
  assert.deepEqual(feed.events.map((event) => event.title), ["Early Set", "Later Set", "Tomorrow"]);
  assert.equal(feed.events[0].venue, "Example Club");
  assert.equal(feed.events[0].price, "$20");
});

test("buildFeed never truncates the current day's listing", () => {
  const manyToday = Array.from({ length: 30 }, (_, index) => ({
    clubId: "club",
    title: `Show ${index + 1}`,
    date: "2026-07-17",
    sets: ["20:00"],
    url: `https://example.test/${index + 1}`
  }));
  const feed = buildFeed({ ...source, events: manyToday }, new Date("2026-07-17T14:00:00Z"));
  assert.equal(feed.events.length, 30);
});
