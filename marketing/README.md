# Marketing

Material for release announcements.

Like Coolify's `marketing/` folder, the video is generated from a spec rather
than edited by hand: one `releases/<version>/video.json` per release, and
`release-video/` holds the renderer and the prompt an agent follows.

| Path | Content |
| --- | --- |
| `release-video/render.mjs` | Builds the mp4 and the contact sheet from a `video.json` |
| `release-video/PROMPT.md` | Instructions for an agent writing the next `video.json` |
| `releases/<version>/video.json` | Slides for that release: title, screenshots, highlights |
| `releases/<version>/release.mp4` | The video; not in git |
| `releases/<version>/contact-sheet.jpg` | Every slide in one image; small enough to commit |

The renderer needs `ffmpeg` on the PATH and nothing else — no Node dependencies,
no browser download. It draws each slide to a PNG and joins them with a short
cross-fade.

```sh
node marketing/release-video/render.mjs marketing/releases/v0.12.13/video.json
```
