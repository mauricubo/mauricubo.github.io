---
# VISIBILITY: set `draft: true` to hide this from the live site
# (its page, its menu link, its home-page block and everything inside it).
# Preview hidden things locally with: hugo server -D
cascade:
  draft: false
title: "Apps"
description: "Small web apps I've built. They run entirely in your browser: no sign-up, no tracking, and your progress stays on your device."
layout: "apps"
menu:
  main:
    weight: 25   # position in the top menu
# Each app lives in static/apps/<folder>/ (copied by scripts/sync-apps.sh).
# Remove an entry here to hide it from the menu and this page.
apps:
  - name: "German Trainer"
    tagline: "Learn German from A2 to C2"
    description: "DeutschWeg: a complete learning path with spaced repetition, grammar drills, reading, dictation, speaking practice and writing exercises."
    url: "/apps/german-trainer/"
    cover: "/images/apps/german-trainer.jpg"
    tags: ["German", "Spaced repetition", "Speech"]
  - name: "Guitar Trainer"
    tagline: "Scales, ear training & improvisation"
    description: "MauriFret: an interactive fretboard with 21 scales, ear-training games, backing tracks, a chord-progression analyzer and a 12-week study plan."
    url: "/apps/guitar-trainer/"
    cover: "/images/apps/guitar-trainer.jpg"
    tags: ["Guitar", "Music theory", "Web Audio"]
---
