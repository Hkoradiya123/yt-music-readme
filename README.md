# API Usage Guide

This guide shows how to use the app API, fetch account data, and publish it for GitHub display.

## Base URL

Use your deployment URL or local URL:

- Local: `http://127.0.0.1:8000`
- Hosted: `https://your-app-domain`

## Authentication Model

There are two auth paths:

1. Session auth for private account APIs.
- `/api/recent`
- `/api/now-playing`
- `/api/status`

2. Webhook token auth for ingestion API.
- `/api/webhook`
- `/api/webhook/<token>`

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

1. Login using `APP_EMAIL` and `APP_PASSWORD` from GitHub Secrets.
2. Fetch `/api/now-playing` and `/api/recent?event=scrobble&limit=20`.
3. Build `MUSIC.md`.
4. Replace README block between `MUSIC:START` and `MUSIC:END`.
5. Commit updated files.

### Required GitHub Secrets

- `APP_BASE_URL`
- `APP_EMAIL`
- `APP_PASSWORD`

## Live Music Block

The section below is auto-updated by GitHub Actions.

<!-- MUSIC:START -->

## Listening Now
- No active track

## Recently Played
- No recent scrobbles

_Last updated: pending first workflow run_

<!-- MUSIC:END -->

## Security Notes

- Never commit your webhook token, account password, or session cookies.
- Store credentials only in environment variables or GitHub Secrets.
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
