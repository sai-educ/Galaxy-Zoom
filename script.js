// ===== Infinite Galaxy Explorer - HDR Edition (WebGL) =====
// Works with the existing index.html shaders & UI.
// No external libs. WebGL1 + point sprites + a simple bloom pass.

(() => {
  // ---------- DOM ----------
  const canvas = document.getElementById("galaxyCanvas");
  const ui = {
    autoRotate: document.getElementById("autoRotate"),
    bloomIntensity: document.getElementById("bloomIntensity"),
    galaxyDensity: document.getElementById("galaxyDensity"),
    resetView: document.getElementById("resetView"),
    fps: document.querySelector("#fps span"),
    count: document.querySelector("#galaxyCount span"),
    loading: document.getElementById("loading"),
  };

  // Prevent context menu for right-drag pan
  window.addEventListener("contextmenu", e => e.preventDefault());

  // ---------- GL SETUP ----------
  const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
  if (!gl) {
    alert("WebGL not supported. Try a different browser.");
    return;
  }
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  // ---------- Utils (matrices & vecs) ----------
  const Mat4 = {
    ident() { const m = new Float32Array(16); m[0]=m[5]=m[10]=m[15]=1; return m; },
    mul(o, a, b) {
      const o0  = a[0]*b[0] + a[4]*b[1] + a[8]*b[2]  + a[12]*b[3];
      const o1  = a[1]*b[0] + a[5]*b[1] + a[9]*b[2]  + a[13]*b[3];
      const o2  = a[2]*b[0] + a[6]*b[1] + a[10]*b[2] + a[14]*b[3];
      const o3  = a[3]*b[0] + a[7]*b[1] + a[11]*b[2] + a[15]*b[3];

      const o4  = a[0]*b[4] + a[4]*b[5] + a[8]*b[6]  + a[12]*b[7];
      const o5  = a[1]*b[4] + a[5]*b[5] + a[9]*b[6]  + a[13]*b[7];
      const o6  = a[2]*b[4] + a[6]*b[5] + a[10]*b[6] + a[14]*b[7];
      const o7  = a[3]*b[4] + a[7]*b[5] + a[11]*b[6] + a[15]*b[7];

      const o8  = a[0]*b[8] + a[4]*b[9] + a[8]*b[10] + a[12]*b[11];
      const o9  = a[1]*b[8] + a[5]*b[9] + a[9]*b[10] + a[13]*b[11];
      const o10 = a[2]*b[8] + a[6]*b[9] + a[10]*b[10]+ a[14]*b[11];
      const o11 = a[3]*b[8] + a[7]*b[9] + a[11]*b[10]+ a[15]*b[11];

      const o12 = a[0]*b[12]+ a[4]*b[13]+ a[8]*b[14] + a[12]*b[15];
      const o13 = a[1]*b[12]+ a[5]*b[13]+ a[9]*b[14] + a[13]*b[15];
      const o14 = a[2]*b[12]+ a[6]*b[13]+ a[10]*b[14]+ a[14]*b[15];
      const o15 = a[3]*b[12]+ a[7]*b[13]+ a[11]*b[14]+ a[15]*b[15];
      o[0]=o0;o[1]=o1;o[2]=o2;o[3]=o3;o[4]=o4;o[5]=o5;o[6]=o6;o[7]=o7;o[8]=o8;o[9]=o9;o[10]=o10;o[11]=o11;o[12]=o12;o[13]=o13;o[14]=o14;o[15]=o15;
      return o;
    },
    perspective(o, fovy, aspect, near, far) {
      const f = 1/Math.tan(fovy/2), nf = 1/(near - far);
      o.fill(0);
      o[0]=f/aspect; o[5]=f; o[10]=(far+near)*nf; o[11]=-1; o[14]=(2*far*near)*nf;
      return o;
    },
    lookAt(o, eye, center, up) {
      const x0 = eye[0], x1 = eye[1], x2 = eye[2];
      let fx = center[0]-x0, fy=center[1]-x1, fz=center[2]-x2;
      const fl = Math.hypot(fx,fy,fz); fx/=fl; fy/=fl; fz/=fl;
      let sx = fy*up[2]-fz*up[1], sy=fz*up[0]-fx*up[2], sz=fx*up[1]-fy*up[0];
      const sl = Math.hypot(sx,sy,sz); sx/=sl; sy/=sl; sz/=sl;
      const ux = sy*fz - sz*fy, uy = sz*fx - sx*fz, uz = sx*fy - sy*fx;
      o[0]=sx; o[1]=ux; o[2]=-fx; o[3]=0;
      o[4]=sy; o[5]=uy; o[6]=-fy; o[7]=0;
      o[8]=sz; o[9]=uz; o[10]=-fz; o[11]=0;
      o[12]=-(sx*x0 + sy*x1 + sz*x2);
      o[13]=-(ux*x0 + uy*x1 + uz*x2);
      o[14]= (fx*x0 + fy*x1 + fz*x2);
      o[15]=1;
      return o;
    }
  };
  const Vec3 = {
    cross(a,b){return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]},
    sub(a,b){return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]},
    add(a,b){return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]},
    scale(a,s){return [a[0]*s,a[1]*s,a[2]*s]},
    norm(a){ const l=Math.hypot(a[0],a[1],a[2]); return l? [a[0]/l,a[1]/l,a[2]/l] : [0,0,0]; }
  };

  // ---------- Compile & Link ----------
  function shaderFromDOM(id, type) {
    const srcEl = document.getElementById(id);
    const src = srcEl ? srcEl.textContent : "";
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(id, gl.getShaderInfoLog(sh), src);
      throw new Error("Shader compile failed: " + id);
    }
    return sh;
  }
  function makeProgram(vsId, fsId) {
    const vs = shaderFromDOM(vsId, gl.VERTEX_SHADER);
    const fs = shaderFromDOM(fsId, gl.FRAGMENT_SHADER);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      throw new Error("Program link failed");
    }
    return prog;
  }
  const sceneProg = makeProgram("vertexShader", "fragmentShader");
  const bloomProg = makeProgram("bloomVertexShader", "bloomFragmentShader");

  // ---------- Scene attrib/uniform locations ----------
  const A = {
    position: gl.getAttribLocation(sceneProg, "position"),
    color: gl.getAttribLocation(sceneProg, "color"),
    size: gl.getAttribLocation(sceneProg, "size"),
    type: gl.getAttribLocation(sceneProg, "type"),
    rotation: gl.getAttribLocation(sceneProg, "rotation"),
    evolution: gl.getAttribLocation(sceneProg, "evolutionPhase"),
  };
  const U = {
    modelView: gl.getUniformLocation(sceneProg, "modelViewMatrix"),
    projection: gl.getUniformLocation(sceneProg, "projectionMatrix"),
    time: gl.getUniformLocation(sceneProg, "time"),
  };

  // Bloom program
  const AB = { position: gl.getAttribLocation(bloomProg, "position") };
  const UB = {
    tDiffuse: gl.getUniformLocation(bloomProg, "tDiffuse"),
    resolution: gl.getUniformLocation(bloomProg, "resolution"),
    bloomIntensity: gl.getUniformLocation(bloomProg, "bloomIntensity"),
  };

  // ---------- Geometry: galaxies ----------
  let galaxyCount = 0;
  let buffers = null;

  function randInSphere(scale=1){
    // Marsaglia method
    let x, y, s;
    do {
      x = Math.random()*2-1;
      y = Math.random()*2-1;
      s = x*x + y*y;
    } while (s >= 1 || s === 0);
    const z = 1 - 2*s;
    const factor = 2*Math.sqrt(1-s);
    const vx = x*factor, vy = y*factor, vz = z;
    const r = Math.pow(Math.random(), 0.35) * scale; // favor outer reaches
    return [vx*r, vy*r, vz*r];
  }

  function randomColor() {
    // cool astro palette; gentle variation
    const base = [
      [0.8, 0.9, 1.0],
      [1.0, 0.8, 0.95],
      [0.7, 0.85, 1.0],
      [0.95, 0.95, 1.0],
      [0.9, 0.9, 0.9],
    ][(Math.random()*5)|0];
    const jitter = () => (Math.random()*0.15 - 0.075);
    return [base[0]+jitter(), base[1]+jitter(), base[2]+jitter()].map(v => Math.max(0, v));
  }

  function generateGalaxies(densityValue) {
    // Map slider (50..500) -> points (2,500 .. 25,000)
    const count = densityValue * 50;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const types = new Float32Array(count);
    const rotations = new Float32Array(count);
    const evol = new Float32Array(count);

    const spread = 550;
    for (let i = 0; i < count; i++) {
      const p = randInSphere(spread);
      positions[i*3+0] = p[0];
      positions[i*3+1] = p[1];
      positions[i*3+2] = p[2];

      const c = randomColor();
      colors[i*3+0] = c[0];
      colors[i*3+1] = c[1];
      colors[i*3+2] = c[2];

      sizes[i] = 5 + Math.random()*9;        // base point size
      types[i] = Math.random();               // <0.33 spiral, <0.66 elliptical, else irregular
      rotations[i] = Math.random()*Math.PI*2; // radians
      evol[i] = Math.random()*Math.PI*2;
    }

    // Upload to GPU
    function makeVBO(data, size, attribLoc) {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return { buf, size, attribLoc, type: gl.FLOAT, stride: 0, offset: 0 };
    }
    buffers = {
      position: makeVBO(positions, 3, A.position),
      color: makeVBO(colors, 3, A.color),
      size: makeVBO(sizes, 1, A.size),
      type: makeVBO(types, 1, A.type),
      rotation: makeVBO(rotations, 1, A.rotation),
      evolution: makeVBO(evol, 1, A.evolution),
    };
    galaxyCount = count;
    ui.count.textContent = count.toLocaleString();
  }

  // ---------- Offscreen framebuffer for bloom ----------
  let rt = null;
  function makeRenderTarget(w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Framebuffer incomplete");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, tex, w, h };
  }

  // Full-screen quad
  const fsQuad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fsQuad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1,-1,  1,-1,  -1,1,  1,1
  ]), gl.STATIC_DRAW);

  // ---------- Camera / controls ----------
  let yaw = 0.0, pitch = 0.0;
  let distance = 600;
  let target = [0,0,0];
  const up = [0,1,0];

  let isRotating = false, isPanning = false;
  let lastX = 0, lastY = 0;

  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0) { isRotating = true; }
    else if (e.button === 2) { isPanning = true; }
    lastX = e.clientX; lastY = e.clientY;
  });
  window.addEventListener("mouseup", () => { isRotating = isPanning = false; });
  window.addEventListener("mousemove", (e) => {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;

    if (isRotating) {
      yaw += dx * 0.005;
      pitch += dy * 0.005;
      const lim = Math.PI/2 - 0.01;
      if (pitch >  lim) pitch =  lim;
      if (pitch < -lim) pitch = -lim;
    } else if (isPanning) {
      // Pan relative to camera axes
      const eye = eyeFromAngles();
      const dir = Vec3.norm(Vec3.sub(target, eye));
      const right = Vec3.norm(Vec3.cross(dir, up));
      const camUp = Vec3.norm(Vec3.cross(right, dir));
      const scale = distance * 0.0015;
      target = Vec3.add(target, Vec3.scale(right, -dx * scale));
      target = Vec3.add(target, Vec3.scale(camUp,  dy * scale));
    }
  });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const k = Math.exp(e.deltaY * 0.001);
    distance = Math.max(50, Math.min(3000, distance * k));
  }, { passive: false });

  ui.resetView.addEventListener("click", () => {
    yaw = 0; pitch = 0; distance = 600; target = [0,0,0];
  });

  ui.galaxyDensity.addEventListener("input", () => {
    generateGalaxies(+ui.galaxyDensity.value);
  });

  function eyeFromAngles() {
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cy = Math.cos(yaw),   sy = Math.sin(yaw);
    const eyeDir = [sy*cp, sp, cy*cp];
    return Vec3.add(target, Vec3.scale(eyeDir, distance));
  }

  // ---------- Resize ----------
  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  function resize() {
    const w = Math.floor(canvas.clientWidth  * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      rt = makeRenderTarget(w, h);
    }
  }
  window.addEventListener("resize", resize);

  // ---------- Render loop ----------
  let t0 = performance.now(), lastFPSUpdate = 0, frameCount = 0;
  let firstFrameDone = false;
  function render(now) {
    const dt = (now - t0) / 1000; t0 = now;

    if (ui.autoRotate.checked) yaw += dt * 0.1;

    resize();

    // Build matrices
    const projection = new Float32Array(16);
    Mat4.perspective(projection, Math.PI/3, canvas.width/canvas.height, 0.1, 5000);

    const eye = eyeFromAngles();
    const view = Mat4.ident();
    Mat4.lookAt(view, eye, target, up);

    // Pass 1: scene to texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, rt.fb);
    gl.viewport(0, 0, rt.w, rt.h);
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(sceneProg);

    // Attributes
    function bindAttrib(bufferObj) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj.buf);
      gl.enableVertexAttribArray(bufferObj.attribLoc);
      gl.vertexAttribPointer(bufferObj.attribLoc, bufferObj.size, bufferObj.type, false, bufferObj.stride, bufferObj.offset);
    }
    bindAttrib(buffers.position);
    bindAttrib(buffers.color);
    bindAttrib(buffers.size);
    bindAttrib(buffers.type);
    bindAttrib(buffers.rotation);
    bindAttrib(buffers.evolution);

    // Uniforms
    gl.uniformMatrix4fv(U.modelView, false, view);
    gl.uniformMatrix4fv(U.projection, false, projection);
    gl.uniform1f(U.time, now * 0.001);

    gl.drawArrays(gl.POINTS, 0, galaxyCount);

    // Pass 2: bloom composite to default framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.useProgram(bloomProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, rt.tex);
    gl.uniform1i(UB.tDiffuse, 0);
    gl.uniform2f(UB.resolution, canvas.width, canvas.height);
    gl.uniform1f(UB.bloomIntensity, parseFloat(ui.bloomIntensity.value));

    gl.bindBuffer(gl.ARRAY_BUFFER, fsQuad);
    gl.enableVertexAttribArray(AB.position);
    gl.vertexAttribPointer(AB.position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Stats
    frameCount++;
    lastFPSUpdate += dt;
    if (lastFPSUpdate >= 0.25) {
      const fps = Math.round(frameCount / lastFPSUpdate);
      ui.fps.textContent = fps.toString();
      frameCount = 0; lastFPSUpdate = 0;
    }

    if (!firstFrameDone) {
      firstFrameDone = true;
      ui.loading.classList.add("hidden"); // fade out the loader
    }

    requestAnimationFrame(render);
  }

  // ---------- Boot ----------
  // Match the existing UI & shaders in index.html/style.css
  // (canvas fills viewport, overlay controls, loading screen). :contentReference[oaicite:3]{index=3} :contentReference[oaicite:4]{index=4}
  generateGalaxies(+ui.galaxyDensity.value);
  resize();
  requestAnimationFrame(render);
})();
