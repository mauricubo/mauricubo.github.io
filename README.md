# mauricubo.com

Personal website built with [Hugo](https://gohugo.io) and hosted on GitHub Pages.
Every push to `main` rebuilds and publishes the site automatically
(see [.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

## Run it locally

Install Hugo **extended** (`sudo dnf install hugo` on Fedora, or grab a binary from the
[releases page](https://github.com/gohugoio/hugo/releases)), then:

```bash
hugo server -D      # http://localhost:1313, live reload; -D also shows drafts
```

## Project layout

```
content/
  _index.md            Home page intro text (title + paragraph)
  blog/                Blog posts: one Markdown file per post
  portfolio/           Portfolio projects: one Markdown file per project
  music/_index.md      Intro text for the Music page
  apps.md              Apps page + the "Apps" dropdown in the menu
  about.md             About page (photo + quick facts in the front matter)
  now.md               "What I'm doing now" page
data/music.yaml        Tracks, videos and platform links for the Music page
static/                Files copied as-is (images, audio, favicon...)
static/apps/           The web apps (copied from their own repos, don't edit here)
scripts/sync-apps.sh   Updates static/apps/ from the apps' GitHub repos
layouts/               HTML templates
assets/css/main.css    All styles (colors are CSS variables at the top)
assets/js/main.js      Theme toggle, video embeds, audio player
hugo.toml             Site settings: name, social links, menu
```

## Write a blog post

Create a file in `content/blog/`, e.g. `content/blog/my-robot-arm.md`
(the file name becomes the URL: `/blog/my-robot-arm/`):

```markdown
---
title: "Building a robot arm"
description: "One-line summary shown in lists and link previews."
date: 2026-10-20
tags: ["robotics", "diy"]
cover: "/images/blog/robot-arm.jpg"   # optional
toc: true                             # optional table of contents
draft: false                          # true = hidden on the live site
---

Your post in **Markdown**.

![A photo](/images/blog/robot-arm-2.jpg)
```

Or let Hugo create it for you: `hugo new blog/my-robot-arm.md` (it starts as a draft).

Put images in `static/images/blog/` and reference them as `/images/blog/name.jpg`.

### Embeds you can use inside any post

```markdown
{{< video youtube="https://www.youtube.com/watch?v=VIDEO_ID" title="My video" >}}
{{< video vimeo="123456789" >}}
{{< video url="https://example.com/clip.mp4" >}}
{{< audio src="/music/my-song.mp3" title="My song" >}}
```

## Add a portfolio project

Create `content/portfolio/my-project.md`:

```markdown
---
title: "My project"
description: "What it is, in one sentence."
date: 2025-03-01
featured: true                 # featured projects appear on the home page
role: "Lead developer"
stack: ["Python", "FastAPI"]
cover: "/images/portfolio/my-project.jpg"   # optional, 16:9 works best
links:
  - name: "Repository"
    url: "https://github.com/mauricubo/my-project"
    icon: "github"
  - name: "Live demo"
    url: "https://..."
---

Longer write-up in Markdown.
```

Projects without a cover get a generated colorful placeholder.
There's an example draft in `content/portfolio/example-project.md` you can copy or delete.

## Add music and videos

1. Copy your audio files into `static/music/` (mp3 is the safest format for every browser).
2. List them in [data/music.yaml](data/music.yaml):

   ```yaml
   tracks:
     - title: "My song"
       file: "/music/my-song.mp3"
       description: "Recorded at home, 2026"
       cover: "/images/music/my-song.jpg"   # optional square image
       download: true                        # optional download button
   ```

3. Videos are linked from YouTube, Vimeo or any URL to a video file:

   ```yaml
   videos:
     - title: "Live session"
       youtube: "https://youtu.be/VIDEO_ID"
   ```

Remove the two demo tracks (`static/music/demo-*.mp3` and their entries) before going live.

**Size limits:** GitHub rejects files over 100 MB and recommends keeping a repository under
about 1 GB. A few dozen mp3s is fine. For a large catalogue, host the audio elsewhere (e.g.
Cloudflare R2, Backblaze B2, archive.org) and put the full `https://` URL in `file:`.

## Show, hide or add sections

Each section is controlled by **one file**. Everything about it (visibility, menu link,
menu position) lives at the top of that file:

| Section   | File                          |
|-----------|-------------------------------|
| Blog      | `content/blog/_index.md`      |
| Portfolio | `content/portfolio/_index.md` |
| Music     | `content/music/_index.md`     |
| Apps      | `content/apps.md`             |
| About     | `content/about.md`            |
| Now       | `content/now.md`              |

**Hide a section:** change `draft: false` to `draft: true` under `cascade:`. The page, its menu
link, its block on the home page and every post/project inside it disappear from the live
site. Run `hugo server -D` to keep seeing hidden sections locally while you work on them.
(Files in `static/`, like audio, are still reachable by direct URL.)

**Hide a single post or project:** add `draft: true` to that file only.

**Reorder the menu:** change `weight` under `menu:` (lower numbers come first).

**Add a new section**, e.g. "Uses":

- A single page: create `content/uses.md`:

  ```markdown
  ---
  cascade:
    draft: false
  title: "Uses"
  description: "The gear and software I use every day."
  menu:
    main:
      weight: 60
  ---

  Your content in Markdown.
  ```

- A section with its own list of pages (like the blog): create `content/notes/_index.md` with
  the same front matter, then add pages as `content/notes/anything.md`. They're listed
  automatically, newest first.

## Apps (German Trainer, Guitar Trainer)

The apps are developed in their own repositories
([german_teacher](https://github.com/mauricubo/german_teacher),
[guitar_trainer](https://github.com/mauricubo/guitar_trainer)) and published as part of this
site at `/apps/german-trainer/` and `/apps/guitar-trainer/`.

**Update an app** after changing it in its own repo:

```bash
./scripts/sync-apps.sh     # copies the latest version into static/apps/
git add static/apps && git commit -m "Update apps" && git push
```

**Add another app:**

1. Add a line to `APPS` in [scripts/sync-apps.sh](scripts/sync-apps.sh) and run it.
2. Add an entry under `apps:` in [content/apps.md](content/apps.md). It appears in the menu
   dropdown and on the Apps page.
3. Optional: add a cover image in `static/images/apps/` and a portfolio page in `content/portfolio/`.

To hide one app, remove its entry from `content/apps.md`. To hide all of them, set `draft: true`
in that file. Note that anything in `static/` is public once deployed, so the apps' code is
visible to anyone who opens them, even though their repositories are private.

## Change the name or social links

Edit [hugo.toml](hugo.toml). Available social icons: `github`, `stackoverflow`, `x`,
`linkedin`, `youtube`, `mail`, `music` (see [layouts/partials/icon.html](layouts/partials/icon.html)).

## How it's published

This repository is `mauricubo/mauricubo.github.io`. Every push to `main` runs
[.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds the site with Hugo
and publishes it to GitHub Pages at <https://mauricubo.com>. The first build takes about a minute;
progress is under the repository's **Actions** tab.

Required settings (already done once, listed here for reference):

- **Settings → Pages → Build and deployment → Source: GitHub Actions**
- **Settings → Pages → Custom domain:** `mauricubo.com`, with **Enforce HTTPS** ticked.
- At the DNS provider, the apex domain points to GitHub's `A` records (`185.199.108.153`,
  `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and `www` is a `CNAME` to
  `mauricubo.github.io`.

The workflow uses only GitHub's built-in, short-lived deploy token. There are no stored
secrets, API keys or passwords anywhere in this repository, so there is nothing to leak.
Keep it that way: never commit tokens, `.env` files or private keys.

### Who can edit the site?

Only people with **write access** to the repository can change it. By default that's only you.
Visitors can see the site, and the source code if the repo is public, but they can't modify
anything. To harden it further:

- Don't add collaborators (**Settings → Collaborators**).
- Turn on two-factor authentication on your GitHub account.
- Optional: **Settings → Branches → Add rule** for `main` to block force-pushes and deletions.
- Optional: on GitHub Pro, Pages can be served from a private repository, so the source isn't public either.

Old URLs from the previous site (`/posts/`, `/posts/my-first-post/`) redirect to the new ones.
