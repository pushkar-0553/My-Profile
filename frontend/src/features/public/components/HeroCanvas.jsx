import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Full-bleed holographic "AI world" hero canvas.
 *  - Holographic globe: sparse points, fresnel rim, scan-line sweep, lat/long grid, orbit rings
 *  - Neural network: drifting nodes that link to neighbours, and to your cursor
 *  - Perspective grid floor that glides toward the viewer
 * Place inside a `position: relative; overflow: hidden` hero section.
 * Pauses off-screen, respects reduced-motion, adapts to light/dark backgrounds.
 */

/* ───────────── Shaders ───────────── */

const GLOBE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aRand;
  varying float vFres;
  varying float vScan;
  varying float vFront;
  varying float vMix;
  varying float vRand;

  void main() {
    vec3 dir = normalize(position);
    float n = sin(position.x * 2.0 + uTime * 0.7) * sin(position.y * 2.3 + uTime * 0.8) * sin(position.z * 1.9 + uTime * 0.6);
    vec3 p = position + dir * (n * 0.08 + sin(position.y * 3.0 - uTime * 1.2) * 0.03);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec3 nView = normalize(normalMatrix * dir);
    vec3 viewDir = normalize(-mv.xyz);
    float facing = dot(nView, viewDir);

    vFront = smoothstep(-0.25, 0.3, facing);
    vFres = pow(1.0 - abs(facing), 2.0);

    float scanY = sin(uTime * 0.7) * 1.5;
    vScan = exp(-pow((p.y - scanY) * 3.5, 2.0));

    vMix = clamp((p.y + 1.6) / 3.2, 0.0, 1.0);
    vRand = aRand;

    gl_PointSize = uSize * (0.65 + aRand * 0.7 + vScan * 1.3) * uPixelRatio * (6.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const GLOBE_FRAG = /* glsl */ `
  uniform vec3 uColA;
  uniform vec3 uColB;
  uniform vec3 uColC;
  uniform vec3 uHot;
  uniform float uOpacity;
  varying float vFres;
  varying float vScan;
  varying float vFront;
  varying float vMix;
  varying float vRand;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.05, d);

    vec3 col = mix(uColA, uColB, smoothstep(0.0, 0.55, vMix));
    col = mix(col, uColC, smoothstep(0.5, 1.0, vMix));
    col = mix(col, uHot, clamp(vScan, 0.0, 1.0));

    float a = soft * (0.3 + vFres * 0.7 + vScan * 0.9);
    a *= mix(0.3, 1.0, vFront);
    a *= (0.6 + vRand * 0.4);
    gl_FragColor = vec4(col, a * uOpacity);
  }
`;

const NODE_VERT = /* glsl */ `
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uHalfW;
  uniform float uFade;
  attribute float aRand;
  varying float vAlpha;
  varying float vRand;

  void main() {
    float nx = position.x / uHalfW;
    vAlpha = mix(1.0, 0.3 + 0.7 * smoothstep(-0.6, 0.5, nx), uFade);
    vRand = aRand;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * (0.6 + aRand * 0.9) * uPixelRatio * (6.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const NODE_FRAG = /* glsl */ `
  uniform vec3 uColA;
  uniform vec3 uColC;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vRand;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.18, 0.0, d);
    float halo = smoothstep(0.5, 0.0, d) * 0.45;
    vec3 col = mix(uColA, uColC, vRand);
    gl_FragColor = vec4(mix(col, vec3(1.0), core * 0.6), (core + halo) * vAlpha * uOpacity);
  }
`;

const GRID_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const GRID_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec3 vWorld;

  void main() {
    vec2 c = vec2(vWorld.x * 0.9, vWorld.z * 0.9 + uTime * 0.35);
    vec2 d = 0.5 - abs(fract(c) - 0.5);
    float line = 1.0 - smoothstep(0.0, 0.035, min(d.x, d.y));
    float depthFade = smoothstep(-14.0, 1.5, vWorld.z);
    float edgeFade = 1.0 - smoothstep(6.0, 16.0, abs(vWorld.x));
    gl_FragColor = vec4(uColor, line * depthFade * edgeFade * uOpacity);
  }
`;

/* ───────────── Helpers ───────────── */

function isLightBackground() {
  try {
    const bg = getComputedStyle(document.body).backgroundColor;
    const m = bg.match(/\d+(\.\d+)?/g);
    if (!m || m.length < 3) return false;
    if (m.length >= 4 && parseFloat(m[3]) === 0) return false;
    const [r, g, b] = m.map(Number);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
  } catch {
    return false;
  }
}

function makeRing(radius, color, opacity, blending, segments = 160) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending, depthWrite: false });
  return { line: new THREE.Line(geo, mat), geo, mat };
}

function makeGlobeGrid(R, color, opacity, blending) {
  const verts = [];
  const seg = 96;
  // latitudes
  for (let lat = -60; lat <= 60; lat += 20) {
    const phi = (lat * Math.PI) / 180;
    const y = Math.sin(phi) * R;
    const r = Math.cos(phi) * R;
    for (let i = 0; i < seg; i++) {
      const a1 = (i / seg) * Math.PI * 2;
      const a2 = ((i + 1) / seg) * Math.PI * 2;
      verts.push(Math.cos(a1) * r, y, Math.sin(a1) * r, Math.cos(a2) * r, y, Math.sin(a2) * r);
    }
  }
  // meridians
  for (let m = 0; m < 12; m++) {
    const theta = (m / 12) * Math.PI * 2;
    for (let i = 0; i < seg / 2; i++) {
      const p1 = (i / (seg / 2)) * Math.PI - Math.PI / 2;
      const p2 = ((i + 1) / (seg / 2)) * Math.PI - Math.PI / 2;
      verts.push(
        Math.cos(p1) * Math.cos(theta) * R, Math.sin(p1) * R, Math.cos(p1) * Math.sin(theta) * R,
        Math.cos(p2) * Math.cos(theta) * R, Math.sin(p2) * R, Math.cos(p2) * Math.sin(theta) * R
      );
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending, depthWrite: false });
  return { lines: new THREE.LineSegments(geo, mat), geo, mat };
}

/* ───────────── Component ───────────── */

export default function HeroCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.innerWidth < 768) return; // keep mobile light

    // Theme palettes. `light` is re-checked live, so switching theme updates the canvas.
    const LIGHT_PALETTE = { a: 0x2563eb, b: 0x7c3aed, c: 0x0891b2, hot: 0x6d28d9, ring: 0x6366f1 };
    const DARK_PALETTE = { a: 0x60a5fa, b: 0xa78bfa, c: 0x22d3ee, hot: 0xffffff, ring: 0x93c5fd };
    let light = isLightBackground();
    let palette = light ? LIGHT_PALETTE : DARK_PALETTE;
    let blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;

    let frameId;
    let isVisible = true;
    let width = mount.clientWidth || 1200;
    let height = mount.clientHeight || 700;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    const pixelRatio = Math.min(window.devicePixelRatio, 1.75);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    mount.appendChild(renderer.domElement);

    /* ── Globe ── */
    const R = 1.5;
    const GCOUNT = 1900;
    const gPos = new Float32Array(GCOUNT * 3);
    const gRand = new Float32Array(GCOUNT);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < GCOUNT; i++) {
      const y = 1 - (i / (GCOUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      gPos[i * 3] = Math.cos(th) * r * R;
      gPos[i * 3 + 1] = y * R;
      gPos[i * 3 + 2] = Math.sin(th) * r * R;
      gRand[i] = Math.random();
    }
    const globeGeo = new THREE.BufferGeometry();
    globeGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
    globeGeo.setAttribute('aRand', new THREE.BufferAttribute(gRand, 1));
    const globeMat = new THREE.ShaderMaterial({
      vertexShader: GLOBE_VERT,
      fragmentShader: GLOBE_FRAG,
      transparent: true,
      depthWrite: false,
      blending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 4.2 },
        uPixelRatio: { value: pixelRatio },
        uOpacity: { value: light ? 0.95 : 1.0 },
        uColA: { value: new THREE.Color(palette.a) },
        uColB: { value: new THREE.Color(palette.b) },
        uColC: { value: new THREE.Color(palette.c) },
        uHot: { value: new THREE.Color(palette.hot) }
      }
    });
    const globePoints = new THREE.Points(globeGeo, globeMat);
    globePoints.frustumCulled = false;

    const gridLines = makeGlobeGrid(R, palette.ring, light ? 0.2 : 0.12, blending);
    const ringA = makeRing(2.05, palette.ring, light ? 0.4 : 0.32, blending);
    const ringB = makeRing(2.45, palette.c, light ? 0.28 : 0.22, blending);
    ringA.line.rotation.set(Math.PI / 2.6, 0.2, 0);
    ringB.line.rotation.set(Math.PI / 1.8, 0, 0.6);

    const globe = new THREE.Group();
    globe.add(globePoints, gridLines.lines, ringA.line, ringB.line);
    scene.add(globe);

    /* ── Neural network ── */
    const N = 80;
    const LINK = 1.55;
    const CURSOR_LINK = 2.4;
    const MAX_SEG = 800;

    let visH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    let visW = visH * camera.aspect;

    const nPos = new Float32Array((N + 1) * 3); // last slot = cursor
    const nVel = new Float32Array(N * 3);
    const nRand = new Float32Array(N + 1);
    for (let i = 0; i < N; i++) {
      nPos[i * 3] = (Math.random() - 0.5) * visW * 1.05;
      nPos[i * 3 + 1] = (Math.random() - 0.5) * visH * 1.05;
      nPos[i * 3 + 2] = -3 + Math.random() * 4.5;
      nVel[i * 3] = (Math.random() - 0.5) * 0.006;
      nVel[i * 3 + 1] = (Math.random() - 0.5) * 0.006;
      nVel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
      nRand[i] = Math.random();
    }
    nPos[N * 3] = 999;
    nPos[N * 3 + 1] = 999;

    const nodeGeo = new THREE.BufferGeometry();
    const nodeAttr = new THREE.BufferAttribute(nPos, 3);
    nodeAttr.setUsage(THREE.DynamicDrawUsage);
    nodeGeo.setAttribute('position', nodeAttr);
    nodeGeo.setAttribute('aRand', new THREE.BufferAttribute(nRand, 1));
    nodeGeo.setDrawRange(0, N);
    const nodeMat = new THREE.ShaderMaterial({
      vertexShader: NODE_VERT,
      fragmentShader: NODE_FRAG,
      transparent: true,
      depthWrite: false,
      blending,
      uniforms: {
        uSize: { value: 9.0 },
        uPixelRatio: { value: pixelRatio },
        uHalfW: { value: visW / 2 },
        uFade: { value: 1 },
        uOpacity: { value: light ? 0.9 : 0.95 },
        uColA: { value: new THREE.Color(palette.a) },
        uColC: { value: new THREE.Color(palette.c) }
      }
    });
    const nodePoints = new THREE.Points(nodeGeo, nodeMat);
    nodePoints.frustumCulled = false;
    scene.add(nodePoints);

    const linePos = new Float32Array(MAX_SEG * 6);
    const lineCol = new Float32Array(MAX_SEG * 6);
    const lineGeo = new THREE.BufferGeometry();
    const linePosAttr = new THREE.BufferAttribute(linePos, 3);
    const lineColAttr = new THREE.BufferAttribute(lineCol, 3);
    linePosAttr.setUsage(THREE.DynamicDrawUsage);
    lineColAttr.setUsage(THREE.DynamicDrawUsage);
    lineGeo.setAttribute('position', linePosAttr);
    lineGeo.setAttribute('color', lineColAttr);
    lineGeo.setDrawRange(0, 0);
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending
    });
    const netLines = new THREE.LineSegments(lineGeo, lineMat);
    netLines.frustumCulled = false;
    scene.add(netLines);

    const baseCol = new THREE.Color(palette.a);
    const altCol = new THREE.Color(palette.c);
    const tmpCol = new THREE.Color();
    // Dark mode only: softer blue→violet tone for cursor links (light mode keeps its own look)
    const cursorColDark = new THREE.Color(0x7aa2ff).lerp(new THREE.Color(0xa78bfa), 0.45);
    const writeColor = (idx, mixT, intensity) => {
      tmpCol.copy(baseCol).lerp(altCol, mixT);
      let r = tmpCol.r, g = tmpCol.g, b = tmpCol.b;
      if (light) {
        r = 1 - (1 - r) * intensity;
        g = 1 - (1 - g) * intensity;
        b = 1 - (1 - b) * intensity;
      } else {
        r *= intensity; g *= intensity; b *= intensity;
      }
      lineCol[idx] = r;
      lineCol[idx + 1] = g;
      lineCol[idx + 2] = b;
    };

    /* ── Grid floor ── */
    const floorGeo = new THREE.PlaneGeometry(60, 40);
    const floorMat = new THREE.ShaderMaterial({
      vertexShader: GRID_VERT,
      fragmentShader: GRID_FRAG,
      transparent: true,
      depthWrite: false,
      blending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(palette.c) },
        uOpacity: { value: light ? 0.35 : 0.4 }
      }
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -2.3, -8);
    scene.add(floor);

    /* ── Live theme switching (light <-> dark) ── */
    const applyTheme = (isLight) => {
      if (isLight === light) return;
      light = isLight;
      palette = light ? LIGHT_PALETTE : DARK_PALETTE;
      blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;

      globeMat.uniforms.uColA.value.set(palette.a);
      globeMat.uniforms.uColB.value.set(palette.b);
      globeMat.uniforms.uColC.value.set(palette.c);
      globeMat.uniforms.uHot.value.set(palette.hot);
      globeMat.uniforms.uOpacity.value = light ? 0.95 : 1.0;

      nodeMat.uniforms.uColA.value.set(palette.a);
      nodeMat.uniforms.uColC.value.set(palette.c);
      nodeMat.uniforms.uOpacity.value = light ? 0.9 : 0.95;

      floorMat.uniforms.uColor.value.set(palette.c);
      floorMat.uniforms.uOpacity.value = light ? 0.35 : 0.4;

      gridLines.mat.color.set(palette.ring);
      gridLines.mat.opacity = light ? 0.2 : 0.12;
      ringA.mat.color.set(palette.ring);
      ringA.mat.opacity = light ? 0.4 : 0.32;
      ringB.mat.color.set(palette.c);
      ringB.mat.opacity = light ? 0.28 : 0.22;

      baseCol.set(palette.a);
      altCol.set(palette.c);

      [globeMat, nodeMat, lineMat, floorMat, gridLines.mat, ringA.mat, ringB.mat].forEach((m) => {
        m.blending = blending;
        m.needsUpdate = true;
      });
    };

    /* ── Layout ── */
    const layout = () => {
      visH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      visW = visH * camera.aspect;
      const wide = camera.aspect > 1.3;
      globe.position.x = wide ? visW * 0.26 : 0;
      const s = wide ? 1 : 0.8;
      globe.scale.setScalar(s);
      nodeMat.uniforms.uHalfW.value = visW / 2;
      nodeMat.uniforms.uFade.value = wide ? 1 : 0.4;
    };
    layout();

    /* ── Pointer ── */
    let mouseNX = 0;
    let mouseNY = 0;
    let easedX = 0;
    let easedY = 0;
    let cursorActive = false;
    const cursorWorld = new THREE.Vector3(999, 999, 0);

    const onMove = (e) => {
      const rect = mount.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) {
        cursorActive = false;
        return;
      }
      cursorActive = true;
      mouseNX = x * 2 - 1;
      mouseNY = y * 2 - 1;
      cursorWorld.set(mouseNX * visW * 0.5, -mouseNY * visH * 0.5, 0);
    };
    const onLeave = () => { cursorActive = false; };
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    const observer = new IntersectionObserver(([entry]) => { isVisible = entry.isIntersecting; }, { threshold: 0.02 });
    observer.observe(mount);

    const render = () => renderer.render(scene, camera);

    const resizeObserver = new ResizeObserver(() => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      layout();
      render();
    });
    resizeObserver.observe(mount);

    /* ── Frame update ── */
    const step = (t, dt) => {
      globeMat.uniforms.uTime.value = t;
      floorMat.uniforms.uTime.value = t;

      easedX += (mouseNX - easedX) * 0.04;
      easedY += (mouseNY - easedY) * 0.04;

      globe.rotation.y = t * 0.14 + easedX * 0.3;
      globe.rotation.x = Math.sin(t * 0.15) * 0.1 + easedY * 0.2;
      ringA.line.rotation.z = t * 0.2;
      ringB.line.rotation.x = Math.PI / 1.8 + t * 0.12;

      const bx = visW * 0.58;
      const by = visH * 0.58;

      // cursor slot
      if (cursorActive) {
        nPos[N * 3] = cursorWorld.x;
        nPos[N * 3 + 1] = cursorWorld.y;
        nPos[N * 3 + 2] = 0;
      } else {
        nPos[N * 3] = 999;
        nPos[N * 3 + 1] = 999;
      }

      // move nodes
      for (let i = 0; i < N; i++) {
        const k = i * 3;
        if (cursorActive) {
          const dx = cursorWorld.x - nPos[k];
          const dy = cursorWorld.y - nPos[k + 1];
          const d2 = dx * dx + dy * dy;
          if (d2 < 4 && d2 > 0.01) {
            nVel[k] += dx * 0.00005 * dt;
            nVel[k + 1] += dy * 0.00005 * dt;
          }
        }
        nVel[k] *= 0.999;
        nVel[k + 1] *= 0.999;
        nPos[k] += nVel[k] * dt;
        nPos[k + 1] += nVel[k + 1] * dt;
        nPos[k + 2] += nVel[k + 2] * dt;
        if (nPos[k] > bx || nPos[k] < -bx) nVel[k] *= -1;
        if (nPos[k + 1] > by || nPos[k + 1] < -by) nVel[k + 1] *= -1;
        if (nPos[k + 2] > 1.5 || nPos[k + 2] < -3) nVel[k + 2] *= -1;
      }
      nodeAttr.needsUpdate = true;

      // links
      let seg = 0;
      const total = cursorActive ? N + 1 : N;
      const halfW = visW / 2;
      const wide = camera.aspect > 1.3;
      for (let i = 0; i < total && seg < MAX_SEG; i++) {
        const ix = nPos[i * 3], iy = nPos[i * 3 + 1], iz = nPos[i * 3 + 2];
        for (let j = i + 1; j < total && seg < MAX_SEG; j++) {
          const isCursor = j === N;
          const maxD = isCursor ? CURSOR_LINK : LINK;
          const dx = ix - nPos[j * 3];
          if (dx > maxD || dx < -maxD) continue;
          const dy = iy - nPos[j * 3 + 1];
          const dz = iz - nPos[j * 3 + 2];
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d > maxD) continue;

          const nx = (ix + nPos[j * 3]) / 2 / halfW;
          const fade = wide ? 0.3 + 0.7 * Math.min(1, Math.max(0, (nx + 0.6) / 1.1)) : 0.5;
          let intensity = (1 - d / maxD) * 0.75 * fade;
          if (isCursor) intensity = Math.min(1, (1 - d / maxD) * 1.2);

          const o = seg * 6;
          linePos[o] = ix; linePos[o + 1] = iy; linePos[o + 2] = iz;
          linePos[o + 3] = nPos[j * 3]; linePos[o + 4] = nPos[j * 3 + 1]; linePos[o + 5] = nPos[j * 3 + 2];

          if (isCursor && !light) {
            // ═════════ DARK MODE cursor links ═════════
            // Smooth falloff, capped brightness, gradient that glows at the
            // cursor end and melts away at the node end (no harsh cyan overlap).
            const t = 1 - d / maxD;
            const eased = t * t * (3 - 2 * t);
            const atCursor = eased * 0.5;
            const atNode = eased * 0.12;
            lineCol[o] = cursorColDark.r * atNode;
            lineCol[o + 1] = cursorColDark.g * atNode;
            lineCol[o + 2] = cursorColDark.b * atNode;
            lineCol[o + 3] = cursorColDark.r * atCursor;
            lineCol[o + 4] = cursorColDark.g * atCursor;
            lineCol[o + 5] = cursorColDark.b * atCursor;
          } else {
            // ═════════ LIGHT MODE cursor links (original look, unchanged) ═════════
            // Also used for node-to-node links in both themes.
            const mixT = isCursor ? 1 : ((i + j) % 7) / 7;
            writeColor(o, mixT, intensity);
            writeColor(o + 3, mixT, intensity);
          }
          seg++;
        }
      }
      lineGeo.setDrawRange(0, seg * 2);
      linePosAttr.needsUpdate = true;
      lineColAttr.needsUpdate = true;
    };

    const clock = new THREE.Clock();
    let themeTick = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!isVisible) { clock.getDelta(); return; }
      if (++themeTick % 30 === 0) applyTheme(isLightBackground());
      const dt = Math.min(clock.getDelta(), 0.05) * 60;
      step(clock.elapsedTime, dt);
      render();
    };

    let themeTimer;
    if (reduceMotion) {
      globe.rotation.set(0.12, 0.7, 0);
      step(1.5, 0);
      render();
      // static frame: re-render only if the theme changes
      themeTimer = setInterval(() => {
        const l = isLightBackground();
        if (l !== light) {
          applyTheme(l);
          step(1.5, 0);
          render();
        }
      }, 500);
    } else {
      animate();
    }

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(themeTimer);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      observer.disconnect();
      resizeObserver.disconnect();
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      globeGeo.dispose(); globeMat.dispose();
      gridLines.geo.dispose(); gridLines.mat.dispose();
      ringA.geo.dispose(); ringA.mat.dispose();
      ringB.geo.dispose(); ringB.mat.dispose();
      nodeGeo.dispose(); nodeMat.dispose();
      lineGeo.dispose(); lineMat.dispose();
      floorGeo.dispose(); floorMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        background:
          'radial-gradient(ellipse at 74% 48%, rgba(99,102,241,0.16) 0%, rgba(34,211,238,0.06) 32%, transparent 62%)',
        WebkitMaskImage: 'linear-gradient(to bottom, #000 78%, transparent 100%)',
        maskImage: 'linear-gradient(to bottom, #000 78%, transparent 100%)'
      }}
    />
  );
}