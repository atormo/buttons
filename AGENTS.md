<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Buttons

Open source button builder. Production site: https://buttons.tormo.at

This repository is independent from `tormo.at`. Do not change the portfolio site from here.

## Commands

- `npm run dev`
- `npm run typecheck`
- `npm test`
- `npm run build` (typecheck + tests + Next.js build)

Node `>=22.12.0`. No env vars.

## Layout

- `app/page.tsx` renders `ButtonBuilder`
- `app/api/icons/route.ts` proxies Iconify collections and falls back to a featured list
- `components/button-builder/` is the product
  - `button-builder-types.ts`: `ButtonConfig`
  - `button-output.ts`: CSS, Tailwind, HTML, React, prompt, SVG, PNG
  - `button-color-utils.ts`: OKLCH helpers
  - `button-presets.ts`, `button-fonts.ts`, `button-icons.ts`: data
  - `button-builder.tsx` and friends: UI
- `tests/` covers the generators

Keep generation logic portable. Do not hide export behavior inside React components if it can live in `button-output.ts`.
