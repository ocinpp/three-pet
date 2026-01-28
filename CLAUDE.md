# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Three Pet is a 3D voxel pet game built with Vue 3, Three.js, and Pinia. The game features a Tamagotchi-style virtual pet with real-time needs, evolution system, day/night cycles, and browser notifications.

## Common Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Tech Stack
- **Vue 3** (v3.5.13) - Composition API with `<script setup>`
- **Vite** (v6.1.0) - Build tool and dev server
- **Pinia** (v2.2.8) - State management (installed in `src/main.ts`)
- **Three.js** (v0.173.0) - 3D graphics with WebGLRenderer

### Project Structure

```
src/
├── components/
│   └── PetScene.vue          # Three.js 3D scene component
│                              # Contains all voxel models (egg, baby, child, adult, elder)
│                              # Handles animations, particles, lighting, and time-of-day transitions
├── stores/
│   └── petStore.ts           # Pinia store with all game logic
│                              # Game loop (1 second ticks)
│                              # State management, evolution logic
│                              # Offline time calculation
│                              # Notification system with cooldowns
├── constants/
│   └── pet.ts                # Game balance constants
│                              # Evolution timings, decay rates, thresholds
├── App.vue                   # Main UI component
│                              # Stats display, action buttons
│                              # Time-of-day tracking
└── main.ts                   # App entry point
```

### Core Systems

#### Game Loop (petStore.ts)
- Runs on 1-second intervals via `setInterval`
- Each tick = 1 game second
- Handles stat decay, evolution checks, poop spawning, health calculations
- Saves state to localStorage on each tick

#### State Persistence
- State saved to `localStorage` key `'three-pet-state'`
- Includes: all stats, age, life stage, evolution type, care quality tracking
- Saves on: page visibility change (hidden), beforeunload

#### Offline Time Calculation
- Uses `lastActiveTime` timestamp to calculate elapsed seconds
- On page visibility change (visible), loads saved state and simulates missed ticks
- Calls `tick()` function in a loop to catch up on elapsed time
- Important: Pet continues to age even when tab is closed

#### Notification System
- Only sends notifications when `document.hidden` is true (tab inactive)
- Cooldown system prevents spam (1 minute default per notification type)
- Tracks `lastNotificationTime` per type: hungry, sick, sleepy, sad, dirty, dead, evolved
- Requests permission on first user interaction

#### Evolution System
- 5 life stages: egg → baby → child → adult → elder
- Evolution type determined by care quality: perfect (90%+), good (70%+), normal (50%+), bad (<50%)
- Care quality sampled every 10 seconds (`CARE.SAMPLE_INTERVAL`)
- `totalCareScore` and `careSamples` track average stats over time

#### Time-of-Day System
- Tracked in App.vue, passed as prop to PetScene.vue
- Morning (6am-11am), Afternoon (11am-4pm), Evening (4pm-7pm), Night (7pm-6am)
- Click the time badge to cycle through times (for testing)
- Affects background color, ground color, and light intensity in 3D scene

#### Mood System (Computed Property)
- Priority order: dead > sick > dirty > sleepy > sad > hungry > happy > normal
- Determines status message color and pet animations

### 3D Scene (PetScene.vue)

#### Voxel Models
- All models built programmatically with `THREE.BoxGeometry` and `THREE.MeshLambertMaterial`
- No external model files - each life stage has a dedicated `create*()` function
- `getPetColor()` returns evolution-based color (gold/hot pink/light pink/gray)

#### Animations
- Idle: gentle bobbing (`Math.sin(time * 2)`)
- Eating: quick hopping (`Math.sin(time * 8)`)
- Playing: excited spinning and jumping
- Egg wobble: nervous shaking
- Hatching: rapid rotation and scaling
- Sleep: gentle breathing motion
- Death: pet falls over (`rotation.x = Math.PI / 2`)

#### Lighting System
- `THREE.AmbientLight` and `THREE.DirectionalLight` for base lighting
- `THREE.PointLight` (sleepLight) for warm glow when sleeping
- Intensity changes based on time-of-day and sleep state

#### Background Transitions
- Smooth color interpolation using `THREE.Color.lerp()`
- Updates every frame in `animate()` loop
- Transition speed: 0.02 factor

#### Particle Systems
- Evolution particles: 100 particles, radial expansion, fades over 2 seconds
- ZZZ particles: spawned while sleeping, float upward, fade over 3 seconds
- Implemented with `THREE.Points` and `THREE.BufferGeometry`

### Vue Components

#### App.vue
- Main UI container with stat bars and action buttons
- Manages time-of-day state (updates every 60 seconds)
- Handles notification permission requests
- All action buttons disabled when pet is sleeping (except sleep/wake button)

#### PetScene.vue
- Pure Three.js component wrapped in Vue
- Uses Vue's `watch()` to react to store changes:
  - `lifeStage` change → rebuild pet model + spawn particles
  - `poopCount` change → add/remove poop meshes
  - `isSleeping` change → toggle sleep light + update colors
- Animation loop runs via `requestAnimationFrame`

### Game Balance (src/constants/pet.ts)

Key constants for gameplay tuning:
- `GROWTH_TIMING`: Age thresholds for evolution (30s, 90s, 210s, 390s)
- `DECAY_RATES`: Stat decrease per tick (hunger: 0.5, happiness: 0.3, energy: 0.2)
- `THRESHOLDS`: Trigger levels for low stats, mood changes
- `EVOLUTION_QUALITY`: Minimum average stats for perfect/good/normal evolution
- `ACTIONS`: Amount restored by feed/play actions
- `POOP`: Spawn mechanics (2% chance per tick after 45s, max 8)

### Important Implementation Details

#### Browser APIs Used
- **Page Visibility API**: Detects when tab is hidden/visible for offline time calculation
- **Notification API**: Native browser notifications
- **localStorage**: Persistent state saving
- **requestAnimationFrame**: Smooth 60fps animations

#### Vue Watchers vs Computed
- Use `computed` for derived state (mood, evolution type)
- Use `watch` for side effects (Three.js scene updates, notifications)

#### Three.js Lifecycle
- Initialize in `onMounted()` after DOM is ready
- Clean up in `onUnmounted()` (remove event listeners, cancel animation frame)
- Always check `containerRef.value` exists before initializing

#### Color System
- Hex colors used throughout (e.g., `0xFFD700` for gold)
- Evolution colors in `getPetColor()` (PetScene.vue line 36)
- Time-of-day colors in `getBackgroundColor()` and `getGroundColor()` (PetScene.vue line 55)

#### Testing Features
- Click time badge in App.vue to cycle through times of day
- Game runs at 1 second = 1 game second (can be sped up by modifying tick interval)
