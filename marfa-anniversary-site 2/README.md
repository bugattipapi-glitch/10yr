# Megan + Jason — 10-Year Anniversary Site

A static anniversary announcement for **December 17–20, 2026 in Marfa, Texas**. The project is ready to upload to GitHub and deploy on Vercel without a framework, package manager, or build step.

## What is included

- A pinned, full-screen West Texas Milky Way hero
- Random twinkling stars and an occasional shooting star with a trailing tail
- Six real-photo Marfa landmark cutouts that rise into the bottom of the hero as the page scrolls
- A vintage postcard treatment with overlapping cutouts, paper borders, tape, a flickering Stardust sign, and a Marfa postmark
- The streamlined anniversary announcement and low-pressure invitation copy
- A continuous dark, starry background behind the invitation, closing message, and timeline
- A glowing gold “wand” timeline for 2013, 2015, 2016, 2022, 2023, 2024, and Beyond
- Placeholder memory cards that open on hover, keyboard focus, or tap
- A secret Marfa-themed crossing game at `beyond.html`
- Desktop, tablet, and phone layouts, including mobile game controls
- Reduced-motion and no-JavaScript fallbacks
- A collapsible photo-credit and license section in the footer

## Project files

- `index.html` — names, dates, invitation copy, timeline points, and photo credits
- `styles.css` — main-site layout, typography, postcard effects, and animation
- `script.js` — stars, shooting stars, pinned-hero scroll animation, reveals, and timeline interactions
- `beyond.html` — secret mini-game page
- `game.css` — mini-game page and board styling
- `game.js` — Jeep controls, three obstacle lanes, collision resets, and win state
- `assets/west-texas-milky-way.webp` — hero image
- `assets/landmarks/` — transparent Marfa landmark cutouts
- `assets/timeline/` — temporary timeline placeholder artwork
- `assets/game/` — the Valentine and Marfa Spirit Co. images plus Jeep and obstacle sprites
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

## Replace the timeline placeholders

The current placeholder files are:

```text
assets/timeline/2013.svg
assets/timeline/2015.svg
assets/timeline/2016.svg
assets/timeline/2022.svg
assets/timeline/2023.svg
assets/timeline/2024.svg
```

The quickest replacement method is to export each real photo as a JPG or WebP, put it in `assets/timeline/`, and update the matching `<img src="...">` inside `index.html`. The cards use `object-fit: cover`, so both portrait and landscape photos will crop cleanly.

Example:

```html
<img src="assets/timeline/2013.jpg" alt="Megan and Jason in Marfa in 2013" />
```

The desktop interaction uses hover and keyboard focus. Phones and tablets open and close a card by tapping its year.

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
- Adjust obstacle speed, spacing, hitboxes, or Jeep movement in `game.js`.

Desktop controls are the arrow keys or WASD. Touch controls appear on phones and tablets. A collision returns the Jeep to the Valentine sidewalk; reaching the right sidewalk opens the win screen.

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

The site footer contains the clickable source and license links for the hero and landmark photography. The current sources are:

- Davis Mountains Milky Way — Carl Young, CC BY-SA 4.0
- El Cosmico teepees — Maher El Aridi, CC0 1.0
- Stardust sign — Lars Plougmann, CC BY-SA 2.0
- Highland Avenue — Matthew Rutledge, CC BY 2.0
- Concrete works — Jgc3, CC BY-SA 3.0
- Presidio County Courthouse — Talshiarr, CC BY-SA 2.5
- Marfa water tower — Todd Dwyer, CC BY-SA 3.0

The Valentine and Marfa Spirit Co. photographs and the game character artwork were supplied by Megan and Jason and are credited on the game page.
