# TRMNL Jazz Lineup

An open-source, no-account-needed data feed and [TRMNL](https://trmnl.com/) Recipe for a concise **NYC Jazz Tonight** display.

![Jazz Lineup NYC preview](https://raw.githubusercontent.com/kip-claw/trmnl-jazz-lineup/refs/heads/main/docs/nyc-jazz-lineup-preview.png)

It fetches Jazz Lineup's public NYC event feed, retains only the fields needed for an e-ink schedule, and publishes a small, documented JSON feed. The accompanying Liquid markup is designed for a TRMNL private plugin / community Recipe and renders every show listed for the current NYC day in chronological, four-column order.

> Data source: [Jazz Lineup](https://jazzlineup.com/). This project is not affiliated with Jazz Lineup or TRMNL.

## Status

Early public prototype. The project deliberately starts as a TRMNL **Recipe**, not a hosted OAuth plugin: it requires no user credentials or personal data, is simple to fork, and can be submitted for TRMNL community review when the display and data policy are ready.

## Public feed

After GitHub Pages is enabled, the feed will be available at:

`https://kip-claw.github.io/trmnl-jazz-lineup/nyc.json`

It contains a versioned schema, source attribution, freshness timestamps, NYC venue metadata, and upcoming events. It intentionally does **not** mirror Jazz Lineup's complete data set or retain a historical archive.

The v1 contract is documented in [`schema/nyc-feed.schema.json`](schema/nyc-feed.schema.json). The collector validates the feed before every deployment, and a separate GitHub Actions workflow fetches and validates the deployed JSON after GitHub Pages updates.

## TRMNL setup

1. Import [`recipe/settings.yml`](recipe/settings.yml) into a TRMNL **Polling** private plugin, then paste [`recipe/markup.liquid`](recipe/markup.liquid) into the markup editor.
2. Use the standard `full` layout and preview on the 7.5-inch device.
3. Test a private copy before publishing a Recipe. Public Recipes are reviewed by TRMNL; users may install or fork them.

The finished Recipe will credit Jazz Lineup in the footer and link here for source, privacy, and maintenance information.

## Development

Requires Node.js 20+.

```bash
npm install     # install dev tooling (ESLint, Prettier)
npm run lint    # static analysis
npm run format  # apply Prettier formatting (format:check to verify only)
npm test
npm run collect
```

Continuous integration runs `lint`, `format:check`, and `test` on every push and pull request, and again before each scheduled publish.

`npm run collect` writes `public/nyc.json`. The GitHub Actions workflow runs the same collector on a 15-minute cadence and deploys the public directory to GitHub Pages.

## Design and data policy

- Prefer Jazz Lineup's documented public JSON feed over browser scraping.
- Fetch politely and no more often than every 15 minutes.
- Publish the complete current-day listing and a small upcoming preview with attribution, not a historical archive or complete calendar clone.
- Store no user data, API keys, cookies, analytics identifiers, or event history.
- Preserve source event links so viewers can verify details at the venue.
- If Jazz Lineup publishes reuse terms, an API policy, or requests a change, follow it promptly.

## Contributing

Issues and pull requests are welcome, especially for legibility on e-ink, venue corrections, and data-quality safeguards. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

See [device compatibility](docs/device-compatibility.md), the [roadmap](ROADMAP.md), and the [security policy](SECURITY.md) for public-release status and reporting paths.

## License

The code and templates are released under the [MIT License](LICENSE). Jazz Lineup data and trademarks remain their respective owners' property.
