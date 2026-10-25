LEGACY HERO VIDEO
=================

hero-loop.mp4 — the clinic-tour reel from Soie's own Instagram
(reception with the lit sign, treatment prep, the equipment rooms),
prepared for the web:

  - H.264 high profile, CRF 26, 25 fps, audio stripped (plays silent)
  - 360x640 portrait source, 68 s, ~1.9 MB, +faststart
  - poster frame: ../images/hero-poster.jpg (the reception shot)

This is an archived asset. The homepage now uses the site's plain light
background and does not load this film.

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

CUTERA EXCEL HR LOOP
===================

cutera-excel-hr.mp4 combines both clinic-supplied MOV clips in the requested order:

  1. IMG_1630.mov: 2.733 s (82 frames), the short device introduction
  2. IMG_1954.mov: 12.800 s (384 frames), the treatment-control close-up

The complete 15.533 s sequence repeats, so the short clip always starts each loop.
The source MOV files remain outside the checkout.

  - H.264 High, yuv420p, 720x1280 portrait, 30 fps, CRF 23, no audio
  - Original phone rotation applied; BT.709 with consistent limited-range output
  - MP4 faststart; approximately 1.6 MB (original clips combined: 13.1 MB)
  - Location and other source metadata removed from the published file
  - Poster: posters/cutera-excel-hr.jpg, from 0.3 s in the opening clip

Devices and device-cutera.html share this file and the existing data-film player:
deferred loading on approach, muted inline playback while visible, pause/resume
control, offscreen pause, and a still poster for reduced-motion or Save-Data.
The two clips are concatenated during encoding; no browser playlist or extra
video download is needed at the transition.

FINEXEL FRACTIONAL CO2 LOOP
=========================

finexel-fractional-co2.mp4 comes from the clinic's supplied 17.8 s screen recording.
The source remains outside the checkout. The published loop keeps these source ranges:

  1. 0.000 to 5.266667 s: device overview, controls and treatment close-ups
  2. 8.200 to 13.600 s: treatment close-ups

Both appearances of the practitioner and the phone control-centre / stop-recording
sequence are excluded. The 1320x2868 recording is cropped to its central
1320x2346 picture at x=0, y=260, removing the phone's surrounding black bars.
The clinic watermark and treatment footage remain intact.

  - 10.666667 s, 320 frames, 720x1280 portrait, 30 fps
  - H.264 High level 3.1, CRF 23, yuv420p, BT.709 limited range, no audio
  - MP4 faststart; approximately 1.6 MB (original recording: 10.0 MB)
  - Source metadata removed
  - Poster: posters/finexel-fractional-co2.jpg, from 0.1 s of the edited loop

Uses the same data-film player on Devices and device-finexel.html. The unopened
tab does not fetch its video. Playback is muted and inline, loops while visible,
and pauses offscreen or when a different device is selected. Reduced-motion
and Save-Data preferences keep the poster instead.
