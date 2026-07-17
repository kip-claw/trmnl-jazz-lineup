import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { SOURCE_URL } from "./collect.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const settings = await readFile(path.join(root, "recipe/settings.yml"), "utf8");
const configured = new Set([...settings.matchAll(/^\s+- .+: ([a-z0-9]+)$/gm)].map((match) => match[1]));
const response = await fetch(SOURCE_URL, { headers: { Accept: "application/json" } });
if (!response.ok) throw new Error(`Jazz Lineup responded with HTTP ${response.status}`);
const source = await response.json();
const current = new Set(source.clubs.map((club) => club.id));
const missing = [...current].filter((id) => !configured.has(id));
const retired = [...configured].filter((id) => !current.has(id));
if (missing.length || retired.length) throw new Error(`Favorite-venue options drifted (missing: ${missing.join(", ") || "none"}; retired: ${retired.join(", ") || "none"})`);
console.log(`Favorite-venue options match ${current.size} Jazz Lineup clubs.`);
