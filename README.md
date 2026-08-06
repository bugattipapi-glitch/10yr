# Megan + Jason — 10-Year Anniversary Site

A static, one-page anniversary announcement for **December 17–20, 2026 in Marfa, Texas**. It is ready to upload to GitHub and deploy on Vercel without a framework, package manager, or build step.

## What is included

- A real nighttime photograph of El Cosmico in Marfa
- Randomly twinkling stars and occasional shooting stars
- A scroll-revealed collage made from real Marfa photographs
- Vintage postcard borders, subtle paper texture, overlap, tape, and a Marfa postmark
- A flickering Stardust sign
- Photographs of the Stardust sign, Highland Avenue, Presidio County Courthouse, Marfa water tower, El Cosmico teepees, and the concrete works at the Chinati Foundation
- Desktop, tablet, and phone layouts
- Reduced-motion and no-JavaScript fallbacks
- A collapsible credits and licenses section in the footer

## Project files

- `index.html` — all visible wording, dates, names, markup, and photo credits
- `styles.css` — layout, typography, postcard treatment, and animation
- `script.js` — stars, shooting stars, scroll reveals, and subtle desktop parallax
- `assets/marfa-night-sky.jpg` — hero photograph
- `assets/landmarks/` — transparent WebP landmark cutouts used by the collage
- `assets/source-*.jpg` — source photographs retained for future edits
- `tools/prepare_landmarks.py` — optional script used to recreate the cutouts
- `vercel.json` — static deployment settings and basic security headers

## Change names, dates, or wording

Open `index.html` in a text editor and search for:

- `Megan`
- `Jason`
- `December 17–20, 2026`
- `Thursday, December 17`
- `Ten years down. Still starry-eyed.`

The visible invitation text is all in that file.

## Replace a photograph

The deployed page only needs the files in `assets/landmarks/` and `assets/marfa-night-sky.jpg`.

To replace the hero, use a wide JPG named:

```text
assets/marfa-night-sky.jpg
```

To replace a landmark without changing the HTML, export a transparent WebP with the corresponding filename in `assets/landmarks/`. Update the credits at the bottom of `index.html` whenever a source photograph changes.

### Rebuild the included landmark cutouts

The optional cutout script requires Python plus Pillow, NumPy, and OpenCV:

```bash
python3 tools/prepare_landmarks.py
```

The site itself does **not** require Python or those libraries.

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

## Photograph credits

The site footer contains clickable source and license links. The included photographs are credited as follows:

- El Cosmico night sky and teepees — Maher El Aridi, CC0 1.0
- Stardust sign — Lars Plougmann, CC BY-SA 2.0
- Highland Avenue — Matthew Rutledge, CC BY 2.0
- Concrete works — Jgc3, CC BY-SA 3.0
- Presidio County Courthouse — Talshiarr, CC BY-SA 2.5
- Marfa water tower — Todd Dwyer, CC BY-SA 3.0

The photographs were cropped, color-adjusted, background-isolated, and given a vintage paper border for this design. Each adapted photograph remains available under the source image’s listed license.
