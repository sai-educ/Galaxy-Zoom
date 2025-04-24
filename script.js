const canvas = document.getElementById('galaxyCanvas');
const ctx = canvas.getContext('2d');

let width, height;
// --- Combined list for all scene objects ---
let sceneObjects = [];
const MAX_OBJECTS = 450; // Total objects (galaxies + nebulae)
const NEBULA_SPAWN_CHANCE = 0.08; // 8% chance to spawn nebula on reset

// --- Constants ---
const MAX_DEPTH = 60;
const ZOOM_SPEED = 0.0055; // Adjusted speed
const BASE_GALAXY_SIZE = 4.725; // Keep the larger size
const BASE_NEBULA_SIZE = BASE_GALAXY_SIZE * 20;
const FADE_IN_DURATION = 2.0; // Seconds

const GALAXY_TYPES = ['elliptical', 'spiral', 'barred_spiral', 'ringed_spiral', 'irregular', 'lenticular', 'edge_on_spiral'];
const NEBULA_COLORS = [ // For nebula components
    { r: 180, g: 80, b: 80, alpha: 0.15 }, { r: 80, g: 100, b: 180, alpha: 0.15 },
    { r: 150, g: 150, b: 160, alpha: 0.1 }, { r: 200, g: 150, b: 100, alpha: 0.12 }
];

let isZooming = false;
let animationFrameId = null;

// --- Object Creation ---

// Creates galaxy data object
function createGalaxy(isInitial = false) {
    let z = isInitial ? (Math.random() * (MAX_DEPTH - 1) + 1) : MAX_DEPTH;
    if (z <= 0) z = 1;

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
    const shadowBlurFactor = 1.8 + Math.random() * 0.7; // Store random blur factor
    let ringData = null;
    let irregularBlobs = null;
    let dustColor = null;

    // Type-Specific Setup (Stable randomness properties are set here)
    if (type === 'elliptical') {
        coreColor = `rgba(255, ${Math.floor(200 + Math.random()*55)}, ${Math.floor(180 + Math.random()*55)}, 0.7)`;
        outerColor = coreColor.replace(/[\d\.]+\)$/g, `0.4)`);
        aspect = 0.6 + Math.random() * 0.4;
    } else if (type === 'lenticular') {
        aspect = 0.4 + Math.random() * 0.2;
        coreColor = `rgba(220, 220, ${Math.floor(230 + Math.random()*25)}, 0.7)`;
        outerColor = `rgba(200, 200, 255, 0.4)`;
    } else if (type === 'irregular') {
        coreColor = `rgba(${Math.floor(200 + Math.random()*55)}, ${Math.floor(200 + Math.random()*55)}, 255, 0.7)`;
        outerColor = `rgba(${Math.floor(150 + Math.random()*55)}, ${Math.floor(150 + Math.random()*55)}, 255, 0.4)`;
        irregularBlobs = []; // Define blobs ONCE
        const numBlobs = 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numBlobs; i++) {
            irregularBlobs.push({
                x: (Math.random() - 0.5) * size * 1.5, y: (Math.random() - 0.5) * size * 1.5,
                s: size * (0.2 + Math.random() * 0.4), a: (0.4 + Math.random() * 0.6)
            });
        }
    } else if (type === 'ringed_spiral') {
        ringData = { // Define ring properties ONCE
             thicknessFactor: 0.15 + Math.random() * 0.1,
             startAngle: Math.random() * Math.PI * 2,
             angleSpan: Math.PI + Math.random() * Math.PI
        };
    } else if (type === 'edge_on_spiral') {
        aspect = 0.1 + Math.random() * 0.1; // Very flat
        coreColor = `rgba(255, 255, ${Math.floor(210 + Math.random() * 45)}, 0.9)`;
        outerColor = `rgba(${Math.floor(180 + Math.random() * 50)}, ${Math.floor(100 + Math.random() * 50)}, ${Math.floor(80 + Math.random() * 50)}, 0.6)`;
        dustColor = `rgba(${Math.floor(30 + Math.random() * 30)}, ${Math.floor(20 + Math.random() * 20)}, ${Math.floor(20 + Math.random() * 20)}, 0.75)`;
    }

    return {
        renderType: 'galaxy', // Identify object type
        x: x, y: y, z: z, type: type, size: size, opacity: 0.5 + Math.random() * 0.5,
        coreColor: coreColor, outerColor: outerColor, dustColor: dustColor, angle: Math.random() * Math.PI * 2,
        age: 0, aspect: aspect, shadowBlurFactor: shadowBlurFactor, ringData: ringData,
        irregularBlobs: irregularBlobs, fadeDuration: FADE_IN_DURATION // Store duration in seconds
    };
}

// Creates nebula data object
function createNebulaCloud(isInitial = false) {
    let z = isInitial ? (Math.random() * (MAX_DEPTH - 5) + 5) : MAX_DEPTH;
     if (z <= 0) z = 5;

    const targetScreenX = Math.random() * width;
    const targetScreenY = Math.random() * height;
    const centerX = width / 2;
    const centerY = height / 2;
    const x = (targetScreenX - centerX) * z;
    const y = (targetScreenY - centerY) * z;

    const size = BASE_NEBULA_SIZE * (0.8 + Math.random() * 0.4);
    const components = []; // Define nebula structure ONCE
    const numComponents = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < numComponents; i++) {
        const compColor = NEBULA_COLORS[Math.floor(Math.random() * NEBULA_COLORS.length)];
        components.push({
            offsetX: (Math.random() - 0.5) * size * 0.6, offsetY: (Math.random() - 0.5) * size * 0.6,
            radiusX: size * (0.1 + Math.random() * 0.4), radiusY: size * (0.1 + Math.random() * 0.4),
            color: `rgba(${compColor.r}, ${compColor.g}, ${compColor.b}, ${compColor.alpha * (0.5 + Math.random()*0.5)})`,
            angle: Math.random() * Math.PI * 2
        });
    }

    return {
        renderType: 'nebula', x: x, y: y, z: z, size: size, opacity: 0.6 + Math.random() * 0.4,
        angle: Math.random() * Math.PI * 2, age: 0, components: components,
        fadeDuration: FADE_IN_DURATION // Store duration in seconds
    };
}

// --- Drawing Functions ---

// Draws a single galaxy using Canvas 2D API
function drawGalaxy(galaxy) {
    if (galaxy.z <= 0.01) return;
    const scale = 1 / galaxy.z;
    const screenX = width / 2 + galaxy.x * scale;
    const screenY = height / 2 + galaxy.y * scale;
    const drawSize = galaxy.size; // Constant apparent size

    const fadeInFactor = Math.min(1.0, galaxy.age / galaxy.fadeDuration);
    if (fadeInFactor <= 0) return;

    const margin = drawSize * 10;
    if (screenX < -margin || screenX > width + margin || screenY < -margin || screenY > height + margin) return;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(galaxy.angle);

    const baseAlpha = galaxy.opacity * fadeInFactor;
    ctx.globalAlpha = baseAlpha; // Apply base opacity including fade-in

    // Apply Glow using shadowBlur (reads stable factor from object)
    ctx.shadowBlur = drawSize * galaxy.shadowBlurFactor;
    let shadowColorStr = typeof galaxy.outerColor === 'string' ? galaxy.outerColor : 'rgba(200, 200, 255, 0.5)';
    ctx.shadowColor = shadowColorStr.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.5})`);


    // Draw based on type using stable properties
    switch (galaxy.type) {
        case 'elliptical':
        case 'lenticular':
             { // Use block scope for gradient variable
                const gradElliptical = ctx.createRadialGradient(0, 0, drawSize * 0.1, 0, 0, drawSize);
                gradElliptical.addColorStop(0, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha})`));
                gradElliptical.addColorStop(1, galaxy.outerColor.replace(/[\d\.]+\)$/g, `0)`));
                ctx.fillStyle = gradElliptical;
                ctx.beginPath();
                // Use stored aspect ratio
                ctx.ellipse(0, 0, drawSize, drawSize * galaxy.aspect, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#000000"; // Reset fillStyle
            }
            break;
        case 'spiral':
        case 'barred_spiral':
             {
                // Core bulge (gradient)
                const coreSize = drawSize * 0.6;
                const gradSpiralCore = ctx.createRadialGradient(0, 0, coreSize * 0.1, 0, 0, coreSize);
                gradSpiralCore.addColorStop(0, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 1.2})`));
                gradSpiralCore.addColorStop(1, galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.8})`));
                ctx.fillStyle = gradSpiralCore;
                ctx.beginPath();
                ctx.arc(0, 0, coreSize, 0, Math.PI * 2); // Draw core bulge
                ctx.fill();
                 ctx.fillStyle = "#000000";

                // Faint outer disk/arms simulation
                ctx.fillStyle = galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.5})`);
                ctx.beginPath();
                ctx.ellipse(0, 0, drawSize * 1.8, drawSize * 1.2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Add bar for barred spiral
                if (galaxy.type === 'barred_spiral') {
                    ctx.fillStyle = galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.7})`);
                    ctx.fillRect(-drawSize * 0.8, -drawSize * 0.15, drawSize * 1.6, drawSize * 0.3);
                }
            }
            break;
         case 'ringed_spiral':
             {
                // Central yellow glow
                const coreSize = drawSize * 0.5;
                const gradRingedCore = ctx.createRadialGradient(0, 0, coreSize * 0.1, 0, 0, coreSize);
                gradRingedCore.addColorStop(0, `rgba(255, 255, 200, ${baseAlpha * 1.2})`);
                gradRingedCore.addColorStop(1, `rgba(200, 200, 150, ${baseAlpha * 0.8})`);
                ctx.fillStyle = gradRingedCore;
                ctx.beginPath();
                ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
                ctx.fill();
                 ctx.fillStyle = "#000000";

                // Blue rings - use stored properties
                const ringColor = `rgba(150, 200, 255, ${baseAlpha * 0.7})`;
                ctx.strokeStyle = ringColor;
                // Use stored thickness factor
                ctx.lineWidth = drawSize * galaxy.ringData.thicknessFactor;
                // Apply specific shadow/blur for rings or rely on global? Rely on global for now.
                // ctx.shadowBlur = drawSize * 0.5;
                // ctx.shadowColor = ringColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.4})`);

                for (let r = 0; r < 2; r++) {
                    const ringRadius = drawSize * (0.8 + r * 0.6);
                    ctx.beginPath();
                    // Use stored start angle and angle span
                    ctx.ellipse(0, 0, ringRadius, ringRadius * 0.6, 0, galaxy.ringData.startAngle, galaxy.ringData.startAngle + galaxy.ringData.angleSpan);
                    ctx.stroke();
                }
                // Reset line width just in case
                ctx.lineWidth = 1;
            }
             break;
         case 'irregular':
            // Draw blobs using stored definitions (no randomness here)
            if (galaxy.irregularBlobs) {
                galaxy.irregularBlobs.forEach(blob => {
                    const gradBlob = ctx.createRadialGradient(blob.x, blob.y, blob.s * 0.1, blob.x, blob.y, blob.s);
                    // Use stored alpha factor for variation
                    gradBlob.addColorStop(0, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * blob.a})`));
                    gradBlob.addColorStop(1, galaxy.outerColor.replace(/[\d\.]+\)$/g, `0)`));
                    ctx.fillStyle = gradBlob;
                    ctx.beginPath();
                    ctx.arc(blob.x, blob.y, blob.s, 0, Math.PI * 2);
                    ctx.fill();
                });
                 ctx.fillStyle = "#000000";
            }
            break;
         case 'edge_on_spiral':
            // --- Draw Edge-On ---
            {
                const diskWidth = drawSize * 2.5;
                const diskHeight = diskWidth * galaxy.aspect; // Use stored aspect
                const bulgeHeight = diskHeight * 2.5;
                const bulgeWidth = drawSize * 0.8;

                // 1. Draw main disk
                ctx.fillStyle = galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.8})`);
                ctx.beginPath();
                ctx.ellipse(0, 0, diskWidth / 2, diskHeight / 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // 2. Draw central bulge (gradient)
                const gradBulge = ctx.createRadialGradient(0, 0, bulgeWidth * 0.1, 0, 0, bulgeWidth * 0.5);
                gradBulge.addColorStop(0, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 1.1})`));
                gradBulge.addColorStop(1, galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.7})`));
                ctx.fillStyle = gradBulge;
                ctx.beginPath();
                ctx.ellipse(0, 0, bulgeWidth / 2, bulgeHeight / 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // 3. Draw dust lane
                ctx.fillStyle = galaxy.dustColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.85})`);
                const dustLaneHeight = diskHeight * 0.4;
                ctx.beginPath();
                ctx.rect(-diskWidth / 2, -dustLaneHeight / 2, diskWidth, dustLaneHeight);
                ctx.fill();
                 ctx.fillStyle = "#000000";
            }
            break;
    }

    // --- Reset shadowBlur for next object ---
    ctx.shadowBlur = 0;
    ctx.restore(); // Restore context state
}

// Draws a single nebula using Canvas 2D API
function drawNebulaCloud(nebula) {
    if (nebula.z <= 0.01) return;
    const scale = 1 / nebula.z;
    const screenX = width / 2 + nebula.x * scale;
    const screenY = height / 2 + nebula.y * scale;
    const baseDrawSize = nebula.size * scale; // Nebula size scales with perspective

    const fadeInFactor = Math.min(1.0, nebula.age / nebula.fadeDuration);
    if (fadeInFactor <= 0) return;

    const margin = baseDrawSize * 1.5; // Approximate margin
    if (screenX < -margin || screenX > width + margin || screenY < -margin || screenY > height + margin) return;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(nebula.angle);

    const baseAlpha = nebula.opacity * fadeInFactor;

    // Draw nebula components using stored definitions
    nebula.components.forEach(comp => {
        const compX = comp.offsetX * scale;
        const compY = comp.offsetY * scale;
        const compRadiusX = comp.radiusX * scale;
        const compRadiusY = comp.radiusY * scale;

        // Apply individual component alpha adjusted by overall nebula alpha
        const compAlphaMatch = comp.color.match(/[\d\.]+\)$/);
        const compBaseAlpha = compAlphaMatch ? parseFloat(compAlphaMatch[0].slice(0,-1)) : 0.1;
        const finalAlpha = Math.min(baseAlpha, compBaseAlpha);

        ctx.fillStyle = comp.color.replace(/[\d\.]+\)$/g, `${finalAlpha})`);

        // Use shadowBlur for soft edges
        ctx.shadowBlur = Math.max(10, compRadiusX * 0.5); // Blur based on component size
        ctx.shadowColor = ctx.fillStyle; // Glow with component color

        // Draw the shape
        ctx.beginPath();
        ctx.ellipse(compX, compY, compRadiusX, compRadiusY, comp.angle, 0, Math.PI * 2);
        ctx.fill();
    });

    // Reset shadow after drawing nebula
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#000000";
    ctx.restore();
}

// --- Main Draw Loop ---
function draw() {
    ctx.clearRect(0, 0, width, height); // Clear canvas

    // Sort objects by Z distance (farther first)
    sceneObjects.sort((a, b) => b.z - a.z);

    // Draw all objects
    sceneObjects.forEach(obj => {
        if (obj.renderType === 'galaxy') {
            drawGalaxy(obj);
        } else if (obj.renderType === 'nebula') {
            drawNebulaCloud(obj);
        }
    });
}

// --- Animation & Update ---
let lastTimestamp = 0;
function update(timestamp) {
    // Calculate delta time in seconds
    const deltaTime = (timestamp - lastTimestamp) / 1000.0 || (1 / 60); // Handle first frame
    lastTimestamp = timestamp;

    for (let i = sceneObjects.length - 1; i >= 0; i--) {
        const obj = sceneObjects[i];

        // Update age (in seconds)
        obj.age += deltaTime;

        // Update position if zooming
        if (isZooming) {
            obj.z -= ZOOM_SPEED / scale(1, MAX_DEPTH, 0.1, 1.0, obj.z); // Adjust speed slightly based on depth? Optional.
            // Simple speed: obj.z -= ZOOM_SPEED;

            // Resetting logic
            if (obj.z <= 0.01) {
                let newObj;
                if (Math.random() < NEBULA_SPAWN_CHANCE) {
                    newObj = createNebulaCloud(false);
                } else {
                    newObj = createGalaxy(false);
                }
                newObj.age = 0; // Reset age for fade-in
                sceneObjects[i] = newObj; // Replace object
            }
        }
    }
}

// Animation loop using requestAnimationFrame
function animate(timestamp) {
    update(timestamp); // Pass timestamp for delta time calculation
    draw(); // Draw the updated scene
    animationFrameId = requestAnimationFrame(animate); // Request next frame
}

// --- Event Handlers ---
function handleMouseDown(event) {
    if (event.button === 0) { isZooming = true; }
}
function handleMouseUp(event) {
    if (event.button === 0) { isZooming = false; }
}

// Debounced resize handler
let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        // Re-initialize objects to fit new screen size
        sceneObjects = [];
        for (let i = 0; i < MAX_OBJECTS; i++) {
            let obj;
             if (Math.random() < 0.1) { // Initial nebula chance
                 obj = createNebulaCloud(true);
             } else {
                 obj = createGalaxy(true);
             }
            obj.age = FADE_IN_DURATION + 1; // Start visible
            sceneObjects.push(obj);
        }
        // If not currently animating (e.g., first load), draw static frame
         if (!animationFrameId) {
             draw();
         }
    }, 100); // Debounce time
}

// --- Initialization ---
function init() {
    // Add event listeners
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', handleResize);

    // Initial setup calls resize handler
    handleResize();

    // Start animation loop
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); }
    lastTimestamp = performance.now(); // Set initial timestamp
    animate(lastTimestamp);
}

// Utility function (optional, for scaling speed maybe)
function scale(number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}


// --- Start the simulation ---
init();