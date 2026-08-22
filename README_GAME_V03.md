# Knowledge Quest v0.3 — Connected Knowledge

This version keeps the v0.2 level map, history, streaks, wrong-answer book and badges, and upgrades the post-answer Knowledge Note.

## What changed

After an answer is selected, the page now:

1. immediately shows the local answer note;
2. searches English Wikipedia for the most relevant article using the correct answer + subject;
3. searches Wikimedia Commons for a related image;
4. replaces the placeholder visual with the returned image when available;
5. adds a short Wikipedia introduction and a source link;
6. caches results in localStorage so repeat questions load faster;
7. falls back to the local note and generated visual if the network request fails.

No API key is required.

## Install

Replace these four v0.2 files in the website root:

- game.html
- game.css
- game.js
- questions.js

Then preview `game.html` with Live Server.

Publish with:

```bash
git add .
git commit -m "Add connected knowledge to quiz"
git push
```

## Why Wikipedia + Wikimedia Commons?

A static Cloudflare Pages site cannot safely store a private Google/Bing search API key in browser JavaScript. Wikipedia and Wikimedia provide public APIs that support browser requests and provide clearer source/licensing information for educational use.

## Notes

- Search results depend on the query and may occasionally select a related but imperfect article/image.
- The local answer note remains the authoritative fallback for the quiz.
- For especially important questions, you can still set a manual `image` field in `questions.js` and/or later add a custom `search` field for tighter matching.
