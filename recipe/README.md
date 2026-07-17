# TRMNL Recipe source

This folder contains the public, reviewable source for the **NYC Jazz Tonight** Recipe.

The Recipe uses TRMNL's Polling strategy with the deployed `nyc.json` feed. It has no credentials, installation webhook, or user data. Its sole optional custom field is a multi-select of favorite venues: leave it blank for every listed NYC show today, or select one or more venues to filter the board. The Liquid template renders matching events in chronological, four-column order. Each compact entry shows its first set time, artist/group, and venue.

## Install a private copy

1. Create a **Polling** private plugin in TRMNL.
2. Import `settings.yml`, or copy its Polling URL and favorite-venue field into the form builder.
3. Paste `markup.liquid` into the markup editor.
4. Select TRMNL's `full` layout and refresh every 15 minutes.
5. Leave **Favorite venues** empty for the complete citywide board, or choose one or more venues to filter it.

## Troubleshooting

- **No listed sets tonight:** Jazz Lineup has no valid current-day events in the feed at the last successful collection.
- **No favorite venues tonight:** Clear or revise the optional venue selection to return to the citywide board.
- **DATA MAY BE STALE:** The source generation time is more than 90 minutes old. The public feed remains intentionally available rather than being replaced with an empty schedule.
- **A venue is missing from the picker:** Open a data-quality issue. Automated CI checks detect source/Recipe venue drift before deployment.

Before submitting, test the markup in a private plugin, create a non-personal 800×480 preview screen, and follow TRMNL's current Recipe publication flow. See [`../docs/device-compatibility.md`](../docs/device-compatibility.md) for the release check.
