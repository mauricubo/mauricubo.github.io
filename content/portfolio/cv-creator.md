---
title: "CV Creator"
description: "A private, in-browser CV builder that exports real Word (.docx) files and PDFs, with no server and no dependencies."
date: 2026-11-11
featured: true
role: "Design & development"
stack: ["HTML", "CSS", "JavaScript (ES modules)", "Office Open XML"]
cover: "/images/apps/cv-creator.jpg"
links:
  - name: "Open the app"
    url: "/apps/cv-creator/"
    icon: "external"
---

**CV Creator** lets you write a CV with a live preview and export it, without creating an account or
sending your data anywhere.

## Features

- **Four formats**: Professional, Classic, Modern (two columns with a sidebar) and ATS Simple for
  applicant tracking systems. Switch at any time without losing your content.
- **Flexible sections** that you can add, rename, reorder and delete: paragraphs, label-and-text lines,
  jobs and studies with bullets, and bullet lists.
- **Export to Word**: a real `.docx` file generated in the browser, with hyperlinks, bullets, a footer
  with page numbers and the photo. The ZIP container and the Office Open XML are written from scratch.
- **Export to PDF** through the browser's print engine, so the text stays selectable and links keep working.
- **Save and import** your data as JSON, with optional autosave in the browser.

## Privacy and security by design

- **Your data stays with you**: no server, no analytics, no fonts or scripts from other sites, and
  network requests are blocked entirely.
- **Strict Content Security Policy and Trusted Types**: only the app's own scripts can run, and HTML
  can't be injected from text.
- **Safe links**: only `http(s)` and `mailto` links are produced.
- **Photos are re-encoded** through a canvas, which removes metadata such as GPS location and any
  hidden payloads.
- **Imported files are validated**, so unknown fields and oversized data are rejected.
