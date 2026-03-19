console.clear();

// ================================================================
//  ROOM 1 — PULSATING HEART  (original code, preserved exactly)
// ================================================================

const room1El = document.getElementById('room1');
const room2El = document.getElementById('room2');

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setClearColor(new THREE.Color("rgb(0,0,0)"));
renderer.setSize(window.innerWidth, window.innerHeight);
room1El.appendChild(renderer.domElement);

camera.position.z = 1.8;

const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.noPan     = true;
controls.maxDistance = 3;
controls.minDistance = 0.7;

const group = new THREE.Group();
scene.add(group);

let heart       = null;
let sampler     = null;
let originHeart = null;
let transitioning = false;

new THREE.OBJLoader().load("https://assets.codepen.io/127738/heart_2.obj", (obj) => {
    heart = obj.children[0];
    heart.geometry.rotateX(-Math.PI * 0.5);
    heart.geometry.scale(0.04, 0.04, 0.04);
    heart.geometry.translate(0, -0.4, 0);
    group.add(heart);

    heart.material = new THREE.MeshBasicMaterial({ color: new THREE.Color("rgb(0,0,0)") });
    originHeart = Array.from(heart.geometry.attributes.position.array);
    sampler     = new THREE.MeshSurfaceSampler(heart).build();
    initHeartParticles();
    renderer.setAnimationLoop(renderHeart);
});

let positions = [];
let colors    = [];
const geometry = new THREE.BufferGeometry();
const material = new THREE.PointsMaterial({ vertexColors: true, size: 0.009 });
const particles = new THREE.Points(geometry, material);
group.add(particles);

const simplex = new SimplexNoise();
const pos     = new THREE.Vector3();
const palette = [
    new THREE.Color("#ffd4ee"),
    new THREE.Color("#ff77fc"),
    new THREE.Color("#ff77ae"),
    new THREE.Color("#ff1775"),
];

class SparkPoint {
    constructor() {
        sampler.sample(pos);
        this.color = palette[Math.floor(Math.random() * palette.length)];
        this.rand  = Math.random() * 0.03;
        this.pos   = pos.clone();
        this.one   = null;
        this.two   = null;
    }
    update(a) {
        const noise  = simplex.noise4D(this.pos.x * 1, this.pos.y * 1, this.pos.z * 1, 0.1) + 1.5;
        const noise2 = simplex.noise4D(this.pos.x * 500, this.pos.y * 500, this.pos.z * 500, 1) + 1;
        this.one = this.pos.clone().multiplyScalar(1.01 + noise  * 0.15 * beat.a);
        this.two = this.pos.clone().multiplyScalar(1    + noise2 * 1    * (beat.a + 0.3) - beat.a * 1.2);
    }
}

let spikes = [];

function initHeartParticles() {
    positions = [];
    colors    = [];
    for (let i = 0; i < 10000; i++) {
        spikes.push(new SparkPoint());
    }
}

const beat = { a: 0 };
gsap.timeline({ repeat: -1, repeatDelay: 0.3 })
    .to(beat, { a: 0.5, duration: 0.6, ease: "power2.in"  })
    .to(beat, { a: 0.0, duration: 0.6, ease: "power3.out" });

const maxZ  = 0.23;
const rateZ = 0.5;

function renderHeart(a) {
    // Zoom-in portal trigger
    if (!transitioning && camera.position.length() < 0.82) {
        transitioning = true;
        triggerRoomTransition();
    }

    positions = [];
    colors    = [];
    spikes.forEach((g) => {
        g.update(a);
        const rand  = g.rand;
        const color = g.color;
        if (maxZ * rateZ + rand     > g.one.z && g.one.z > -maxZ * rateZ - rand) {
            positions.push(g.one.x, g.one.y, g.one.z);
            colors.push(color.r, color.g, color.b);
        }
        if (maxZ * rateZ + rand * 2 > g.one.z && g.one.z > -maxZ * rateZ - rand * 2) {
            positions.push(g.two.x, g.two.y, g.two.z);
            colors.push(color.r, color.g, color.b);
        }
    });

    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute("color",    new THREE.BufferAttribute(new Float32Array(colors),    3));

    const vs = heart.geometry.attributes.position.array;
    for (let i = 0; i < vs.length; i += 3) {
        const v     = new THREE.Vector3(originHeart[i], originHeart[i + 1], originHeart[i + 2]);
        const noise = simplex.noise4D(
            originHeart[i] * 1.5, originHeart[i + 1] * 1.5,
            originHeart[i + 2] * 1.5, a * 0.0005
        ) + 1;
        v.multiplyScalar(0 + noise * 0.15 * beat.a);
        vs[i] = v.x;  vs[i + 1] = v.y;  vs[i + 2] = v.z;
    }
    heart.geometry.attributes.position.needsUpdate = true;

    controls.update();
    renderer.render(scene, camera);
}

// Room transition
function triggerRoomTransition() {
    renderer.setAnimationLoop(null);
    gsap.to(room1El, {
        opacity: 0,
        duration: 1.1,
        ease: "power2.inOut",
        onComplete: () => {
            room1El.style.display = 'none';
            room2El.style.display = 'block';
            addClouds();
            initRoom2();
            gsap.fromTo(room2El, { opacity: 0 }, {
                opacity: 1, duration: 1.2, ease: "power2.inOut"
            });
        }
    });
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (camera2 && renderer2) {
        camera2.aspect = window.innerWidth / window.innerHeight;
        camera2.updateProjectionMatrix();
        renderer2.setSize(window.innerWidth, window.innerHeight);
    }
});


// ================================================================
//  ROOM 2 — 3-D POSTCARD FLOATING IN THE SKY
// ================================================================

let scene2, camera2, renderer2, card2;

let rotX = 0, rotY = 0;
let targetRotX = 0, targetRotY = 0;
let camZ = 5, targetCamZ = 5;

let isDragging    = false;
let lastMouseX    = 0, lastMouseY = 0;
let dragDist      = 0;
let lastPinchDist = 0;
let isResetting   = false;

function initRoom2() {
    scene2  = new THREE.Scene();
    const fov = 60;
    camera2 = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera2.position.set(0, 0, 5);
    camera2.lookAt(0, 0, 0);

    renderer2 = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer2.setSize(window.innerWidth, window.innerHeight);
    renderer2.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    room2El.appendChild(renderer2.domElement);

    scene2.add(new THREE.AmbientLight(0xffffff, 1.6));

    const vFovRad = fov * Math.PI / 180;
    const visH    = 2 * Math.tan(vFovRad / 2) * 5;
    const visW    = visH * (window.innerWidth / window.innerHeight);
    let cardH     = visH * 0.58;
    let cardW     = cardH * 1.6;
    if (cardW > visW * 0.88) { cardW = visW * 0.88; cardH = cardW / 1.6; }
    const cardD   = 0.04;

    const frontTex = buildFrontTexture(cardW, cardH);
    const backTex  = buildBackTexture();

    const cream = new THREE.Color(0xf2e4cc);
    const mats  = [
        new THREE.MeshBasicMaterial({ color: cream }),   // +x edge
        new THREE.MeshBasicMaterial({ color: cream }),   // -x edge
        new THREE.MeshBasicMaterial({ color: cream }),   // +y edge
        new THREE.MeshBasicMaterial({ color: cream }),   // -y edge
        new THREE.MeshBasicMaterial({ map: frontTex }),  // +z FRONT
        new THREE.MeshBasicMaterial({ map: backTex  }),  // -z BACK
    ];

    card2 = new THREE.Mesh(new THREE.BoxGeometry(cardW, cardH, cardD), mats);
    scene2.add(card2);

    setupCardInteraction(renderer2.domElement);
    addRoom2Hint();
    animateRoom2();
}

// ────────────────────────────────────────────────────────────────
//  FRONT TEXTURE — photo left, handwritten note right with lines
// ────────────────────────────────────────────────────────────────
function buildFrontTexture(cardW, cardH) {
    const W   = 1024;
    const H   = Math.round(W / (cardW / cardH));
    const cvs = document.createElement('canvas');
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext('2d');
    const tex = new THREE.CanvasTexture(cvs);

    function draw(photoImg) {
        ctx.fillStyle = '#fdf8ef';
        ctx.fillRect(0, 0, W, H);

        // Left half — photo
        if (photoImg && photoImg.naturalWidth > 0) {
            const pw = Math.floor(W / 2), ph = H;
            const ia = photoImg.width / photoImg.height;
            const ta = pw / ph;
            let sx, sy, sw, sh;
            if (ia > ta) { sh = photoImg.height; sw = sh * ta; sx = (photoImg.width - sw) / 2; sy = 0; }
            else         { sw = photoImg.width;  sh = sw / ta; sy = (photoImg.height - sh) / 2; sx = 0; }
            ctx.drawImage(photoImg, sx, sy, sw, sh, 0, 0, pw, ph);
        } else {
            const grd = ctx.createLinearGradient(0, 0, W / 2, H);
            grd.addColorStop(0,   '#f5c0ce');
            grd.addColorStop(0.5, '#e8a0b8');
            grd.addColorStop(1,   '#d4849e');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, W / 2, H);
            ctx.fillStyle    = 'rgba(255,255,255,0.35)';
            ctx.font         = `${Math.round(H * 0.12)}px serif`;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('📷', W / 4, H / 2);
            ctx.font         = `${Math.round(H * 0.045)}px sans-serif`;
            ctx.fillStyle    = 'rgba(255,255,255,0.6)';
            ctx.fillText('photo.jpg', W / 4, H * 0.63);
        }

        // Right half — cream paper
        ctx.fillStyle = '#fdf8ef';
        ctx.fillRect(W / 2, 0, W / 2, H);

        // Outer border
        ctx.strokeStyle = '#b07245';
        ctx.lineWidth   = 10;
        ctx.strokeRect(5, 5, W - 10, H - 10);

        // Centre dashed divider
        ctx.strokeStyle = '#c09060';
        ctx.lineWidth   = 2.5;
        ctx.setLineDash([10, 7]);
        ctx.beginPath();
        ctx.moveTo(W / 2, 24);
        ctx.lineTo(W / 2, H - 24);
        ctx.stroke();
        ctx.setLineDash([]);

        // Handwritten message with ruled lines
        const fs = Math.round(H * 0.082);
        const lh = Math.round(fs * 1.55);
        const tx = W / 2 + Math.round(W * 0.04);
        const ty = Math.round(H * 0.22);

        const msgLines = [
            "I told you I could",
            "do it, my baby!!",
            "",
            "I love you \u2013",
            "shiney \u2764",
        ];

        // Draw ruled lines first (skip blank line)
        const ruleLeft  = W / 2 + 18;
        const ruleRight = W - 28;
        ctx.strokeStyle = '#d4c0a8';
        ctx.lineWidth   = 1.1;
        msgLines.forEach((line, i) => {
            if (line === '') return;
            const ruleY = (ty + i * lh) + Math.round(fs * 0.2);
            ctx.beginPath();
            ctx.moveTo(ruleLeft, ruleY);
            ctx.lineTo(ruleRight, ruleY);
            ctx.stroke();
        });

        // Text on top of lines
        ctx.font         = `${fs}px 'Caveat', cursive`;
        ctx.fillStyle    = '#4a2e1a';
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'alphabetic';
        msgLines.forEach((line, i) => ctx.fillText(line, tx, ty + i * lh));

        // Decorative hearts
        ctx.font      = `${Math.round(fs * 0.6)}px 'Caveat', cursive`;
        ctx.fillStyle = '#e0507a';
        ctx.fillText('\u2661  \u2661  \u2661', tx, H - Math.round(H * 0.06));

        tex.needsUpdate = true;
    }

    draw(null);
    document.fonts.ready.then(() => {
        if (imgRef.complete && imgRef.naturalWidth > 0) draw(imgRef);
        else draw(null);
    });

    const imgRef = new Image();
    imgRef.onload  = () => { document.fonts.ready.then(() => draw(imgRef)); };
    imgRef.onerror = () => { document.fonts.ready.then(() => draw(null));   };
    imgRef.src = 'images/photo.jpg';

    return tex;
}

// ────────────────────────────────────────────────────────────────
//  BACK TEXTURE — drawn normally, no canvas transform needed
// ────────────────────────────────────────────────────────────────
function buildBackTexture() {
    const W   = 1024, H = 640;
    const cvs = document.createElement('canvas');
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext('2d');
    const tex = new THREE.CanvasTexture(cvs);

    function draw() {
        ctx.clearRect(0, 0, W, H);

        // Paper background
        ctx.fillStyle = '#fdf8ef';
        ctx.fillRect(0, 0, W, H);

        // Outer border
        ctx.strokeStyle = '#b07245';
        ctx.lineWidth   = 10;
        ctx.strokeRect(5, 5, W - 10, H - 10);

        // "Postcard" label top-left
        ctx.fillStyle    = '#9a6830';
        ctx.font         = `italic 30px Georgia, 'Times New Roman', serif`;
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Postcard', 30, 58);

        // Horizontal top rule
        ctx.strokeStyle = '#d4b488';
        ctx.lineWidth   = 1.2;
        ctx.beginPath();
        ctx.moveTo(20, 72); ctx.lineTo(W - 20, 72);
        ctx.stroke();

        // Vertical centre divider
        ctx.strokeStyle = '#c8a870';
        ctx.lineWidth   = 1.8;
        ctx.beginPath();
        ctx.moveTo(W * 0.52, 88); ctx.lineTo(W * 0.52, H - 30);
        ctx.stroke();

        // Address lines (right side)
        ctx.strokeStyle = '#ddc8a0';
        ctx.lineWidth   = 1.2;
        [0.48, 0.58, 0.68, 0.78].forEach(t => {
            const y = H * t;
            ctx.beginPath();
            ctx.moveTo(W * 0.57, y); ctx.lineTo(W - 45, y);
            ctx.stroke();
        });

        // Stamp box (top-right)
        const sx = W - 165, sy = 38, sw = 125, sh = 95;
        ctx.strokeStyle = '#b07245';
        ctx.lineWidth   = 2;
        ctx.strokeRect(sx, sy, sw, sh);
        ctx.fillStyle = '#ecdbb8';
        ctx.fillRect(sx + 2, sy + 2, sw - 4, sh - 4);
        ctx.fillStyle    = '#9a6830';
        ctx.font         = 'bold 13px sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('STAMP', sx + sw / 2, sy + sh / 2);

        // SECRET MESSAGE with ruled lines
        const fs = Math.round(H * 0.088);
        const lh = Math.round(fs * 1.45);
        const mx = W * 0.26;

        const secretLines = [
            { text: 'I deserve my kiss now,', y: H * 0.62       },
            { text: 'my darling \u2764',       y: H * 0.62 + lh },
        ];

        // Ruled lines behind text
        ctx.strokeStyle = '#d4b0a0';
        ctx.lineWidth   = 1.2;
        secretLines.forEach(({ y }) => {
            const ruleY = y + Math.round(fs * 0.22);
            ctx.beginPath();
            ctx.moveTo(28, ruleY);
            ctx.lineTo(W * 0.5 - 20, ruleY);
            ctx.stroke();
        });

        // Text on top
        ctx.font         = `${fs}px 'Caveat', cursive`;
        ctx.fillStyle    = '#c04065';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'alphabetic';
        secretLines.forEach(({ text, y }) => ctx.fillText(text, mx, y));

        tex.needsUpdate = true;
    }

    draw();
    document.fonts.ready.then(draw);
    return tex;
}

// ────────────────────────────────────────────────────────────────
//  INTERACTION
// ────────────────────────────────────────────────────────────────
function setupCardInteraction(cvs) {
    cvs.addEventListener('mousedown', e => {
        isDragging = true;
        lastMouseX = e.clientX; lastMouseY = e.clientY;
        dragDist   = 0;
    });
    cvs.addEventListener('mousemove', e => {
        if (!isDragging || isResetting) return;
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        dragDist   += Math.hypot(dx, dy);
        targetRotY += dx * 0.008;
        targetRotX += dy * 0.008;
        lastMouseX  = e.clientX; lastMouseY = e.clientY;
    });
    cvs.addEventListener('mouseup', e => {
        if (dragDist < 5) handleTap(e.clientX, e.clientY);
        isDragging = false;
    });
    cvs.addEventListener('mouseleave', () => { isDragging = false; });

    cvs.addEventListener('wheel', e => {
        e.preventDefault();
        if (isResetting) return;
        targetCamZ += e.deltaY * 0.004;
        targetCamZ  = Math.max(2.2, Math.min(9, targetCamZ));
    }, { passive: false });

    cvs.addEventListener('touchstart', e => {
        e.preventDefault();
        if (e.touches.length === 1) {
            isDragging = true;
            lastMouseX = e.touches[0].clientX; lastMouseY = e.touches[0].clientY;
            dragDist   = 0;
        } else if (e.touches.length === 2) {
            isDragging    = false;
            lastPinchDist = pinchDist(e.touches);
        }
    }, { passive: false });

    cvs.addEventListener('touchmove', e => {
        e.preventDefault();
        if (isResetting) return;
        if (e.touches.length === 1 && isDragging) {
            const dx = e.touches[0].clientX - lastMouseX;
            const dy = e.touches[0].clientY - lastMouseY;
            dragDist   += Math.hypot(dx, dy);
            targetRotY += dx * 0.01;
            targetRotX += dy * 0.01;
            lastMouseX  = e.touches[0].clientX; lastMouseY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            const d     = pinchDist(e.touches);
            targetCamZ -= (d - lastPinchDist) * 0.03;
            targetCamZ  = Math.max(2.2, Math.min(9, targetCamZ));
            lastPinchDist = d;
        }
    }, { passive: false });

    cvs.addEventListener('touchend', e => {
        if (e.changedTouches.length === 1 && dragDist < 12) {
            handleTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }
        isDragging = false;
    });
}

function pinchDist(touches) {
    return Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
    );
}

function handleTap(x, y) {
    if (!card2 || !camera2) return;
    const ray   = new THREE.Raycaster();
    const mouse = new THREE.Vector2(
        (x / window.innerWidth)  *  2 - 1,
        (y / window.innerHeight) * -2 + 1
    );
    ray.setFromCamera(mouse, camera2);
    if (ray.intersectObject(card2).length > 0) {
        isResetting = true;
        targetRotX = 0; targetRotY = 0; targetCamZ = 5;
        gsap.to(card2.rotation, { x: 0, y: 0, z: 0, duration: 1.1, ease: "power2.out" });
        gsap.to(camera2.position, {
            z: 5, duration: 1.1, ease: "power2.out",
            onComplete: () => { rotX = 0; rotY = 0; camZ = 5; isResetting = false; }
        });
    }
}

// ────────────────────────────────────────────────────────────────
//  RENDER LOOP
// ────────────────────────────────────────────────────────────────
function animateRoom2() {
    requestAnimationFrame(animateRoom2);
    if (!isResetting) {
        const ease = 0.09;
        rotX += (targetRotX - rotX) * ease;
        rotY += (targetRotY - rotY) * ease;
        camZ += (targetCamZ - camZ) * ease;
        card2.rotation.x   = rotX;
        card2.rotation.y   = rotY;
        camera2.position.z = camZ;
    }
    renderer2.render(scene2, camera2);
}

// ────────────────────────────────────────────────────────────────
//  HINT + CLOUDS
// ────────────────────────────────────────────────────────────────
function addRoom2Hint() {
    const isMob = window.innerWidth < 768;
    const hint  = document.createElement('div');
    hint.id     = 'room2-hint';
    hint.innerHTML = isMob
        ? 'Drag to rotate &nbsp;·&nbsp; Pinch to zoom &nbsp;·&nbsp; Tap card to reset'
        : 'Drag to rotate &nbsp;·&nbsp; Scroll to zoom &nbsp;·&nbsp; Click card to reset';
    room2El.appendChild(hint);
    setTimeout(() => { gsap.to(hint, { opacity: 0, duration: 1.8 }); }, 3500);
}

function addClouds() {
    const clouds = [
        { w: 220, h: 60, top: '12%', left:  '5%', opacity: 0.45 },
        { w: 160, h: 45, top: '22%', left: '72%', opacity: 0.35 },
        { w: 300, h: 75, top: '55%', left: '-4%', opacity: 0.3  },
        { w: 180, h: 50, top: '68%', left: '80%', opacity: 0.4  },
        { w: 130, h: 40, top: '38%', left: '85%', opacity: 0.25 },
    ];
    clouds.forEach(c => {
        const el = document.createElement('div');
        el.className = 'cloud';
        el.style.cssText = `
            width:${c.w}px; height:${c.h}px;
            top:${c.top}; left:${c.left};
            opacity:${c.opacity};
            border-radius:${c.h / 2}px;
        `;
        room2El.appendChild(el);
        gsap.to(el, {
            x: (Math.random() - 0.5) * 60,
            duration: 12 + Math.random() * 10,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true
        });
    });
}
