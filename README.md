# API Usage Guide

This guide shows how to use the app API, fetch account data, and publish it for GitHub display.

## Base URL

Use your deployment URL or local URL:

- Local: `http://127.0.0.1:8000`
- Hosted: `https://your-app-domain`

## Authentication Model

There are three auth paths:

1. Session auth for private account APIs.
- `/api/recent`
- `/api/now-playing`
- `/api/status`

2. Webhook token auth for ingestion API.
- `/api/webhook`
- `/api/webhook/<token>`

3. Webhook token auth for public read API (no email/password).
- `GET /api/public/<token>`
- Returns now playing, recent items, and stats for that token owner.

## 1) Login and Fetch Private API Data

Private API endpoints require a valid session cookie.

### Step A: Login and store cookie

```bash
curl -i -c cookies.txt -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=YOUR_EMAIL&password=YOUR_PASSWORD" \
  http://127.0.0.1:8000/login
```

### Step B: Fetch now playing

```bash
curl -b cookies.txt http://127.0.0.1:8000/api/now-playing
```

### Step C: Fetch recent events

```bash
# all event types (default)
curl -b cookies.txt "http://127.0.0.1:8000/api/recent?limit=20"

# only played songs (scrobbles)
curl -b cookies.txt "http://127.0.0.1:8000/api/recent?event=scrobble&limit=20"
```

### Step D: Fetch account status summary

```bash
curl -b cookies.txt http://127.0.0.1:8000/api/status
```

## 2) Webhook Ingestion API

Use your account webhook token from the Account page.

### Path token form

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "event": "nowplaying",
    "song": {
      "artist": "Daft Punk",
      "track": "Digital Love",
      "album": "Discovery"
    }
  }' \
  "http://127.0.0.1:8000/api/webhook/YOUR_WEBHOOK_TOKEN"
```

### Header token form

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Recently-Played-Token: YOUR_WEBHOOK_TOKEN" \
  -d '{
    "event": "scrobble",
    "song": {
      "artist": "Kavinsky",
      "track": "Nightcall",
      "album": "OutRun"
    }
  }' \
  "http://127.0.0.1:8000/api/webhook"
```

## 3) Fetch Data Directly Using Webhook URL (No Login Required)

You can fetch data directly from the webhook URL using `GET`, without session login.

### Direct URL pattern

```text
GET /api/public/<YOUR_WEBHOOK_TOKEN>
```

### Your hosted example

```text
http://jinksqspider-live-listening-diary.hf.space/api/public/<YOUR_WEBHOOK_TOKEN>
```

### Fetch only played songs (scrobbles)

```bash
curl "http://jinksqspider-live-listening-diary.hf.space/api/public/<YOUR_WEBHOOK_TOKEN>?event=scrobble&limit=3"
```

### Fetch all event types

```bash
curl "http://jinksqspider-live-listening-diary.hf.space/api/public/<YOUR_WEBHOOK_TOKEN>?event=all&limit=3"
```

### Public read response shape

```json
{
  "ok": true,
  "user": {
    "display_name": "Your Name"
  },
  "now_playing": {
    "artist": "...",
    "track": "..."
  },
  "recent": [
    {
      "event_type": "scrobble",
      "artist": "...",
      "track": "..."
    }
  ],
  "stats": {
    "total_scrobbles": 0,
    "last_updated": "...",
    "top_artist": "..."
  },
  "count": 0,
  "limit": 3,
  "event": "scrobble"
}
```

## API Response Shapes

### GET /api/now-playing

```json
{
  "ok": true,
  "item": {
    "event_type": "nowplaying",
    "artist": "Artist",
    "track": "Track",
    "album": "Album",
    "artwork_url": "...",
    "received_at_human": "1m ago"
  }
}
```

### GET /api/recent

```json
{
  "ok": true,
  "items": [
    {
      "event_type": "scrobble",
      "artist": "Artist",
      "track": "Track",
      "album": "Album"
    }
  ],
  "count": 123,
  "limit": 20,
  "event": "scrobble"
}
```

## Display Data on GitHub

GitHub README is static, so fetch API data on a schedule, write output files, then commit them.

Current repo setup uses `.github/workflows/update.yml` to:

1. Fetch from `GET /api/public/<token>?event=scrobble&limit=3` using the hardcoded base URL `https://live-listening-diary.vercel.app`.
2. Use `now_playing` and `recent` from response.
3. Build `MUSIC.md`.
4. Replace README block between `MUSIC:START` and `MUSIC:END`.
5. Commit updated files.

### Required GitHub Secrets

- `WEBHOOK_TOKEN`

## Live Music Block

The section below is auto-updated by GitHub Actions.

<!-- MUSIC:START -->

## Now Playing
- No active track

## Recent 3 Tracks
1. No recent scrobbles

_Last updated: pending first workflow run_

<!-- MUSIC:END -->

## Security Notes

- Never commit your webhook token, account password, or session cookies.
- Store token/credentials only in environment variables or GitHub Secrets.
- If token/password leaks, rotate immediately.

## Troubleshooting

### 401 on private API

- Session cookie missing or expired.
- Re-run login and use `-b cookies.txt`.

### 403 on webhook

- Wrong webhook token.
- Use account-specific token from `/account`.

### Database connection errors in cloud

- Verify `DATABASE_URL` points to Supabase IPv4 pooler host.
- Include `?sslmode=require`.
