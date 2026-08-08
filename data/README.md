# Data files

All site content is static JSON, generated or curated here and committed.
The Astro build imports these files; nothing is fetched at runtime.

| File | Source | Updated by |
| --- | --- | --- |
| `seasons/<year>.json` | Jolpica F1 API | `scripts/update_results.py` (GH Action, weekly) |
| `driver.json` | Jolpica F1 API | `scripts/update_results.py` |
| `junior-career.json` | Researched + adversarially fact-checked | Manually — junior series never change |
| `research/` | Provenance: per-claim verification logs + critique | With `junior-career.json` |
| `attributions.json` | Wikimedia Commons API | `scripts/fetch_images.py` (manual, review before commit) |
| `signature-moments.json` | Hand-curated, oEmbed-verified video IDs | Manually |
| `cache/jolpica/` | API response cache | automatic; delete to force a full refresh |

`attributions.json` and the images it describes (`public/images/commons/`,
33 files) are **committed**: `CommonsImage.astro` and the attributions page
import the manifest at build time, so a fresh clone builds without running
any Python. `scripts/fetch_images.py` only needs re-running to add images.

The `youtubeVideoId` field in `seasons/*.json` is filled by
`scripts/update_highlights.py` (needs `YOUTUBE_API_KEY`); `null` means
never searched, `""` means searched and nothing found, and a string is a
video ID. `update_results.py` preserves whatever is already there.

## junior-career.json

The horizontal timeline (Phase 3) walks `eras[]` in order — karting through
F1 — and renders one timeline chapter per era. Shape:

```jsonc
{
  "eras": [
    {
      "era": "f4-2022",          // stable key, used as DOM id
      "label": "Formula 4",      // chapter heading
      "years": "2022",           // display string
      "entries": [               // one row per championship contested
        {
          "series": "Italian F4 Championship",
          "year": 2022,
          "team": "Prema Racing",
          "result": "Champion",  // display string
          "wins": 13, "poles": 10, "podiums": 18, "points": 371, // null = n/a
          "notes": null
        }
      ],
      "facts": [                 // signature facts shown on the chapter card
        { "fact": "…", "sourceUrl": "…" }
      ],
      "note": "…"                // optional: era-level caveat (e.g. a gap
                                 // that could not be verified to two sources)
    }
  ]
}
```

Every fact carries the URL it was verified against. Facts that could not be
confirmed by two independent sources were dropped during research — do not
add new ones without a source. `data/research/` holds the per-claim
verification log (confirmed / corrected / dropped, with reasons) and the
completeness critique behind the current dataset.

The F1 era in this file holds only *records and milestones* (youngest-ever
marks, first podium, and so on). Race-by-race F1 results live in
`seasons/*.json` and are never duplicated here.

## signature-moments.json

Five hand-picked moments, each with an official-channel YouTube video ID.
Prose here must not outrun `junior-career.json`: every claim in a moment's
`text` has to be supported by that verified dataset. Before adding an ID,
confirm the channel:

```bash
curl "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json"
```

`author_name` must be `FORMULA 1` or `Mercedes-AMG PETRONAS F1 Team` —
broadcaster rips and fan uploads are rejected on principle.
