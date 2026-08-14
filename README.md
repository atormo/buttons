# Buttons

[Live site](https://buttons.tormo.at) · [tormo.at](https://tormo.at)

A button builder. Design one, preview it live, then copy CSS, Tailwind, or a prompt, or export SVG and PNG.

[![Buttons preview](docs/preview.jpg)](https://buttons.tormo.at)

MIT licensed. Fork it, lift the generation logic, or run your own instance.

## What it does

- Live preview you can drag, zoom, and restyle
- Presets: Clean, Skeuomorphic, Glass, Prism, Brutalist, Soft, Terminal, Candy
- OKLCH color picker for fill, stroke, text, icon, and shadow
- Solid or gradient fill and stroke
- Rounded or pixel corners
- Icons from Lucide, Phosphor, and Pixelarticons
- A big font list, with weight and italic when the face supports it
- Copy CSS, Tailwind, HTML, React, or a rebuild prompt
- Export SVG or PNG at 1x to 4x

No accounts. No database. No env vars. The only network call is Iconify, for the icon catalog and SVG bodies.

## Use the logic

The app is a thin Next.js shell. The reusable part lives in `components/button-builder/`.

| File | What it is |
| --- | --- |
| `button-builder-types.ts` | `ButtonConfig` and `DEFAULT_CONFIG` |
| `button-output.ts` | CSS, Tailwind, HTML, React, prompt, SVG, PNG |
| `button-color-utils.ts` | OKLCH conversion |
| `button-presets.ts` | Starting looks |
| `button-fonts.ts` | Font catalog and Bunny Fonts URLs |
| `button-icons.ts` | Icon libraries and Iconify URLs |
| `button-builder.tsx` | The UI |

You can copy those files into another project and keep the UI, or throw the UI away and just call the generators.

```ts
import { DEFAULT_CONFIG } from "./button-builder-types";
import { getCssCode, getTailwindClasses, createSvgMarkup } from "./button-output";

const config = {
  ...DEFAULT_CONFIG,
  label: "Get started",
  fill: "#171717",
  textColor: "#ffffff",
};

getCssCode(config);
getTailwindClasses(config);
await createSvgMarkup(config);
```

`ButtonConfig` is a plain object. Serialize it, store it, share it, generate a gallery from it. The tests in `tests/` cover the generators, so you can change output without guessing.

## Run it locally

Node 22.12 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run typecheck
npm test
npm run build
```

`npm run build` runs typecheck, tests, and the Next.js production build.

## Deploy

Any host that can run Next.js 16 on Node 22. Production is at [buttons.tormo.at](https://buttons.tormo.at).

There are no required environment variables. The icon picker talks to `api.iconify.design`. If that request fails, the API route falls back to a small featured set so the builder still works.

## License

[MIT](LICENSE). Use the code, the logic, and the output however you want.
