# TRMNL Recipe source

This folder contains the public, reviewable source for the **NYC Jazz Tonight** Recipe.

The Recipe uses TRMNL's Polling strategy with the deployed `nyc.json` feed. It has no credentials, installation webhook, or user data. Its sole optional custom field is a multi-select of favorite venues: leave it blank for every listed NYC show today, or select one or more venues to filter the board. The Liquid template renders matching events in chronological, four-column order. Each compact entry shows its first set time, artist/group, and venue.

Before submitting, test the markup in a private plugin, create a non-personal preview screen, and follow TRMNL's current Recipe publication flow.
