---
title: "Guitar Trainer"
description: "An interactive fretboard, ear trainer, backing-track player and progression analyzer for intermediate guitarists."
date: 2026-09-01
featured: true
role: "Design & development"
stack: ["HTML", "CSS", "JavaScript", "Web Audio API"]
cover: "/images/apps/guitar-trainer.jpg"
links:
  - name: "Open the app"
    url: "/apps/guitar-trainer/"
    icon: "external"
---

**MauriFret** helps intermediate guitarists reach an advanced level.

## Sections

- **Explore**: 21 scales and modes on an interactive fretboard, with positions, intervals,
  chord tones, diatonic 7th chords and a drone.
- **Practice**: note finder with a weak-spot heat map, interval and mode ear training,
  and sequence drills with scrolling tab.
- **Improvise**: 14 backing tracks across 5 grooves, with scale suggestions for every chord,
  guide-tone lines and challenges.
- **Analyzer**: type any progression (`Dm7 G7 | Cmaj7`) to get its tonal center, each chord's
  function and the scales that fit, then jam over it.
- **Study plan**: 12 weeks in 3 phases, with a routine timer and practice streak.

All sound is synthesized live in the browser (a Karplus–Strong guitar, bass and drums) using the
Web Audio API. There are no frameworks and no build step.
