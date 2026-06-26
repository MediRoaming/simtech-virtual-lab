# SIMTeCH Medical College Simulation Lab - PWA 360 View

Mobile-friendly Progressive Web App for the NEST-BD / SIMTeCH interactive 360-degree medical simulation lab panorama.

## Files

- `index.html` - browser entry page
- `styles.css` - responsive NEST-BD / SIMTeCH interface styling
- `script.js` - Three.js panorama viewer, hotspots, touch controls and PWA install behaviour
- `panorama.jpg` - 360-degree lab panorama
- `manifest.webmanifest` - PWA metadata
- `service-worker.js` - offline cache for the viewer files
- `icons/` - app icons for installable PWA use

## Features

- Works from a normal shared web link
- Runs on iPhone, iPad, Android, Mac and Windows browsers
- Mouse drag and one-finger touch drag to look around
- Mouse wheel and two-finger pinch to zoom
- Tap or click numbered hotspots for information
- Install / Add to Home Screen button
- QR-code placeholder area for presentations
- Offline cache for `index.html`, `styles.css`, `script.js`, `panorama.jpg`, manifest and app icons after the first successful visit

## Local Test Instructions

Because service workers require `http://localhost` or HTTPS, test with a small local web server from this folder:

```bash
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080
```

You do not need localhost after deployment. Netlify will serve the same files over HTTPS from a normal public web link.

## Netlify Deployment

This project is a static PWA. No build step is required.

1. Open Netlify.
2. Choose manual deploy or drag-and-drop deploy.
3. Drag the entire `simtech-panorama-viewer` folder into Netlify.
4. Netlify will publish the folder as a normal HTTPS web link.
5. Share that link with users or convert it into a QR code for presentations.

## iPhone Sharing Instructions

1. Deploy the folder to Netlify.
2. Open the Netlify web link on the iPhone using Safari.
3. Share the same normal web link by message, email, QR code, WhatsApp or presentation slide.
4. Recipients can open the link directly without installing anything.

## Add to Home Screen

### iPhone and iPad

1. Open the Netlify web link in Safari.
2. Tap the Share button.
3. Select **Add to Home Screen**.
4. Confirm the name, then tap **Add**.

### Android

1. Open the Netlify web link in Chrome.
2. Tap **Install / Add to Home Screen** in the app, or use Chrome's menu.
3. Confirm installation.

### Desktop Chrome or Edge

1. Open the Netlify web link.
2. Click **Install / Add to Home Screen** if the browser prompt appears.
3. The viewer can then open like an installed app.

## Notes

The viewer loads Three.js from a CDN. The service worker also attempts to cache that CDN file after the first successful visit so repeat viewing is more resilient.
