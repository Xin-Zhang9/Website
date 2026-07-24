# Xin Zhang Scientific Gallery — Version 0.1

## Files to upload to GitHub

Upload everything in this folder:

- index.html
- styles.css
- script.js
- assets/

`index.html` must be in the top level of the repository.

## Add videos later

Place MP4 files at:

- assets/videos/hero.mp4
- assets/videos/story-01.mp4
- assets/videos/story-02.mp4
- assets/videos/story-03.mp4

The website works without them because fallback backgrounds are included.

Recommended video format:
- MP4
- H.264
- muted
- 8–20 second seamless loop
- ideally under 15 MB per background video

## Edit links

Open index.html and replace the `#` links for:
- LinkedIn
- CV
- Publications

## Add your images

Replace a placeholder such as:

<div class="placeholder">
  <span>Add your image</span>
</div>

with:

<img class="project-image" src="assets/images/my-image.jpg" alt="Description">

Then add this to styles.css:

.project-image {
  width: 100%;
  height: 420px;
  object-fit: cover;
  display: block;
}

## Cloudflare Pages

Framework preset: None
Build command: leave blank
Build output directory: /

After deployment, add xin-zhang.com under Custom domains.

## Future updates

This website can be changed at any time. Update the files in GitHub and Cloudflare Pages will deploy the new version automatically.
