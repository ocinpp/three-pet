<template>
  <div class="app-container">
    <div class="device-frame">
      <!-- CRT Scanline Effect Overlay -->
      <div class="scanlines" aria-hidden="true"></div>
      <div class="vignette" aria-hidden="true"></div>

      <!-- Device Header -->
      <header class="device-header">
        <div class="header-indicators">
          <span class="indicator-dot active" aria-label="Device On"></span>
          <span class="indicator-label">THREE<span class="accent">PET</span>_LAB v1.0</span>
        </div>
        <div class="time-display">
          <span class="time-icon">{{ getTimeOfDayIcon() }}</span>
          <span class="time-text" @click="cycleTimeOfDay" :title="currentTimeOfDay">
            {{ formatTimeDisplay() }}
          </span>
        </div>
      </header>

      <!-- Device Content Grid -->
      <div class="device-content">
        <!-- Left Column: Scene & Stats -->
        <div class="main-column">
          <!-- Main Viewport -->
          <div class="viewport">
            <PetScene class="scene-viewport" :time-of-day="currentTimeOfDay" />

            <!-- Floating Status Badges -->
            <div class="status-badges">
              <div class="badge stage-badge" :class="petStore.lifeStage">
                <span class="badge-icon">{{ getStageIcon() }}</span>
                <span class="badge-text">{{ capitalize(petStore.lifeStage) }}</span>
              </div>

              <div
                v-if="petStore.evolutionType && petStore.lifeStage !== 'egg'"
                class="badge evolution-badge"
                :class="petStore.evolutionType"
              >
                <span class="badge-icon">{{ getEvolutionIcon() }}</span>
                <span class="badge-text">{{ getEvolutionLabel() }}</span>
              </div>
            </div>
          </div>

          <!-- Status Display -->
          <div class="status-display" :class="petStore.mood">
            <div class="status-icon">{{ getStatusIcon() }}</div>
            <div class="status-content">
              <span class="status-title">{{ getStatusTitle() }}</span>
              <span class="status-message">{{ getStatusMessage() }}</span>
            </div>
          </div>

          <!-- Stats Panel -->
          <div class="stats-panel">
            <div class="panel-header">
              <span class="panel-title">📊 METRICS</span>
              <span class="panel-subtitle">MONITORING SYSTEM</span>
            </div>

            <div class="stats-grid">
              <div
                class="stat-card"
                :class="{
                  'stat-warning': getStatLevel(petStore.hunger) === 'low',
                  'stat-critical': getStatLevel(petStore.hunger) === 'critical',
                }"
              >
                <div class="stat-header">
                  <span class="stat-icon">🍖</span>
                  <span class="stat-name">Hunger</span>
                </div>
                <div class="stat-bar-container">
                  <div class="stat-bar" :style="{ '--stat-width': petStore.hunger + '%' }">
                    <div class="stat-bar-fill"></div>
                    <div class="stat-bar-glow"></div>
                  </div>
                  <span class="stat-value stat-value-mobile">{{
                    Math.round(petStore.hunger)
                  }}</span>
                </div>
              </div>

              <div
                class="stat-card"
                :class="{
                  'stat-warning': getStatLevel(petStore.happiness) === 'low',
                  'stat-critical': getStatLevel(petStore.happiness) === 'critical',
                }"
              >
                <div class="stat-header">
                  <span class="stat-icon">✨</span>
                  <span class="stat-name">Happiness</span>
                </div>
                <div class="stat-bar-container">
                  <div class="stat-bar" :style="{ '--stat-width': petStore.happiness + '%' }">
                    <div class="stat-bar-fill"></div>
                    <div class="stat-bar-glow"></div>
                  </div>
                  <span class="stat-value stat-value-mobile">{{
                    Math.round(petStore.happiness)
                  }}</span>
                </div>
              </div>

              <div
                class="stat-card"
                :class="{
                  'stat-warning': getStatLevel(petStore.energy) === 'low',
                  'stat-critical': getStatLevel(petStore.energy) === 'critical',
                }"
              >
                <div class="stat-header">
                  <span class="stat-icon">⚡</span>
                  <span class="stat-name">Energy</span>
                </div>
                <div class="stat-bar-container">
                  <div class="stat-bar" :style="{ '--stat-width': petStore.energy + '%' }">
                    <div class="stat-bar-fill"></div>
                    <div class="stat-bar-glow"></div>
                  </div>
                  <span class="stat-value stat-value-mobile">{{
                    Math.round(petStore.energy)
                  }}</span>
                </div>
              </div>

              <div
                class="stat-card"
                :class="{
                  'stat-warning': getStatLevel(petStore.health) === 'low',
                  'stat-critical': getStatLevel(petStore.health) === 'critical',
                }"
              >
                <div class="stat-header">
                  <span class="stat-icon">❤️</span>
                  <span class="stat-name">Health</span>
                </div>
                <div class="stat-bar-container">
                  <div class="stat-bar" :style="{ '--stat-width': petStore.health + '%' }">
                    <div class="stat-bar-fill"></div>
                    <div class="stat-bar-glow"></div>
                  </div>
                  <span class="stat-value stat-value-mobile">{{
                    Math.round(petStore.health)
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Notification Request -->
          <div
            v-if="!petStore.notificationEnabled && canRequestNotification()"
            class="notification-prompt"
          >
            <button @click="requestNotificationPermission" class="notification-btn">
              <span class="btn-icon">🔔</span>
              <span class="btn-text">Enable Alerts</span>
              <span class="btn-arrow">→</span>
            </button>
          </div>
        </div>
        <!-- Right Column: Controls -->
        <div class="sidebar-column">
          <!-- Control Panel -->
          <div class="control-panel">
            <div class="panel-header">
              <span class="panel-title">🎮 CONTROLS</span>
              <span class="panel-subtitle">INTERACTION SYSTEM</span>
            </div>

            <div class="actions-grid">
              <button
                @click="petStore.feed()"
                :disabled="!petStore.isAlive || petStore.isSleeping"
                class="control-btn feed-btn"
                :class="{ 'btn-pressed': lastAction === 'feed' }"
                @mousedown="lastAction = 'feed'"
                @mouseup="lastAction = null"
                @mouseleave="lastAction = null"
              >
                <div class="btn-inner">
                  <span class="btn-icon">🍖</span>
                  <span class="btn-label">Feed</span>
                  <span class="btn-hint">+Hunger</span>
                </div>
              </button>

              <button
                @click="petStore.play()"
                :disabled="!petStore.isAlive || petStore.isSleeping"
                class="control-btn play-btn"
                :class="{ 'btn-pressed': lastAction === 'play' }"
                @mousedown="lastAction = 'play'"
                @mouseup="lastAction = null"
                @mouseleave="lastAction = null"
              >
                <div class="btn-inner">
                  <span class="btn-icon">🎮</span>
                  <span class="btn-label">Play</span>
                  <span class="btn-hint">+Happy</span>
                </div>
              </button>

              <button
                @click="petStore.clean()"
                :disabled="!petStore.isAlive || petStore.isSleeping || petStore.poopCount === 0"
                class="control-btn clean-btn"
                :class="{
                  'btn-pressed': lastAction === 'clean',
                  'btn-disabled': petStore.poopCount === 0,
                }"
                @mousedown="lastAction = 'clean'"
                @mouseup="lastAction = null"
                @mouseleave="lastAction = null"
              >
                <div class="btn-inner">
                  <span class="btn-icon">🧹</span>
                  <span class="btn-label">Clean</span>
                  <span class="btn-hint" v-if="petStore.poopCount > 0">{{
                    petStore.poopCount
                  }}</span>
                  <span class="btn-hint" v-else>Done</span>
                </div>
              </button>

              <button
                @click="petStore.sleep()"
                :disabled="!petStore.isAlive"
                class="control-btn sleep-btn"
                :class="{
                  'btn-active': petStore.isSleeping,
                  'btn-pressed': lastAction === 'sleep',
                }"
                @mousedown="lastAction = 'sleep'"
                @mouseup="lastAction = null"
                @mouseleave="lastAction = null"
              >
                <div class="btn-inner">
                  <span class="btn-icon">{{ petStore.isSleeping ? '⏰' : '😴' }}</span>
                  <span class="btn-label">{{ petStore.isSleeping ? 'Wake' : 'Sleep' }}</span>
                  <span class="btn-hint">{{ petStore.isSleeping ? 'zZZ' : 'Rest' }}</span>
                </div>
              </button>

              <button
                v-if="!petStore.isAlive"
                @click="petStore.revive()"
                class="control-btn revive-btn full-width"
                :class="{ 'btn-pressed': lastAction === 'revive' }"
                @mousedown="lastAction = 'revive'"
                @mouseup="lastAction = null"
                @mouseleave="lastAction = null"
              >
                <div class="btn-inner">
                  <span class="btn-icon">💖</span>
                  <span class="btn-label">Revive Pet</span>
                  <span class="btn-hint">New Life</span>
                </div>
              </button>
            </div>

            <!-- Metrics Panel (Desktop) -->
            <div class="metrics-panel">
              <div class="panel-header">
                <span class="panel-title">📈 STATUS</span>
                <span class="panel-subtitle">PET INFO</span>
              </div>
              <div class="metrics-list">
                <div class="metric-item">
                  <span class="metric-label">AGE</span>
                  <span class="metric-value-large">{{ formatAge(petStore.age) }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">MOOD</span>
                  <span class="metric-value-large mood-badge" :class="petStore.mood">{{
                    capitalize(petStore.mood)
                  }}</span>
                </div>
                <div class="metric-item" v-if="petStore.isSleeping">
                  <span class="metric-label">STATE</span>
                  <span class="metric-value-large sleeping">💤 Sleeping</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Info (Mobile only) -->
      <div class="device-footer device-footer-mobile" v-if="petStore.isAlive">
        <div class="footer-metrics">
          <div class="metric">
            <span class="metric-label">AGE</span>
            <span class="metric-value">{{ formatAge(petStore.age) }}</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric">
            <span class="metric-label">MOOD</span>
            <span class="metric-value mood-badge" :class="petStore.mood">{{
              capitalize(petStore.mood)
            }}</span>
          </div>
          <div class="metric-divider" v-if="petStore.isSleeping"></div>
          <div class="metric" v-if="petStore.isSleeping">
            <span class="metric-label">STATE</span>
            <span class="metric-value sleeping">💤</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { usePetStore } from './stores/petStore'
import PetScene from './components/PetScene.vue'

const petStore = usePetStore()
const lastAction = ref<string | null>(null)

// Time of day tracking
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
const timesOfDay: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night']
const currentTimeOfDay = ref<TimeOfDay>(getTimeOfDay())
let timeUpdateInterval: number | null = null

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()

  if (hour >= 6 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 16) return 'afternoon'
  if (hour >= 16 && hour < 19) return 'evening'
  return 'night'
}

function getTimeOfDayIcon(): string {
  switch (currentTimeOfDay.value) {
    case 'morning':
      return '🌅'
    case 'afternoon':
      return '☀️'
    case 'evening':
      return '🌆'
    case 'night':
      return '🌙'
    default:
      return '☀️'
  }
}

function formatTimeDisplay(): string {
  const hour = new Date().getHours()
  const minute = new Date().getMinutes()
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
}

function cycleTimeOfDay() {
  const currentIndex = timesOfDay.indexOf(currentTimeOfDay.value)
  const nextIndex = (currentIndex + 1) % timesOfDay.length
  currentTimeOfDay.value = timesOfDay[nextIndex]
}

function canRequestNotification(): boolean {
  return 'Notification' in window && Notification.permission === 'default'
}

async function requestNotificationPermission() {
  await petStore.requestNotificationPermission()
}

onMounted(() => {
  timeUpdateInterval = window.setInterval(() => {
    currentTimeOfDay.value = getTimeOfDay()
  }, 60000)
})

onUnmounted(() => {
  if (timeUpdateInterval !== null) {
    clearInterval(timeUpdateInterval)
  }
})

function getStatLevel(value: number): 'high' | 'medium' | 'low' | 'critical' {
  if (value > 60) return 'high'
  if (value > 30) return 'medium'
  if (value > 15) return 'low'
  return 'critical'
}

function getStatusIcon(): string {
  if (!petStore.isAlive) return '💀'
  if (petStore.lifeStage === 'egg') return '🥚'
  if (petStore.isHatching) return '✨'
  switch (petStore.mood) {
    case 'happy':
      return '😊'
    case 'hungry':
      return '😋'
    case 'sick':
      return '🤒'
    case 'sleepy':
      return '😴'
    case 'sad':
      return '😢'
    case 'dirty':
      return '🤢'
    default:
      return '😐'
  }
}

function getStatusTitle(): string {
  if (!petStore.isAlive) return 'SIGNAL LOST'
  if (petStore.lifeStage === 'egg') return 'INCUBATING'
  if (petStore.isHatching) return 'EVOLUTION IN PROGRESS'
  switch (petStore.mood) {
    case 'happy':
      return 'OPTIMAL'
    case 'hungry':
      return 'REFUELING REQUIRED'
    case 'sick':
      return 'MEDICAL ALERT'
    case 'sleepy':
      return 'LOW ENERGY'
    case 'sad':
      return 'ATTENTION NEEDED'
    case 'dirty':
      return 'SANITY WARNING'
    default:
      return 'STABLE'
  }
}

function getStatusMessage(): string {
  if (!petStore.isAlive) return 'Pet has passed away. Press revive to start anew.'
  if (petStore.lifeStage === 'egg') return 'Life is forming within... Hatch imminent.'
  if (petStore.isHatching) return 'Transformation sequence initiating!'
  if (petStore.mood === 'happy') return 'All systems nominal. Pet thriving.'
  if (petStore.mood === 'hungry') return 'Nutrients depleted. Initiate feeding protocol.'
  if (petStore.mood === 'sick') return 'Health critical. Medical care required.'
  if (petStore.mood === 'sleepy') return 'Energy reserves low. Rest recommended.'
  if (petStore.mood === 'sad') return 'Emotional stability compromised. Engagement needed.'
  if (petStore.mood === 'dirty') return 'Environment contaminated. Cleanup required.'
  return 'Vital signs stable. Continue monitoring.'
}

function getStageIcon(): string {
  switch (petStore.lifeStage) {
    case 'egg':
      return '🥚'
    case 'baby':
      return '🐣'
    case 'child':
      return '🐥'
    case 'adult':
      return '🐔'
    case 'elder':
      return '🦄'
    default:
      return '❓'
  }
}

function getEvolutionIcon(): string {
  switch (petStore.evolutionType) {
    case 'perfect':
      return '⭐'
    case 'good':
      return '💖'
    case 'normal':
      return '👍'
    case 'bad':
      return '😔'
    default:
      return ''
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getEvolutionLabel(): string {
  switch (petStore.evolutionType) {
    case 'perfect':
      return 'Perfect'
    case 'good':
      return 'Well Cared'
    case 'normal':
      return 'Normal'
    case 'bad':
      return 'Neglected'
    default:
      return ''
  }
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');

/* CSS Variables for Design System */
:root {
  --color-bg-primary: #f7f3e8;
  --color-bg-secondary: #ede4d3;
  --color-bg-card: #faf8f3;
  --color-accent: #8b5cf6;
  --color-accent-light: #a78bfa;
  --color-accent-dark: #7c3aed;
  --color-text-primary: #1a1a2e;
  --color-text-secondary: #4a4a5e;
  --color-text-tertiary: #8a8a9e;
  --color-border: #e5e0d0;
  --color-border-dark: #d4d0c0;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  --font-display: 'Outfit', sans-serif;
  --font-body: 'Space Grotesk', sans-serif;
}

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f7f3e8 0%, #ede4d3 50%, #f7f3e8 100%);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow-x: hidden;
}

.app-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  opacity: 0.4;
  z-index: 0;
}

.device-frame {
  position: relative;
  width: 100%;
  max-width: 1400px;
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow:
    var(--shadow-xl),
    0 0 0 1px var(--color-border),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
  z-index: 1;
}

@media (min-width: 769px) {
  .device-frame {
    max-height: calc(100vh - 40px);
    overflow-y: auto;
  }
}

.device-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 0 20px;
}

@media (min-width: 769px) {
  .device-content {
    grid-template-columns: 1fr 320px;
    gap: 16px;
    padding: 0 20px 20px;
  }
}

.main-column {
  display: flex;
  flex-direction: column;
}

.sidebar-column {
  display: flex;
  flex-direction: column;
}

/* CRT Effects */
.scanlines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.02) 0px,
    rgba(0, 0, 0, 0.02) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 10;
  opacity: 0.5;
}

.vignette {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.03) 100%);
  pointer-events: none;
  z-index: 9;
}

/* Device Header */
.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, transparent 100%);
  border-bottom: 1px solid var(--color-border);
}

.header-indicators {
  display: flex;
  align-items: center;
  gap: 10px;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-tertiary);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.indicator-dot.active {
  background: var(--color-success);
  box-shadow:
    0 0 8px var(--color-success),
    0 0 16px var(--color-success);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.indicator-label {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-text-tertiary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.indicator-label .accent {
  color: var(--color-accent);
}

.time-display {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.time-icon {
  font-size: 0.9rem;
}

.time-text {
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color 0.2s ease;
  user-select: none;
}

.time-text:hover {
  color: var(--color-accent);
}

/* Viewport */
.viewport {
  position: relative;
  padding: 16px 0;
  background: var(--color-bg-secondary);
}

.scene-viewport {
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow:
    var(--shadow-md),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  height: 280px;
}

@media (min-width: 769px) {
  .scene-viewport {
    height: 280px;
  }
}

.status-badges {
  position: absolute;
  top: 24px;
  left: 30px;
  right: 30px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  pointer-events: none;
}

.badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  animation: slideDown 0.4s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.badge-icon {
  font-size: 0.9rem;
}

.badge-text {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.stage-badge.egg {
  background: linear-gradient(135deg, #fef3c7, #fbbf24);
}

.stage-badge.baby {
  background: linear-gradient(135deg, #fce7f3, #f9a8d4);
}

.stage-badge.child {
  background: linear-gradient(135deg, #dbeafe, #60a5fa);
}

.stage-badge.adult {
  background: linear-gradient(135deg, #d1fae5, #34d399);
}

.stage-badge.elder {
  background: linear-gradient(135deg, #e0e7ff, #818cf8);
}

.evolution-badge.perfect {
  background: linear-gradient(135deg, #fef08a, #fbbf24);
  box-shadow: 0 2px 12px rgba(251, 191, 36, 0.5);
}

.evolution-badge.good {
  background: linear-gradient(135deg, #fce7f3, #f472b6);
}

.evolution-badge.normal {
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
}

.evolution-badge.bad {
  background: linear-gradient(135deg, #fee2e2, #fca5a5);
}

/* Stats Panel */
.stats-panel {
  padding: 12px 0 0 0;
  border-top: 1px solid var(--color-border);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.panel-title {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: 0.1em;
}

.panel-subtitle {
  font-family: var(--font-body);
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.stat-card {
  padding: 10px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: var(--color-accent-light);
  box-shadow: var(--shadow-sm);
}

.stat-card.stat-warning {
  border-color: var(--color-warning);
  background: linear-gradient(135deg, #fef3c7, #fef9e7);
}

.stat-card.stat-critical {
  border-color: var(--color-error);
  background: linear-gradient(135deg, #fee2e2, #fef2f2);
  animation: criticalPulse 1.5s ease-in-out infinite;
}

@keyframes criticalPulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  }
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.stat-icon {
  font-size: 1rem;
}

.stat-name {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-bar-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-bar {
  flex: 1;
  height: 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.stat-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: var(--stat-width, 100%);
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent-light));
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* Hunger bar - orange */
.stat-card:nth-child(1) .stat-bar-fill {
  background: linear-gradient(90deg, #f97316, #fbbf24);
}

/* Happiness bar - pink */
.stat-card:nth-child(2) .stat-bar-fill {
  background: linear-gradient(90deg, #ec4899, #f472b6);
}

/* Energy bar - yellow */
.stat-card:nth-child(3) .stat-bar-fill {
  background: linear-gradient(90deg, #eab308, #facc15);
}

/* Health bar - red */
.stat-card:nth-child(4) .stat-bar-fill {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

/* Warning state - intensify base colors */
.stat-card.stat-warning:nth-child(1) .stat-bar-fill {
  background: linear-gradient(90deg, #ea580c, #f97316);
}

.stat-card.stat-warning:nth-child(2) .stat-bar-fill {
  background: linear-gradient(90deg, #db2777, #ec4899);
}

.stat-card.stat-warning:nth-child(3) .stat-bar-fill {
  background: linear-gradient(90deg, #ca8a04, #eab308);
}

.stat-card.stat-warning:nth-child(4) .stat-bar-fill {
  background: linear-gradient(90deg, #dc2626, #ef4444);
}

/* Critical state - even more intense */
.stat-card.stat-critical:nth-child(1) .stat-bar-fill {
  background: linear-gradient(90deg, #c2410c, #ea580c);
}

.stat-card.stat-critical:nth-child(2) .stat-bar-fill {
  background: linear-gradient(90deg, #be185d, #db2777);
}

.stat-card.stat-critical:nth-child(3) .stat-bar-fill {
  background: linear-gradient(90deg, #a16207, #ca8a04);
}

.stat-card.stat-critical:nth-child(4) .stat-bar-fill {
  background: linear-gradient(90deg, #b91c1c, #dc2626);
}

.stat-bar-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.stat-value {
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  min-width: 45px;
  text-align: right;
}

.stat-value-mobile::after {
  content: '%';
}

@media (max-width: 640px) {
  .stat-value-mobile {
    min-width: 32px;
    font-size: 0.7rem;
  }

  .stat-value-mobile::after {
    content: '';
  }
}

/* Status Display */
.status-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  margin-top: 0;
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-accent);
  transition: all 0.3s ease;
}

.status-display.happy {
  border-left-color: var(--color-success);
  background: linear-gradient(135deg, #d1fae5, #ecfdf5);
}

.status-display.hungry {
  border-left-color: var(--color-warning);
  background: linear-gradient(135deg, #fef3c7, #fffbeb);
}

.status-display.sick {
  border-left-color: var(--color-error);
  background: linear-gradient(135deg, #fee2e2, #fef2f2);
}

.status-display.sleepy {
  border-left-color: var(--color-info);
  background: linear-gradient(135deg, #e0e7ff, #eef2ff);
}

.status-display.sad {
  border-left-color: var(--color-accent-dark);
  background: linear-gradient(135deg, #f3e8ff, #faf5ff);
}

.status-display.dirty {
  border-left-color: #b45309;
  background: linear-gradient(135deg, #fef9c3, #fffef0);
}

.status-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.status-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-title {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--color-text-tertiary);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.status-message {
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.4;
}

/* Notification Prompt */
.notification-prompt {
  padding: 12px 0;
}

.notification-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-dark));
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
}

.notification-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.notification-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 1.1rem;
}

.btn-text {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
  flex: 1;
  text-align: left;
}

.btn-arrow {
  font-family: var(--font-body);
  font-size: 1.1rem;
  color: white;
  transition: transform 0.3s ease;
}

.notification-btn:hover .btn-arrow {
  transform: translateX(4px);
}

/* Control Panel */
.control-panel {
  padding: 16px 0;
  border-top: 1px solid var(--color-border);
}

@media (min-width: 769px) {
  .control-panel {
    border-top: none;
    padding: 16px 0 0 0;
  }
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.control-btn {
  position: relative;
  padding: 0;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.control-btn:hover:not(:disabled) {
  border-color: var(--color-accent-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.control-btn:active:not(:disabled) {
  transform: translateY(0);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 12px;
}

.control-btn .btn-icon {
  font-size: 1.5rem;
  transition: transform 0.3s ease;
}

.control-btn:hover:not(:disabled) .btn-icon {
  transform: scale(1.1);
}

.control-btn .btn-label {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.control-btn .btn-hint {
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.control-btn.feed-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-color: #fbbf24;
}

.control-btn.play-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
  border-color: var(--color-accent-light);
}

.control-btn.clean-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-color: var(--color-info);
}

.control-btn.sleep-btn {
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  border-color: var(--color-accent-light);
}

.control-btn.sleep-btn.btn-active {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-color: #fbbf24;
}

.control-btn.revive-btn {
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  border-color: var(--color-error);
}

.control-btn.revive-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #fbcfe8, #f9a8d4);
}

.control-btn.full-width {
  grid-column: 1 / -1;
}

.control-btn.btn-pressed {
  transform: scale(0.98);
}

.control-btn.btn-disabled {
  opacity: 0.4;
}

/* Metrics Panel (Desktop) */
.metrics-panel {
  display: none;
  padding: 16px 0 0;
}

@media (min-width: 769px) {
  .metrics-panel {
    display: block;
  }
}

.metrics-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.metric-item .metric-label {
  font-family: var(--font-display);
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-text-tertiary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.metric-value-large {
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.metric-value-large.mood-badge {
  padding: 3px 10px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  font-size: 0.7rem;
}

.metric-value-large.sleeping {
  color: var(--color-info);
}

/* Device Footer */
.device-footer {
  padding: 14px 0;
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
}

@media (min-width: 769px) {
  .device-footer.device-footer-mobile {
    display: none;
  }
}

.footer-metrics {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.metric-label {
  font-family: var(--font-display);
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-text-tertiary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.metric-value {
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.metric-value.mood-badge {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-primary);
  font-size: 0.75rem;
}

.metric-value.sleeping {
  font-size: 1.2rem;
}

.metric-divider {
  width: 1px;
  height: 24px;
  background: var(--color-border);
}

/* Responsive */
@media (max-width: 640px) {
  .app-container {
    padding: 8px;
    align-items: flex-start;
  }

  .device-frame {
    max-width: 100%;
  }

  .device-content {
    padding: 0 12px;
  }

  .device-header {
    padding: 8px 12px;
  }

  .time-display {
    padding: 4px 8px;
  }

  .time-icon {
    font-size: 0.8rem;
  }

  .time-text {
    font-size: 0.7rem;
  }

  .viewport {
    padding: 8px 0;
  }

  .scene-viewport {
    height: 260px;
  }

  .status-badges {
    top: 12px;
    left: 16px;
    right: 16px;
  }

  .badge {
    padding: 4px 8px;
    gap: 4px;
  }

  .badge-icon {
    font-size: 0.8rem;
  }

  .badge-text {
    font-size: 0.6rem;
  }

  .stats-panel {
    padding: 8px 0 6px 0;
  }

  .panel-header {
    margin-bottom: 6px;
  }

  .panel-title {
    font-size: 0.7rem;
  }

  .panel-subtitle {
    font-size: 0.6rem;
  }

  .stats-grid {
    gap: 6px;
  }

  .stat-card {
    padding: 6px 8px;
  }

  .stat-header {
    margin-bottom: 4px;
    gap: 4px;
  }

  .stat-icon {
    font-size: 0.85rem;
  }

  .stat-name {
    font-size: 0.65rem;
  }

  .stat-bar-container {
    gap: 6px;
  }

  .stat-bar {
    height: 6px;
  }

  .stat-value {
    font-size: 0.7rem;
    min-width: 32px;
  }

  .status-display {
    margin-top: 0;
    padding: 8px 10px;
  }

  .status-icon {
    font-size: 1.1rem;
  }

  .status-title {
    font-size: 0.6rem;
  }

  .status-message {
    font-size: 0.7rem;
  }

  .notification-prompt {
    padding: 6px 0;
  }

  .notification-btn {
    padding: 8px 12px;
  }

  .notification-btn .btn-icon {
    font-size: 1rem;
  }

  .notification-btn .btn-text {
    font-size: 0.75rem;
  }

  .notification-btn .btn-arrow {
    font-size: 0.9rem;
  }

  .control-panel {
    padding: 8px 0;
  }

  .actions-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .btn-inner {
    padding: 12px 6px;
    gap: 2px;
  }

  .control-btn .btn-icon {
    font-size: 1.5rem;
  }

  .control-btn .btn-label {
    display: none;
  }

  .control-btn .btn-hint {
    display: none;
  }

  .control-btn.full-width {
    grid-column: 1 / -1;
  }

  .control-btn.full-width .btn-label {
    display: block;
    font-size: 0.75rem;
  }

  .control-btn.full-width .btn-hint {
    display: block;
    font-size: 0.6rem;
  }

  .control-btn.full-width .btn-inner {
    padding: 10px 12px;
  }

  .device-footer {
    padding: 8px 0;
  }

  .footer-metrics {
    gap: 8px;
  }

  .metric-label {
    font-size: 0.55rem;
  }

  .metric-value {
    font-size: 0.75rem;
  }

  .metric-value.mood-badge {
    font-size: 0.65rem;
    padding: 2px 6px;
  }

  .metric-value.sleeping {
    font-size: 1rem;
  }

  .metric-divider {
    height: 18px;
  }
}
</style>
