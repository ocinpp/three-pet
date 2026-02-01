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

# Run linter with auto-fix
npm run lint

# Format code with Prettier
npm run format
```

## Code Quality Standards

### Linting & Formatting
This project uses ESLint 9+ (flat config) and Prettier for consistent code quality.

#### Before Committing
Always run:
```bash
npm run lint    # Check and fix linting issues
npm run format  # Format all files
```

#### ESLint Configuration
- Config file: `eslint.config.js`
- Vue 3 + TypeScript support via `vue-eslint-parser`
- Prettier integration (runs as part of ESLint)
- Auto-fixes enabled
- Unused variables must be prefixed with `_` (e.g., `_unusedVar`)

#### Prettier Configuration
- Config file: `.prettierrc.json`
- Single quotes, no semicolons (Vue community style)
- 100 character line width
- ES5 trailing commas
- LF line endings

#### VSCode Setup
- `.vscode/settings.json` - Auto-format on save, ESLint integration
- `.vscode/extensions.json` - Recommended extensions
- Install Prettier and ESLint extensions for best experience

#### Code Style Rules
1. **Vue Components**: Use `<script setup lang="ts">` syntax
2. **TypeScript**: Strict typing, avoid `any` when possible
3. **Variables**: Use `const` by default, `let` only when necessary
4. **Naming**: camelCase for variables/funcs, PascalCase for components
5. **Imports**: Order: Vue libs → External libs → Internal modules
6. **Unused variables**: Prefix with `_` to satisfy linter

### Pre-commit Workflow
```bash
# Make sure code is clean before committing
npm run lint && npm run format

# Then commit your changes
git add .
git commit -m "Your message"
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
- **Multiple save triggers for reliability**:
  - `visibilitychange` event (tab hidden/visible)
  - `pagehide` event (more reliable than beforeunload on mobile)
  - `freeze` event (browser freezing page to save memory)
  - `resume` event (browser thawing frozen page)
  - `focus` event (tab gains focus)
  - `blur` event (tab loses focus)
  - `beforeunload` event (page closing)
  - **Periodic auto-save** every 30 seconds (`AUTO_SAVE.INTERVAL`)
- **iOS Safari workaround**: Delayed double-save (100ms) when page hides
- **State validation**: `loadState()` validates required fields before accepting data

#### Offline Time Calculation
- Uses `lastActiveTime` timestamp to calculate elapsed seconds
- On page visibility change (visible), loads saved state and simulates missed ticks
- **Double-save protection**: Saves state before AND after processing offline ticks
- Calls `tick()` function in a loop to catch up on elapsed time
- Capped at 1 hour (3600 seconds) to prevent excessive aging
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
- `AUTO_SAVE`: Periodic save interval (30000ms = 30 seconds)

### Important Implementation Details

#### Browser APIs Used
- **Page Visibility API**: Detects when tab is hidden/visible for offline time calculation
- **Page Lifecycle Events**:
  - `pagehide` - More reliable than `beforeunload` on mobile
  - `freeze` - Browser freezing page to save memory
  - `resume` - Browser thawing frozen page
- **Focus/Blur Events**: Detect tab switching for additional state saves
- **Notification API**: Native browser notifications
- **localStorage**: Persistent state saving
- **requestAnimationFrame**: Smooth 60fps animations

#### Mobile Browser Considerations
- **iOS Safari**: Event firing is unreliable, uses delayed double-save workaround
- **Android Chrome**: Works well with standard Page Visibility API
- **Timer Throttling**: Background tabs throttle `setInterval` - relies on timestamp calculation instead
- **Process Killing**: Mobile browsers may kill background tabs - periodic auto-save provides backup
- **localStorage Clearing**: Some browsers clear localStorage on force-quit - state validation handles this

#### State Validation & Recovery
- `loadState()` returns `boolean` to indicate success/failure
- Validates required fields (`lifeStage`, `age`) before accepting state
- Uses nullish coalescing (`??`) for all optional fields with safe defaults
- Logs errors to console for debugging mobile issues

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

## Mobile Browser Testing

### Testing Checklist

#### Desktop Testing
1. Open browser DevTools console
2. Switch to another tab and back - check console for event logs
3. Close tab and reopen - state should be preserved
4. Wait 30+ seconds - verify "Auto-saved state" appears in console

#### iOS Safari Testing
1. Switch to another tab and back - pet should have aged
2. Lock phone, unlock after 1 minute - offline time should be processed
3. Switch to another app, return - state preserved
4. Force-quit Safari, reopen - state should load (may not always work due to iOS limitations)
5. Rotate device - state preserved

#### Android Chrome Testing
1. Same scenarios as iOS Safari
2. Test with battery saver mode on/off

### Console Logging
The game logs various events for debugging mobile issues:
- `State loaded successfully` - State loaded from localStorage
- `No saved state found` - Fresh start
- `Processing Xs offline time...` - Offline time being processed
- `Page hidden - saving state` - Visibility change triggered save
- `Page visible - loading state` - Visibility change triggered load
- `iOS Safari detected - forcing save` - iOS workaround triggered
- `Auto-saved state` - Periodic backup save (every 30s)
- `Page hiding/freezing/blurring/focused/etc.` - Various event triggers

### Known Limitations
- **iOS Safari** - Can still lose state if browser is force-quit and localStorage is cleared (OS-level limitation)
- **Timer Throttling** - Background tabs may throttle setInterval, but timestamp calculation compensates
- **Max Offline Cap** - Only processes up to 1 hour of offline time to prevent excessive aging
