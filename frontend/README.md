# Frontend README - QCONNECT V2.0

## Overview

This frontend is a React 18 + Vite + Tailwind CSS application for QCONNECT.

Current user flow:
1. Authenticate (`/login`, `/register`, `/verify`)
2. Complete onboarding (`/profile-setup`)
3. Access home feed (`/home`)

Also available:
- `/feed-demo`: standalone visual feed demo page

---

## Tech Stack

- React 18
- React Router v6
- Vite 5
- Tailwind CSS v3
- Zustand (persisted auth store)
- Axios
- Lucide React

---

## Routing and Guard Logic

Source: `src/App.jsx`

- Public routes:
  - `/login`
  - `/register`
  - `/verify`
  - `/feed-demo`
- Protected routes:
  - `/profile-setup` -> allowed only when authenticated and profile incomplete
  - `/home` -> allowed only when authenticated and profile complete

Redirect rules:
- Unauthenticated -> `/login`
- Authenticated + incomplete profile -> `/profile-setup`
- Authenticated + complete profile -> `/home`

---

## App Boot and API Diagnostics

Source: `src/main.jsx`

On boot, frontend logs:
- whether `VITE_API_BASE_URL` exists
- backend `/health` connectivity status

This helps quickly debug env/CORS/backend availability issues during local setup.

---

## Home Layout (Current Behavior)

Source: `src/components/layout/MainLayout.jsx`

`/home` uses a stable 3-column structure:
- **Left:** Sidebar (reserved layout slot)
- **Center:** Main feed card container
- **Right:** Right panel pinned to the right (`ml-auto` wrapper)

The center and right columns stay stable during sidebar interaction.

---

## Sidebar Interaction Model

Source: `src/components/layout/Sidebar.jsx`

- Outer sidebar wrapper reserves `220px` in layout (`w-[220px] shrink-0`)
- Inner visual rail starts compact (`w-[72px]`)
- On `hover` or `focus-within`, inner rail expands to `220px`
- Labels (nav + create button) reveal with opacity/translate transitions

Result:
- no horizontal reflow of center/right panels
- compact default sidebar appearance

---

## Feed System

## Top tabs

Source: `src/components/layout/TopTabs.jsx`

- `For You`
- `Questions`
- `Quiz`
- `AI News` pill

## Data behavior by tab

Source: `src/components/feed/Feed.jsx`

- `For You`:
  - renders curated dummy feed cards using `src/components/feedDemo/PostCard.jsx`
- `questions`, `quiz`, `ai`:
  - uses `fetchPosts({ tab, cursor, tag })`
  - supports cursor pagination + infinite scroll via `IntersectionObserver`

## Feed demo module

Source: `src/components/feedDemo/*`

Includes modern post-card UI with:
- glassmorphism card style
- image + video media rendering
- like/save local interactions
- media-safe layout (`object-contain`, `h-auto`)

---

## Feed API Contract (Frontend Layer)

Source: `src/api/posts.js`

```js
fetchPosts({ tab, cursor = null, tag = null })
```

Returns:

```js
{ posts: Post[], nextCursor: string | null }
```

Notes:
- Cursor is base64 JSON of `{ createdAt, _id }`
- Tab filters are applied client-side in the current mocked API layer
- Designed to keep feed UI state model stable when replaced by backend API

---

## Theme Tokens

Source: `src/index.css`

```css
--primary: #f59e0b;
--primary-dark: #d97706;
--primary-light: #fef3c7;
--bg: #f5efe6;
--sidebar-bg: #e8dcc8;
--card: #ffffff;
--border: #e5e7eb;
--text1: #1f2937;
--text2: #6b7280;
```

Also defined:
- shimmer skeleton animation
- pulse animation
- feed card entrance animation
- demo feed entrance + like pop animations
- custom scrollbars for feed/community panes

---

## API Layer and Store

## API modules (`src/api`)

- `httpClient.js`: axios setup + auth header + 401 handling
- `auth.js`: auth/register/verify/oauth/session endpoints
- `profile.js`: current profile setup endpoints (`/api/profile/*`)
- `users.js`: legacy users endpoints
- `posts.js`: current frontend feed data source abstraction

## Auth store (`src/store/authStore.js`)

Persisted Zustand state:
- `token`
- `user`
- `isLoading`

Actions:
- `login`
- `logout`
- `setUser`
- `setLoading`

---

## Run Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

---

## Status Snapshot

Implemented:
- auth pages and verification flow
- profile setup flow
- guarded home route
- stable 3-column home layout
- feed tabs + infinite scroll behavior
- demo feed UI module

Still in progress:
- create post workflow UI
- community detail pages
- discussion thread detail pages
- global search results page
- shorts dedicated page
