# riwu-music-frontend-web

Next.js web player and administrative control center for the **riwu-music** platform. Dark-themed streaming UI with search, playlists, play history, async download queue, and RBAC-protected admin dashboard.

## Features

- **Stream Player** — Search and play tracks from YouTube, Google Drive, and local modules
- **Admin Panel** — Toggle media source modules, view system stats, manage user roles (admin only)
- **Hidden Registration** — `/register` route for user and admin account creation
- **Download Queue** — Monitor background download worker tasks
- **Playlists & History** — Authenticated users can save playlists and view play history

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev
```

Make sure the [riwu-music-backend](../riwu-music-backend) is running on `http://localhost:8080`.

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Pages & Routes

| Route       | Description                              |
|-------------|------------------------------------------|
| `/`         | Main stream player with search           |
| `/register` | Hidden registration (user or admin role) |

## Default Login

Use the backend default accounts or register via `/register`:

- **Admin:** `admin@riwu.com` / `admin123`
- **User:** `user@riwu.com` / `user123`

## Tech Stack

- Next.js 13 (App Router)
- TypeScript
- Tailwind CSS
- Lucide React icons

## Related Repos

- [riwu-music-backend](../riwu-music-backend) — Go core server
- [riwu-music-frontend-mobile](../riwu-music-frontend-mobile) — Flutter mobile app
