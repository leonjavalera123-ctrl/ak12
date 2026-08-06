# AK12 — Andrea Kimi Antonelli fan site

An unofficial, scroll-animated tribute to Andrea Kimi Antonelli, Mercedes-AMG
PETRONAS F1 driver, car **#12**. Built with Astro + GSAP ScrollTrigger; race
data is generated from the [Jolpica F1 API](https://api.jolpi.ca/ergast/) by
Python scripts in `scripts/` and committed as static JSON in `data/`.

The centerpiece is a **horizontal career timeline**: scrolling down the page
scrubs sideways through his career, from karting to Formula 1.

## Commands

| Command           | Action                                      |
| ----------------- | ------------------------------------------- |
| `npm install`     | Install dependencies                        |
| `npm run dev`     | Dev server at `localhost:4322/ak12/`        |
| `npm run build`   | Production build to `./dist/`               |
| `npm run preview` | Preview the production build                |

## Ground rules

- Unofficial fan site — not affiliated with Antonelli, Mercedes-AMG PETRONAS,
  or Formula 1. A visible disclaimer stays in the footer.
- Videos: official YouTube embeds only, via click-to-load facades.
- Images: Wikimedia Commons, license-checked, with visible attribution.
- No API keys in the repo — secrets live in `.env` (gitignored) and GitHub
  Actions secrets.
