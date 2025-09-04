// Galaxy HDR Engine - Professional 3D Galaxy Visualization
class GalaxyEngine {
    constructor() {
        this.canvas = document.getElementById('galaxyCanvas');
        this.gl = null;
        this.program = null;
        this.bloomProgram = null;
        
        // Galaxy properties
        this.galaxies = [];
        this.numGalaxies = 200;
        this.galaxyData = {
            positions: [],
            colors: [],
            sizes: [],
            types: [],
            rotations: [],
            evolutionPhases: []
        };
        
        // Camera properties
        this.camera = {
            position: [0, 0, 5],
            rotation: [0, 0, 0],
            fov: 60,
            near: 0.1,
            far: 1000
        };
        
        // Interaction
        this.mouse = { x: 0, y: 0, down: false, button: 0 };
        this.lastMouse = { x: 0, y: 0 };
        this.autoRotate = true;
        this.rotationSpeed = 0.001;
        
        // Rendering
        this.time = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        
        // Settings
        this.bloomIntensity = 1.0;
        
        // Framebuffers for post-processing
        this.framebuffer = null;
        this.texture = null;
        this.depthBuffer = null;
        
        this.init();
    }
    
    init() {
        this.setupWebGL();
        this.setupShaders();
        this.setupFramebuffer();
        this.generateGalaxies();
        this.setupBuffers();
        this.setupEventListeners();
        this.hideLoading();
        this.animate();
    }
    
    setupWebGL() {
        this.gl = this.canvas.getContext('webgl2', {
            antialias: false,
            alpha: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false
        });
        
        if (!this.gl) {
            alert('WebGL 2 not supported. Please use a modern browser.');
            return;
        }
        
        const gl = this.gl;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        
        this.resize();
    }
    
    setupShaders() {
        // Main galaxy shader
        const vertexShaderSource = document.getElementById('vertexShader').textContent;
        const fragmentShaderSource = document.getElementById('fragmentShader').textContent;
        this.program = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
        
        // Bloom post-processing shader
        const bloomVertexSource = document.getElementById('bloomVertexShader').textContent;
        const bloomFragmentSource = document.getElementById('bloomFragmentShader').textContent;
        this.bloomProgram = this.createShaderProgram(bloomVertexSource, bloomFragmentSource);
        
        // Get uniform locations
        const gl = this.gl;
        gl.useProgram(this.program);
        this.uniforms = {
            modelViewMatrix: gl.getUniformLocation(this.program, 'modelViewMatrix'),
            projectionMatrix: gl.getUniformLocation(this.program, 'projectionMatrix'),
            time: gl.getUniformLocation(this.program, 'time')
        };
        
        // Bloom uniforms
        gl.useProgram(this.bloomProgram);
        this.bloomUniforms = {
            tDiffuse: gl.getUniformLocation(this.bloomProgram, 'tDiffuse'),
            resolution: gl.getUniformLocation(this.bloomProgram, 'resolution'),
            bloomIntensity: gl.getUniformLocation(this.bloomProgram, 'bloomIntensity')
        };
    }
    
    createShaderProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        
        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Shader program failed to link:', gl.getProgramInfoLog(program));
            return null;
        }
        
        return program;
    }
    
    createShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    setupFramebuffer() {
        const gl = this.gl;
        
        // Create framebuffer
        this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        
        // Create texture
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.canvas.width, this.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        // Create depth buffer
        this.depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.canvas.width, this.canvas.height);
        
        // Attach to framebuffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    generateGalaxies() {
        this.galaxies = [];
        this.galaxyData = {
            positions: [],
            colors: [],
            sizes: [],
            types: [],
            rotations: [],
            evolutionPhases: []
        };
        
        for (let i = 0; i < this.numGalaxies; i++) {
            const galaxy = this.createGalaxy();
            this.galaxies.push(galaxy);
            
            // Flatten data for buffers
            this.galaxyData.positions.push(...galaxy.position);
            this.galaxyData.colors.push(...galaxy.color);
            this.galaxyData.sizes.push(galaxy.size);
            this.galaxyData.types.push(galaxy.type);
            this.galaxyData.rotations.push(galaxy.rotation);
            this.galaxyData.evolutionPhases.push(galaxy.evolutionPhase);
        }
    }
    
    createGalaxy() {
        // Random position in 3D space
        const radius = 50 + Math.random() * 200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi) - 100;
        
        // Galaxy properties
        const types = ['spiral', 'elliptical', 'irregular'];
        const typeIndex = Math.floor(Math.random() * types.length);
        const type = typeIndex / types.length; // Normalize to 0-1
        
        // Color based on type
        let color;
        if (typeIndex === 0) { // Spiral - bluish with yellow core
            color = [0.4 + Math.random() * 0.3, 0.5 + Math.random() * 0.3, 0.8 + Math.random() * 0.2];
        } else if (typeIndex === 1) { // Elliptical - reddish
            color = [0.9 + Math.random() * 0.1, 0.6 + Math.random() * 0.2, 0.4 + Math.random() * 0.2];
        } else { // Irregular - mixed colors
            color = [0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5];
        }
        
        return {
            position: [x, y, z],
            color: color,
            size: 20 + Math.random() * 80,
            type: type,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            evolutionPhase: Math.random() * Math.PI * 2,
            evolutionSpeed: 0.01 + Math.random() * 0.02
        };
    }
    
    setupBuffers() {
        const gl = this.gl;
        gl.useProgram(this.program);
        
        // Position buffer
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.galaxyData.positions), gl.STATIC_DRAW);
        
        const positionLoc = gl.getAttribLocation(this.program, 'position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
        
        // Color buffer
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.galaxyData.colors), gl.STATIC_DRAW);
        
        const colorLoc = gl.getAttribLocation(this.program, 'color');
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
        
        // Size buffer
        this.sizeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.galaxyData.sizes), gl.STATIC_DRAW);
        
        const sizeLoc = gl.getAttribLocation(this.program, 'size');
        gl.enableVertexAttribArray(sizeLoc);
        gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);
        
        // Type buffer
        this.typeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.typeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.galaxyData.types), gl.STATIC_DRAW);
        
        const typeLoc = gl.getAttribLocation(this.program, 'type');
        gl.enableVertexAttribArray(typeLoc);
        gl.vertexAttribPointer(typeLoc, 1, gl.FLOAT, false, 0, 0);
        
        // Rotation buffer (will be updated)
        this.rotationBuffer = gl.createBuffer();
        this.rotationData = new Float32Array(this.galaxyData.rotations);
        
        // Evolution buffer (will be updated)
        this.evolutionBuffer = gl.createBuffer();
        this.evolutionData = new Float32Array(this.galaxyData.evolutionPhases);
        
        // Create quad for bloom post-processing
        this.quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        const quadVertices = new Float32Array([
            -1, -1,  1, -1,  -1, 1,
            -1, 1,   1, -1,   1, 1
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        // Window resize
        window.addEventListener('resize', () => this.resize());
        
        // UI controls
        document.getElementById('autoRotate').addEventListener('change', (e) => {
            this.autoRotate = e.target.checked;
        });
        
        document.getElementById('bloomIntensity').addEventListener('input', (e) => {
            this.bloomIntensity = parseFloat(e.target.value);
        });
        
        document.getElementById('galaxyDensity').addEventListener('input', (e) => {
            this.numGalaxies = parseInt(e.target.value);
            this.generateGalaxies();
            this.setupBuffers();
        });
        
        document.getElementById('resetView').addEventListener('click', () => {
            this.camera.position = [0, 0, 5];
            this.camera.rotation = [0, 0, 0];
        });
    }
    
    onMouseDown(e) {
        this.mouse.down = true;
        this.mouse.button = e.button;
        this.lastMouse.x = e.clientX;
        this.lastMouse.y = e.clientY;
    }
    
    onMouseMove(e) {
        if (!this.mouse.down) return;
        
        const deltaX = e.clientX - this.lastMouse.x;
        const deltaY = e.clientY - this.lastMouse.y;
        
        if (this.mouse.button === 0) { // Left button - rotate
            this.camera.rotation[1] += deltaX * 0.01;
            this.camera.rotation[0] += deltaY * 0.01;
            this.camera.rotation[0] = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.camera.rotation[0]));
        } else if (this.mouse.button === 2) { // Right button - pan
            const panSpeed = 0.01 * this.camera.position[2];
            this.camera.position[0] -= deltaX * panSpeed;
            this.camera.position[1] += deltaY * panSpeed;
        }
        
        this.lastMouse.x = e.clientX;
        this.lastMouse.y = e.clientY;
    }
    
    onMouseUp(e) {
        this.mouse.down = false;
    }
    
    onWheel(e) {
        e.preventDefault();
        const zoomSpeed = 0.001 * Math.abs(this.camera.position[2]);
        this.camera.position[2] += e.deltaY * zoomSpeed;
        this.camera.position[2] = Math.max(1, Math.min(500, this.camera.position[2]));
    }
    
    onTouchStart(e) {
        if (e.touches.length === 1) {
            this.mouse.down = true;
            this.lastMouse.x = e.touches[0].clientX;
            this.lastMouse.y = e.touches[0].clientY;
        }
    }
    
    onTouchMove(e) {
        if (e.touches.length === 1 && this.mouse.down) {
            const deltaX = e.touches[0].clientX - this.lastMouse.x;
            const deltaY = e.touches[0].clientY - this.lastMouse.y;
            
            this.camera.rotation[1] += deltaX * 0.01;
            this.camera.rotation[0] += deltaY * 0.01;
            
            this.lastMouse.x = e.touches[0].clientX;
            this.lastMouse.y = e.touches[0].clientY;
        }
    }
    
    onTouchEnd(e) {
        this.mouse.down = false;
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Recreate framebuffer for new size
        this.setupFramebuffer();
    }
    
    updateGalaxies() {
        // Update rotation and evolution
        for (let i = 0; i < this.galaxies.length; i++) {
            this.galaxies[i].rotation += this.galaxies[i].rotationSpeed;
            this.galaxies[i].evolutionPhase += this.galaxies[i].evolutionSpeed;
            
            this.rotationData[i] = this.galaxies[i].rotation;
            this.evolutionData[i] = this.galaxies[i].evolutionPhase;
        }
        
        // Update buffers
        const gl = this.gl;
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.rotationBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.rotationData, gl.DYNAMIC_DRAW);
        const rotationLoc = gl.getAttribLocation(this.program, 'rotation');
        gl.enableVertexAttribArray(rotationLoc);
        gl.vertexAttribPointer(rotationLoc, 1, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.evolutionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.evolutionData, gl.DYNAMIC_DRAW);
        const evolutionLoc = gl.getAttribLocation(this.program, 'evolutionPhase');
        gl.enableVertexAttribArray(evolutionLoc);
        gl.vertexAttribPointer(evolutionLoc, 1, gl.FLOAT, false, 0, 0);
    }
    
    render() {
        const gl = this.gl;
        
        // First pass: Render to framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Use main program
        gl.useProgram(this.program);
        
        // Setup matrices
        const projectionMatrix = this.createProjectionMatrix();
        const modelViewMatrix = this.createModelViewMatrix();
        
        gl.uniformMatrix4fv(this.uniforms.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(this.uniforms.modelViewMatrix, false, modelViewMatrix);
        gl.uniform1f(this.uniforms.time, this.time);
        
        // Draw galaxies as points
        gl.drawArrays(gl.POINTS, 0, this.numGalaxies);
        
        // Second pass: Apply bloom
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(this.bloomProgram);
        
        // Bind the rendered texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.bloomUniforms.tDiffuse, 0);
        gl.uniform2f(this.bloomUniforms.resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.bloomUniforms.bloomIntensity, this.bloomIntensity);
        
        // Draw fullscreen quad
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        const positionLoc = gl.getAttribLocation(this.bloomProgram, 'position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
    createProjectionMatrix() {
        const aspect = this.canvas.width / this.canvas.height;
        const fovRad = this.camera.fov * Math.PI / 180;
        const f = 1.0 / Math.tan(fovRad / 2);
        const rangeInv = 1 / (this.camera.near - this.camera.far);
        
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (this.camera.near + this.camera.far) * rangeInv, -1,
            0, 0, this.camera.near * this.camera.far * rangeInv * 2, 0
        ]);
    }
    
    createModelViewMatrix() {
        // Create rotation matrices
        const cosX = Math.cos(this.camera.rotation[0]);
        const sinX = Math.sin(this.camera.rotation[0]);
        const cosY = Math.cos(this.camera.rotation[1]);
        const sinY = Math.sin(this.camera.rotation[1]);
        
        // Combined rotation and translation matrix
        return new Float32Array([
            cosY, sinX * sinY, -cosX * sinY, 0,
            0, cosX, sinX, 0,
            sinY, -sinX * cosY, cosX * cosY, 0,
            -this.camera.position[0], -this.camera.position[1], -this.camera.position[2], 1
        ]);
    }
    
    updateStats() {
        const currentTime = performance.now();
        this.frameCount++;
        
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            // Update UI
            document.querySelector('#fps span').textContent = this.fps;
            document.querySelector('#galaxyCount span').textContent = this.numGalaxies;
        }
    }
    
    hideLoading() {
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, 1500);
    }
    
    animate() {
        this.time += 0.016; // ~60fps
        
        // Auto rotation
        if (this.autoRotate) {
            this.camera.rotation[1] += this.rotationSpeed;
        }
        
        this.updateGalaxies();
        this.render();
        this.updateStats();
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize the engine when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GalaxyEngine();
});