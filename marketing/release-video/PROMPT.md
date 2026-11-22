# Making the release video

You are writing the spec for the next Enerthya Host release video. The renderer
does the rest.

## Read first

1. `CHANGELOG.md` at the repository root, the section for the version you are
   announcing.
2. The pull requests merged into it (`gh pr view <n>`), for the *why* behind each
   entry. The changelog says what changed; the PR says why it matters.
3. `marketing/releases/<previous version>/video.json`, to keep the voice.

## Write `marketing/releases/<version>/video.json`

```json
{
  "version": "v0.12.14",
  "title": "Enerthya Host v0.12.14",
  "subtitle": "one line, no marketing adjectives",
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "slides": [
    { "kind": "title", "title": "Backups you can prove", "body": "v0.12.14", "seconds": 3 },
    { "kind": "screenshot", "title": "The schedule", "body": "1 hour, keep 7 days", "image": "screenshots/schedule.png", "seconds": 5 },
    { "kind": "text", "title": "What changed", "body": "- scheduled backups\n- retention window\n- S3 delete", "seconds": 4 }
  ]
}
```

Rules:

- **Four to six slides.** One claim per slide. If a release has six features,
  pick the three that change what someone does.
- **Screenshots are real.** Take them from a running panel at 1920×1080; never
  draw a fake interface. Put them in `marketing/releases/<version>/screenshots/`
  next to the spec and reference them relative to that folder.
- **Body text is short.** It is rendered at 32px; more than three lines is cut.
- **No claims the changelog cannot support.** If the release fixes a bug, say
  which bug; do not call it a rewrite.
- **Titles are sentences someone would say out loud**, not nouns in caps.

## Render and check

```sh
node marketing/release-video/render.mjs marketing/releases/<version>/video.json
```

That writes `release.mp4` (git-ignored) and `contact-sheet.jpg` (committed).
Open the contact sheet first: it shows every slide at once and catches a
truncated line or a screenshot of the wrong screen. Then watch the video once,
muted, the way someone scrolling a timeline will.
