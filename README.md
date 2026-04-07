# North York Studio

Fullscreen parallax video homepage deployed to Cloudflare Workers with video hosted on R2.

## How it works

The homepage plays a looping video scaled to 130% of the viewport. Moving the cursor shifts the visible frame in the opposite direction, creating a subtle parallax effect. Audio is muted by default with a toggle in the top-right corner.

## Architecture

- **Site**: Vite build → Cloudflare Workers Static Assets
- **Video**: Hosted on Cloudflare R2 (`nys-media` bucket)
- **Routing**: Cloudflare Worker routes `northyorkstudio.com` → `home.html`, `terry.northyorkstudio.com` → `index.html`

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build to `dist/`
- `npm run deploy` — build + deploy to Cloudflare

## Deployment

1. `npx wrangler login`
2. `npm run deploy`

Video is served from R2 and not included in the repo (`.gitignore`'d). To update the video:

```
npx wrangler r2 object put nys-media/video1.mp4 --file <path> --remote
```
