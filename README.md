# Megan + Jason — 10-Year Anniversary Site

A static anniversary announcement for **December 17–20, 2026 in Marfa, Texas**. The project is ready to upload to GitHub and deploy on Vercel without a framework, package manager, or build step.

## What is included

- A pinned, full-screen West Texas Milky Way hero
- Random twinkling stars and an occasional shooting star with a correctly trailing tail
- Six real-photo Marfa landmark cutouts that rise into the lower quarter of the hero as the page scrolls
- A desktop-specific collage arrangement that groups the El Cosmico teepees at the far right and places the courthouse beside the Stardust sign
- A vintage postcard treatment with overlapping cutouts, paper borders, tape, a flickering Stardust sign, and a Marfa postmark
- The streamlined anniversary announcement and low-pressure invitation copy
- A continuous dark, starry background behind the invitation, closing message, and timeline
- A glowing gold, wand-like timeline with **nine memory points plus Beyond**
- Forty-four personal Marfa photographs, grouped chronologically by filename across the nine memory points
- Photo fans that open on desktop hover or click and on phone/tablet tap, while remaining fully contained inside the timeline section
- A secret Marfa-themed crossing game at `beyond.html`
- Roadrunners, tornadoes, and hot dogs already moving in all three lanes when the game begins
- An original looping outlaw-country-style instrumental, **“Desert Detour,”** with an on-page music toggle
- Desktop, tablet, and phone layouts, including mobile game controls
- Reduced-motion and no-JavaScript fallbacks
- A collapsible photo-credit and license section in the footer

## Project files

- `index.html` — names, dates, invitation copy, memory-photo groups, and photo credits
- `styles.css` — main-site layout, typography, postcard effects, timeline fans, and animation
- `script.js` — stars, shooting stars, pinned-hero scroll animation, reveals, and timeline interactions
- `beyond.html` — secret mini-game page and music player
- `game.css` — mini-game page and board styling
- `game.js` — Jeep controls, obstacle lanes, collision resets, music behavior, and win state
- `assets/west-texas-milky-way.webp` — hero image
- `assets/landmarks/` — transparent Marfa landmark cutouts, including the grouped desktop teepee asset
- `assets/timeline/` — 44 optimized personal memory photographs
- `assets/game/` — Valentine and Marfa Spirit Co. images plus Jeep and obstacle sprites
- `assets/audio/desert-detour.mp3` and `assets/audio/desert-detour.ogg` — original game music
- `vercel.json` — static deployment settings and basic security headers

## Change names, dates, or wording

Open `index.html` in a text editor and search for any text you want to change, including:

```text
Megan
Jason
December 17–20, 2026
Thursday, December 17
Ten years down. Still starry-eyed.
```

All visible invitation copy is in `index.html`.

## Edit the memory timeline

The timeline has nine photo points followed by **Beyond**. Only the first and fifth memory points display year labels—**2013** and **2020**—while the other photo points are intentionally unlabeled.

The optimized images are stored in:

```text
assets/timeline/
```

They are grouped in ascending filename order, beginning with `img_6755.webp` and ending with `img_6819.webp`. The groups currently contain:

```text
5 / 5 / 5 / 5 / 5 / 5 / 5 / 5 / 4 photos
```

To replace an image, export a JPG or WebP and update the corresponding `<img src="...">` in `index.html`. The photo cards preserve each image’s natural aspect ratio rather than cropping it. For best performance, keep replacement images near 1100 pixels on their longest edge.

Desktop users can hover over a point for a temporary fan or click it to open and close the fan. Phones and tablets toggle a fan by tapping its point. Only one memory fan stays open at a time.

The supplied personal photos were auto-rotated, resized, converted to WebP, and saved without EXIF metadata before being added to the site.

## Change the hero image

Replace:

```text
assets/west-texas-milky-way.webp
```

with another wide WebP using the same filename. A photo with mostly sky and a low, dark horizon works best because the landmark collage enters across the lower quarter of the hero.

Update the hero credit in the footer of `index.html` whenever the source changes.

## Edit the secret game

The game is linked only from **Beyond** on the timeline.

- Replace the Valentine cutout at `assets/game/valentine-cutout.png`.
- Replace the Marfa Spirit Co. postcard image at `assets/game/marfa-spirit.webp`.
- Edit the game instructions and win message in `beyond.html`.
- Replace the transparent Jeep, roadrunner, or tornado sprites at `assets/game/jeep-sprite.png`, `assets/game/roadrunner-sprite.png`, and `assets/game/tornado-sprite.png`.
- Adjust obstacle speed, starting positions, spacing, hitboxes, or Jeep movement in `game.js`.
- Replace the music files in `assets/audio/` while retaining the existing filenames, or update the `<source>` paths in `beyond.html`.

Desktop controls are the arrow keys or WASD. Touch controls appear on phones and tablets. A collision returns the Jeep to the Valentine sidewalk; reaching the right sidewalk opens the win screen.

Modern browsers block unprompted audio. The music therefore starts after the visitor presses **Start crossing**, uses a game control, or presses an arrow/WASD key. The music button can mute or resume it at any time.

“Desert Detour” is an original royalty-free instrumental created specifically for this site, so no outside music license or attribution is required. Its credit remains visible in the game footer.

## Preview locally

From the project folder, run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

## Deploy through GitHub and Vercel

1. Create a new GitHub repository.
2. Upload the contents of this folder, keeping `index.html` at the repository root.
3. In Vercel, choose **Add New → Project** and import the repository.
4. Set the framework preset to **Other**.
5. Leave the build command empty.
6. Set the output directory to `.` only if Vercel asks for one.
7. Deploy.

Because `cleanUrls` is enabled in `vercel.json`, the secret page may appear publicly as `/beyond` even though the source file is `beyond.html`.

## Photograph credits

The site footer contains clickable source and license links for the hero and landmark photography. The current sources are:

- Davis Mountains Milky Way — Carl Young, CC BY-SA 4.0
- El Cosmico teepees — Maher El Aridi, CC0 1.0
- Stardust sign — Lars Plougmann, CC BY-SA 2.0
- Highland Avenue — Matthew Rutledge, CC BY 2.0
- Concrete works — Jgc3, CC BY-SA 3.0
- Presidio County Courthouse — Talshiarr, CC BY-SA 2.5
- Marfa water tower — Todd Dwyer, CC BY-SA 3.0

The 44 timeline photographs, the Valentine and Marfa Spirit Co. photographs, and the game character artwork were supplied by Megan and Jason. The game page includes a concise credit for the supplied imagery and original music.
