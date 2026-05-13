# Docs App

This app is the public documentation site for Exeria Charts. It is built with Docusaurus and is intended to host the onboarding flow, API reference, usage guides, and focused live examples that stay aligned with the publishable package surface.

## Local Development

From the repository root:

```bash
npm --prefix apps/docs run dev
```

The site runs on `http://localhost:3001`.

## Build

```bash
npm --prefix apps/docs run build
```

## Content Structure

- `docs/` contains authored documentation pages.
- `src/pages/` contains the custom landing page.
- `src/components/` contains reusable React components for interactive examples.
- `src/css/custom.css` contains site-level theming.

## Content Rules

- Examples should import only from public package entrypoints.
- Keep interactive examples focused on one task at a time.
- Prefer docs pages for stable guidance and `apps/web` for broader exploratory demos.
