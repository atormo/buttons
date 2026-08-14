# Contributing

Issues and pull requests are welcome.

## Setup

```bash
npm install
npm run dev
```

Node 22.12 or newer.

## Before you open a PR

```bash
npm run typecheck
npm test
npm run build
```

Keep the change focused. If you are changing how a button looks when exported, add or update a test in `tests/`.

## Where things live

- Generation logic: `components/button-builder/button-output.ts`
- Config shape: `components/button-builder/button-builder-types.ts`
- UI: `button-builder.tsx`, `button-controls.tsx`, `icon-picker.tsx`, `oklch-color-picker.tsx`
- Icon catalog API: `app/api/icons/route.ts`

Try not to mix UI work into the generators. The useful part of this repo is that those stay portable.

## Style

Match the files around your change. No new dependencies unless the feature really needs one.
