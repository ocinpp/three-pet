# Learning Guide: Three Pet Project

This document breaks down the technologies, patterns, and techniques used in the Three Pet project. Each section explains the concepts with real examples from the codebase.

---

## Table of Contents

1. [Vue 3 Composition API](#vue-3-composition-api)
2. [Pinia State Management](#pinia-state-management)
3. [Three.js 3D Graphics](#threejs-3d-graphics)
4. [TypeScript Best Practices](#typescript-best-practices)
5. [Game Development Patterns](#game-development-patterns)
6. [Mobile Browser Considerations](#mobile-browser-considerations)
7. [Browser APIs](#browser-apis)
8. [Architecture Patterns](#architecture-patterns)

---

## Vue 3 Composition API

### Script Setup Syntax

The `<script setup lang="ts">` syntax is the modern way to write Vue 3 components.

**Why use it?**
- Less boilerplate code
- Better TypeScript support
- Improved performance (compiled to more efficient code)

**Example from `App.vue`:**
```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { usePetStore } from './stores/petStore'

const petStore = usePetStore()

// Reactive state
const currentTimeOfDay = ref<TimeOfDay>(getTimeOfDay())

// Lifecycle hooks
onMounted(() => {
  // Initialize
})

onUnmounted(() => {
  // Cleanup
})
</script>
```

### Reactive Primitives: `ref()` vs `reactive()`

**`ref()`** - For primitive values and single objects
```typescript
const hunger = ref(100)        // Number
const isAlive = ref(true)      // Boolean
const lifeStage = ref('egg')   // String

// Access value with .value
hunger.value = 50
```

**`reactive()`** - For complex objects (less common in this project)
```typescript
const pet = reactive({
  hunger: 100,
  happiness: 100,
  energy: 100
})

// No .value needed
pet.hunger = 50
```

**Why this project uses `ref()` exclusively:**
- Consistent API
- Easier to destructure
- Works better with TypeScript

### Computed Properties

Derived state that automatically updates when dependencies change.

**Example from `petStore.ts`:**
```typescript
const mood = computed(() => {
  if (!isAlive.value) return 'dead'
  if (health.value < THRESHOLDS.HEALTH_LOW) return 'sick'
  if (poopCount.value >= 2) return 'dirty'
  if (energy.value < THRESHOLDS.ENERGY_LOW) return 'sleepy'
  if (happiness.value < THRESHOLDS.HAPPINESS_LOW) return 'sad'
  if (hunger.value < THRESHOLDS.HUNGER_HIGH) return 'hungry'
  if (happiness.value > THRESHOLDS.HAPPINESS_HIGH) return 'happy'
  return 'normal'
})
```

**Why use computed?**
- Automatic caching (recalculates only when dependencies change)
- Declarative (easy to understand)
- Read-only (prevents accidental mutations)

### Watchers: `watch()` for Side Effects

Use `watch()` when you need to perform actions in response to state changes.

**Example from `PetScene.vue`:**
```typescript
watch(() => petStore.lifeStage, () => {
  // Rebuild pet model when life stage changes
  createPet()
  spawnEvolutionParticles()
})

watch(() => petStore.poopCount, (newCount, oldCount) => {
  // Add/remove poop meshes
  if (newCount > oldCount) {
    addPoop()
  } else {
    clearPoop()
  }
})
```

**When to use `watch()` vs `computed()`:**
- Use `computed()` for derived values (no side effects)
- Use `watch()` for side effects (DOM updates, API calls, animations)

### Lifecycle Hooks

```typescript
onMounted(() => {
  // Called after component is mounted to DOM
  // Good for: DOM manipulation, API calls, initializing Three.js
})

onUnmounted(() => {
  // Called before component is destroyed
  // Good for: cleanup, removing event listeners
})
```

**Common pattern for cleanup:**
```typescript
let intervalId: number | null = null

onMounted(() => {
  intervalId = setInterval(() => {
    tick()
  }, 1000)
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId) // Prevent memory leak!
  }
})
```

---

## Pinia State Management

### Why Pinia over Vuex?

- **TypeScript-first**: Better type inference
- **Simpler API**: No mutations, no action namespacing
- **Composition API support**: Works naturally with `<script setup>`
- **DevTools integration**: Great debugging experience

### Store Structure

**Example from `petStore.ts`:**
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePetStore = defineStore('pet', () => {
  // State (ref)
  const hunger = ref(100)
  const happiness = ref(100)
  const isAlive = ref(true)

  // Computed (derived state)
  const mood = computed(() => {
    // ...
  })

  // Actions (functions)
  function feed() {
    hunger.value = Math.min(100, hunger.value + 30)
  }

  return {
    hunger,
    happiness,
    isAlive,
    mood,
    feed
  }
})
```

### Using Stores in Components

```vue
<script setup lang="ts">
import { usePetStore } from './stores/petStore'

const petStore = usePetStore()

// Access state
console.log(petStore.hunger)

// Call actions
petStore.feed()
</script>

<template>
  <!-- Use in template -->
  <div>Hunger: {{ petStore.hunger }}%</div>
  <button @click="petStore.feed()">Feed</button>
</template>
```

### Store Composition (Using One Store from Another)

**Example from `petStore.ts`:**
```typescript
import { useNotificationStore } from './notificationStore'

function sendNotification(type: string, title: string, body: string) {
  // Use notificationStore from within petStore
  const appNotificationStore = useNotificationStore()
  appNotificationStore.addNotification(type as AppNotification['type'], title, body)
}
```

**Key insight**: Stores can call other stores! This enables clean separation of concerns.

---

## Three.js 3D Graphics

### Scene Setup Pattern

Every Three.js scene needs these 4 things:

1. **Scene** - Container for all objects
2. **Camera** - Your viewpoint
3. **Renderer** - Draws the scene to canvas
4. **Light** - Makes objects visible

**Example from `PetScene.vue`:**
```typescript
// 1. Scene
const scene = new THREE.Scene()

// 2. Camera (field of view, aspect ratio, near, far)
const camera = new THREE.PerspectiveCamera(
  75,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
)
camera.position.set(0, 5, 10)
camera.lookAt(0, 0, 0)

// 3. Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setSize(container.clientWidth, container.clientHeight)
renderer.setPixelRatio(window.devicePixelRatio)
container.appendChild(renderer.domElement)

// 4. Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)
```

### Building Voxel Models with BoxGeometry

Voxel models are made by stacking small cubes (boxes).

**Example from `PetScene.vue` (Baby pet):**
```typescript
function createBaby() {
  const group = new THREE.Group()

  // Body (2x2x1 voxels)
  const bodyGeometry = new THREE.BoxGeometry(2, 2, 1)
  const bodyMaterial = new THREE.MeshBasicMaterial({ color: getPetColor() })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 1
  group.add(body)

  // Eyes
  const eyeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.1)
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  leftEye.position.set(-0.5, 1.5, 0.5)
  group.add(leftEye)

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  rightEye.position.set(0.5, 1.5, 0.5)
  group.add(rightEye)

  return group
}
```

**Key concepts:**
- **THREE.Group**: Container for multiple meshes (treated as one object)
- **THREE.Mesh**: Combination of geometry (shape) + material (appearance)
- **Positioning**: Use `x, y, z` coordinates to place voxels

### Animation Loop with `requestAnimationFrame`

**The standard Three.js animation pattern:**
```typescript
function animate() {
  requestAnimationFrame(animate)

  const time = Date.now() * 0.001

  // Animate pet (idle bobbing)
  if (petRef.current && petStore.isAlive) {
    petRef.current.position.y = 1 + Math.sin(time * 2) * 0.1
  }

  // Smoothly transition background color
  const targetColor = getBackgroundColor(timeOfDay)
  scene.background.lerp(targetColor, 0.02)

  renderer.render(scene, camera)
}

animate()
```

**Why `requestAnimationFrame`?**
- Syncs with monitor refresh rate (usually 60fps)
- Pauses when tab is inactive (saves battery)
- Smoother than `setInterval()`

### Particle Systems

**Example from `PetScene.vue` (Evolution particles):**
```typescript
function spawnEvolutionParticles() {
  const particleCount = 100
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)

  // Create random positions
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 5     // x
    positions[i + 1] = Math.random() * 3         // y
    positions[i + 2] = (Math.random() - 0.5) * 5 // z
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: 0xffd700,
    size: 0.2,
    transparent: true,
    opacity: 1
  })

  const particles = new THREE.Points(geometry, material)
  scene.add(particles)

  // Animate fade out
  const startTime = Date.now()
  function animateParticles() {
    const elapsed = Date.now() - startTime
    const progress = elapsed / 2000 // 2 seconds

    if (progress >= 1) {
      scene.remove(particles)
      return
    }

    material.opacity = 1 - progress
    particles.rotation.y += 0.02

    requestAnimationFrame(animateParticles)
  }

  animateParticles()
}
```

**Key techniques:**
- **BufferGeometry**: Efficient for many particles
- **Float32Array**: Typed array for performance
- **PointsMaterial**: Simple material for dots/squares
- **Transparent opacity**: Fade out effect

### Smooth Color Transitions with `lerp()`

`lerp()` = Linear Interpolation (smooth transition between values)

```typescript
// Gradually transition background color
const targetColor = new THREE.Color(0x87ceeb)
const currentColor = new THREE.Color(0xffe4b5)

// Interpolate 2% per frame
currentColor.lerp(targetColor, 0.02)

scene.background = currentColor
```

**Why use small lerp values (0.02)?**
- Slower = smoother transition
- 60fps × 0.02 = ~1.2 per second (takes ~1 second for full transition)

---

## TypeScript Best Practices

### Type Annotations for Props

```typescript
interface Props {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
}

const props = defineProps<Props>()
```

### Type Imports (No Runtime Dependency)

Use `type` keyword to import only types (removed from compiled JS):

```typescript
import { useNotificationStore, type AppNotification } from './notificationStore'
//                                  ^^^^
//                                  "type" keyword = no runtime code
```

### Union Types for State

```typescript
type LifeStage = 'egg' | 'baby' | 'child' | 'adult' | 'elder'
type EvolutionType = 'perfect' | 'good' | 'normal' | 'bad'

const lifeStage = ref<LifeStage>('egg')
```

**Why union types?**
- Autocomplete in IDE
- Catch typos at compile time
- Self-documenting code

### Strict Typing, Avoid `any`

```typescript
// ❌ Bad - loses type safety
function addNotification(type: any, title: string) {
  // ...
}

// ✅ Good - preserves type safety
function addNotification(type: AppNotification['type'], title: string) {
  // ...
}
```

### Interface vs Type

**Use `interface` for:**
- Object shapes
- Public APIs (can be extended)

```typescript
interface AppNotification {
  id: string
  type: 'hungry' | 'sick' | 'sleepy' | 'sad' | 'dirty' | 'dead' | 'evolved'
  title: string
  message: string
  timestamp: number
  read: boolean
}
```

**Use `type` for:**
- Unions
- Primitives
- Mapped types

```typescript
type LifeStage = 'egg' | 'baby' | 'child' | 'adult' | 'elder'
type NotificationType = AppNotification['type'] // Extract from interface
```

---

## Game Development Patterns

### Game Loop Architecture

The heart of any game is the loop that updates state and renders.

**Pattern from `petStore.ts`:**
```typescript
// 1. Start loop
onMounted(() => {
  tickInterval = window.setInterval(() => {
    tick()
    lastActiveTime.value = Date.now()
  }, 1000) // 1 second = 1 game second
})

// 2. Game tick function
function tick() {
  if (!isAlive.value) return

  // Egg doesn't decay
  if (lifeStage.value === 'egg') {
    if (age.value >= GROWTH_TIMING.EGG_HATCH) {
      evolve()
    }
    age.value += 1
    return
  }

  // Decay stats
  hunger.value = Math.max(0, hunger.value - DECAY_RATES.HUNGER)
  happiness.value = Math.max(0, happiness.value - DECAY_RATES.HAPPINESS)
  energy.value = Math.max(0, energy.value - DECAY_RATES.ENERGY)

  // Check evolution
  if (lifeStage.value === 'baby' && age.value >= GROWTH_TIMING.BABY_EVOLVE) {
    evolve()
  }

  // Check death
  if (health.value <= THRESHOLDS.HEALTH_CRITICAL) {
    isAlive.value = false
  }

  // Send notifications (only when tab hidden)
  if (document.hidden) {
    checkAndSendNotifications()
  }
}

// 3. Cleanup
onUnmounted(() => {
  if (tickInterval !== null) {
    clearInterval(tickInterval)
  }
})
```

**Key concepts:**
- **Fixed timestep**: 1 game second = 1 real second
- **Guard clauses**: Return early for special cases (egg, dead)
- **State clamping**: `Math.max(0, value)` prevents negative stats
- **Conditional logic**: Notifications only when tab hidden

### Offline Time Calculation

How to handle player returning after being away?

**Pattern from `petStore.ts`:**
```typescript
function processOfflineTime() {
  const now = Date.now()
  const elapsedMs = now - lastActiveTime.value
  const elapsedSeconds = Math.floor(elapsedMs / 1000)

  if (elapsedSeconds > 1) {
    // Cap at 1 hour to prevent excessive aging
    const maxOfflineSeconds = 3600
    const secondsToSimulate = Math.min(elapsedSeconds, maxOfflineSeconds)

    console.log(`Processing ${secondsToSimulate}s offline time...`)

    // Save BEFORE processing (in case it fails)
    saveState()

    // Simulate each second
    for (let i = 0; i < secondsToSimulate; i++) {
      tick() // Reuse existing tick function!
    }

    // Save AFTER processing
    saveState()
  }

  lastActiveTime.value = now
}
```

**Key techniques:**
- **Reuse `tick()` function**: Don't duplicate logic
- **Double-save protection**: Save before AND after
- **Cap offline time**: Prevent unfair punishment
- **Timestamp-based**: Calculate elapsed time, don't rely on `setInterval`

### State Persistence Pattern

**Save function:**
```typescript
function saveState() {
  const state = {
    hunger: hunger.value,
    happiness: happiness.value,
    health: health.value,
    energy: energy.value,
    age: age.value,
    lifeStage: lifeStage.value,
    evolutionType: evolutionType.value,
    isAlive: isAlive.value,
    isSleeping: isSleeping.value,
    poopCount: poopCount.value,
    totalCareScore: totalCareScore.value,
    careSamples: careSamples.value,
    lastActiveTime: lastActiveTime.value,
  }
  localStorage.setItem('three-pet-state', JSON.stringify(state))
}
```

**Load function with validation:**
```typescript
function loadState(): boolean {
  const saved = localStorage.getItem('three-pet-state')
  if (saved) {
    try {
      const state = JSON.parse(saved)

      // Validate required fields
      if (!state.lifeStage || typeof state.age !== 'number') {
        console.error('Invalid state detected, starting fresh')
        return false
      }

      // Use nullish coalescing for safe defaults
      hunger.value = state.hunger ?? 100
      happiness.value = state.happiness ?? 100
      health.value = state.health ?? 100

      console.log('State loaded successfully')
      return true
    } catch (e) {
      console.error('Failed to load state:', e)
      return false
    }
  }
  return false
}
```

**Key concepts:**
- **Validation**: Check required fields before accepting data
- **Nullish coalescing (`??`)**: Use default value only if `null` or `undefined`
- **Return boolean**: Indicate success/failure to caller
- **Try/catch**: Handle corrupted localStorage

### Game Balance with Constants

**File: `src/constants/pet.ts`**
```typescript
export const GROWTH_TIMING = {
  EGG_HATCH: 30,      // 30 seconds
  BABY_EVOLVE: 90,    // 90 seconds
  CHILD_EVOLVE: 210,  // 3.5 minutes
  ADULT_EVOLVE: 390,  // 6.5 minutes
}

export const DECAY_RATES = {
  HUNGER: 0.5,      // -0.5 per second
  HAPPINESS: 0.3,   // -0.3 per second
  ENERGY: 0.2,      // -0.2 per second
  HEALTH_DECAY: 2,  // -2 per second when neglected
  HEALTH_REGEN: 0.5, // +0.5 per second
}

export const THRESHOLDS = {
  HUNGER_HIGH: 30,     // Hungry when < 30%
  HUNGER_LOW: 60,      // Full when > 60%
  HAPPINESS_LOW: 30,
  ENERGY_LOW: 30,
  HEALTH_LOW: 50,
  HEALTH_CRITICAL: 0,
}

export const EVOLUTION_QUALITY = {
  PERFECT_MIN: 90,  // 90%+ average stats
  GOOD_MIN: 70,     // 70%+ average stats
  NORMAL_MIN: 50,   // 50%+ average stats
}
```

**Why separate constants?**
- Easy to tune gameplay
- Self-documenting (names explain values)
- Single source of truth
- Can be modified without touching logic

---

## Mobile Browser Considerations

### Page Visibility API

Detect when user switches away from your tab.

```typescript
document.addEventListener('visibilitychange', handleVisibilityChange)

function handleVisibilityChange() {
  if (document.hidden) {
    // Tab is hidden - save state!
    console.log('Page hidden - saving state')
    saveState()

    // iOS Safari workaround
    if (isIOSSafari()) {
      setTimeout(() => saveState(), 100)
    }
  } else {
    // Tab is visible again - process offline time
    console.log('Page visible - loading state')
    loadState()
    processOfflineTime()
  }
}
```

**Why important for mobile?**
- Mobile users switch apps frequently
- Browsers may kill background tabs to save memory
- Need to save state before losing it

### Page Lifecycle Events

Modern browsers emit lifecycle events:

```typescript
// More reliable than beforeunload on mobile
window.addEventListener('pagehide', handlePageHide)

// Browser freezing page to save memory
document.addEventListener('freeze', handleFreeze)

// Browser thawing frozen page
document.addEventListener('resume', handleResume)

// Tab gains/loses focus
window.addEventListener('focus', handleFocus)
window.addEventListener('blur', handleBlur)
```

### iOS Safari Detection

**User Agent Detection:**
```typescript
function isIOSSafari(): boolean {
  const ua = window.navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua)
  return isIOS && isSafari
}
```

**Why detect iOS Safari?**
- Notification API not supported in regular browser mode
- Event firing is unreliable
- Needs special workarounds (delayed double-save)

### Timer Throttling in Background Tabs

Browsers throttle `setInterval` in background tabs (to save battery).

**Problem:**
```typescript
// This slows down when tab is hidden!
setInterval(() => {
  tick()
}, 1000)
```

**Solution: Timestamp-based calculation**
```typescript
// Save timestamp on each tick
lastActiveTime.value = Date.now()

// Calculate elapsed time when returning
const elapsedMs = Date.now() - lastActiveTime.value
const elapsedSeconds = Math.floor(elapsedMs / 1000)

// Simulate missed ticks
for (let i = 0; i < elapsedSeconds; i++) {
  tick()
}
```

---

## Browser APIs

### Notification API (with Fallback)

**Request permission:**
```typescript
async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false // Not supported
  }

  if (Notification.permission === 'granted') {
    return true
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}
```

**Send notification with fallback:**
```typescript
function sendNotification(type: string, title: string, body: string) {
  // Try browser notification first
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: type, // Prevents duplicates
    })
  } else {
    // Fallback to in-app notification
    const appNotificationStore = useNotificationStore()
    appNotificationStore.addNotification(type as AppNotification['type'], title, body)
  }
}
```

**Only send when tab hidden:**
```typescript
// Don't annoy user while they're playing!
if (document.hidden) {
  checkAndSendNotifications()
}
```

### localStorage API

**Save data:**
```typescript
localStorage.setItem('key', JSON.stringify(data))
```

**Load data:**
```typescript
const saved = localStorage.getItem('key')
if (saved) {
  const data = JSON.parse(saved)
}
```

**Clear data:**
```typescript
localStorage.removeItem('key')
```

### requestAnimationFrame

**Smooth animations:**
```typescript
function animate() {
  requestAnimationFrame(animate)

  // Update scene
  const time = Date.now() * 0.001
  mesh.position.y = Math.sin(time * 2) * 0.1

  // Render
  renderer.render(scene, camera)
}

animate()
```

---

## Architecture Patterns

### Separation of Concerns

**Stores (State):** `src/stores/`
- `petStore.ts` - Game logic, state, actions
- `notificationStore.ts` - Notification state

**Components (UI):** `src/components/`
- `PetScene.vue` - Three.js rendering
- `AppNotifications.vue` - Notification display

**Constants (Config):** `src/constants/`
- `pet.ts` - Game balance values

**Benefits:**
- Easy to find code
- Testable in isolation
- Reusable across projects

### Component Communication

**Parent → Child:** Props
```vue
<!-- Parent -->
<PetScene :time-of-day="currentTimeOfDay" />

<!-- Child -->
<script setup lang="ts">
const props = defineProps<{
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
}>()
</script>
```

**Child → Parent:** Emit events (not used in this project, but good to know)
```vue
<!-- Child -->
<button @click="$emit('feed')">Feed</button>

<!-- Parent -->
<PetScene @feed="handleFeed" />
```

**Cross-Component:** Pinia stores
```typescript
// Any component can access
const petStore = usePetStore()
petStore.feed()
```

### Reactive State Updates

Vue's reactivity system automatically tracks dependencies and updates the DOM.

**How it works:**
1. Component accesses `petStore.hunger`
2. Vue tracks this dependency
3. When `petStore.hunger` changes, Vue re-renders
4. DOM updates automatically

```vue
<template>
  <!-- Automatically updates when hunger changes -->
  <div>Hunger: {{ petStore.hunger }}%</div>
</template>
```

### Conditional Rendering

Show/hide elements based on state:

```vue
<!-- Revive overlay only shows when pet is dead -->
<div v-if="!petStore.isAlive" class="revive-overlay">
  <button @click="petStore.revive()">Revive</button>
</div>

<!-- Button text changes based on state -->
<button>
  <span v-if="petStore.isSleeping">WAKE</span>
  <span v-else-if="petStore.poopCount > 0">CLEAN</span>
  <span v-else>SLEEP</span>
</button>

<!-- Show notification indicator when there are unread -->
<div
  v-if="notificationStore.unreadCount > 0"
  class="notification-indicator"
>
  🔔 {{ notificationStore.unreadCount }}
</div>
```

### List Rendering

Render arrays with `v-for`:

```vue
<TransitionGroup name="notification">
  <div
    v-for="notification in notificationStore.notifications"
    :key="notification.id"
    class="notification-card"
  >
    {{ notification.title }}
  </div>
</TransitionGroup>
```

**Key points:**
- Always provide a unique `:key`
- Use `<TransitionGroup>` for list animations

---

## Advanced Patterns

### Cooldown System

Prevent spamming actions or notifications:

```typescript
const lastNotificationTime = ref<Record<string, number>>({})

function sendNotification(type: string, title: string, body: string, cooldownMs = 60000) {
  const now = Date.now()
  const lastSent = lastNotificationTime.value[type] || 0

  // Check cooldown
  if (now - lastSent < cooldownMs) return

  // Send notification
  new Notification(title, { body })

  // Update last sent time
  lastNotificationTime.value[type] = now
}
```

### Care Quality Tracking

How to track average stats over time:

```typescript
const totalCareScore = ref(0)
const careSamples = ref(0)

// Sample every 10 seconds
if (age.value % 10 === 0) {
  const currentCare = (hunger.value + happiness.value + health.value + energy.value) / 4
  totalCareScore.value += currentCare
  careSamples.value += 1
}

// Calculate evolution type
function calculateEvolution(): EvolutionType {
  if (careSamples.value === 0) return 'normal'
  const avgCare = totalCareScore.value / careSamples.value

  if (avgCare >= 90) return 'perfect'
  if (avgCare >= 70) return 'good'
  if (avgCare >= 50) return 'normal'
  return 'bad'
}
```

### Priority-Based Mood System

Order matters! Check most important conditions first:

```typescript
const mood = computed(() => {
  // Highest priority: Dead
  if (!isAlive.value) return 'dead'

  // Second: Sick
  if (health.value < 50) return 'sick'

  // Third: Dirty (poop)
  if (poopCount.value >= 2) return 'dirty'

  // Fourth: Sleepy
  if (energy.value < 30) return 'sleepy'

  // Fifth: Sad
  if (happiness.value < 30) return 'sad'

  // Sixth: Hungry
  if (hunger.value < 30) return 'hungry'

  // Seventh: Happy
  if (happiness.value > 80) return 'happy'

  // Default: Normal
  return 'normal'
})
```

### Multiple Save Triggers

Don't rely on a single save event - use multiple triggers:

```typescript
// Visibility change (tab hidden/visible)
document.addEventListener('visibilitychange', handleVisibilityChange)

// Page hide (more reliable than beforeunload on mobile)
window.addEventListener('pagehide', handlePageHide)

// Page freeze (browser freezing page)
document.addEventListener('freeze', handleFreeze)

// Focus/blur (tab switching)
window.addEventListener('focus', handleFocus)
window.addEventListener('blur', handleBlur)

// Periodic auto-save (backup)
autoSaveInterval = setInterval(() => {
  saveState()
}, 30000) // Every 30 seconds
```

---

## CSS Techniques

### Retro LCD Scanline Effect

```css
.lcd-screen::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
  pointer-events: none;
  z-index: 2;
}
```

**How it works:**
- `repeating-linear-gradient` creates horizontal lines
- 2px transparent, 2px semi-transparent black
- Creates scanline effect

### 3D Button Press Effect

```css
.physical-btn {
  box-shadow:
    0 6px 0 #2e7d32,        /* Drop shadow (button height) */
    0 8px 12px rgba(0, 0, 0, 0.3),  /* Soft shadow */
    inset 0 -3px 8px rgba(0, 0, 0, 0.2),  /* Inner shadow (bottom) */
    inset 0 3px 8px rgba(255, 255, 255, 0.3);  /* Inner highlight (top) */
}

.physical-btn:active {
  transform: translateY(4px);
  box-shadow:
    0 2px 0 #2e7d32,  /* Reduced drop shadow */
    0 4px 8px rgba(0, 0, 0, 0.2),
    inset 0 -1px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 4px rgba(255, 255, 255, 0.3);
}
```

**How it works:**
- Active state moves button down 4px
- Reduces drop shadow from 6px to 2px
- Creates illusion of button being pressed

### Pulse Animation

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.notification-indicator {
  animation: pulse 1.5s infinite;
}
```

**Use case:** Draw attention to unread notifications

### TransitionGroup Animations

```css
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
```

**How it works:**
- Vue applies classes automatically to list items
- Items slide in from right, slide out to right
- `TransitionGroup` handles enter/leave transitions

---

## Testing & Debugging

### Console Logging for Mobile Issues

The game logs important events for debugging:

```typescript
console.log('State loaded successfully')
console.log('Processing 120s offline time...')
console.log('Page hidden - saving state')
console.log('iOS Safari detected - forcing save')
```

**Open browser DevTools to see these logs!**

### Click to Cycle Time of Day (Testing Feature)

```typescript
function cycleTimeOfDay() {
  const timesOfDay: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night']
  const currentIndex = timesOfDay.indexOf(currentTimeOfDay.value)
  const nextIndex = (currentIndex + 1) % timesOfDay.length
  currentTimeOfDay.value = timesOfDay[nextIndex]
}
```

**Click the time badge in App.vue to test different lighting!**

---

## Key Takeaways

### For Vue Development
- Use `<script setup lang="ts">` for modern Vue 3 components
- Pinia for state management (simpler than Vuex)
- `computed()` for derived values, `watch()` for side effects
- Always cleanup event listeners and timers in `onUnmounted()`

### For Three.js
- Always need: Scene, Camera, Renderer, Light
- Use `THREE.Group` to organize complex models
- `requestAnimationFrame` for smooth animations
- `lerp()` for smooth transitions

### For TypeScript
- Use `ref<Type>()` for typed reactive state
- Union types for string literals (`'a' | 'b' | 'c'`)
- Avoid `any` - use proper types or `unknown`
- Import types with `type` keyword

### For Game Development
- Separate constants from logic
- Use timestamps for offline time (don't rely on `setInterval`)
- Save state before AND after processing
- Cap offline time to prevent excessive aging

### For Mobile Support
- Use Page Visibility API
- Multiple save triggers (visibility, pagehide, blur, periodic)
- iOS Safari needs special handling (delayed double-save)
- Test on real devices!

---

## Further Learning Resources

### Vue 3
- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [VueUse](https://vueuse.org/) (Composable utilities)

### Three.js
- [Three.js Documentation](https://threejs.org/docs/)
- [Three.js Examples](https://threejs.org/examples/)
- [Three.js Journey](https://threejs-journey.com/) (Paid course)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vue TypeScript Guide](https://vuejs.org/guide/typescript/overview.html)

### Game Development
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)
- [Gamedev.js](https://gamedevjs.io/)

---

## Practice Exercises

1. **Add a new stat**: Implement a "thirst" stat that decays over time
2. **Create a new animation**: Add a "dancing" animation when pet is very happy
3. **Add a new notification**: Create a "thirsty" notification type
4. **Modify game balance**: Adjust evolution timings to make the game faster/slower
5. **Create a new life stage**: Add a "teen" stage between child and adult
6. **Add a mini-game**: Implement a simple rock-paper-scissors game for playing
7. **Customize colors**: Change the evolution type colors to your preference
8. **Add sound effects**: Play sounds when feeding, playing, evolving
9. **Create achievements**: Track achievements like "Perfect Care 5 Times"
10. **Multi-pet system**: Support raising multiple pets simultaneously

---

Happy coding! 🚀

*Remember: The best way to learn is to experiment, break things, and fix them.*
