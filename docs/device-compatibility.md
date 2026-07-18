# Device compatibility

The Recipe targets TRMNL's standard **full** layout. It intentionally favors a
complete, dense daily schedule over large type, with artist and venue names
clipped with an ellipsis rather than wrapping into adjacent entries. The
column-major grid shows **four columns in landscape** and reflows to **two
columns in portrait** (TRMNL X), keyed off the framework's `.screen--portrait`
class so the chronological down-each-column order is preserved in both.

## Current support

| Screen             | Status                                    | Notes                                                                          |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------------------------ |
| 7.5-inch (800×480) | Targeted; pending physical-device capture | Four-column layout is designed for the full current-day feed.                  |
| 6-inch             | Not yet verified                          | Install a private fork before relying on it.                                   |
| 4-inch             | Not supported by this Recipe              | A separate, deliberately shorter layout is preferable to shrinking this board. |

## Before publishing a Recipe revision

1. Import `recipe/settings.yml` into a private Polling plugin.
2. Paste `recipe/markup.liquid` into the markup editor and select the `full` layout.
3. Check an ordinary day and a high-volume day; confirm that the last listing, footer, and stale notice remain visible. Preview both landscape (TRMNL OG and X) and portrait (TRMNL X); confirm the grid shows four columns in landscape and two in portrait.
4. Capture a non-personal 800×480 preview and add it to this repository before submitting or materially changing the public Recipe.

![Jazz Lineup NYC preview](https://raw.githubusercontent.com/kip-claw/trmnl-jazz-lineup/refs/heads/main/docs/nyc-jazz-lineup-device.jpg)

The image above is TRMNL's server-rendered Pop Out Preview, which mirrors the dithering/rendering pipeline used for the physical device, and has been visually confirmed against the actual 7.5-inch hardware.
