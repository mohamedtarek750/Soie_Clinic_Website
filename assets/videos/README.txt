HERO VIDEO
==========

hero-loop.mp4 — the clinic-tour reel from Soie's own Instagram
(reception with the lit sign, treatment prep, the equipment rooms),
prepared for the web:

  - H.264 high profile, CRF 26, 25 fps, audio stripped (plays silent)
  - 360x640 portrait source, 68 s, ~1.9 MB, +faststart
  - poster frame: ../images/hero-poster.jpg (the reception shot)

It plays as the homepage hero background: autoplay, muted, loop,
playsinline, behind a dark veil for text readability. Users with
prefers-reduced-motion get the still poster instead (script.js), and
the whisper of blur in style.css §26 hides upscaling artifacts on
large screens.

To swap in a new clip, replace hero-loop.mp4 (and ideally the poster)
with the same settings. A landscape 1920x1080 master, 10-20 s seamless
loop, under 8 MB, would look even sharper on big desktop displays.

INDIBA SESSION LOOP
===================

indiba-session.mp4 is the clinic-supplied six-second portrait clip, prepared
for the Devices and INDIBA pages. The original MOV is kept outside the checkout.

  - H.264 High, yuv420p, 720x1280, 30 fps, CRF 23, no audio
  - HLG / BT.2020 converted to SDR / BT.709 for consistent browser colour
  - MP4 faststart; approximately 1.7 MB (original: 17.1 MB)
  - Poster: posters/indiba-session.jpg, taken from the same video

The existing data-film / initFilms player loads the file on approach,
automatically plays it muted and inline when visible, and loops it. It pauses
offscreen or in a hidden tab, and includes a pause/resume control. Reduced-motion
and Save-Data preferences show the poster instead. No Google Drive embed is used.
