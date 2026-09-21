# CRM Plus — Edit Member Level

Web front end for managing CRM Plus member levels.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint (`eslint-config-next`)

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                             |
| --------------- | --------------------------------------- |
| `npm run dev`   | Start the development server            |
| `npm run build` | Create a production build               |
| `npm run start` | Serve the production build              |
| `npm run lint`  | Lint the project                        |

## Project layout

```
src/
  app/
    layout.tsx    # Root layout, fonts and metadata
    page.tsx      # Home page
    globals.css   # Tailwind entry point and theme tokens
public/           # Static assets
```

## Environment variables

None are required yet. When they are added, copy them into a local `.env.local`
file — `.env*` files are git-ignored.
