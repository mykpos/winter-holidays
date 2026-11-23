// The winter backdrop: a winter dawn by day, a northern-lights night by dark.
// Each part is its own nested viewport sized in percent of the scene's box, so the
// garland stays on the top edge, the cabin and the Christmas tree stay in the
// bottom corners, and nothing important is cropped on a wide or a tall screen.

const WIDTH = 1600
const HEIGHT = 1000
const SEED = 20261225

const STAR_COUNT = 90
const STAR_BAND_HEIGHT = 520
const TWINKLE_SPREAD_SECONDS = 6
const GARLAND_ARCS = 4
const BULB_COUNT = 26
const RANGE_WIDTH = WIDTH * 2
const RANGE_HEIGHT = 500
const FOREST_TREES = 92
const FAR_PEAKS = 14
const NEAR_PEAK_SPACING = 180
const TREE_LIGHTS = 22

const BULB_COLORS = ['#ff4d5e', '#ffc94a', '#4fd08a', '#5fb8ff'] as const
const ORNAMENT_GRADIENTS = ['ball-red', 'ball-gold', 'ball-blue', 'ball-silver'] as const

type SnowLayer = { count: number; minR: number; maxR: number; seconds: number; opacity: number }

const SOFT_SNOW: readonly SnowLayer[] = [
  { count: 90, minR: 1.2, maxR: 2.2, seconds: 70, opacity: 0.6 },
  { count: 55, minR: 2.4, maxR: 3.8, seconds: 46, opacity: 0.85 },
]
const CRYSTAL_COUNT = 18
const CRYSTAL_SECONDS = 34

type Ornament = readonly [dx: number, dy: number, gradient: number]

const ORNAMENTS: readonly Ornament[] = [
  [-0.1, 0.3, 0], [0.12, 0.38, 1], [-0.16, 0.52, 2], [0.06, 0.56, 3], [0.2, 0.66, 0],
  [-0.22, 0.74, 1], [-0.04, 0.78, 2], [0.24, 0.86, 3], [-0.28, 0.9, 0], [0.02, 0.92, 1],
]

function seeded(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f = (n: number): string => n.toFixed(1)

function layer(box: string, viewBox: string, aspect: string, body: string): string {
  return `<svg ${box} viewBox="${viewBox}" preserveAspectRatio="${aspect}">${body}</svg>`
}

type Stop = readonly [at: number, color: string, opacity: number]

function radial(id: string, stops: readonly Stop[]): string {
  const body = stops.map(([at, color, opacity]) => `<stop offset="${at}" stop-color="${color}" stop-opacity="${opacity}"/>`).join('')
  return `<radialGradient id="${id}">${body}</radialGradient>`
}

function defs(): string {
  const sky =
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" class="sky-top"/><stop offset="0.55" class="sky-mid"/><stop offset="1" class="sky-bottom"/></linearGradient>`
  const aurora =
    `<linearGradient id="aurora" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#7bffcf" stop-opacity="0"/><stop offset="0.45" stop-color="#5df2c0" stop-opacity="0.55"/>` +
    `<stop offset="0.75" stop-color="#3aa8e0" stop-opacity="0.25"/><stop offset="1" stop-color="#7a5cff" stop-opacity="0"/></linearGradient>`
  const balls = [
    ['ball-red', '#ff8a8a', '#c4162c'],
    ['ball-gold', '#fff1b0', '#d49a17'],
    ['ball-blue', '#bfe6ff', '#2a6fd1'],
    ['ball-silver', '#ffffff', '#8fa3b8'],
  ]
    .map(([id, light, dark]) => `<radialGradient id="${id}" cx="0.35" cy="0.35" r="0.7"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`)
    .join('')
  const bulbs = BULB_COLORS.map((color, i) => radial(`bulb${i}`, [[0, '#ffffff', 1], [0.25, color, 1], [0.5, color, 0.35], [1, color, 0]])).join('')
  return (
    `<defs>${sky}${aurora}${balls}${bulbs}` +
    radial('flake', [[0, '#ffffff', 1], [0.55, '#ffffff', 0.85], [1, '#ffffff', 0]]) +
    radial('moon-halo', [[0, '#fff8dc', 0.55], [0.4, '#cfe3ff', 0.18], [1, '#cfe3ff', 0]]) +
    radial('sun-glow', [[0, '#fff3d6', 0.95], [0.35, '#ffd6b0', 0.5], [1, '#ffc9a8', 0]]) +
    radial('window-glow', [[0, '#ffd27a', 0.8], [1, '#ffb347', 0]]) +
    radial('star-glow', [[0, '#fff6c2', 0.9], [1, '#ffd34d', 0]]) +
    `<linearGradient id="meteor-tail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="0.3" stop-color="#cfe6ff" stop-opacity="0.5"/><stop offset="1" stop-color="#cfe6ff" stop-opacity="0"/></linearGradient>` +
    radial('smoke', [[0, '#e9eef5', 0.7], [1, '#e9eef5', 0]]) +
    `</defs>`
  )
}

function stars(random: () => number): string {
  let out = ''
  for (let i = 0; i < STAR_COUNT; i++) {
    const delay = f(random() * TWINKLE_SPREAD_SECONDS)
    const r = 0.5 + random() * random() * 1.8
    out += `<circle class="star" style="animation-delay:-${delay}s" cx="${f(random() * WIDTH)}" cy="${f(random() * STAR_BAND_HEIGHT)}" r="${f(r)}"/>`
  }
  return out
}

type AuroraBand = { y: number; amp: number; height: number; wave: number; cls: string }

const AURORA_BANDS: readonly AuroraBand[] = [
  { y: 70, amp: 38, height: 190, wave: 340, cls: 'aurora-a' },
  { y: 140, amp: 60, height: 150, wave: 460, cls: 'aurora-b' },
  { y: 40, amp: 26, height: 120, wave: 260, cls: 'aurora-c' },
]

function auroraBand(band: AuroraBand): string {
  const { y, amp, height, wave, cls } = band
  let top = `M${-wave} ${y}`
  let bottom = ''
  let even = true
  let x = -wave
  while (x <= WIDTH + wave) {
    top += ` Q${x + wave / 2} ${f(y + (even ? -amp : amp))} ${x + wave} ${y}`
    bottom = ` Q${x + wave / 2} ${f(y + height + (even ? amp * 0.5 : -amp * 0.5))} ${x} ${y + height}` + bottom
    even = !even
    x += wave
  }
  return `<path class="${cls}" fill="url(#aurora)" d="${top} L${x} ${y + height}${bottom} Z"/>`
}

function aurora(): string {
  return AURORA_BANDS.map(auroraBand).join('')
}

function ridge(random: () => number, base: number, peaks: number, height: number): string {
  let d = `M0 ${base}`
  const step = RANGE_WIDTH / peaks
  for (let i = 0; i < peaks; i++) {
    const x = i * step
    const peak = base - height * (0.55 + random() * 0.45)
    d += ` L${f(x + step * (0.35 + random() * 0.3))} ${f(peak)} L${f(x + step)} ${f(base - height * random() * 0.25)}`
  }
  return `${d} L${RANGE_WIDTH} ${RANGE_HEIGHT} L0 ${RANGE_HEIGHT}Z`
}

type Point = readonly [number, number]

const CAP_REACH = 0.32

// Peaks and valleys in turn across the whole range.
function nearRidge(random: () => number): Point[] {
  const points: Point[] = []
  let isPeak = false
  for (let x = 0; x < RANGE_WIDTH; x += NEAR_PEAK_SPACING * (0.8 + random() * 0.4)) {
    points.push([Math.round(x), Math.round(isPeak ? 200 + random() * 60 : 310 + random() * 60)])
    isPeak = !isPeak
  }
  points.push([RANGE_WIDTH, 330])
  return points
}

// Snow on a peak: down both slopes, with a ragged lower edge.
function peakCap(left: Point, peak: Point, right: Point): string {
  const at = (to: Point, t: number): string =>
    `${f(peak[0] + (to[0] - peak[0]) * t)} ${f(peak[1] + (to[1] - peak[1]) * t)}`
  const mid = (t: number, drop: number): string => {
    const x = peak[0] + ((left[0] - peak[0]) * (1 - t) + (right[0] - peak[0]) * t) * CAP_REACH
    const yl = peak[1] + (left[1] - peak[1]) * CAP_REACH
    const yr = peak[1] + (right[1] - peak[1]) * CAP_REACH
    return `${f(x)} ${f(yl + (yr - yl) * t - drop)}`
  }
  return `<path class="peak-snow" d="M${peak[0]} ${peak[1]} L${at(right, CAP_REACH)} L${mid(0.8, 14)} L${mid(0.62, -6)} L${mid(0.45, 18)} L${mid(0.28, -4)} L${mid(0.14, 12)} L${at(left, CAP_REACH)}Z"/>`
}

function mountains(random: () => number): string {
  let forest = ''
  for (let i = 0; i < FOREST_TREES; i++) {
    const x = (i + random() * 0.6) * (RANGE_WIDTH / FOREST_TREES)
    const h = 26 + random() * 34
    const base = 420 + random() * 14
    forest += `<path class="forest" d="M${f(x)} ${f(base - h)} L${f(x + h * 0.3)} ${f(base)} L${f(x - h * 0.3)} ${f(base)}Z"/>`
  }
  const ridgePoints = nearRidge(random)
  const near = ridgePoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')
  let caps = ''
  for (let i = 1; i < ridgePoints.length - 1; i++) {
    const [left, peak, right] = [ridgePoints[i - 1], ridgePoints[i], ridgePoints[i + 1]]
    if (left !== undefined && peak !== undefined && right !== undefined && peak[1] < left[1] && peak[1] < right[1]) {
      caps += peakCap(left, peak, right)
    }
  }
  return (
    `<path class="ridge-far" d="${ridge(random, 330, FAR_PEAKS, 210)}"/>` +
    `<path class="ridge-near" d="${near} L${RANGE_WIDTH} ${RANGE_HEIGHT} L0 ${RANGE_HEIGHT}Z"/>` +
    caps +
    `<path class="hill" d="M0 430 Q400 380 800 420 T1600 410 T2400 420 T3200 410 V${RANGE_HEIGHT} H0Z"/>` +
    forest +
    `<path class="hill-front" d="M0 470 Q500 440 1000 465 T2000 455 T3200 465 V${RANGE_HEIGHT} H0Z"/>`
  )
}

function softFlakes(random: () => number, snow: SnowLayer): string {
  let out = ''
  for (let i = 0; i < snow.count; i++) {
    const r = snow.minR + random() * (snow.maxR - snow.minR)
    out += `<circle cx="${f(random() * WIDTH)}" cy="${f(random() * HEIGHT)}" r="${f(r * 1.6)}"/>`
  }
  return out
}

function crystal(size: number): string {
  let d = ''
  const twig = size * 0.32
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k
    const ex = Math.cos(a) * size
    const ey = Math.sin(a) * size
    d += `M0 0L${f(ex)} ${f(ey)}`
    const bx = ex * 0.55
    const by = ey * 0.55
    for (const turn of [Math.PI / 4, -Math.PI / 4]) {
      d += `M${f(bx)} ${f(by)}l${f(Math.cos(a + turn) * twig)} ${f(Math.sin(a + turn) * twig)}`
    }
  }
  return d
}

function crystals(random: () => number): string {
  let out = ''
  for (let i = 0; i < CRYSTAL_COUNT; i++) {
    const size = 6 + random() * 7
    const spin = f(12 + random() * 16)
    out += `<g transform="translate(${f(random() * WIDTH)} ${f(random() * HEIGHT)})"><path class="crystal" style="animation-duration:${spin}s" d="${crystal(size)}"/></g>`
  }
  return out
}

function fallingField(field: string, seconds: number, opacity: number, sway: number): string {
  return (
    `<g class="sway" style="animation-duration:${sway}s"><g class="fall" style="animation-duration:${seconds}s" opacity="${opacity}">` +
    `<g>${field}</g><g transform="translate(0 -${HEIGHT})">${field}</g></g></g>`
  )
}

function snowfall(random: () => number): string {
  const soft = SOFT_SNOW.map((snow, i) => fallingField(`<g fill="url(#flake)">${softFlakes(random, snow)}</g>`, snow.seconds, snow.opacity, 8 + i * 3)).join('')
  return `<g>${soft}${fallingField(crystals(random), CRYSTAL_SECONDS, 0.95, 12)}</g>`
}

function garland(): string {
  const sag = 46
  const top = 8
  const arc = WIDTH / GARLAND_ARCS
  let wire = `M0 ${top}`
  for (let i = 0; i < GARLAND_ARCS; i++) {
    wire += ` Q${f(arc * i + arc / 2)} ${top + sag * 2} ${f(arc * (i + 1))} ${top}`
  }
  let bulbs = ''
  for (let i = 0; i < BULB_COUNT; i++) {
    const t = (i + 0.5) / BULB_COUNT
    const x = t * WIDTH
    const span = (t * GARLAND_ARCS) % 1
    const y = top + sag * 4 * span * (1 - span)
    const c = i % BULB_COLORS.length
    const delay = f((i * 0.7) % 5)
    bulbs +=
      `<g class="bulb" style="animation-delay:-${delay}s">` +
      `<circle cx="${f(x)}" cy="${f(y + 15)}" r="22" fill="url(#bulb${c})"/>` +
      `<rect class="socket" x="${f(x - 3)}" y="${f(y)}" width="6" height="7" rx="1.5"/>` +
      `<ellipse cx="${f(x)}" cy="${f(y + 15)}" rx="5.5" ry="8.5" fill="${BULB_COLORS[c]}"/>` +
      `<ellipse cx="${f(x - 1.8)}" cy="${f(y + 12)}" rx="1.6" ry="3" fill="#ffffff" opacity="0.7"/>` +
      `</g>`
  }
  return `<path class="wire" d="${wire}" fill="none" stroke-width="2.2"/>${bulbs}`
}

// One tier of a fir: a body with a scalloped lower edge, its shaded right half,
// and a cap of snow on its shoulders.
function tier(x: number, top: number, half: number, height: number, scallops: number): string {
  const bottom = top + height
  const width = (half * 2) / scallops
  const scallop = (k: number): string => {
    const x1 = x + half - width * (k + 1)
    return ` Q${f(x1 + width / 2)} ${f(bottom + height * 0.14)} ${f(x1)} ${f(bottom)}`
  }
  const rightSlope = `M${f(x)} ${f(top)} Q${f(x + half * 0.4)} ${f(top + height * 0.6)} ${f(x + half)} ${f(bottom)}`
  let edge = ''
  for (let k = 0; k < scallops; k++) {
    edge += scallop(k)
  }
  let shadeEdge = ''
  for (let k = 0; k < Math.floor(scallops / 2); k++) {
    shadeEdge += scallop(k)
  }
  const body = `${rightSlope}${edge} Q${f(x - half * 0.4)} ${f(top + height * 0.6)} ${f(x)} ${f(top)}Z`
  const shade = `${rightSlope}${shadeEdge} L${f(x)} ${f(bottom)}Z`
  const sy = top + height * 0.3
  const sh = half * 0.34
  const cap =
    `M${f(x)} ${f(top - 1)} Q${f(x + sh * 0.6)} ${f(sy - height * 0.1)} ${f(x + sh)} ${f(sy)}` +
    ` Q${f(x + sh * 0.5)} ${f(sy - height * 0.06)} ${f(x + sh * 0.2)} ${f(sy + height * 0.03)}` +
    ` Q${f(x)} ${f(sy - height * 0.08)} ${f(x - sh * 0.25)} ${f(sy + height * 0.02)}` +
    ` Q${f(x - sh * 0.6)} ${f(sy - height * 0.07)} ${f(x - sh)} ${f(sy)}` +
    ` Q${f(x - sh * 0.6)} ${f(sy - height * 0.1)} ${f(x)} ${f(top - 1)}Z`
  return `<path class="pine" d="${body}"/><path class="pine-shade" d="${shade}"/><path class="cap" d="${cap}"/>`
}

function fir(x: number, base: number, height: number): string {
  const tiers = 4
  let out = `<rect class="trunk" x="${f(x - height * 0.04)}" y="${f(base - height * 0.1)}" width="${f(height * 0.08)}" height="${f(height * 0.1)}"/>`
  for (let i = 0; i < tiers; i++) {
    const top = base - height + (i * height * 0.75) / tiers
    const half = height * 0.32 * (0.42 + (0.58 * (i + 1)) / tiers)
    out += tier(x, top, half, height * 0.36, 4 + i)
  }
  return out
}

function starPath(cx: number, cy: number, r: number): string {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const radius = i % 2 === 0 ? r : r * 0.42
    d += `${i === 0 ? 'M' : 'L'}${f(cx + radius * Math.cos(angle))} ${f(cy + radius * Math.sin(angle))}`
  }
  return `${d}Z`
}

function christmasTree(x: number, base: number, height: number): string {
  let out = fir(x, base, height)
  for (const [dx, dy, g] of ORNAMENTS) {
    const cx = x + dx * height * 0.9
    const cy = base - height + dy * height * 0.86
    const r = height * 0.026
    out += `<line class="ornament-string" x1="${f(cx)}" y1="${f(cy - r * 1.8)}" x2="${f(cx)}" y2="${f(cy - r)}"/>`
    out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#${ORNAMENT_GRADIENTS[g]})"/>`
  }
  for (let i = 0; i < TREE_LIGHTS; i++) {
    const t = (i + 0.5) / TREE_LIGHTS
    const y = base - height * (0.85 - t * 0.72)
    const span = height * 0.3 * (0.2 + t * 0.85)
    const lx = x + Math.sin(t * Math.PI * 5.5) * span * 0.85
    const c = i % BULB_COLORS.length
    out += `<circle class="tree-light" style="animation-delay:-${f((i * 0.9) % 5)}s" cx="${f(lx)}" cy="${f(y)}" r="${f(height * 0.012)}" fill="${BULB_COLORS[c]}"/>`
  }
  const sy = base - height - height * 0.03
  out += `<circle class="glow" cx="${f(x)}" cy="${f(sy)}" r="${f(height * 0.14)}" fill="url(#star-glow)"/>`
  out += `<path class="glow" d="${starPath(x, sy, height * 0.065)}" fill="#ffd34d" stroke="#fff3b0" stroke-width="1.5"/>`
  return out
}

function gift(x: number, base: number, w: number, h: number, box: string, ribbon: string): string {
  const lid = base - h - 6
  return (
    `<rect x="${f(x)}" y="${f(base - h)}" width="${f(w)}" height="${f(h)}" rx="2" fill="${box}"/>` +
    `<rect x="${f(x - 2)}" y="${f(lid)}" width="${f(w + 4)}" height="8" rx="2" fill="${box}"/>` +
    `<rect x="${f(x + w / 2 - 3)}" y="${f(lid)}" width="6" height="${f(h + 6)}" fill="${ribbon}"/>` +
    `<path d="M${f(x + w / 2)} ${f(lid)} q-14 -14 -16 -2 q4 6 16 2 q14 -14 16 -2 q-4 6 -16 2Z" fill="${ribbon}"/>` +
    `<path class="cap" d="M${f(x - 2)} ${f(lid + 1)} q${f(w / 4)} -5 ${f(w / 2 + 2)} -1 q${f(w / 4)} -4 ${f(w / 2 + 2)} 1 v3 h${f(-(w + 4))}Z"/>`
  )
}

function cabinWindow(wx: number, top: number): string {
  return (
    `<circle cx="${wx + 15}" cy="${top + 42}" r="44" fill="url(#window-glow)" class="window-glow"/>` +
    `<rect x="${wx}" y="${top + 28}" width="30" height="30" rx="2" fill="#ffd27a"/>` +
    `<path d="M${wx + 15} ${top + 28}v30M${wx} ${top + 43}h30" stroke="#6b3f22" stroke-width="3"/>` +
    `<rect x="${wx - 3}" y="${top + 56}" width="36" height="5" class="cap"/>`
  )
}

function cabin(x: number, base: number): string {
  const w = 170
  const h = 100
  const top = base - h
  let smoke = ''
  for (let i = 0; i < 4; i++) {
    smoke += `<circle class="smoke" style="animation-delay:-${i * 2}s" cx="${x + 127 + i * 7}" cy="${top - 74 - i * 30}" r="${14 + i * 6}" fill="url(#smoke)" opacity="${f(0.5 - i * 0.1)}"/>`
  }
  return (
    smoke +
    `<rect x="${x + 116}" y="${top - 64}" width="22" height="50" class="chimney"/>` +
    `<rect x="${x + 112}" y="${top - 70}" width="30" height="9" rx="4" class="cap"/>` +
    `<rect x="${x}" y="${top}" width="${w}" height="${h}" class="wall"/>` +
    `<path d="M${x} ${top + 20}h${w}M${x} ${top + 40}h${w}M${x} ${top + 60}h${w}M${x} ${top + 80}h${w}" class="logs"/>` +
    `<path d="M${x - 22} ${top + 6} L${x + w / 2} ${top - 64} L${x + w + 22} ${top + 6}Z" class="roof"/>` +
    `<path d="M${x - 28} ${top + 8} L${x + w / 2} ${top - 70} L${x + w + 28} ${top + 8} q-12 10 -26 2 q-14 12 -30 3 q-16 12 -34 2 q-18 12 -34 1 q-16 12 -32 2 q-16 10 -30 0 q-14 8 -26 -2Z" class="cap"/>` +
    cabinWindow(x + 22, top) +
    cabinWindow(x + 118, top) +
    `<rect x="${x + 70}" y="${top + 40}" width="34" height="60" rx="3" class="door"/>` +
    `<circle cx="${x + 97}" cy="${top + 72}" r="2.5" fill="#f2c14e"/>` +
    `<circle cx="${x + 87}" cy="${top + 22}" r="12" fill="none" stroke="#2f7a4f" stroke-width="6"/>` +
    `<path d="M${x + 82} ${top + 32} l5 6 l5 -6" stroke="#c4162c" stroke-width="3" fill="none"/>`
  )
}

function leftCorner(): string {
  return fir(60, 412, 230) + cabin(130, 404) + fir(370, 414, 190) + fir(460, 416, 140)
}

function rightCorner(): string {
  return (
    fir(70, 420, 170) +
    christmasTree(290, 396, 330) +
    gift(204, 406, 52, 38, '#c4162c', '#ffd34d') +
    gift(318, 410, 44, 30, '#2a6fd1', '#ffffff') +
    gift(368, 406, 38, 46, '#2f7a4f', '#ff4d5e') +
    fir(470, 420, 140)
  )
}

// Santa's sleigh and team, drawn facing right in its own units (about 400 by 100).
function reindeer(x: number, y: number): string {
  return (
    `<g class="deer">` +
    `<path d="M${x + 10} ${y + 4}L${x + 26} ${y + 13}M${x + 6} ${y + 6}L${x + 20} ${y + 16}M${x - 10} ${y + 4}L${x - 28} ${y + 9}M${x - 6} ${y + 6}L${x - 24} ${y + 14}" class="deer-leg"/>` +
    `<path d="M${x - 17} ${y - 2}Q${x - 24} ${y - 7} ${x - 22} ${y - 1}Z" fill="#f3ead8"/>` +
    `<ellipse cx="${x}" cy="${y}" rx="19" ry="8.5" class="deer-body"/>` +
    `<path d="M${x + 12} ${y - 4}Q${x + 20} ${y - 10} ${x + 22} ${y - 18}L${x + 29} ${y - 15}Q${x + 25} ${y - 5} ${x + 16} ${y + 3}Z" class="deer-body"/>` +
    `<ellipse cx="${x + 28}" cy="${y - 17}" rx="7" ry="4.5" class="deer-body" transform="rotate(18 ${x + 28} ${y - 17})"/>` +
    `<circle cx="${x + 34}" cy="${y - 14}" r="1.8" fill="#3a2418"/>` +
    `<circle cx="${x + 27}" cy="${y - 19}" r="1.1" fill="#1d120b"/>` +
    `<path d="M${x + 24} ${y - 21}l-4 -9l-5 -2M${x + 22} ${y - 26}l-5 1M${x + 27} ${y - 21}l1 -10l4 -4M${x + 28} ${y - 27}l4 0" class="antler"/>` +
    `<path d="M${x - 6} ${y - 8}Q${x} ${y + 9} ${x + 6} ${y - 8}" class="harness"/>` +
    `<circle cx="${x}" cy="${y + 7}" r="2" fill="#ffd34d"/>` +
    `</g>`
  )
}

function sleigh(): string {
  return (
    `<path d="M14 80H112Q132 80 134 66" class="runner"/><path d="M34 66V80M92 66V80" class="runner"/>` +
    `<path d="M18 48Q10 22 32 12Q38 4 44 12Q60 22 52 48Z" fill="#8a5a34"/>` +
    `<rect x="26" y="6" width="12" height="10" rx="1" fill="#2a6fd1"/><rect x="38" y="2" width="10" height="12" rx="1" fill="#2f7a4f"/>` +
    `<path d="M31 6v10M43 2v12" stroke="#ffd34d" stroke-width="2"/>` +
    `<ellipse cx="74" cy="42" rx="16" ry="17" fill="#d7263d"/>` +
    `<path d="M58 44h32" stroke="#2b1d14" stroke-width="4"/><rect x="71" y="41" width="6" height="6" fill="#ffd34d"/>` +
    `<path d="M84 36Q96 32 104 34" stroke="#d7263d" stroke-width="6" stroke-linecap="round" fill="none"/>` +
    `<circle cx="105" cy="34" r="3.5" fill="#2b1d14"/>` +
    `<circle cx="78" cy="18" r="9" fill="#f2c8a0"/>` +
    `<path d="M69 18Q70 34 79 34Q89 33 88 20Q84 24 79 22Q73 24 69 18Z" fill="#ffffff"/>` +
    `<circle cx="82" cy="15" r="1.3" fill="#2b1d14"/><circle cx="86" cy="19" r="2" fill="#e99a84"/>` +
    `<path d="M68 12Q72 0 88 6L86 12Z" fill="#d7263d"/><path d="M70 11Q66 4 58 6" stroke="#d7263d" stroke-width="5" stroke-linecap="round" fill="none"/>` +
    `<circle cx="57" cy="7" r="3.5" fill="#ffffff"/><rect x="66" y="10" width="23" height="5" rx="2.5" fill="#ffffff"/>` +
    `<path d="M4 30Q2 66 30 68L98 68Q116 68 120 46L124 30Q110 36 106 50L26 50Q14 50 12 30Z" class="sleigh-body"/>` +
    `<path d="M14 56Q24 62 40 62L100 62" stroke="#ffd34d" stroke-width="2.5" fill="none"/>` +
    `<circle cx="9" cy="30" r="5" fill="none" stroke="#ffd34d" stroke-width="2.5"/>`
  )
}

// Santa rests mid-sky, where reduced motion leaves him.
const SANTA_X = 700
const SANTA_Y = 132
const SANTA_SCALE = 1.05
// The team is about SANTA_SPAN wide and its sparkle trail reaches SANTA_TRAIL behind it.
const SANTA_SPAN = 400
const SANTA_TRAIL = 160
const SPARKLE_COUNT = 9

// He flies from SANTA_FLY_FROM to SANTA_FLY_TO, measured from the rest spot. On
// screen a point of the team lands at SANTA_X + SANTA_SCALE * k * (fly + its own x),
// where k is the rest scale below (1, 0.9 or 0.8); SANTA_MARGIN keeps both ends of
// the flight, trail included, off the 0..WIDTH band for every k.
const SANTA_MARGIN = 240
const SANTA_FLY_FROM = -(SANTA_X + SANTA_SPAN * SANTA_SCALE + SANTA_MARGIN)
const SANTA_FLY_TO = WIDTH - SANTA_X + SANTA_TRAIL * SANTA_SCALE + SANTA_MARGIN
const SANTA_FLY_SECONDS = 48
const SANTA_FLY_SHARE = 55
const SANTA_RISE = 10
const SANTA_DIP = 50

// A tall window shows only the middle of the band, so Santa rests a little left there, and smaller.
const SANTA_PORTRAIT_SHIFT = 100
const SANTA_PORTRAIT_SCALE = 0.9
// A very wide window shows only a thin strip of the band, so Santa flies lower
// and smaller there, clear of the garland.
const SANTA_ULTRAWIDE_DROP = 40
const SANTA_ULTRAWIDE_SCALE = 0.8

function sparkleTrail(): string {
  let out = ''
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const x = -12 - i * 16
    const y = 74 + Math.sin(i * 1.3) * 7
    out += `<circle cx="${x}" cy="${f(y)}" r="${f(2.6 - i * 0.22)}" fill="#ffe08a" opacity="${f(0.9 - i * 0.09)}"/>`
  }
  return out
}

function santa(): string {
  const reins = `<path d="M105 34L214 30L276 20L338 12" class="rein"/>`
  return (
    `<g transform="translate(${SANTA_X} ${SANTA_Y}) scale(${SANTA_SCALE})"><g class="santa-rest"><g class="santa-fly"><g class="santa-bob">` +
    sparkleTrail() +
    reins +
    reindeer(214, 36) +
    reindeer(276, 26) +
    reindeer(338, 18) +
    sleigh() +
    `</g></g></g></g>`
  )
}

// Each meteor falls along METEOR_ANGLE, down and to the left, by METEOR_TRAVEL,
// and its tail points back along the same line.
const METEOR_ANGLE = Math.PI / 6
const METEOR_TRAVEL = 345
const METEOR_DX = Math.cos(METEOR_ANGLE)
const METEOR_DY = Math.sin(METEOR_ANGLE)

type Meteor = { x: number; y: number; length: number; seconds: number; delay: number }

const METEORS: readonly Meteor[] = [
  { x: 560, y: 220, length: 170, seconds: 11, delay: 2 },
  { x: 1150, y: 200, length: 210, seconds: 17, delay: 7 },
  { x: 860, y: 260, length: 140, seconds: 13, delay: 11 },
  { x: 300, y: 300, length: 160, seconds: 19, delay: 15 },
]

// A streak falling down and to the left, bright at its head and fading to its tail.
function shootingStars(): string {
  return METEORS.map(({ x, y, length, seconds, delay }) => {
    const dx = length * METEOR_DX
    const dy = length * METEOR_DY
    return (
      `<g transform="translate(${x} ${y})"><g class="meteor" style="animation-duration:${seconds}s;animation-delay:-${delay}s">` +
      `<path d="M0 -1.6L${f(dx)} ${f(-dy - 0.4)}L${f(dx)} ${f(-dy + 0.4)}L0 1.6Z" fill="url(#meteor-tail)"/>` +
      `<circle r="2.6" fill="#ffffff"/><circle r="7" fill="url(#star-glow)"/>` +
      `</g></g>`
    )
  }).join('')
}

// The corner art is shown from y = GROUND_LIFT down, so it sits that much higher
// in its box, on a mound of snow that buries the trunks and the gifts' feet.
const GROUND_LIFT = 40

// The mound runs far past its corner (the corner draws with overflow visible),
// so the two corners' mounds meet with no edge between them.
const MOUND_REACH = 2000

function mound(width: number): string {
  return `<path class="drift-near" d="M${-MOUND_REACH} 480 L${-MOUND_REACH} 416 L-40 416 Q${f(width * 0.25)} 402 ${f(width * 0.5)} 416 T${width + 40} 412 L${width + MOUND_REACH} 412 L${width + MOUND_REACH} 480Z"/>`
}

// A tall screen has no room for two corners, so the cabin and the tree stand together.
function portraitGroup(): string {
  return (
    fir(40, 414, 160) +
    cabin(70, 404) +
    christmasTree(390, 396, 300) +
    gift(320, 408, 44, 32, '#c4162c', '#ffd34d') +
    gift(450, 410, 40, 38, '#2f7a4f', '#ff4d5e') +
    fir(500, 416, 130)
  )
}

const STYLE = `
.sky-top{stop-color:#9fc0e4}.sky-mid{stop-color:#d8e6f3}.sky-bottom{stop-color:#fbe3d6}
.ridge-far{fill:#c3d3e6}.ridge-near{fill:#9fb5d0}.peak-snow{fill:#f4f8fc}.hill{fill:#e3ecf5}.hill-front{fill:#f4f8fc}.forest{fill:#7f9bb5}
.drift-near{fill:#ffffff}
.pine{fill:#2f7a5c}.pine-shade{fill:#1f5a43}.trunk{fill:#6b4a33}.cap{fill:#ffffff}
.wire{stroke:#2f4a3a}.socket{fill:#4a5a4f}.ornament-string{stroke:#d9c27a;stroke-width:1}
.wall{fill:#8a5634}.logs{stroke:#6b3f22;stroke-width:2}.roof{fill:#5a3524}.door{fill:#5a3524}.chimney{fill:#7a4a33}
.crystal{fill:none;stroke:#ffffff;stroke-width:1.4;stroke-linecap:round;transform-box:fill-box;transform-origin:center;animation:spin linear infinite}
.night{opacity:0}.day{opacity:1}
.fall{animation:fall linear infinite}
.sway{animation:sway 9s ease-in-out infinite alternate}
.bulb{animation:twinkle 5s ease-in-out infinite}
.tree-light{animation:twinkle 4s ease-in-out infinite}
.star{fill:#ffffff;animation:twinkle 6s ease-in-out infinite}
.glow{animation:twinkle 7s ease-in-out infinite}
.window-glow{animation:flicker 9s ease-in-out infinite}
.smoke{transform-box:fill-box;transform-origin:center;animation:smoke 8s ease-out infinite}
.aurora-a{animation:aurora 40s ease-in-out infinite alternate}
.aurora-b{animation:aurora 55s ease-in-out infinite alternate-reverse;opacity:0.7}
.aurora-c{animation:aurora 70s ease-in-out infinite alternate;opacity:0.5}
.deer-body{fill:#8b5a3c}.deer-leg{stroke:#6e4630;stroke-width:3.2;stroke-linecap:round}.antler{stroke:#d8c3a0;stroke-width:2;stroke-linecap:round;fill:none}
.harness{stroke:#c4162c;stroke-width:3;fill:none}.rein{stroke:#c9a13b;stroke-width:1.4;fill:none}
.sleigh-body{fill:#c4162c}.runner{stroke:#e0b54a;stroke-width:3.5;stroke-linecap:round;fill:none}
.santa-fly{animation:santa-fly ${SANTA_FLY_SECONDS}s linear infinite}
.santa-bob{animation:santa-bob 3.2s ease-in-out infinite alternate}
.meteor{opacity:0;animation:meteor linear infinite}
@keyframes fall{from{transform:translateY(0)}to{transform:translateY(${HEIGHT}px)}}
@keyframes sway{from{transform:translateX(-16px)}to{transform:translateX(16px)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes twinkle{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes flicker{0%,100%{opacity:0.85}50%{opacity:1}}
@keyframes smoke{0%{opacity:0;transform:translate(0,0) scale(0.6)}20%{opacity:0.7}100%{opacity:0;transform:translate(30px,-140px) scale(2.4)}}
@keyframes santa-fly{0%{transform:translate(${f(SANTA_FLY_FROM)}px,${SANTA_DIP}px)}${SANTA_FLY_SHARE}%{transform:translate(${f(SANTA_FLY_TO)}px,${-SANTA_RISE}px)}100%{transform:translate(${f(SANTA_FLY_TO)}px,${-SANTA_RISE}px)}}
@keyframes santa-bob{from{transform:translateY(-7px)}to{transform:translateY(7px)}}
@keyframes meteor{0%{opacity:0;transform:translate(0,0)}1%{opacity:1}7%{opacity:0;transform:translate(${f(-METEOR_TRAVEL * METEOR_DX)}px,${f(METEOR_TRAVEL * METEOR_DY)}px)}100%{opacity:0;transform:translate(${f(-METEOR_TRAVEL * METEOR_DX)}px,${f(METEOR_TRAVEL * METEOR_DY)}px)}}
@keyframes aurora{from{transform:translateX(-120px);opacity:0.65}to{transform:translateX(120px);opacity:1}}
.portrait{display:none}
@media (max-aspect-ratio: 4/5){.landscape{display:none}.portrait{display:inline}.santa-rest{transform:translateX(-${SANTA_PORTRAIT_SHIFT}px) scale(${SANTA_PORTRAIT_SCALE})}}
@media (min-aspect-ratio: 3/1){.santa-rest{transform:translateY(${SANTA_ULTRAWIDE_DROP}px) scale(${SANTA_ULTRAWIDE_SCALE})}}
@media (prefers-color-scheme: dark){
.sky-top{stop-color:#040b18}.sky-mid{stop-color:#0c1d36}.sky-bottom{stop-color:#1c3556}
.ridge-far{fill:#2a4470}.ridge-near{fill:#1d3354}.peak-snow{fill:#b9c9dc}.hill{fill:#8ea5bf}.hill-front{fill:#b4c5d8}.forest{fill:#0f2136}
.drift-near{fill:#c9d7e6}
.pine{fill:#1a4a3a}.pine-shade{fill:#0f3227}.cap{fill:#dde7f2}
.wire{stroke:#8fa6bd}.socket{fill:#a9b8c8}
.wall{fill:#5e3a24}.roof{fill:#3a2218}.door{fill:#3a2218}
.night{opacity:1}.day{opacity:0}
}
`

export function winterScene(): string {
  const random = seeded(SEED)
  const full = 'x="0" y="0" width="100%" height="100%"'
  const sky = `<rect width="100%" height="100%" fill="url(#sky)"/>`
  const heavens = layer(
    full,
    `0 0 ${WIDTH} ${HEIGHT}`,
    'xMidYMid slice',
    `<g class="night">${stars(random)}${shootingStars()}</g><circle class="day" cx="${WIDTH * 0.3}" cy="760" r="420" fill="url(#sun-glow)"/>`,
  )
  const moon = layer(
    'x="50%" y="0" width="50%" height="45%"',
    '0 0 400 300',
    'xMaxYMid meet',
    `<g class="night"><circle cx="300" cy="170" r="120" fill="url(#moon-halo)"/>` +
      `<circle cx="300" cy="170" r="44" fill="#f6f1dc"/><circle cx="284" cy="158" r="9" fill="#e4dec4"/>` +
      `<circle cx="316" cy="184" r="6" fill="#e4dec4"/><circle cx="306" cy="148" r="4" fill="#e4dec4"/></g>`,
  )
  const auroraLayer = layer('x="0" y="0" width="100%" height="55%"', '0 0 1600 500', 'none', `<g class="night">${aurora()}</g>`)
  const santaLayer = layer('x="0" y="6%" width="100%" height="38%"', '0 0 1600 350', 'xMidYMid slice', santa())
  const range = layer('x="0" y="40%" width="100%" height="60%"', `0 0 ${RANGE_WIDTH} ${RANGE_HEIGHT}`, 'xMidYMax slice', mountains(random))
  const corner = (side: 'left' | 'right', art: string): string =>
    layer(
      `class="landscape" overflow="visible" x="${side === 'left' ? '0' : '50%'}" y="40%" width="50%" height="60%"`,
      `0 ${GROUND_LIFT} 520 440`,
      `${side === 'left' ? 'xMinYMax' : 'xMaxYMax'} meet`,
      art + mound(520),
    )
  const nearDrift = layer('x="0" y="92%" width="100%" height="8%"', '0 0 1600 120', 'none', '<path class="drift-near" d="M0 40Q260 0 560 30T1100 22T1600 34V120H0Z"/>')
  const snow = layer(full, `0 0 ${WIDTH} ${HEIGHT}`, 'xMidYMid slice', snowfall(random))
  const lights = layer(full, `0 0 ${WIDTH} 120`, 'xMidYMin meet', garland())
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">` +
    `<style>${STYLE}</style>` +
    defs() +
    sky +
    heavens +
    auroraLayer +
    moon +
    santaLayer +
    range +
    corner('left', leftCorner()) +
    corner('right', rightCorner()) +
    layer('class="portrait" overflow="visible" x="0" y="55%" width="100%" height="45%"', `0 ${GROUND_LIFT} 560 440`, 'xMidYMax meet', portraitGroup() + mound(560)) +
    nearDrift +
    snow +
    lights +
    `</svg>`
  )
}
