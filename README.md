# Swagger / OpenAPI Editor

A web application that combines an **OpenAPI/Swagger editor**, an **interactive viewer
with a built-in REST client**, and per-user **request history & analytics**.

Users can paste or write an OpenAPI/Swagger specification (JSON or YAML), instantly
preview all endpoints, send test requests through a server-side proxy (no CORS issues),
and — when authenticated — save schemas and review a history of executed requests.

## Live Demo

<!-- TODO: add the Vercel deployment link here -->

## Tech Stack

- **Next.js** (App Router) + **TypeScript**
- **Supabase** — authentication + PostgreSQL
- **Monaco** — code editor
- **next-intl** — internationalization (i18n)
- **Vitest** + **React Testing Library** — testing
- Deployed on **Vercel** (SSR)

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment variables

See `.env.example`. You will need a Supabase project URL and anon key.

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **Settings → API**, copy the `Project URL` and `anon public` key into
   `.env.local` (see `.env.example`).
3. Open the **SQL Editor** and run `supabase/migrations/0001_init.sql` to create
   the `schemas` and `requests` tables with Row Level Security.
4. Email/password auth is enabled by default — no extra config needed.

## Scripts

```bash
npm run dev        # start dev server
npm run build      # production build
npm run lint       # ESLint
npm run format     # Prettier
npm run test       # unit tests
```

## Team

- Alkatraz911 — team lead
-
-

## License

RS School educational project.
