# North York Studio

Static multi-page site built with Vite and deployable to Cloudflare Workers Static Assets.

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
