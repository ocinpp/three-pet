# Three Pet - Browser Tamagotchi 🎮

A modern 3D voxel pet game built with Vue 3, Three.js, and Pinia. Experience raising your own virtual pet with real-time needs, evolution system, day/night cycles, and browser notifications - all in a nostalgic Tamagotchi-inspired device interface!

![Three Pet](https://img.shields.io/badge/Vue-3.5.13-42b883) ![Pinia](https://img.shields.io/badge/Pinia-2.2.8-yellow) ![Three.js](https://img.shields.io/badge/Three.js-0.173.0-white)

## ✨ Features

### Core Gameplay
- **5 Life Stages** - Egg → Baby → Child → Adult → Elder
- **Evolution System** - Pet appearance changes based on care quality
  - ⭐ **Perfect** (90%+ avg stats) - Golden pet
  - 💖 **Good** (70%+ avg stats) - Hot pink pet
  - 👍 **Normal** (50%+ avg stats) - Light pink pet
  - 😔 **Bad** (<50% avg stats) - Gray pet
- **4 Need Systems** - Hunger, Happiness, Energy, Health
- **Poop System** - Pet creates poop over time, clean to keep them healthy!
- **Sleep Mode** - Put your pet to sleep to restore energy faster
- **Revive System** - Start over when pet passes away

### 🎨 Visual Features
- **Tamagotchi-Style Device Interface** - Authentic 90s egg-shaped device frame with:
  - Sunny yellow gradient body with hot pink page background
  - Physical A/B/C control buttons with 3D tactile press effects
  - Retro LCD screen with scanline overlay (75% width, square 1:1)
  - Compact mobile-first design (no scrolling)
  - Reset button below controls (retro pin reset style)
  - "Enable Alerts" button positioned outside device frame
- **Unique 3D Voxel Models** - Different designs for each life stage
- **Evolution Effects** - Colorful particle effects when pet evolves
- **Time-of-Day System** - Dynamic backgrounds and lighting:
  - 🌅 **Morning** (6am-11am) - Soft yellow sunrise, fresh green ground
  - ☀️ **Afternoon** (11am-4pm) - Bright blue sky, vibrant green
  - 🌆 **Evening** (4pm-7pm) - Warm orange sunset, golden tones
  - 🌙 **Night** (7pm-6am) - Dark blue sky, dim lighting
- **Smooth Color Transitions** - Background smoothly transitions between times
- **Sleep Visuals** - Dark background with warm glow when sleeping
- **Animated Particles** - ZZZ particles while sleeping, evolution sparkles

### 💤 Smart Features
- **Offline Time Calculation** - Pet continues to age even when tab is closed!
  - Saves state to localStorage with multiple triggers (visibility change, page hide, blur, periodic auto-save)
  - Simulates missed ticks when you return
  - Capped at 1 hour maximum to prevent excessive aging
  - Double-save protection (before and after offline processing)
  - Mobile-optimized with iOS Safari specific workarounds
- **Browser Notifications** - Get alerted when your pet needs attention:
  - 🍖 Hungry alerts
  - 🤒 Sick alerts
  - 😴 Sleepy alerts
  - 😢 Sad alerts
  - 🤢 Dirty alerts (poop needs cleaning)
  - ✨ Evolution notifications
  - 💀 Death notifications
  - Only triggers when tab is inactive (won't annoy you while playing)
- **Cooldown System** - Prevents notification spam (1 minute per type)
- **iOS-Friendly Prompts** - Toast notifications inform users when features aren't supported on their device

### 🎭 Mood System
Your pet shows different moods with unique colors:
- 😊 **Happy** - Light green background
- 😋 **Hungry** - Light yellow background
- 🤒 **Sick** - Light red background
- 😴 **Sleepy** - Light indigo background
- 😢 **Sad** - Light purple background
- 🤢 **Dirty** - Light lime background
- 😐 **Normal** - Default state
- 💀 **Dead** - Light red background

### 🎮 Animations
- **Idle Bobbing** - Gentle bouncing when active
- **Eating Bounce** - Quick hopping while feeding
- **Playing Spin** - Excited spinning and jumping
- **Egg Wobble** - Nervous shaking before hatching
- **Hatching Spin** - Rapid rotation during evolution
- **Sleep Breathing** - Gentle up/down motion while sleeping
- **Death Fall** - Pet falls over when passing away

## 🎯 How to Play

### Controls
- **Button A** (Green) - Feed your pet to restore hunger (+30)
- **Button B** (Blue) - Play with your pet to increase happiness (+25, costs -10 hunger)
- **Button C** (Orange) - Smart button:
  - Clean when poop is present (removes poop, +10 happiness)
  - Put pet to sleep (restores energy +2/sec)
  - Wake pet up when sleeping
- **RESET Button** - Clears all saved progress and restarts with a fresh egg (retro pin reset style)
- **Note**: All A/B/C buttons are disabled while pet is an egg (waiting to hatch)

### Basic Care
1. **Wait to Hatch** - Egg takes 30 seconds to hatch
2. **Keep Stats High**:
   - Press **A** to feed and restore hunger (+30)
   - Press **B** to play and increase happiness (+25, costs -10 hunger)
   - Press **C** to clean poop (+10 happiness) or put pet to sleep/wake up
   - While sleeping, pet restores energy (+2/sec)
3. **Watch Stats Decay**:
   - Hunger -0.5/sec | Happiness -0.3/sec | Energy -0.2/sec
   - Health decreases if any stat drops below 30%
   - Too much poop (3+) makes pet sick faster!
4. **Evolution Timeline**:
   - 🥚 Egg: 0-30 seconds
   - 🐣 Baby: 30-90 seconds
   - 🐥 Child: 90-210 seconds
   - 🐔 Adult: 210-390 seconds
   - 🦄 Elder: 390+ seconds
5. **Care Quality Matters** - Maintain high stats for better evolution!
6. **Poop Management** - Pet randomly creates poop, clean before it reaches 3!
7. **Sleep Strategy** - Put pet to sleep to recover energy, but can't play while sleeping

### Pro Tips 💡
- **Best Care**: Feed before playing to avoid hunger penalty
- **Clean Early**: Remove poop before it accumulates (max 3)
- **Sleep Smart**: Put pet to sleep when energy is low but health is good
- **Watch Colors**: Status message color indicates urgency
- **Offline Warning**: Pet continues aging when tab is closed!

## 🖥️ Tech Stack

### Core Framework
- **Vue 3** (v3.5.13) - Progressive JavaScript framework with Composition API
- **Vite** (v6.1.0) - Lightning-fast build tool and dev server
- **Pinia** (v2.2.8) - Type-safe state management
- **TypeScript** - Type-safe development

### Code Quality
- **ESLint** (v9.39.2) - Code linting with flat config
- **Prettier** (v3.8.1) - Code formatting
- **vue-eslint-parser** - Vue 3 + TypeScript parsing
- **eslint-plugin-vue** - Vue-specific linting rules
- **typescript-eslint** - TypeScript linting support

### 3D Graphics
- **Three.js** (v0.173.0) - 3D rendering engine
  - WebGLRenderer for hardware acceleration
  - MeshBasicMaterial for pet (bright, vibrant colors unaffected by lighting)
  - MeshLambertMaterial for ground and environment (subtle shading)
  - BoxGeometry for voxel construction
  - Particle systems for effects
  - Smooth color transitions with lerp()

### Browser APIs
- **Page Visibility API** - Detect tab focus for offline time calculation
- **Notification API** - Native browser notifications
- **localStorage API** - Persistent state saving
- **requestAnimationFrame** - Smooth 60fps animations

### Game Systems
- **Real-time game loop** - 1 second = 1 game second
- **State sampling** - Care quality measured every 5 seconds
- **Offline time simulation** - Catches up on missed ticks
- **Cooldown timers** - Prevents notification spam
- **Priority mood system** - Determines pet's current state

## 🏗️ Project Structure

```
src/
├── components/
│   └── PetScene.vue          # Three.js 3D scene with all life stage models
│                              # - Time-of-day lighting system
│                              # - Smooth background transitions
│                              # - Particle effects
│                              # - All voxel models (egg, baby, child, adult, elder)
├── stores/
│   └── petStore.ts           # Pet state, evolution logic, game loop
│                              # - Offline time calculation
│                              # - Notification system
│                              # - Care quality tracking
│                              # - Lifecycle management
├── constants/
│   └── pet.ts                # Game balance constants
│                              # - Evolution timings
│                              # - Decay rates
│                              # - Thresholds
│                              # - Action values
├── App.vue                   # Tamagotchi-style device interface
│                              # - Egg-shaped device frame
│                              # - LCD screen container with overlay stats
│                              # - Physical A/B/C control buttons
│                              # - RESET button (retro pin reset style)
│                              # - Time-of-day badge
│                              # - Notification prompt
└── main.ts                   # App entry point, Pinia setup
```

## 🎨 Design System

### Tamagotchi Device Interface

The game features an authentic Tamagotchi-inspired design:

#### Device Frame
- **Shape**: Egg-shaped with asymmetric border-radius (`50% 50% 50% 50% / 60% 60% 40% 40%`)
- **Colors**: Sunny yellow gradient (`#FFF176` → `#FFD54F`)
- **Dimensions**: 90vw × 85vh (max 400px × 700px)
- **Padding**: 65px vertical, 18px horizontal
- **Background**: Hot pink page background (`#FF6B9D`)
- **Overflow**: Hidden (keeps all elements inside)

#### LCD Screen
- **Aspect Ratio**: Square (1:1)
- **Width**: 75% of device frame width
- **Background**: Classic LCD green (`#C8F7C5`)
- **Frame**: Dark gray (`#4A4A4A`)
- **Effects**: Scanline overlay for retro feel

#### Physical Buttons
- **Button A** (Green `#43A047`): Feed action
- **Button B** (Blue `#1E88E5`): Play action
- **Button C** (Orange `#FB8C00`): Smart button (Clean/Sleep/Wake)
- **RESET Button**: Retro pin reset style, full-width button below controls
- **Style**: 3D tactile appearance with press animations

#### Typography
- **Branding**: Permanent Marker (retro marker font)
- **Labels**: Press Start 2P (pixel font)
- **UI Text**: Outfit (modern sans-serif)

### Color Palette

#### Status Colors
| Mood | Background | Text |
|------|------------|------|
| Happy | `#d1fae5` | `#065f46` |
| Hungry | `#fef3c7` | `#92400e` |
| Sick | `#fee2e2` | `#991b1b` |
| Sleepy | `#e0e7ff` | `#3730a3` |
| Sad | `#f3e8ff` | `#6b21a8` |
| Dirty | `#fef9c3` | `#854d0e` |

#### Evolution Colors
| Type | Color (Hex) |
|------|-------------|
| Perfect | `0xFFD700` (Gold) |
| Good | `0xFF69B4` (Hot pink) |
| Normal | `0xFFB6C1` (Light pink) |
| Bad | `0x808080` (Gray) |

#### Time-of-Day Backgrounds
| Time | Background | Ground | Light Intensity |
|------|------------|--------|-----------------|
| Morning | `0xFFE4B5` | `0x98D8AA` | 0.5/0.6 |
| Afternoon | `0x87CEEB` | `0x90EE90` | 0.6/0.8 |
| Evening | `0xFF6B6B` | `0x7CB342` | 0.4/0.5 |
| Night | `0x1a1a2e` | `0x2d4a3e` | 0.2/0.3 |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
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

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🧹 Code Quality

### Linting & Formatting

This project uses **ESLint** and **Prettier** to maintain consistent code quality.

#### ESLint
- Flat config format (ESLint 9+)
- Vue 3 + TypeScript support
- Auto-fixes issues on run
- Config: `eslint.config.js`

#### Prettier
- Single quotes, no semicolons (Vue style)
- 100 character line width
- Automatic formatting on save in VSCode
- Config: `.prettierrc.json`

#### VSCode Integration
The project includes recommended VSCode settings:
- Auto-format on save
- ESLint auto-fix on save
- Recommended extensions auto-prompt

### Code Style Guidelines
- Use Vue Composition API with `<script setup lang="ts">`
- Prefix unused variables with underscore (`_`)
- Prefer `const` over `let`, avoid `var`
- Use TypeScript for type safety
- Follow Vue 3 style guide

## ⚙️ Customization

### Evolution Colors
Edit `src/components/PetScene.vue` in `getPetColor()`:
```javascript
function getPetColor(): number {
  switch (petStore.evolutionType) {
    case 'perfect': return 0xFFD700 // Gold
    case 'good': return 0xFF69B4    // Hot pink
    case 'normal': return 0xFFB6C1  // Light pink
    case 'bad': return 0x808080     // Gray
  }
}
```

### Evolution Timings
Edit `src/constants/pet.ts`:
```javascript
export const GROWTH_TIMING = {
  EGG_HATCH: 30,      // Egg hatch time (seconds)
  BABY_EVOLVE: 90,    // Baby → Child
  CHILD_EVOLVE: 210,  // Child → Adult
  ADULT_EVOLVE: 390   // Adult → Elder
}
```

### Stat Decay Rates
Edit `src/constants/pet.ts`:
```javascript
export const DECAY_RATES = {
  HUNGER: 0.5,      // Hunger per second
  HAPPINESS: 0.3,   // Happiness per second
  ENERGY: 0.2,      // Energy per second
  HEALTH_DECAY: 2,  // Health damage when neglected
  HEALTH_REGEN: 0.5 // Health recovery
}
```

### Care Quality Thresholds
Edit `src/constants/pet.ts`:
```javascript
export const EVOLUTION_QUALITY = {
  PERFECT_MIN: 90,  // Requires 90%+ average stats
  GOOD_MIN: 70,     // Requires 70%+ average stats
  NORMAL_MIN: 50    // Requires 50%+ average stats
}
```

### Notification Settings
Edit `src/stores/petStore.ts` cooldown:
```javascript
function sendNotification(
  type: string,
  title: string,
  body: string,
  cooldownMs = 60000  // Default 1 minute cooldown
)
```

### Time-of-Day Hours
Edit `src/components/PetScene.vue`:
```javascript
function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 16) return 'afternoon'
  if (hour >= 16 && hour < 19) return 'evening'
  return 'night'
}
```

## 🎯 Future Enhancements

### Phase 2: More Interactions
- [x] Clean button (hygiene stat) ✅ **DONE**
- [x] Sleep button (restore energy) ✅ **DONE**
- [ ] Mini-games for playing
- [ ] Training system
- [ ] Pet toys and accessories

### Phase 3: More Life Features
- [x] Life stages (egg → baby → child → adult → elder) ✅ **DONE**
- [x] Evolution based on care quality ✅ **DONE**
- [x] Visual changes per stage ✅ **DONE**
- [x] Poop system ✅ **DONE**
- [ ] Species selection (cat, dog, dragon, etc.)
- [ ] Breeding system
- [ ] Pet personalities

### Phase 4: Polish
- [ ] Sound effects and background music
- [x] More animations ✅ **DONE**
- [x] Particle effects (evolution) ✅ **DONE**
- [x] Save/load with localStorage ✅ **DONE**
- [x] Browser notifications ✅ **DONE**
- [ ] Achievement system
- [ ] Stickers and badges

### Phase 5: Advanced
- [ ] Multiple pet species with unique models
- [ ] Customization (colors, accessories)
- [ ] Import/export MagicaVoxel files
- [ ] Multiplayer features (pet battles, trading)
- [ ] Leaderboards
- [ ] Seasonal events

## 🎮 Voxel Character Models

Each life stage has a unique voxel model built with Three.js BoxGeometry:

- **Egg** - Ellipsoid shape with decorative gold spots and crack hints
- **Baby** - Small round body with oversized sparkly eyes and tiny beak
- **Child** - Medium size with extra rosy cheeks, tiny smile, and hair tuft
- **Adult** - Full size with detailed eyes, sweet smile, and hands
- **Elder** - Wise appearance with glasses, gentle smile, gray hair tuft

For custom models, create them in [MagicaVoxel](https://ephtracy.github.io/) and export as `.vox` files.

## 📱 Browser Compatibility

### Desktop
- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari desktop (full support)

### Mobile
- ✅ iOS Safari (optimized - see mobile notes below)
- ✅ Chrome Android (full support)
- ✅ Samsung Internet (full support)

### Mobile Optimizations
The game includes special features to handle mobile browser quirks:
- **Multiple save triggers** - State saves on visibility change, page hide, tab blur, focus, resume, freeze events
- **Periodic auto-save** - Backup save every 30 seconds
- **iOS Safari workarounds** - Delayed double-save for iOS Safari's unreliable event firing
- **State validation** - Detects and recovers from corrupted localStorage data
- **Mobile meta tags** - Optimized viewport, iOS web app support, theme color

**Note for iOS users**: The Notification API is not available in iOS Safari's regular browser mode. The "Enable Alerts" button will appear but tapping it will show a helpful toast message. For full notification support on iOS, add the site to your home screen.

**Mobile behavior**: When switching apps or locking your phone, the pet continues to age in the background (up to 1 hour cap). When you return, offline time is processed and stats are updated accordingly.

## 🙏 Credits

Built with modern web technologies:
- Vue 3 for reactive UI
- Three.js for 3D graphics
- Pinia for state management
- Vite for lightning-fast development

Inspired by the classic Tamagotchi handheld digital pets, featuring:
- Authentic egg-shaped device design
- Retro LCD screen aesthetic
- Physical button interaction model
- Mobile-first responsive layout

---

**Enjoy raising your voxel pet!** 🐱✨

*Your pet continues to grow even when you're away - don't forget to check on them!*
