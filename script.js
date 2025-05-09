const canvas = document.getElementById('galaxyCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let galaxies = [];
const NUM_GALAXIES = 400;
const MAX_DEPTH = 50;
const ZOOM_SPEED = 0.0048;
const BASE_GALAXY_SIZE = 4.725; // Kept the larger size from previous step
const FADE_IN_DURATION = 1.5;

// Added 'edge_on_spiral' type
const GALAXY_TYPES = ['elliptical', 'spiral', 'barred_spiral', 'ringed_spiral', 'irregular', 'lenticular', 'edge_on_spiral'];

let isZooming = false;
let animationFrameId = null;

// --- Galaxy Creation ---
function createGalaxy(isInitial = false) {
    let z = isInitial ? (Math.random() * (MAX_DEPTH - 0.1) + 0.1) : MAX_DEPTH;
    if (z <= 0) z = 0.1;

    const targetScreenX = Math.random() * width;
    const targetScreenY = Math.random() * height;
    const centerX = width / 2;
    const centerY = height / 2;
    const x = (targetScreenX - centerX) * z;
    const y = (targetScreenY - centerY) * z;

    const type = GALAXY_TYPES[Math.floor(Math.random() * GALAXY_TYPES.length)];
    const size = BASE_GALAXY_SIZE * (0.7 + Math.random() * 0.6);
    let coreColor = 'rgba(255, 255, 220, 0.8)';
    let outerColor = 'rgba(180, 180, 255, 0.5)';
    let aspect = 1.0;

    const shadowBlurFactor = 1.8 + Math.random() * 0.7;
    let ringData = null;
    let irregularBlobs = null;
    let dustColor = null; // For edge-on dust lane

    // --- Type-Specific Setup ---
    if (type === 'elliptical') {
        coreColor = `rgba(255, ${200 + Math.random()*55}, ${180 + Math.random()*55}, 0.7)`;
        outerColor = coreColor.replace(/[\d\.]+\)$/g, `0.4)`); // Match outer glow to core color
        aspect = 0.6 + Math.random() * 0.4;
    } else if (type === 'lenticular') {
        aspect = 0.4 + Math.random() * 0.2;
        coreColor = `rgba(220, 220, ${230 + Math.random()*25}, 0.7)`;
        outerColor = `rgba(200, 200, 255, 0.4)`;
    } else if (type === 'irregular') {
        // Use existing irregular setup...
        coreColor = `rgba(${200 + Math.random()*55}, ${200 + Math.random()*55}, 255, 0.7)`;
        outerColor = `rgba(${150 + Math.random()*55}, ${150 + Math.random()*55}, 255, 0.4)`;
        irregularBlobs = [];
        const numBlobs = 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numBlobs; i++) {
            irregularBlobs.push({
                x: (Math.random() - 0.5) * size * 1.5, y: (Math.random() - 0.5) * size * 1.5,
                s: size * (0.2 + Math.random() * 0.4), a: (0.4 + Math.random() * 0.6)
            });
        }
    } else if (type === 'ringed_spiral') {
        // Use existing ringed setup...
        ringData = {
             thicknessFactor: 0.15 + Math.random() * 0.1,
             startAngle: Math.random() * Math.PI * 2,
             angleSpan: Math.PI + Math.random() * Math.PI
        };
    } else if (type === 'edge_on_spiral') {
        // --- Setup for Edge-On Spiral ---
        aspect = 0.1 + Math.random() * 0.1; // Very flat
        // Bright yellow/white core
        coreColor = `rgba(255, 255, ${210 + Math.floor(Math.random() * 45)}, 0.9)`;
        // Reddish/brownish dusty disk color for the glow/outer parts
        outerColor = `rgba(${180 + Math.floor(Math.random() * 50)}, ${100 + Math.floor(Math.random() * 50)}, ${80 + Math.floor(Math.random() * 50)}, 0.6)`;
        // Dark brown/black dust lane
        dustColor = `rgba(${30 + Math.floor(Math.random() * 30)}, ${20 + Math.floor(Math.random() * 20)}, ${20 + Math.floor(Math.random() * 20)}, 0.75)`;
    }

    return {
        x: x, y: y, z: z, type: type, size: size, opacity: 0.5 + Math.random() * 0.5,
        coreColor: coreColor, outerColor: outerColor, dustColor: dustColor,
        angle: Math.random() * Math.PI * 2, age: 0, aspect: aspect,
        shadowBlurFactor: shadowBlurFactor, ringData: ringData, irregularBlobs: irregularBlobs
    };
}

// --- Drawing ---
function drawGalaxy(galaxy) {
    if (galaxy.z <= 0.01) return;

    const scale = 1 / galaxy.z;
    const screenX = width / 2 + galaxy.x * scale;
    const screenY = height / 2 + galaxy.y * scale;
    const drawSize = galaxy.size;

    const fadeInFactor = Math.min(1.0, galaxy.age / FADE_IN_DURATION);
    if (fadeInFactor <= 0) return;

    const margin = drawSize * 10; // Keep large margin for glows
    if (screenX < -margin || screenX > width + margin || screenY < -margin || screenY > height + margin) {
       return;
    }

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(galaxy.angle); // Apply rotation BEFORE drawing specific shapes

    const baseAlpha = galaxy.opacity * fadeInFactor;
    ctx.globalAlpha = baseAlpha;

    // Apply overall glow using outerColor as base
    ctx.shadowBlur = drawSize * galaxy.shadowBlurFactor;
    ctx.shadowColor = galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.5})`);

    // --- Draw based on type ---
    switch (galaxy.type) {
        // (Elliptical, Lenticular, Spiral, Barred Spiral, Ringed Spiral, Irregular cases remain the same as before)
        case 'elliptical':
        case 'lenticular':
            const gradElliptical = ctx.createRadialGradient(0, 0, drawSize * 0.1, 0, 0, drawSize);
            gradElliptical.addColorStop(0, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha})`));
            gradElliptical.addColorStop(1, galaxy.outerColor.replace(/[\d\.]+\)$/g, `0)`));
            ctx.fillStyle = gradElliptical;
            ctx.beginPath();
            ctx.ellipse(0, 0, drawSize, drawSize * galaxy.aspect, 0, 0, Math.PI * 2);
            ctx.fill();
            break;

        case 'spiral':
        case 'barred_spiral':
            const gradSpiralCore = ctx.createRadialGradient(0, 0, drawSize * 0.1, 0, 0, drawSize * 0.6);
            gradSpiralCore.addColorStop(0, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 1.2})`));
            gradSpiralCore.addColorStop(1, galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.8})`));
            ctx.fillStyle = gradSpiralCore;
            ctx.beginPath();
            ctx.arc(0, 0, drawSize * 0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.5})`);
            ctx.beginPath();
            ctx.ellipse(0, 0, drawSize * 1.8, drawSize * 1.2, 0, 0, Math.PI * 2);
            ctx.fill();

            if (galaxy.type === 'barred_spiral') {
                 ctx.fillStyle = galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.7})`);
                 ctx.fillRect(-drawSize * 0.8, -drawSize * 0.15, drawSize * 1.6, drawSize * 0.3);
            }
            break;

        case 'ringed_spiral':
             const gradRingedCore = ctx.createRadialGradient(0, 0, drawSize * 0.1, 0, 0, drawSize * 0.5);
            gradRingedCore.addColorStop(0, `rgba(255, 255, 200, ${baseAlpha * 1.2})`);
            gradRingedCore.addColorStop(1, `rgba(200, 200, 150, ${baseAlpha * 0.8})`);
            ctx.fillStyle = gradRingedCore;
            ctx.beginPath();
            ctx.arc(0, 0, drawSize * 0.5, 0, Math.PI * 2);
            ctx.fill();

            const ringColor = `rgba(150, 200, 255, ${baseAlpha * 0.7})`;
            ctx.strokeStyle = ringColor;
            ctx.lineWidth = drawSize * galaxy.ringData.thicknessFactor;
            // Keep separate shadow for rings? Or rely on global shadow? Let's rely on global for now.
            // ctx.shadowBlur = drawSize * 0.5;
            // ctx.shadowColor = ringColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.4})`);

            for (let r = 0; r < 2; r++) {
                const ringRadius = drawSize * (0.8 + r * 0.6);
                ctx.beginPath();
                ctx.ellipse(0, 0, ringRadius, ringRadius * 0.6, 0, galaxy.ringData.startAngle, galaxy.ringData.startAngle + galaxy.ringData.angleSpan);
                ctx.stroke();
            }
            break;

        case 'irregular':
            if (galaxy.irregularBlobs) {
                galaxy.irregularBlobs.forEach(blob => {
                    const gradBlob = ctx.createRadialGradient(blob.x, blob.y, blob.s * 0.1, blob.x, blob.y, blob.s);
                    gradBlob.addColorStop(0, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * blob.a})`));
                    gradBlob.addColorStop(1, galaxy.outerColor.replace(/[\d\.]+\)$/g, `0)`));
                    ctx.fillStyle = gradBlob;
                    ctx.beginPath();
                    ctx.arc(blob.x, blob.y, blob.s, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
            break;

        case 'edge_on_spiral':
            // --- Draw Edge-On ---
            const diskWidth = drawSize * 2.5; // Make disk wider relative to core size
            const diskHeight = diskWidth * galaxy.aspect; // Use very small aspect ratio
            const bulgeHeight = diskHeight * 2.5; // Bulge is thicker than disk but not as wide
            const bulgeWidth = drawSize * 0.8;

            // 1. Draw main disk (flattened ellipse, use outerColor)
            ctx.fillStyle = galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.8})`); // Disk color
            ctx.beginPath();
            ctx.ellipse(0, 0, diskWidth / 2, diskHeight / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // --- Optional: Add some color variation/texture to disk ---
            // Simple version: Draw a couple of slightly different colored blobs blurred
            // ctx.save();
            // ctx.filter = `blur(${drawSize * 0.1}px)`; // Add blur effect
            // for(let i=0; i<2; i++){
            //     ctx.fillStyle = `rgba(200, 140, 120, ${baseAlpha * 0.3})`; // Example variation color
            //     ctx.beginPath();
            //     ctx.ellipse((Math.random()-0.5) * diskWidth*0.6, (Math.random()-0.5) * diskHeight*0.4, diskWidth*0.1, diskHeight*0.8, 0, 0, Math.PI*2);
            //     ctx.fill();
            // }
            // ctx.restore(); // Remove blur filter

            // 2. Draw central bulge (brighter, thicker ellipse, use coreColor)
            const gradBulge = ctx.createRadialGradient(0, 0, bulgeWidth * 0.1, 0, 0, bulgeWidth * 0.6);
            gradBulge.addColorStop(0, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 1.1})`)); // Bright center
            gradBulge.addColorStop(1, galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.7})`)); // Blend towards disk color
            ctx.fillStyle = gradBulge;
            ctx.beginPath();
            ctx.ellipse(0, 0, bulgeWidth / 2, bulgeHeight / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // 3. Draw dust lane (dark, semi-opaque rectangle or thin ellipse over the middle)
            ctx.fillStyle = galaxy.dustColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.85})`); // Use stored dust color
            const dustLaneHeight = diskHeight * 0.4; // Adjust thickness
            ctx.beginPath();
            ctx.rect(-diskWidth / 2, -dustLaneHeight / 2, diskWidth, dustLaneHeight);
            ctx.fill();
            break;

    } // End switch

    ctx.restore(); // Restore context state (removes rotation, alpha, shadow etc)
}

// --- Draw Function (No change) ---
function draw() {
    ctx.clearRect(0, 0, width, height);
    galaxies.forEach(drawGalaxy);
}

// --- Animation & Update (No change) ---
function update() {
    const deltaTime = 1 / 60;
    for (let i = 0; i < galaxies.length; i++) {
        galaxies[i].age = Math.min(FADE_IN_DURATION + 0.1, galaxies[i].age + deltaTime);
        if (isZooming) {
            galaxies[i].z -= ZOOM_SPEED;
            if (galaxies[i].z <= 0.01) {
                galaxies[i] = createGalaxy(false);
                galaxies[i].age = 0;
            }
        }
    }
}

function animate() {
    update();
    draw();
    animationFrameId = requestAnimationFrame(animate);
}

// --- Event Handlers (No change) ---
function handleMouseDown(event) { if (event.button === 0) { isZooming = true; } }
function handleMouseUp(event) { if (event.button === 0) { isZooming = false; } }

let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        width = window.innerWidth; height = window.innerHeight;
        canvas.width = width; canvas.height = height;
        galaxies = [];
        for (let i = 0; i < NUM_GALAXIES; i++) {
            galaxies.push(createGalaxy(true));
            galaxies[i].age = FADE_IN_DURATION + 1;
        }
        draw();
    }, 100);
}

// --- Initialization (No change) ---
function init() {
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', handleResize);
    handleResize();
    if (!animationFrameId) { animate(); }
}

// --- Start ---
init();