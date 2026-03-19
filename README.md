# 💗 Heart → Postcard Website

A two-room interactive experience built with Three.js.

---

## Folder Structure

```
your-project/
├── index.html
├── README.md
│
├── css/
│   └── style.css
│
├── js/
│   ├── script.js          ← updated main logic
│   ├── three.min.js       ← copy from uploaded files
│   ├── gsap.min.js        ← copy from uploaded files
│   ├── OBJLoader.js       ← copy from uploaded files
│   ├── TrackballControls.js ← copy from uploaded files
│   ├── MeshSurfaceSampler.js ← copy from uploaded files
│   └── simplex-noise.js   ← copy from uploaded files
│
└── images/
    └── photo.jpg          ← ADD YOUR PHOTO HERE
```

---

## Setup Instructions

### 1. Copy your JS libraries
Place all the JS files you already have into the `js/` folder:
`three.min.js`, `gsap.min.js`, `OBJLoader.js`, `TrackballControls.js`,
`MeshSurfaceSampler.js`, `simplex-noise.js`

### 2. Add your photo
Create an `images/` folder and place your photo inside it named exactly:
```
images/photo.jpg
```

### 3. Run locally in VS Code
Install the **Live Server** extension, then right-click `index.html` → **Open with Live Server**.

> ⚠️ You must use Live Server (or any local web server). Opening `index.html` directly as a `file://` URL will block the photo from loading due to browser security rules.

---

## How It Works

| Room | How to enter | Controls |
|---|---|---|
| **Room 1** — Pulsating Heart | Opens automatically | Scroll / pinch to zoom in |
| **Room 2** — Postcard in the Sky | Zoom in until you "enter" the heart | Drag to rotate · Scroll/pinch to zoom · Tap card to reset |

### Postcard secrets
- **Front** — Your photo on the left, handwritten message on the right
- **Back** — Classic postcard layout with a secret message at the lower left (only visible when rotated)

---

## Deploying to GitHub Pages

1. Push all files to a GitHub repository
2. Go to **Settings → Pages**
3. Set source to `main` branch, root `/`
4. Your site will be live at `https://yourusername.github.io/your-repo-name/`

> The heart 3D model loads from CodePen's CDN — no need to host it yourself.
