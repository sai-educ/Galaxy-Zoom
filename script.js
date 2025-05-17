// --- First, enhance the galaxy creation with more size variation ---
function createGalaxy(isInitial = false) {
    let z = isInitial ? (Math.random() * (MAX_DEPTH - 0.1) + 0.1) : MAX_DEPTH;
    if (z <= 0) z = 0.1;

    const targetScreenX = Math.random() * width;
    const targetScreenY = Math.random() * height;
    const centerX = width / 2;
    const centerY = height / 2;
    const x = (targetScreenX - centerX) * z;
    const y = (targetScreenY - centerY) * z;

    // More dramatic size variation (0.5x to 2.0x the base size)
    const size = BASE_GALAXY_SIZE * (0.5 + Math.random() * 1.5);
    
    // Select galaxy type with adjusted probabilities to match real universe
    const typeIndex = Math.random();
    let type;
    if (typeIndex < 0.4) {
        type = 'spiral'; // More spirals
    } else if (typeIndex < 0.6) {
        type = 'barred_spiral'; // Quite common
    } else if (typeIndex < 0.75) {
        type = 'elliptical';
    } else if (typeIndex < 0.85) {
        type = 'edge_on_spiral';
    } else if (typeIndex < 0.92) {
        type = 'lenticular';
    } else if (typeIndex < 0.96) {
        type = 'irregular';
    } else {
        type = 'ringed_spiral'; // Less common
    }
    
    // Enhanced color palettes based on real galaxy images
    const colorPalettes = {
        spiral: [
            { core: 'rgba(255, 240, 180, 0.9)', outer: 'rgba(180, 180, 255, 0.5)' }, // Bluish with yellow core
            { core: 'rgba(255, 220, 150, 0.9)', outer: 'rgba(120, 140, 220, 0.5)' }, // Blue-purple with orange core
            { core: 'rgba(255, 200, 120, 0.9)', outer: 'rgba(60, 80, 140, 0.6)' },   // Deep blue with bright core
            { core: 'rgba(220, 200, 255, 0.9)', outer: 'rgba(100, 80, 180, 0.5)' }   // Purple-blue with whitish core
        ],
        barred_spiral: [
            { core: 'rgba(255, 230, 180, 0.9)', outer: 'rgba(140, 160, 220, 0.5)' },
            { core: 'rgba(255, 210, 150, 0.9)', outer: 'rgba(100, 120, 200, 0.5)' },
            { core: 'rgba(240, 220, 160, 0.9)', outer: 'rgba(120, 140, 190, 0.6)' }
        ],
        elliptical: [
            { core: 'rgba(255, 240, 220, 0.7)', outer: 'rgba(220, 200, 180, 0.4)' }, // Yellowish
            { core: 'rgba(220, 200, 180, 0.7)', outer: 'rgba(180, 160, 140, 0.4)' }, // Brownish
            { core: 'rgba(240, 230, 220, 0.7)', outer: 'rgba(200, 190, 180, 0.4)' }  // Whitish
        ],
        edge_on_spiral: [
            { core: 'rgba(255, 250, 220, 0.9)', outer: 'rgba(180, 120, 80, 0.6)', dust: 'rgba(30, 20, 20, 0.8)' },
            { core: 'rgba(255, 240, 210, 0.9)', outer: 'rgba(160, 100, 60, 0.6)', dust: 'rgba(40, 25, 15, 0.75)' },
            { core: 'rgba(240, 230, 200, 0.9)', outer: 'rgba(140, 90, 70, 0.7)', dust: 'rgba(35, 25, 20, 0.8)' }
        ],
        ringed_spiral: [
            { core: 'rgba(255, 250, 200, 0.9)', outer: 'rgba(150, 200, 255, 0.7)' },
            { core: 'rgba(240, 230, 190, 0.9)', outer: 'rgba(130, 180, 235, 0.7)' }
        ],
        irregular: [
            { core: 'rgba(220, 200, 255, 0.7)', outer: 'rgba(150, 150, 255, 0.4)' }, // Bluish
            { core: 'rgba(255, 200, 200, 0.7)', outer: 'rgba(255, 150, 150, 0.4)' }, // Reddish
            { core: 'rgba(200, 255, 200, 0.7)', outer: 'rgba(150, 255, 150, 0.4)' }  // Greenish
        ],
        lenticular: [
            { core: 'rgba(230, 225, 255, 0.7)', outer: 'rgba(200, 200, 240, 0.4)' },
            { core: 'rgba(240, 235, 225, 0.7)', outer: 'rgba(210, 205, 195, 0.4)' }
        ]
    };
    
    // Select random color palette for the galaxy type
    const palette = colorPalettes[type][Math.floor(Math.random() * colorPalettes[type].length)];
    let coreColor = palette.core;
    let outerColor = palette.outer;
    let dustColor = palette.dust; // May be undefined for non-edge-on galaxies
    
    // Aspect ratio (controls galaxy shape)
    let aspect;
    
    switch(type) {
        case 'elliptical':
            aspect = 0.4 + Math.random() * 0.6; // More varied elliptical shapes
            break;
        case 'spiral':
        case 'barred_spiral':
            aspect = 0.7 + Math.random() * 0.3; // Slightly flattened
            break;
        case 'ringed_spiral':
            aspect = 0.6 + Math.random() * 0.4;
            break;
        case 'lenticular':
            aspect = 0.3 + Math.random() * 0.2; // Flatter
            break;
        case 'edge_on_spiral':
            aspect = 0.08 + Math.random() * 0.12; // Very flat
            break;
        case 'irregular':
            aspect = 0.5 + Math.random() * 0.5; // Highly varied
            break;
        default:
            aspect = 0.8;
    }

    const shadowBlurFactor = 1.8 + Math.random() * 0.7;
    let ringData = null;
    let irregularBlobs = null;
    let spiralParams = null;

    // Enhanced type-specific features
    if (type === 'ringed_spiral') {
        ringData = {
            thicknessFactor: 0.15 + Math.random() * 0.1,
            startAngle: Math.random() * Math.PI * 2,
            angleSpan: Math.PI + Math.random() * Math.PI,
            ringCount: 1 + Math.floor(Math.random() * 2)
        };
    } else if (type === 'irregular') {
        irregularBlobs = [];
        const numBlobs = 4 + Math.floor(Math.random() * 5); // More blobs for variety
        for (let i = 0; i < numBlobs; i++) {
            irregularBlobs.push({
                x: (Math.random() - 0.5) * size * 1.8, // Wider spread
                y: (Math.random() - 0.5) * size * 1.8,
                s: size * (0.2 + Math.random() * 0.6), // More varied blob sizes
                a: (0.3 + Math.random() * 0.7) // More varied opacity
            });
        }
    } else if (type === 'spiral' || type === 'barred_spiral') {
        // Enhanced spiral arm parameters
        spiralParams = {
            armCount: 2 + Math.floor(Math.random() * 3), // 2-4 arms
            tightness: 0.3 + Math.random() * 0.5,        // How tightly wound
            armWidth: 0.2 + Math.random() * 0.3,         // Width of arms
            armLength: 3 + Math.random() * 3             // Length of arms in turns
        };
    }

    // Add rotation properties
    const baseRotationSpeed = 0.002 + Math.random() * 0.003;
    const rotationDirection = Math.random() > 0.5 ? 1 : -1;
    
    // Type-specific rotation speeds
    let rotationSpeed;
    if (type === 'spiral' || type === 'barred_spiral' || type === 'ringed_spiral') {
        rotationSpeed = baseRotationSpeed * 1.5 * rotationDirection;
    } else if (type === 'elliptical' || type === 'lenticular') {
        rotationSpeed = baseRotationSpeed * 0.3 * rotationDirection;
    } else if (type === 'edge_on_spiral') {
        rotationSpeed = baseRotationSpeed * 0.2 * rotationDirection;
    } else {
        rotationSpeed = baseRotationSpeed * rotationDirection;
    }

    return {
        x, y, z, type, size, 
        opacity: 0.5 + Math.random() * 0.5,
        coreColor, outerColor, dustColor,
        angle: Math.random() * Math.PI * 2, 
        rotationSpeed,
        age: 0, 
        aspect,
        shadowBlurFactor, 
        ringData, 
        irregularBlobs,
        spiralParams  // Add the new spiral parameters
    };
}

// --- Enhanced drawing functions for more realistic galaxies ---
function drawGalaxy(galaxy) {
    if (galaxy.z <= 0.01) return;

    const scale = 1 / galaxy.z;
    const screenX = width / 2 + galaxy.x * scale;
    const screenY = height / 2 + galaxy.y * scale;
    const drawSize = galaxy.size;

    const fadeInFactor = Math.min(1.0, galaxy.age / FADE_IN_DURATION);
    if (fadeInFactor <= 0) return;

    const margin = drawSize * 10;
    if (screenX < -margin || screenX > width + margin || 
        screenY < -margin || screenY > height + margin) {
        return;
    }

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(galaxy.angle);

    const baseAlpha = galaxy.opacity * fadeInFactor;
    ctx.globalAlpha = baseAlpha;

    // Apply overall glow
    ctx.shadowBlur = drawSize * galaxy.shadowBlurFactor;
    ctx.shadowColor = galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.5})`);

    // Draw based on galaxy type
    switch (galaxy.type) {
        case 'elliptical':
        case 'lenticular':
            drawEllipticalGalaxy(galaxy, drawSize, baseAlpha);
            break;

        case 'spiral':
            drawSpiralGalaxy(galaxy, drawSize, baseAlpha, false);
            break;
            
        case 'barred_spiral':
            drawSpiralGalaxy(galaxy, drawSize, baseAlpha, true);
            break;

        case 'ringed_spiral':
            drawRingedSpiralGalaxy(galaxy, drawSize, baseAlpha);
            break;

        case 'irregular':
            drawIrregularGalaxy(galaxy, drawSize, baseAlpha);
            break;

        case 'edge_on_spiral':
            drawEdgeOnSpiralGalaxy(galaxy, drawSize, baseAlpha);
            break;
    }

    ctx.restore();
}

// New separate drawing functions for each galaxy type for better organization
function drawEllipticalGalaxy(galaxy, drawSize, baseAlpha) {
    // Create a more realistic gradient with multiple stops
    const gradElliptical = ctx.createRadialGradient(0, 0, drawSize * 0.05, 0, 0, drawSize);
    gradElliptical.addColorStop(0, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 1.2})`));
    gradElliptical.addColorStop(0.3, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.9})`));
    gradElliptical.addColorStop(0.7, galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.5})`));
    gradElliptical.addColorStop(1, galaxy.outerColor.replace(/[\d\.]+\)$/g, `0)`));
    
    ctx.fillStyle = gradElliptical;
    
    // Draw a more realistic elliptical shape
    ctx.beginPath();
    ctx.ellipse(0, 0, drawSize, drawSize * galaxy.aspect, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a slight inner highlight for realism
    ctx.globalAlpha = baseAlpha * 0.3;
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 0, drawSize * 0.2, drawSize * 0.2 * galaxy.aspect, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawSpiralGalaxy(galaxy, drawSize, baseAlpha, hasBar) {
    // Draw galactic core
    const gradSpiralCore = ctx.createRadialGradient(0, 0, drawSize * 0.05, 0, 0, drawSize * 0.6);
    gradSpiralCore.addColorStop(0, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 1.2})`));
    gradSpiralCore.addColorStop(0.6, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.9})`));
    gradSpiralCore.addColorStop(1, galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.6})`));
    
    ctx.fillStyle = gradSpiralCore;
    ctx.beginPath();
    ctx.arc(0, 0, drawSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw disk/background
    const diskGrad = ctx.createRadialGradient(0, 0, drawSize * 0.1, 0, 0, drawSize * 2);
    diskGrad.addColorStop(0, galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.7})`));
    diskGrad.addColorStop(1, galaxy.outerColor.replace(/[\d\.]+\)$/g, `0)`));
    
    ctx.fillStyle = diskGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, drawSize * 1.8, drawSize * 1.8 * galaxy.aspect, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add bar if it's a barred spiral
    if (hasBar) {
        ctx.fillStyle = galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.7})`);
        ctx.fillRect(-drawSize * 0.8, -drawSize * 0.15, drawSize * 1.6, drawSize * 0.3);
    }
    
    // Draw spiral arms
    const params = galaxy.spiralParams || { 
        armCount: 2, 
        tightness: 0.5, 
        armWidth: 0.3,
        armLength: 4
    };
    
    ctx.strokeStyle = galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.8})`);
    ctx.lineWidth = drawSize * params.armWidth;
    ctx.lineCap = 'round';
    
    // Draw each spiral arm
    for (let a = 0; a < params.armCount; a++) {
        const startAngle = (a / params.armCount) * Math.PI * 2;
        
        ctx.beginPath();
        for (let t = 0.5; t <= params.armLength; t += 0.1) {
            const spiralRadius = t * drawSize * 0.3;
            const spiralAngle = startAngle + t * params.tightness;
            const x = Math.cos(spiralAngle) * spiralRadius;
            const y = Math.sin(spiralAngle) * spiralRadius * galaxy.aspect;
            
            if (t === 0.5) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Add star clusters along arms (bright spots)
        ctx.fillStyle = galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.9})`);
        for (let t = 1; t <= params.armLength; t += 0.6) {
            const spiralRadius = t * drawSize * 0.3;
            const spiralAngle = startAngle + t * params.tightness;
            const x = Math.cos(spiralAngle) * spiralRadius;
            const y = Math.sin(spiralAngle) * spiralRadius * galaxy.aspect;
            
            const clusterSize = drawSize * 0.15 * Math.random();
            ctx.beginPath();
            ctx.arc(x, y, clusterSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawRingedSpiralGalaxy(galaxy, drawSize, baseAlpha) {
    // Draw core
    const gradRingedCore = ctx.createRadialGradient(0, 0, drawSize * 0.05, 0, 0, drawSize * 0.5);
    gradRingedCore.addColorStop(0, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 1.2})`));
    gradRingedCore.addColorStop(1, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.5})`));
    
    ctx.fillStyle = gradRingedCore;
    ctx.beginPath();
    ctx.arc(0, 0, drawSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw rings
    const ringData = galaxy.ringData || {
        thicknessFactor: 0.15,
        startAngle: 0,
        angleSpan: Math.PI * 2,
        ringCount: 2
    };
    
    for (let r = 0; r < ringData.ringCount; r++) {
        const ringRadius = drawSize * (0.8 + r * 0.5);
        const ringThickness = drawSize * ringData.thicknessFactor;
        
        // Create gradient for the ring
        const ringColor = galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.8})`);
        const ringGrad = ctx.createRadialGradient(
            0, 0, ringRadius - ringThickness/2,
            0, 0, ringRadius + ringThickness/2
        );
        ringGrad.addColorStop(0, ringColor);
        ringGrad.addColorStop(0.5, ringColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.9})`));
        ringGrad.addColorStop(1, ringColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.5})`));
        
        ctx.strokeStyle = ringGrad;
        ctx.lineWidth = ringThickness;
        
        // Draw ring with proper aspect ratio
        ctx.beginPath();
        ctx.ellipse(0, 0, 
            ringRadius, 
            ringRadius * galaxy.aspect, 
            0, 
            ringData.startAngle, 
            ringData.startAngle + ringData.angleSpan
        );
        ctx.stroke();
        
        // Add some star clusters on rings
        if (Math.random() > 0.5) {
            const clusterCount = 3 + Math.floor(Math.random() * 5);
            ctx.fillStyle = galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.9})`);
            
            for (let c = 0; c < clusterCount; c++) {
                const angle = Math.random() * Math.PI * 2;
                const x = Math.cos(angle) * ringRadius;
                const y = Math.sin(angle) * ringRadius * galaxy.aspect;
                
                const clusterSize = drawSize * 0.1 * Math.random();
                ctx.beginPath();
                ctx.arc(x, y, clusterSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function drawIrregularGalaxy(galaxy, drawSize, baseAlpha) {
    if (!galaxy.irregularBlobs) return;
    
    // Draw random irregular blobs
    galaxy.irregularBlobs.forEach(blob => {
        const gradBlob = ctx.createRadialGradient(
            blob.x, blob.y, blob.s * 0.1, 
            blob.x, blob.y, blob.s
        );
        gradBlob.addColorStop(0, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * blob.a})`));
        gradBlob.addColorStop(0.7, galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * blob.a * 0.5})`));
        gradBlob.addColorStop(1, galaxy.outerColor.replace(/[\d\.]+\)$/g, `0)`));
        
        ctx.fillStyle = gradBlob;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.s, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some random smaller star clusters
        if (Math.random() > 0.7) {
            const starClusters = 1 + Math.floor(Math.random() * 3);
            
            ctx.fillStyle = galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * blob.a * 1.2})`);
            for (let s = 0; s < starClusters; s++) {
                const clusterX = blob.x + (Math.random() - 0.5) * blob.s * 0.8;
                const clusterY = blob.y + (Math.random() - 0.5) * blob.s * 0.8;
                const clusterSize = blob.s * 0.2 * Math.random();
                
                ctx.beginPath();
                ctx.arc(clusterX, clusterY, clusterSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
    
    // Add connecting dust lanes between some blobs
    if (galaxy.irregularBlobs.length > 2) {
        ctx.globalAlpha = baseAlpha * 0.3;
        ctx.strokeStyle = galaxy.outerColor;
        ctx.lineWidth = drawSize * 0.2;
        
        for (let i = 0; i < galaxy.irregularBlobs.length - 1; i++) {
            if (Math.random() > 0.5) continue; // Only connect some blobs
            
            const blob1 = galaxy.irregularBlobs[i];
            const blob2 = galaxy.irregularBlobs[i + 1];
            
            ctx.beginPath();
            ctx.moveTo(blob1.x, blob1.y);
            
            // Create a curved connection
            const midX = (blob1.x + blob2.x) / 2 + (Math.random() - 0.5) * drawSize * 0.5;
            const midY = (blob1.y + blob2.y) / 2 + (Math.random() - 0.5) * drawSize * 0.5;
            
            ctx.quadraticCurveTo(midX, midY, blob2.x, blob2.y);
            ctx.stroke();
        }
    }
}

function drawEdgeOnSpiralGalaxy(galaxy, drawSize, baseAlpha) {
    // Main disk dimensions
    const diskWidth = drawSize * 2.5;
    const diskHeight = diskWidth * galaxy.aspect;
    const bulgeHeight = diskHeight * 2.5;
    const bulgeWidth = drawSize * 0.8;
    
    // Draw main disk with gradient that extends outward
    const diskGrad = ctx.createLinearGradient(-diskWidth/2, 0, diskWidth/2, 0);
    diskGrad.addColorStop(0, galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.3})`));
    diskGrad.addColorStop(0.2, galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.8})`));
    diskGrad.addColorStop(0.5, galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.9})`));
    diskGrad.addColorStop(0.8, galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.8})`));
    diskGrad.addColorStop(1, galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.3})`));
    
    ctx.fillStyle = diskGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, diskWidth/2, diskHeight/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw central bulge with a nice radial gradient
    const gradBulge = ctx.createRadialGradient(0, 0, bulgeWidth * 0.05, 0, 0, bulgeWidth * 0.6);
    gradBulge.addColorStop(0, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 1.2})`));
    gradBulge.addColorStop(0.6, galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.9})`));
    gradBulge.addColorStop(1, galaxy.outerColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.6})`));
    
    ctx.fillStyle = gradBulge;
    ctx.beginPath();
    ctx.ellipse(0, 0, bulgeWidth/2, bulgeHeight/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw dark dust lane with gradient
    if (galaxy.dustColor) {
        const dustGrad = ctx.createLinearGradient(
            -diskWidth/2, 0, diskWidth/2, 0
        );
        dustGrad.addColorStop(0, galaxy.dustColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.4})`));
        dustGrad.addColorStop(0.25, galaxy.dustColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.85})`));
        dustGrad.addColorStop(0.5, galaxy.dustColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.95})`));
        dustGrad.addColorStop(0.75, galaxy.dustColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.85})`));
        dustGrad.addColorStop(1, galaxy.dustColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.4})`));
        
        ctx.fillStyle = dustGrad;
        const dustLaneHeight = diskHeight * 0.4;
        
        // Make dust lane slightly offset from center for realism
        const offset = drawSize * 0.05;
        ctx.beginPath();
        ctx.rect(-diskWidth/2, -dustLaneHeight/2 + offset, diskWidth, dustLaneHeight);
        ctx.fill();
    }
    
    // Add some brighter spots for star clusters
    ctx.fillStyle = galaxy.coreColor.replace(/[\d\.]+\)$/g, `${baseAlpha * 0.7})`);
    const starClusters = 2 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < starClusters; i++) {
        const x = (Math.random() - 0.5) * diskWidth * 0.8;
        // Keep close to horizontal plane
        const y = (Math.random() - 0.5) * diskHeight * 0.5;
        const size = drawSize * 0.1 * Math.random();
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- Update function with rotation ---
function update() {
    const deltaTime = 1 / 60;
    for (let i = 0; i < galaxies.length; i++) {
        // Update age for fade-in
        galaxies[i].age = Math.min(FADE_IN_DURATION + 0.1, galaxies[i].age + deltaTime);
        
        // Apply rotation - galaxies spin continuously
        galaxies[i].angle += galaxies[i].rotationSpeed;
        
        // Handle zooming through space
        if (isZooming) {
            galaxies[i].z -= ZOOM_SPEED;
            if (galaxies[i].z <= 0.01) {
                galaxies[i] = createGalaxy(false);
                galaxies[i].age = 0;
            }
        }
    }
}