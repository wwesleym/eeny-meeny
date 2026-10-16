# Eeny Meeny

A silly pocket decision-maker for indecisive people. Plain HTML, CSS and JS. No build step, no dependencies.

Tools: **Coin**, **Wheel**, **Number**, **Oracle**. Each fits on one phone screen with no page scrolling.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page markup: header, tab bar, one section per tool |
| `styles.css` | All styling. Colors and fonts are tokens at the top (light and dark) |
| `app.js` | All behavior, in sections: confetti, tabs, then one block per tool |
| `icon.svg`, `manifest.webmanifest` | Home-screen icon and "Add to Home Screen" support |

## Run it locally

From this folder, start any static server:

```bash
python3 -m http.server 8000
# or: npx serve .
```

Open http://localhost:8000. To test on your phone, use the same Wi-Fi and open `http://<your-computer-ip>:8000`.
Vibration works on Android only (iPhone Safari ignores it).

## Publish on GitHub Pages

```bash
git init
git add .
git commit -m "Eeny Meeny"
git branch -M main
git remote add origin https://github.com/<you>/eeny-meeny.git
git push -u origin main
```

Then on GitHub: **Settings > Pages > Build and deployment > Deploy from a branch > main / (root)**.
The site appears at `https://<you>.github.io/eeny-meeny/` after a minute.
On a phone, open that link and use **Share > Add to Home Screen** (iPhone) or **Install app** (Android).

## Easy things to change

- **Silly text:** the lists near the top of each tool in `app.js` (`QH`/`QT` coin quips, the `ORACLE` answer lists (yes/no/maybe and options modes)).
- **Colors and fonts:** the `:root` block at the top of `styles.css`.
- **Wheel starter options:** `DEFAULT_OPTS` in `app.js`.
- **Add a tab:** add an entry to `TABS` in `app.js` and a `<section class="panel" id="p-yourid" hidden>` in `index.html`.
- **Edge-landing odds on the coin:** `r < 0.01` in `flipCoin()`.
