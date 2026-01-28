// Pet growth timing (in seconds)
export const GROWTH_TIMING = {
  EGG_HATCH: 30,          // 30 seconds to hatch
  BABY_DURATION: 60,      // 1 minute as baby
  CHILD_DURATION: 120,    // 2 minutes as child
  ADULT_DURATION: 180,    // 3 minutes as adult
  // Total: 5 minutes to reach elder

  // Age thresholds for evolution
  BABY_EVOLVE: 90,        // 30s (egg) + 60s (baby)
  CHILD_EVOLVE: 210,      // 90s + 120s (child)
  ADULT_EVOLVE: 390,      // 210s + 180s (adult)
} as const

// Stat decay rates per tick (1 tick = 1 second)
export const DECAY_RATES = {
  HUNGER: 0.5,
  HAPPINESS: 0.3,
  ENERGY: 0.2,
  HEALTH_DECAY: 1,        // When needs are neglected
  HEALTH_REGEN: 0.5,      // When needs are met
} as const

// Stat thresholds
export const THRESHOLDS = {
  HUNGER_LOW: 20,
  HUNGER_HIGH: 30,
  HAPPINESS_LOW: 20,
  HAPPINESS_HIGH: 70,
  ENERGY_LOW: 10,
  HEALTH_LOW: 30,
  HEALTH_CRITICAL: 0,
} as const

// Care quality sampling
export const CARE = {
  SAMPLE_INTERVAL: 10,    // Sample every 10 seconds
} as const

// Evolution quality thresholds
export const EVOLUTION_QUALITY = {
  PERFECT_MIN: 90,
  GOOD_MIN: 70,
  NORMAL_MIN: 50,
} as const

// Action amounts
export const ACTIONS = {
  FEED_HUNGER: 30,
  FEED_HAPPINESS: 5,
  PLAY_HAPPINESS: 25,
  PLAY_HUNGER_COST: 10,
  ACTION_DURATION: 2000,  // ms
} as const

// Hatching animation
export const HATCHING = {
  ANIMATION_DURATION: 2000, // ms
} as const

// Poop mechanics
export const POOP = {
  SPAWN_INTERVAL: 45,       // Poop every 45 seconds (on average)
  MAX_POOP: 8,              // Maximum poop before pet gets sick
  POOP_CHANCE: 0.02,        // 2% chance per tick after interval
} as const

// Sleep mechanics
export const SLEEP = {
  ENERGY_RECOVERY: 2,       // Energy recovered per tick while sleeping
} as const
