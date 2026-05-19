const root = document.documentElement;

/* --- Particle background (specks + connecting lines) using WebGL --- */
const canvas = document.getElementById('space');
const gl = canvas && canvas.getContext ? canvas.getContext('webgl', { alpha: true, antialias: true }) : null;
let particles = [];
let cw = 0, ch = 0;
let pointProgram = null;
let lineBuffer = null;
let pointBuffer = null;
let positionLocation = null;
let resolutionLocation = null;
let colorLocation = null;
let pointSizeLocation = null;

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(vertexSource, fragmentSource) {
  const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function initGL() {
  if (!gl) return;
  const vertexSource = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;
    uniform float u_pointSize;
    void main() {
      vec2 zeroToOne = a_position / u_resolution;
      vec2 clipSpace = zeroToOne * 2.0 - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      gl_PointSize = u_pointSize;
    }
  `;
  const fragmentSource = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }
  `;
  pointProgram = createProgram(vertexSource, fragmentSource);
  if (!pointProgram) return;
  positionLocation = gl.getAttribLocation(pointProgram, 'a_position');
  resolutionLocation = gl.getUniformLocation(pointProgram, 'u_resolution');
  colorLocation = gl.getUniformLocation(pointProgram, 'u_color');
  pointSizeLocation = gl.getUniformLocation(pointProgram, 'u_pointSize');
  lineBuffer = gl.createBuffer();
  pointBuffer = gl.createBuffer();
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function resize() {
  if (!canvas || !gl) return;
  cw = Math.floor(window.innerWidth);
  ch = Math.floor(window.innerHeight);
  canvas.width = cw;
  canvas.height = ch;
  canvas.style.width = cw + 'px';
  canvas.style.height = ch + 'px';
  gl.viewport(0, 0, cw, ch);
}

function initParticles() {
  particles = [];
  const area = window.innerWidth * window.innerHeight;
  const count = Math.max(40, Math.min(80, Math.floor(area / 120000)));
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.2 + 0.8,
      alpha: 0.85
    });
  }
}

function drawScene() {
  if (!gl || !pointProgram) return;
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(pointProgram);
  gl.uniform2f(resolutionLocation, cw, ch);

  const linePositions = [];
  const threshold = 110;
  const thresholdSq = threshold * threshold;

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i];
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < thresholdSq) {
        linePositions.push(a.x, a.y, b.x, b.y);
      }
    }
  }

  const lineArray = new Float32Array(linePositions);
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, lineArray, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform4f(colorLocation, 1, 1, 1, 0.16);
  gl.uniform1f(pointSizeLocation, 1.0);
  gl.drawArrays(gl.LINES, 0, lineArray.length / 2);

  const pointPositions = [];
  for (let p of particles) {
    pointPositions.push(p.x, p.y);
  }
  const pointArray = new Float32Array(pointPositions);
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, pointArray, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform4f(colorLocation, 1, 1, 1, 0.95);
  gl.uniform1f(pointSizeLocation, 2.0);
  gl.drawArrays(gl.POINTS, 0, particles.length);
}

function tick() {
  if (!gl) return;
  for (let p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < -10) p.x = window.innerWidth + 10;
    if (p.x > window.innerWidth + 10) p.x = -10;
    if (p.y < -10) p.y = window.innerHeight + 10;
    if (p.y > window.innerHeight + 10) p.y = -10;
  }
  drawScene();
  requestAnimationFrame(tick);
}

function getQueryParam(name) {
  return new URL(window.location.href).searchParams.get(name);
}

const heroBgMap = {
  '/computers.html': 'https://source.unsplash.com/collection/190727/1600x1200',
  '/communications.html': 'https://source.unsplash.com/collection/888146/1600x1200',
  '/early-electricity.html': 'https://source.unsplash.com/collection/1163637/1600x1200'
};

function initHeroPage() {
  const hero = document.querySelector('.hero-page');
  if (!hero) return;
  const queryBg = getQueryParam('bg');
  const baseBg = hero.dataset.bg || heroBgMap[window.location.pathname];
  const imageUrl = queryBg ? decodeURIComponent(queryBg) : baseBg;
  if (imageUrl) {
    hero.style.setProperty('--hero-image', `url('${imageUrl}')`);
  }

  const updateScrollState = () => {
    const threshold = window.innerHeight * 0.18;
    hero.classList.toggle('scrolled', window.scrollY > threshold);
  };

  updateScrollState();
  window.addEventListener('scroll', updateScrollState);
}

if (canvas && gl) {
  initGL();
  window.addEventListener('resize', () => { resize(); initParticles(); });
  resize();
  initParticles();
  requestAnimationFrame(tick);
}

initHeroPage();

/* --- Card interactions: hover tilt and expand to fullscreen navigation --- */
const cards = Array.from(document.querySelectorAll('.card'));

cards.forEach(card => {
  const img = card.querySelector('.card-img');
  let raf = null;

  function onMove(e) {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotY = x * 12; // degrees
    const rotX = -y * 10;
    card.classList.add('is-hover');
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      card.style.transform = `perspective(900px) translateZ(0px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
      if (img) img.style.transform = `translate3d(${x * -6}px, ${y * -6}px, 0) scale(1.06)`;
    });
  }

  function onLeave() {
    card.classList.remove('is-hover');
    cancelAnimationFrame(raf);
    card.style.transform = '';
    if (img) img.style.transform = '';
  }

  card.addEventListener('mousemove', onMove);
  card.addEventListener('mouseleave', onLeave);

  card.addEventListener('click', () => {
    const target = card.getAttribute('data-target') || '#';
    const bg = card.dataset.bg;
    const destination = new URL(target, window.location.href);
    if (bg) {
      destination.searchParams.set('bg', encodeURIComponent(bg));
    }
    card.classList.add('expand');
    setTimeout(() => {
      window.location.href = destination.href;
    }, 650);
  });
});

