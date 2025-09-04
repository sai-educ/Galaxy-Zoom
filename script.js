// Enhanced 3D Galaxy Engine with HDR Effects
class GalaxyEngine {
    constructor() {
        this.canvas = document.getElementById('galaxyCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.bloomCanvas = document.getElementById('bloomCanvas');
        this.bloomCtx = this.bloomCanvas.getContext('2d');
        
        // Galaxy properties
        this.galaxies = [];
        this.numGalaxies = 400;
        
        // Camera
        this.camera = {
            x: 0,
            y: 0,
            z: 0,
            rotationX: 0,
            rotationY: 0,
            fov: 1000
        };
        
        // Mouse/Touch
        this.mouse = {
            x: 0,
            y: 0,
            down: false,
            startX: 0,
            startY: 0
        };
        
        // Settings
        this.autoRotate = true;
        this.bloomIntensity = 1.0;
        this.zoomSpeed = 1.0;
        this.time = 0;
        
        // Performance
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.renderTime = 0;
        
        this.init();
    }
    
    init() {
        this.resize();
        this.createGalaxies();
        this.setupEventListeners();
        this.hideLoading();
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.bloomCanvas.width = window.innerWidth;
        this.bloomCanvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }
    
    createGalaxies() {
        this.galaxies = [];
        
        // Create galaxies in 3D space
        for (let i = 0; i < this.numGalaxies; i++) {
            const angle = Math.random() * Math.PI * 2;
            const angle2 = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 2000;
            
            const galaxy = {
                // 3D position
                x: Math.cos(angle) * Math.sin(angle2) * distance,
                y: Math.sin(angle) * Math.sin(angle2) * distance,
                z: Math.cos(angle2) * distance,
                
                // Properties
                type: ['spiral', 'elliptical', 'irregular'][Math.floor(Math.random() * 3)],
                size: 10 + Math.random() * 50,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.01,
                
                // Colors based on type
                color: this.getGalaxyColor(),
                brightness: 0.5 + Math.random() * 0.5,
                
                // Evolution
                evolutionPhase: Math.random() * Math.PI * 2,
                evolutionSpeed: 0.01 + Math.random() * 0.02,
                
                // Visual properties
                armCount: 2 + Math.floor(Math.random() * 3),
                armTightness: 0.3 + Math.random() * 0.4,
                coreSize: 0.2 + Math.random() * 0.3
            };
            
            this.galaxies.push(galaxy);
        }
    }
    
    getGalaxyColor() {
        const colors = [
            { r: 255, g: 200, b: 150 }, // Yellowish
            { r: 200, g: 220, b: 255 }, // Bluish
            { r: 255, g: 180, b: 200 }, // Pinkish
            { r: 180, g: 255, b: 220 }, // Cyan
            { r: 255, g: 255, b: 200 }  // Bright yellow
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    project3D(x, y, z) {
        // Apply camera rotation
        const cosX = Math.cos(this.camera.rotationX);
        const sinX = Math.sin(this.camera.rotationX);
        const cosY = Math.cos(this.camera.rotationY);
        const sinY = Math.sin(this.camera.rotationY);
        
        // Rotate around Y axis
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;
        
        // Rotate around X axis
        let y1 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;
        
        // Apply camera position
        x1 -= this.camera.x;
        y1 -= this.camera.y;
        z2 -= this.camera.z;
        
        // Perspective projection
        if (z2 < 1) z2 = 1; // Prevent division by zero
        const scale = this.camera.fov / z2;
        
        return {
            x: this.centerX + x1 * scale,
            y: this.centerY + y1 * scale,
            z: z2,
            scale: scale
        };
    }
    
    drawGalaxy(galaxy) {
        const projected = this.project3D(galaxy.x, galaxy.y, galaxy.z);
        
        // Skip if behind camera or out of bounds
        if (projected.z < 1) return;
        
        const size = galaxy.size * projected.scale / 100;
        if (size < 0.5) return; // Too small to see
        
        // Calculate opacity based on distance
        const opacity = Math.min(1, Math.max(0, 1000 / projected.z));
        
        this.ctx.save();
        this.ctx.translate(projected.x, projected.y);
        this.ctx.rotate(galaxy.rotation);
        
        // Draw based on galaxy type
        if (galaxy.type === 'spiral') {
            this.drawSpiralGalaxy(galaxy, size, opacity);
        } else if (galaxy.type === 'elliptical') {
            this.drawEllipticalGalaxy(galaxy, size, opacity);
        } else {
            this.drawIrregularGalaxy(galaxy, size, opacity);
        }
        
        this.ctx.restore();
    }
    
    drawSpiralGalaxy(galaxy, size, opacity) {
        const ctx = this.ctx;
        
        // Draw galactic core
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * galaxy.coreSize);
        coreGradient.addColorStop(0, `rgba(255, 255, 220, ${opacity})`);
        coreGradient.addColorStop(0.5, `rgba(${galaxy.color.r}, ${galaxy.color.g}, ${galaxy.color.b}, ${opacity * 0.8})`);
        coreGradient.addColorStop(1, `rgba(${galaxy.color.r}, ${galaxy.color.g}, ${galaxy.color.b}, 0)`);
        
        ctx.fillStyle = coreGradient;
        ctx.fillRect(-size, -size, size * 2, size * 2);
        
        // Draw spiral arms
        ctx.strokeStyle = `rgba(${galaxy.color.r * 0.7}, ${galaxy.color.g * 0.7}, ${galaxy.color.b}, ${opacity * 0.3})`;
        ctx.lineWidth = size * 0.05;
        
        for (let arm = 0; arm < galaxy.armCount; arm++) {
            ctx.beginPath();
            const armOffset = (Math.PI * 2 / galaxy.armCount) * arm;
            
            for (let i = 0; i <= 50; i++) {
                const t = i / 50;
                const angle = armOffset + t * Math.PI * 2 * galaxy.armTightness;
                const radius = t * size;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // Add star clusters along arms
        for (let arm = 0; arm < galaxy.armCount; arm++) {
            const armOffset = (Math.PI * 2 / galaxy.armCount) * arm;
            for (let i = 0; i < 10; i++) {
                const t = Math.random();
                const angle = armOffset + t * Math.PI * 2 * galaxy.armTightness;
                const radius = t * size * (0.5 + Math.random() * 0.5);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                const clusterSize = size * 0.1 * Math.random();
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, clusterSize);
                gradient.addColorStop(0, `rgba(${galaxy.color.r}, ${galaxy.color.g}, ${galaxy.color.b}, ${opacity * 0.5})`);
                gradient.addColorStop(1, `rgba(${galaxy.color.r}, ${galaxy.color.g}, ${galaxy.color.b}, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x - clusterSize, y - clusterSize, clusterSize * 2, clusterSize * 2);
            }
        }
    }
    
    drawEllipticalGalaxy(galaxy, size, opacity) {
        const ctx = this.ctx;
        
        // Create elliptical gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, `rgba(255, 220, 200, ${opacity})`);
        gradient.addColorStop(0.2, `rgba(${galaxy.color.r}, ${galaxy.color.g * 0.8}, ${galaxy.color.b * 0.6}, ${opacity * 0.8})`);
        gradient.addColorStop(0.6, `rgba(${galaxy.color.r * 0.8}, ${galaxy.color.g * 0.6}, ${galaxy.color.b * 0.5}, ${opacity * 0.4})`);
        gradient.addColorStop(1, `rgba(${galaxy.color.r * 0.5}, ${galaxy.color.g * 0.4}, ${galaxy.color.b * 0.4}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add bright core
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.2);
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.8})`);
        coreGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        ctx.fillStyle = coreGradient;
        ctx.fillRect(-size * 0.2, -size * 0.2, size * 0.4, size * 0.4);
    }
    
    drawIrregularGalaxy(galaxy, size, opacity) {
        const ctx = this.ctx;
        
        // Draw multiple irregular blobs
        for (let i = 0; i < 5; i++) {
            const blobX = (Math.random() - 0.5) * size;
            const blobY = (Math.random() - 0.5) * size;
            const blobSize = size * (0.2 + Math.random() * 0.3);
            
            const gradient = ctx.createRadialGradient(blobX, blobY, 0, blobX, blobY, blobSize);
            gradient.addColorStop(0, `rgba(${galaxy.color.r}, ${galaxy.color.g}, ${galaxy.color.b}, ${opacity * 0.6})`);
            gradient.addColorStop(0.5, `rgba(${galaxy.color.r * 0.8}, ${galaxy.color.g * 0.8}, ${galaxy.color.b}, ${opacity * 0.3})`);
            gradient.addColorStop(1, `rgba(${galaxy.color.r * 0.5}, ${galaxy.color.g * 0.5}, ${galaxy.color.b}, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(blobX - blobSize, blobY - blobSize, blobSize * 2, blobSize * 2);
        }
    }
    
    applyBloom() {
        const bloomCtx = this.bloomCtx;
        
        // Clear bloom canvas
        bloomCtx.clearRect(0, 0, this.bloomCanvas.width, this.bloomCanvas.height);
        
        // Copy main canvas with blur
        bloomCtx.filter = `blur(20px) brightness(${this.bloomIntensity})`;
        bloomCtx.globalCompositeOperation = 'screen';
        bloomCtx.drawImage(this.canvas, 0, 0);
        
        // Add extra glow for bright areas
        bloomCtx.filter = `blur(40px) brightness(${this.bloomIntensity * 0.5})`;
        bloomCtx.drawImage(this.canvas, 0, 0);
    }
    
    update() {
        this.time += 0.016;
        
        // Auto rotation
        if (this.autoRotate) {
            this.camera.rotationY += 0.002;
        }
        
        // Update galaxies
        for (let galaxy of this.galaxies) {
            galaxy.rotation += galaxy.rotationSpeed;
            galaxy.evolutionPhase += galaxy.evolutionSpeed;
            
            // Pulse size based on evolution
            const pulseFactor = 1 + Math.sin(galaxy.evolutionPhase) * 0.1;
            galaxy.currentSize = galaxy.size * pulseFactor;
        }
        
        // Sort galaxies by Z distance for proper rendering order
        this.galaxies.sort((a, b) => {
            const distA = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
            const distB = Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z);
            return distB - distA;
        });
    }
    
    render() {
        const startRender = performance.now();
        
        // Clear canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background stars
        this.drawBackgroundStars();
        
        // Draw all galaxies
        for (let galaxy of this.galaxies) {
            this.drawGalaxy(galaxy);
        }
        
        // Apply bloom effect
        this.applyBloom();
        
        this.renderTime = performance.now() - startRender;
    }
    
    drawBackgroundStars() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        // Use fixed seed for stable star positions
        const seed = 12345;
        for (let i = 0; i < 200; i++) {
            const x = ((seed * i * 9999) % this.canvas.width);
            const y = ((seed * i * 7777) % this.canvas.height);
            const size = ((seed * i) % 3) * 0.5;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        
        // Window resize
        window.addEventListener('resize', () => this.resize());
        
        // UI Controls
        document.getElementById('autoRotate').addEventListener('change', (e) => {
            this.autoRotate = e.target.checked;
        });
        
        document.getElementById('bloomIntensity').addEventListener('input', (e) => {
            this.bloomIntensity = parseFloat(e.target.value);
            e.target.nextElementSibling.textContent = this.bloomIntensity.toFixed(1);
        });
        
        document.getElementById('galaxyCount').addEventListener('input', (e) => {
            this.numGalaxies = parseInt(e.target.value);
            e.target.nextElementSibling.textContent = this.numGalaxies;
            this.createGalaxies();
        });
        
        document.getElementById('zoomSpeed').addEventListener('input', (e) => {
            this.zoomSpeed = parseFloat(e.target.value);
            e.target.nextElementSibling.textContent = this.zoomSpeed.toFixed(1);
        });
        
        document.getElementById('resetView').addEventListener('click', () => {
            this.camera.x = 0;
            this.camera.y = 0;
            this.camera.z = 0;
            this.camera.rotationX = 0;
            this.camera.rotationY = 0;
        });
    }
    
    onMouseDown(e) {
        this.mouse.down = true;
        this.mouse.startX = e.clientX;
        this.mouse.startY = e.clientY;
        document.body.classList.add('grabbing');
    }
    
    onMouseMove(e) {
        if (!this.mouse.down) return;
        
        const deltaX = e.clientX - this.mouse.startX;
        const deltaY = e.clientY - this.mouse.startY;
        
        this.camera.rotationY += deltaX * 0.005;
        this.camera.rotationX += deltaY * 0.005;
        
        this.mouse.startX = e.clientX;
        this.mouse.startY = e.clientY;
    }
    
    onMouseUp(e) {
        this.mouse.down = false;
        document.body.classList.remove('grabbing');
    }
    
    onWheel(e) {
        e.preventDefault();
        this.camera.z += e.deltaY * 0.5 * this.zoomSpeed;
    }
    
    onTouchStart(e) {
        if (e.touches.length === 1) {
            this.mouse.down = true;
            this.mouse.startX = e.touches[0].clientX;
            this.mouse.startY = e.touches[0].clientY;
        }
    }
    
    onTouchMove(e) {
        if (e.touches.length === 1 && this.mouse.down) {
            const deltaX = e.touches[0].clientX - this.mouse.startX;
            const deltaY = e.touches[0].clientY - this.mouse.startY;
            
            this.camera.rotationY += deltaX * 0.005;
            this.camera.rotationX += deltaY * 0.005;
            
            this.mouse.startX = e.touches[0].clientX;
            this.mouse.startY = e.touches[0].clientY;
        }
    }
    
    onTouchEnd(e) {
        this.mouse.down = false;
    }
    
    onKeyDown(e) {
        const moveSpeed = 10;
        switch(e.key) {
            case 'ArrowLeft':
                this.camera.x -= moveSpeed;
                break;
            case 'ArrowRight':
                this.camera.x += moveSpeed;
                break;
            case 'ArrowUp':
                this.camera.y -= moveSpeed;
                break;
            case 'ArrowDown':
                this.camera.y += moveSpeed;
                break;
        }
    }
    
    updateStats() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            // Update UI
            document.getElementById('fps').textContent = this.fps;
            document.getElementById('galaxyCountDisplay').textContent = this.numGalaxies;
            document.getElementById('renderTime').textContent = this.renderTime.toFixed(1);
        }
    }
    
    hideLoading() {
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, 1000);
    }
    
    animate() {
        this.update();
        this.render();
        this.updateStats();
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const engine = new GalaxyEngine();
    console.log('Galaxy Engine initialized successfully');
});