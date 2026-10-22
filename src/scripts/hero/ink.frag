// THIERSINK — goutte d'encre en 3D (raymarching) sur fumée d'encre.
// GLSL ES 1.0 (WebGL 1) pour la compatibilité la plus large.
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_pointer; // -1..1, lissé côté JS
uniform float u_scroll; // 0..1 : la goutte se disperse en quittant le hero
uniform vec3 u_frame;   // xy : centre de l'objet (unités uv), z : focale
uniform float u_steps;  // pas de raymarching (qualité adaptative)

const vec3 SOOT = vec3(0.063, 0.059, 0.055);
const vec3 MIDNIGHT = vec3(0.161, 0.149, 0.133);
const vec3 PARCH = vec3(0.847, 0.796, 0.722);
const vec3 SAFFRON = vec3(0.831, 0.588, 0.325);

vec3 toLin(vec3 c) { return pow(c, vec3(2.2)); }

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdf(vec3 p) {
  float t = u_time;
  float spread = 1.0 + u_scroll * 2.4;
  float d = length(p) - 0.78 * (1.0 - u_scroll * 0.35);
  d += 0.075 * spread * sin(p.x * 3.1 + t * 0.9) * sin(p.y * 2.7 + t * 0.7) * sin(p.z * 2.9 - t * 0.8);
  d += 0.022 * spread * sin(p.x * 7.3 - t * 1.3 + p.y * 5.1) * sin(p.z * 6.7 + t);
  vec3 s1 = vec3(sin(t * 0.45) * 1.12, cos(t * 0.37) * 0.5 + 0.28, cos(t * 0.45) * 0.62) * spread;
  vec3 s2 = vec3(cos(t * 0.31 + 2.0) * 1.0, sin(t * 0.29) * 0.66 - 0.38, sin(t * 0.31 + 2.0) * 0.8) * spread;
  d = smin(d, length(p - s1) - 0.15, 0.34);
  d = smin(d, length(p - s2) - 0.095, 0.28);
  return d;
}

mat3 objectRotation() {
  return rotY(u_pointer.x * 0.55 + u_time * 0.08) * rotX(-u_pointer.y * 0.35 + 0.12);
}

vec3 calcNormal(vec3 p, mat3 R) {
  const vec2 k = vec2(1.0, -1.0);
  const float h = 0.0015;
  return normalize(
    k.xyy * sdf(R * (p + k.xyy * h)) +
    k.yyx * sdf(R * (p + k.yyx * h)) +
    k.yxy * sdf(R * (p + k.yxy * h)) +
    k.xxx * sdf(R * (p + k.xxx * h)));
}

// Studio virtuel : grande boîte à lumière zénithale, bande verticale à droite,
// contre-jour safran en bas à gauche. Le pointeur déplace légèrement les sources.
vec3 envLight(vec3 r) {
  vec2 pl = u_pointer * 0.18;
  float top = smoothstep(0.7, 0.78, r.y + pl.y * 0.3) * smoothstep(0.5, 0.38, abs(r.x - pl.x) + 0.15 * abs(r.z));
  float strip = smoothstep(0.86, 0.9, r.x - pl.x * 0.5) * smoothstep(0.55, 0.4, abs(r.y - 0.08));
  float fill = smoothstep(-0.2, 1.0, r.y) * 0.06;
  float kick = pow(max(dot(r, normalize(vec3(-0.8, -0.38, 0.46))), 0.0), 70.0);
  float line = smoothstep(0.02, 0.0, abs(r.y + 0.12 - pl.y * 0.2)) * smoothstep(-0.2, -0.75, r.x);
  vec3 col = toLin(PARCH) * (top * 5.0 + strip * 2.6 + fill);
  col += toLin(SAFFRON) * (kick * 2.2 + line * 2.0);
  return col;
}

vec3 background(vec2 uv, float halo) {
  float t = u_time;
  vec2 q = vec2(fbm(uv * 1.2 + vec2(0.0, t * 0.03)), fbm(uv * 1.2 + vec2(5.2, 1.3) - t * 0.025));
  vec2 r = vec2(fbm(uv * 1.6 + 2.2 * q + vec2(1.7, 9.2) + t * 0.04), fbm(uv * 1.6 + 2.2 * q + vec2(8.3, 2.8)));
  float f = fbm(uv * 1.35 + 2.6 * r);
  float wisps = smoothstep(0.34, 0.82, f) * 0.8 + pow(f, 2.5) * 0.45;
  wisps *= 0.75 + 0.9 * halo;
  vec3 col = mix(toLin(SOOT), toLin(vec3(0.25, 0.232, 0.21)), wisps);
  col += toLin(SAFFRON) * 0.018 * smoothstep(1.3, 0.0, length(uv - vec2(-0.75, -0.55)));
  col *= 1.0 - 0.42 * dot(uv * 0.75, uv * 0.75);
  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec2 c = u_frame.xy + vec2(0.0, u_scroll * 0.35);
  vec2 o = uv - c;
  float halo = smoothstep(1.1, 0.25, length(o));

  vec3 col = background(uv, halo);
  // ombre douce : détache la goutte de la fumée
  col *= 1.0 - 0.35 * smoothstep(0.75, 0.2, length(o));

  vec3 ro = vec3(0.0, 0.0, 3.2);
  vec3 rd = normalize(vec3(o, -u_frame.z));
  mat3 R = objectRotation();

  // sphère englobante : on ne marche que là où l'objet peut se trouver
  float bR = 1.75 * (1.0 + u_scroll * 1.4);
  float b = dot(ro, rd);
  float disc = b * b - dot(ro, ro) + bR * bR;
  if (disc > 0.0) {
    float s = sqrt(disc);
    float tt = max(-b - s, 0.0);
    float tmax = -b + s;
    bool hit = false;
    vec3 p = ro;
    for (int i = 0; i < 96; i++) {
      if (float(i) >= u_steps) break;
      p = ro + rd * tt;
      float d = sdf(R * p);
      if (d < 0.0012) { hit = true; break; }
      tt += d * 0.78;
      if (tt > tmax) break;
    }
    if (hit) {
      vec3 n = calcNormal(p, R);
      vec3 v = -rd;
      vec3 rf = reflect(rd, n);
      float ndv = max(dot(n, v), 0.0);
      float fres = 0.05 + 0.95 * pow(1.0 - ndv, 5.0);
      vec3 base = toLin(vec3(0.032, 0.03, 0.028)) * (0.35 + 0.65 * max(dot(n, normalize(vec3(0.3, 0.8, 0.5))), 0.0));
      vec3 surf = base + envLight(rf) * mix(0.07, 1.0, fres);
      surf += toLin(SAFFRON) * pow(1.0 - ndv, 5.0) * 0.28 * smoothstep(0.0, -0.8, n.x + n.y * 0.6);
      float fade = 1.0 - smoothstep(0.55, 1.0, u_scroll);
      col = mix(col, surf, fade);
    }
  }

  col = col / (1.0 + col);
  col = pow(col, vec3(1.0 / 2.2));
  col += (hash(gl_FragCoord.xy + fract(u_time * 7.0) * 113.0) - 0.5) * 0.022;
  gl_FragColor = vec4(col, 1.0);
}
