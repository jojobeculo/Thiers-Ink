import fragmentSource from './ink.frag?raw';

const VERTEX_SOURCE = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';

// Cadrages identiques à ceux des images fixes (posters) pour un fondu sans saut.
const FRAME_LANDSCAPE: [number, number, number] = [0.42, 0.04, 1.15];
const FRAME_PORTRAIT: [number, number, number] = [0, -0.04, 0.7];
// Les posters sont rendus à t = 6 s.
const TIME_OFFSET = 6;

interface InkRenderer {
  destroy: () => void;
}

/**
 * Rend la goutte d'encre dans le canvas du hero.
 * Qualité adaptative : la résolution et le nombre de pas baissent si les images
 * dépassent ~22 ms ; au plancher, le rendu s'arrête et l'image fixe reste.
 * Aucune image n'est calculée quand le hero est caché, recouvert ou l'onglet inactif.
 */
export function createInkRenderer(canvas: HTMLCanvasElement): InkRenderer {
  const noop = { destroy() {} };
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'default',
  });
  if (!gl) return noop;

  const program = buildProgram(gl);
  if (!program) return noop;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const attrib = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(attrib);
  gl.vertexAttribPointer(attrib, 2, gl.FLOAT, false, 0, 0);

  const u = {
    res: gl.getUniformLocation(program, 'u_res'),
    time: gl.getUniformLocation(program, 'u_time'),
    pointer: gl.getUniformLocation(program, 'u_pointer'),
    scroll: gl.getUniformLocation(program, 'u_scroll'),
    frame: gl.getUniformLocation(program, 'u_frame'),
    steps: gl.getUniformLocation(program, 'u_steps'),
  };

  let scale = 0.8;
  let steps = 72;
  let raf = 0;
  let running = false;
  let destroyed = false;
  let startTime = performance.now();
  let lastFrame = 0;
  let slowFrames = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr * scale));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl!.viewport(0, 0, w, h);
    gl!.uniform2f(u.res, w, h);
    const frame = canvas.clientWidth >= canvas.clientHeight ? FRAME_LANDSCAPE : FRAME_PORTRAIT;
    gl!.uniform3f(u.frame, frame[0], frame[1], frame[2]);
  }

  function coverProgress() {
    return Math.min(Math.max(window.scrollY / window.innerHeight, 0), 1);
  }

  function adapt(dt: number) {
    if (dt > 22) slowFrames++;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames < 24) return;
    slowFrames = 0;
    if (scale > 0.46) {
      scale = Math.max(0.45, scale * 0.82);
      steps = Math.max(40, steps - 12);
      resize();
    } else {
      // appareil trop lent pour la scène : on garde l'image fixe
      destroy();
    }
  }

  function render(now: number) {
    raf = 0;
    if (!running) return;
    const progress = coverProgress();
    if (progress >= 0.999) {
      // recouvert par la section suivante : on attend un défilement vers le haut
      running = false;
      return;
    }
    const dt = lastFrame ? now - lastFrame : 16;
    lastFrame = now;
    adapt(dt);
    if (destroyed) return;

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    gl!.uniform1f(u.time, TIME_OFFSET + (now - startTime) / 1000);
    gl!.uniform2f(u.pointer, pointer.x, pointer.y);
    gl!.uniform1f(u.scroll, progress);
    gl!.uniform1f(u.steps, steps);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    if (!canvas.hasAttribute('data-ready')) canvas.setAttribute('data-ready', '');
    raf = requestAnimationFrame(render);
  }

  function play() {
    if (destroyed || running || document.hidden || coverProgress() >= 0.999) return;
    running = true;
    lastFrame = 0;
    raf = requestAnimationFrame(render);
  }

  function pause() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  const onVisibility = () => (document.hidden ? pause() : play());
  const onScroll = () => play();
  const onLost = (e: Event) => {
    e.preventDefault();
    destroy();
  };
  const ro = new ResizeObserver(() => resize());

  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onLost);
  ro.observe(canvas);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    pause();
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', onLost);
    ro.disconnect();
    canvas.removeAttribute('data-ready');
    gl!.deleteBuffer(buffer);
    gl!.deleteProgram(program);
    gl!.getExtension('WEBGL_lose_context')?.loseContext();
  }

  resize();
  startTime = performance.now();
  play();
  return { destroy };
}

function buildProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('[THIERSINK] shader :', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };
  const vs = compile(gl.VERTEX_SHADER, VERTEX_SOURCE);
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[THIERSINK] programme WebGL :', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}
