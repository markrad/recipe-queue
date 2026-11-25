# Recipe queue server
![GitHub Release](https://img.shields.io/github/v/release/markrad/recipe-queue)
![GitHub License](https://img.shields.io/github/license/markrad/recipe-queue)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/markrad/recipe-queue/docker-image.yml)

A small Bun + TypeScript + Express + Pug app that queues Facebook Reel
links for later import into Mealie.

## Endpoints

- `GET /` — form and queued links
- `POST /submit` — form field `url`, must be an `https://facebook.com` link.
  Duplicate URLs are not queued twice.
- `GET /queue` — JSON feed for the scheduled Muse processor
- `POST /queue/:id/complete` — optional status update, with
  `{ "status": "done" | "failed", "mealieSlug": "...", "error": "..." }`
- `GET /health` — `{ "ok": true }`

## Persistence

The queue is a JSON file, written atomically (temporary file, then rename),
at the path in `QUEUE_FILE`. In Docker, that path is `/app/data/queue.json`
and `./data` on the host is mounted there, so the queue survives a container
restart. Do not store it in `/tmp`.

## Run locally

```sh
bun install
bun run dev
```

Then open http://localhost:3010

## Run in Docker

```sh
docker compose up --build -d
```

Then open http://localhost:3010, and point your Cloudflare tunnel at
`localhost:3010` on that host.

## Access protection

Put the tunnel behind Cloudflare Access, or another login you control,
before exposing the form publicly. Otherwise anyone who finds the address
could submit links.

If `QUEUE_TOKEN` is set, `/queue` and `/queue/:id/complete` require it as
an `x-queue-token` header. If your tunnel is behind Cloudflare Access,
give the Muse processor a way through that check as well, such as a
Cloudflare service token, or keep the API path under the token check
instead of the browser login.

## Muse processor

Once the tunnel address is known, a scheduled Muse check will poll
`GET /queue`, import new links with the Facebook Reel to Mealie workflow,
and report each verified import, including its Mealie slug, serving count,
times, ingredient count, and instruction count. If a Reel needs a signed-in
video check and a one-time code, that entry stays pending until you
approve the code.

You need an AI to do this. Any AI should be fine. I used Muse since it seemed highly unlikely that Meta would ever block their own AI from Facebook.
