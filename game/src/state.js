// state.js — the single source of truth for a Saltwind Caravan run:
// canvas size, the caravan road, the build plots, the wind compass,
// and the fresh-game factory. No drawing or input lives here.
export const VIEW_W = 1280;
export const VIEW_H = 720;

// The caravan road: a serpentine packed-earth track across the flat.
// The heart-cart and every raider travel along these waypoints.
export const ROAD = [
  { x: -40, y: 600 },
  { x: 340, y: 600 },
  { x: 340, y: 240 },
  { x: 640, y: 240 },
  { x: 640, y: 600 },
  { x: 940, y: 600 },
  { x: 940, y: 240 },
  { x: 1320, y: 240 },
];

// Eight compass winds. dx/dy point where the wind BLOWS TO.
export const WINDS = [
  { name: 'E', label: 'East', dx: 1, dy: 0, angle: 0 },
  { name: 'SE', label: 'South-East', dx: 0.7071, dy: 0.7071, angle: Math.PI / 4 },
  { name: 'S', label: 'South', dx: 0, dy: 1, angle: Math.PI / 2 },
  { name: 'SW', label: 'South-West', dx: -0.7071, dy: 0.7071, angle: 3 * Math.PI / 4 },
  { name: 'W', label: 'West', dx: -1, dy: 0, angle: Math.PI },
  { name: 'NW', label: 'North-West', dx: -0.7071, dy: -0.7071, angle: -3 * Math.PI / 4 },
  { name: 'N', label: 'North', dx: 0, dy: -1, angle: -Math.PI / 2 },
  { name: 'NE', label: 'North-East', dx: 0.7071, dy: -0.7071, angle: -Math.PI / 4 },
];

// Build plots: flat clearings beside the road where towers may stand.
// (x, y) are plot centres; nothing here overlaps the road.
export const PLOTS = [
  { x: 120, y: 480 }, { x: 220, y: 420 }, { x: 170, y: 180 },
  { x: 470, y: 480 }, { x: 470, y: 420 }, { x: 480, y: 130 },
  { x: 800, y: 480 }, { x: 780, y: 360 }, { x: 800, y: 130 },
  { x: 1090, y: 480 }, { x: 1090, y: 360 }, { x: 1090, y: 130 },
  { x: 250, y: 540 }, { x: 560, y: 540 }, { x: 860, y: 540 },
  { x: 1150, y: 540 }, { x: 60, y: 300 }, { x: 1210, y: 420 },
];

export const TOTAL_WAVES = 12;
export const CART_MAX_HP = 20;
export const START_SALT = 130;
export const START_WIND_CHARGES = 3;
export const MAX_WIND_CHARGES = 5;

// Length of each road segment, for distance-along-road lookups.
export function roadLengths() {
  const lens = [];
  for (let i = 0; i < ROAD.length - 1; i++) {
    const a = ROAD[i];
    const b = ROAD[i + 1];
    lens.push(Math.hypot(b.x - a.x, b.y - a.y));
  }
  return lens;
}

export const ROAD_LENGTHS = roadLengths();
export const ROAD_TOTAL = ROAD_LENGTHS.reduce((a, b) => a + b, 0);

// Position + heading at a distance along the road.
export function roadPoint(dist) {
  let d = Math.max(0, Math.min(dist, ROAD_TOTAL));
  for (let i = 0; i < ROAD_LENGTHS.length; i++) {
    if (d <= ROAD_LENGTHS[i] || i === ROAD_LENGTHS.length - 1) {
      const a = ROAD[i];
      const b = ROAD[i + 1];
      const t = ROAD_LENGTHS[i] === 0 ? 0 : d / ROAD_LENGTHS[i];
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angle: Math.atan2(b.y - a.y, b.x - a.x),
      };
    }
    d -= ROAD_LENGTHS[i];
  }
  const last = ROAD[ROAD.length - 1];
  return { x: last.x, y: last.y, angle: 0 };
}

export function createGame() {
  // The heart-cart starts 300 along the road, ahead of the raiders'
  // spawn — the caravan is already under way when the first wave hits.
  const start = roadPoint(300);
  return {
    screen: 'title', // title | play | won | lost
    paused: false,
    time: 0,
    salt: START_SALT,
    score: 0,
    kills: 0,
    leaks: 0,
    wave: 0,
    waveActive: false,
    spawnQueue: [],
    spawnTimer: 0,
    betweenTimer: 0,
    windIndex: 0, // East at the start of a run
    windCharges: START_WIND_CHARGES,
    cart: { dist: 300, hp: CART_MAX_HP, maxHp: CART_MAX_HP, x: start.x, y: start.y, angle: 0, bob: 0 },
    towers: [],
    enemies: [],
    projectiles: [],
    particles: [],
    floats: [],
    selected: 'sail',
    selectedTower: null,
    hoverPlot: null,
    mouse: { x: 0, y: 0, inside: false },
    message: '',
    messageTimer: 0,
    muted: false,
    shake: 0,
    flash: 0,
    demo: null,
    stats: { built: 0, earned: 0, gusts: 0, wavesCleared: 0 },
  };
}

export function windOf(game) {
  return WINDS[((game.windIndex % WINDS.length) + WINDS.length) % WINDS.length];
}

// Angle (radians) from a tower to a point, and whether that point lies
// downwind of the tower within a 60-degree half-cone of the wind.
export function isDownwind(game, fromX, fromY, toX, toY) {
  const w = windOf(game);
  const ang = Math.atan2(toY - fromY, toX - fromX);
  let diff = ang - w.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return Math.abs(diff) <= Math.PI / 3;
}
