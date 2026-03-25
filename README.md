# North York Studio

Static multi-page site built with Vite and deployable to Cloudflare Workers Static Assets.

## Distribution

### Claude Code plugin marketplace

This repo now doubles as a Claude Code plugin marketplace.

1. Add the marketplace:
   `/plugin marketplace add lehzhu/north-york-studio`
2. Install the Terry plugin:
   `/plugin install terry-roast@north-york-studio`

The plugin itself lives in `plugins/terry-roast/` and exposes the `terry-roast` skill.

### Direct skill downloads

- Claude skill: `public/downloads/claude/skills/terry-roast/SKILL.md`
- Codex skill bundle: `public/downloads/terry-roast-bundle.zip`

## Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run cf:dev`
- `npm run deploy`

## Deployment

1. Log in to Cloudflare: `npx wrangler login`
2. Build and deploy: `npm run deploy`
3. In Cloudflare, attach the production domain to the deployed Worker/asset project.

## Notes

- The production build outputs to `dist/`.
- The `public/downloads/` directory is copied through unchanged so download links remain stable.
- This setup stays portable: any host that can serve the contents of `dist/` can run the site.
