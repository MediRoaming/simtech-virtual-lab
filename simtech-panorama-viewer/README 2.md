# SIMTeCH Medical College Simulation Lab - Interactive 3D View

This is a browser-based 360-degree panorama viewer built with Three.js.

## Files

- `index.html` - viewer page
- `styles.css` - NEST-BD/SIMTeCH blue and white interface styling
- `script.js` - Three.js panorama, drag, zoom, and hotspot interactions
- `panorama.jpg` - simulation lab panorama background

## Open Locally

For best results, run a small local web server from this folder and open the shown local URL:

```bash
python3 -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

The page loads Three.js from a CDN, so an internet connection is required the first time it opens.
