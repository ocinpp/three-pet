<template>
  <div class="app-container">
    <div class="device-frame">
      <!-- Branding -->
      <div class="brand-logo">THREE<span class="accent">PET</span></div>

      <!-- LCD Display -->
      <div class="lcd-container">
        <div class="lcd-frame">
          <div class="lcd-screen">
            <PetScene class="scene-viewport" :time-of-day="currentTimeOfDay" />

            <!-- Status Badges (Stage & Evolution) -->
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

            <!-- Stats Overlay -->
            <div class="stats-overlay">
              <div
                class="stat-badge"
                :class="{ critical: getStatLevel(petStore.hunger) === 'critical' }"
              >
                <span class="stat-icon">🍖</span>
                <span class="stat-value">{{ Math.round(petStore.hunger) }}%</span>
              </div>
              <div
                class="stat-badge"
                :class="{ critical: getStatLevel(petStore.happiness) === 'critical' }"
              >
                <span class="stat-icon">✨</span>
                <span class="stat-value">{{ Math.round(petStore.happiness) }}%</span>
              </div>
              <div
                class="stat-badge"
                :class="{ critical: getStatLevel(petStore.energy) === 'critical' }"
              >
                <span class="stat-icon">⚡</span>
                <span class="stat-value">{{ Math.round(petStore.energy) }}%</span>
              </div>
              <div
                class="stat-badge"
                :class="{ critical: getStatLevel(petStore.health) === 'critical' }"
              >
                <span class="stat-icon">❤️</span>
                <span class="stat-value">{{ Math.round(petStore.health) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Physical Buttons -->
      <div class="control-panel">
        <div class="physical-buttons">
          <button
            @click="petStore.feed()"
            :disabled="!petStore.isAlive || petStore.isSleeping || petStore.lifeStage === 'egg'"
            class="physical-btn btn-a"
            aria-label="Feed pet"
          >
            <span class="btn-label">A</span>
            <span class="btn-action">FEED</span>
          </button>

          <button
            @click="petStore.play()"
            :disabled="!petStore.isAlive || petStore.isSleeping || petStore.lifeStage === 'egg'"
            class="physical-btn btn-b"
            aria-label="Play with pet"
          >
            <span class="btn-label">B</span>
            <span class="btn-action">PLAY</span>
          </button>

          <button
            @click="handleCButton"
            :disabled="!petStore.isAlive || petStore.lifeStage === 'egg'"
            class="physical-btn btn-c"
            aria-label="Clean or sleep"
          >
            <span class="btn-label">C</span>
            <span class="btn-action" v-if="petStore.isSleeping">WAKE</span>
            <span class="btn-action" v-else-if="petStore.poopCount > 0">CLEAN</span>
            <span class="btn-action" v-else>SLEEP</span>
          </button>
        </div>

        <!-- Time Display -->
        <div class="time-display">
          <span class="time-icon">{{ getTimeOfDayIcon() }}</span>
          <span class="time-text" @click="cycleTimeOfDay" :title="currentTimeOfDay">
            {{ formatTimeDisplay() }}
          </span>
        </div>

        <!-- Restart Button (retro pin reset style) -->
        <button @click="resetGame" class="restart-btn" aria-label="Reset Game">
          <span class="restart-icon">🔄</span>
          <span class="restart-text">RESET</span>
        </button>
      </div>

      <!-- Auto-Save Indicator -->
      <div
        v-if="petStore.isSaving"
        class="auto-save-indicator"
        role="status"
        aria-live="polite"
        aria-label="Game saved"
      >
        <div class="save-dot"></div>
      </div>
    </div>

    <!-- Revive Overlay (full screen, shown when pet is dead) -->
    <div v-if="!petStore.isAlive" class="revive-overlay">
      <button @click="petStore.revive()" class="revive-btn">
        <span class="revive-icon">💖</span>
        <span class="revive-text">REVIVE</span>
      </button>
    </div>

    <!-- Notification Indicator -->
    <div
      v-if="notificationStore.unreadCount > 0"
      class="notification-indicator"
      @click="notificationStore.markAllAsRead()"
    >
      <span class="indicator-icon">🔔</span>
      <span class="indicator-count">{{ notificationStore.unreadCount }}</span>
    </div>

    <!-- Notification Prompt (outside device frame) -->
    <div
      v-if="!petStore.notificationEnabled && canRequestNotification() && petStore.isAlive"
      class="notification-prompt"
    >
      <button @click="requestNotificationPermission" class="notification-btn">
        <span class="btn-icon">🔔</span>
        <span class="btn-text">Enable Alerts</span>
      </button>
    </div>

    <!-- In-App Notifications -->
    <AppNotifications />

    <!-- Toast Notification -->
    <div v-if="toastMessage" :class="['notification-toast', { show: toastVisible }]">
      {{ toastMessage }}
    </div>

    <!-- Debug Button -->
    <button @click="showDebugModal = true" class="debug-btn" aria-label="Debug">
      <span class="debug-icon">🐛</span>
    </button>

    <!-- Debug Modal -->
    <div
      v-if="showDebugModal"
      class="debug-modal-overlay"
      @click.self="closeDebugModal"
      @keydown.esc="closeDebugModal"
    >
      <div class="debug-modal">
        <div class="debug-modal-header">
          <h3>Debug Info</h3>
          <button @click="closeDebugModal" class="debug-close-btn" aria-label="Close">×</button>
        </div>
        <div class="debug-modal-content">
          <div class="debug-section">
            <div class="debug-section-header">
              <h4>localStorage Data</h4>
              <button @click="refreshDebugData" class="debug-refresh-btn" aria-label="Refresh data">
                <span class="debug-refresh-icon">🔄</span>
              </button>
            </div>
            <pre class="debug-json">{{ debugData }}</pre>
          </div>
          <div class="debug-section">
            <h4>Parsed State</h4>
            <div class="debug-state">
              <div class="debug-state-row">
                <span class="debug-label">Life Stage:</span>
                <span class="debug-value">{{ petStore.lifeStage }}</span>
              </div>
              <div class="debug-state-row">
                <span class="debug-label">Age:</span>
                <span class="debug-value">{{ petStore.age }}s</span>
              </div>
              <div class="debug-state-row">
                <span class="debug-label">Hunger:</span>
                <span class="debug-value">{{ Math.round(petStore.hunger) }}%</span>
              </div>
              <div class="debug-state-row">
                <span class="debug-label">Happiness:</span>
                <span class="debug-value">{{ Math.round(petStore.happiness) }}%</span>
              </div>
              <div class="debug-state-row">
                <span class="debug-label">Health:</span>
                <span class="debug-value">{{ Math.round(petStore.health) }}%</span>
              </div>
              <div class="debug-state-row">
                <span class="debug-label">Energy:</span>
                <span class="debug-value">{{ Math.round(petStore.energy) }}%</span>
              </div>
              <div class="debug-state-row">
                <span class="debug-label">Is Alive:</span>
                <span class="debug-value">{{ petStore.isAlive }}</span>
              </div>
              <div class="debug-state-row">
                <span class="debug-label">Is Sleeping:</span>
                <span class="debug-value">{{ petStore.isSleeping }}</span>
              </div>
              <div class="debug-state-row">
                <span class="debug-label">Poop Count:</span>
                <span class="debug-value">{{ petStore.poopCount }}</span>
              </div>
              <div class="debug-state-row">
                <span class="debug-label">Evolution:</span>
                <span class="debug-value">{{ petStore.evolutionType }}</span>
              </div>
              <div class="debug-state-row">
                <span class="debug-label">Last Active:</span>
                <span class="debug-value">{{ formatLastActiveTime() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePetStore } from './stores/petStore'
import { useNotificationStore } from './stores/notificationStore'
import PetScene from './components/PetScene.vue'
import AppNotifications from './components/AppNotifications.vue'

const petStore = usePetStore()
const notificationStore = useNotificationStore()

// Toast state
const toastMessage = ref('')
const toastVisible = ref(false)
let toastTimer: number | null = null

// Debug state
const showDebugModal = ref(false)
const debugRefreshCounter = ref(0)

// Get localStorage data as formatted JSON
const debugData = computed(() => {
  // Use refreshCounter to force recomputation when refresh button is clicked
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  debugRefreshCounter.value

  try {
    const data = localStorage.getItem('three-pet-state')
    if (!data) return 'No saved state found in localStorage'
    const parsed = JSON.parse(data)
    return JSON.stringify(parsed, null, 2)
  } catch (e) {
    return `Error reading localStorage: ${e instanceof Error ? e.message : String(e)}`
  }
})

function closeDebugModal() {
  showDebugModal.value = false
}

function refreshDebugData() {
  debugRefreshCounter.value++
}

function formatLastActiveTime(): string {
  try {
    const data = localStorage.getItem('three-pet-state')
    if (!data) return 'N/A'
    const parsed = JSON.parse(data)
    const lastActive = parsed.lastActiveTime
    if (!lastActive) return 'N/A'
    const date = new Date(lastActive)
    const now = Date.now()
    const diffMs = now - lastActive
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor(diffMs / 1000)

    if (diffSecs < 60) return 'Just now'
    return `${date.toLocaleTimeString()} (${diffMins}m ago)`
  } catch {
    return 'Error'
  }
}

// Auto-refresh debug data when modal opens
watch(showDebugModal, (isOpen) => {
  if (isOpen) {
    refreshDebugData()
  }
})

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

function handleCButton() {
  if (petStore.isSleeping) {
    petStore.sleep() // Wake up
  } else if (petStore.poopCount > 0) {
    petStore.clean()
  } else {
    petStore.sleep()
  }
}

function canRequestNotification(): boolean {
  // Don't show button on iOS Safari (Notification API not supported)
  const ua = window.navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua)

  if (isIOS && isSafari) {
    return false // Hide button on iOS Safari
  }

  // Show button on other platforms if permission is default
  return 'Notification' in window && Notification.permission === 'default'
}

async function requestNotificationPermission() {
  const success = await petStore.requestNotificationPermission()
  if (!success) {
    if (!('Notification' in window)) {
      showToast('ℹ️ Using in-app notifications instead! Check the 🔔 bell icon for alerts.')
    } else if (Notification.permission === 'denied') {
      showToast('⚠️ Notifications blocked. Enable in browser settings or use in-app notifications.')
    }
  }
}

function showToast(message: string) {
  // Clear any existing toast timer
  if (toastTimer !== null) {
    clearTimeout(toastTimer)
  }

  // Set message and hide initially
  toastMessage.value = message
  toastVisible.value = false

  // Show toast after a brief delay (for animation)
  setTimeout(() => {
    toastVisible.value = true
  }, 10)

  // Hide after 5 seconds
  toastTimer = window.setTimeout(() => {
    toastVisible.value = false
    // Clear message after animation completes
    setTimeout(() => {
      if (!toastVisible.value) {
        toastMessage.value = ''
      }
    }, 300)
  }, 5000)
}

function getStatLevel(value: number): 'high' | 'medium' | 'low' | 'critical' {
  if (value > 60) return 'high'
  if (value > 30) return 'medium'
  if (value > 15) return 'low'
  return 'critical'
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

function resetGame() {
  if (
    confirm(
      'Are you sure you want to restart? This will clear all progress and start with a fresh egg!'
    )
  ) {
    petStore.reset()
  }
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
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Press+Start+2P&family=Outfit:wght@400;600;700;800&display=swap');

/* CSS Variables for Design System */
:root {
  /* Device colors - bold and playful */
  --device-bg-primary: #fff176; /* Sunny yellow */
  --device-bg-secondary: #ffd54f; /* Golden yellow */
  --device-accent: #e91e63; /* Hot pink brand */

  /* LCD display */
  --lcd-bg: #c8f7c5; /* Classic green */
  --lcd-frame: #4a4a4a; /* Dark gray */

  /* Button colors - distinct and tactile */
  --btn-a: #43a047; /* Green */
  --btn-b: #1e88e5; /* Blue */
  --btn-c: #fb8c00; /* Orange */

  /* Background */
  --page-bg: #ff6b9d; /* Hot pink */
}

* {
  box-sizing: border-box;
}

.app-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--page-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.device-frame {
  width: 90vw;
  max-width: 400px;
  height: 85vh;
  max-height: 700px;
  background: linear-gradient(145deg, var(--device-bg-primary), var(--device-bg-secondary));
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  box-shadow:
    inset 0 -10px 30px rgba(0, 0, 0, 0.1),
    0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  padding: 65px 18px;
  position: relative;
  overflow: hidden;
}

/* Branding */
.brand-logo {
  text-align: center;
  font-family: 'Permanent Marker', cursive;
  font-size: 1.4rem;
  color: var(--device-accent);
  margin-bottom: 8px;
  text-shadow: 2px 2px 0 rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.brand-logo .accent {
  color: #7b1fa2;
}

/* LCD Container */
.lcd-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 0;
  overflow: hidden;
}

.lcd-frame {
  width: 75%;
  background: var(--lcd-frame);
  border-radius: 12px;
  padding: 10px;
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.2);
}

.lcd-screen {
  background: var(--lcd-bg);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
}

/* Scanline effect */
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

.scene-viewport {
  width: 100%;
  height: 100%;
  border-radius: 6px;
}

/* Status Badges */
.status-badges {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  pointer-events: none;
  z-index: 3;
}

.badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  font-family: 'Outfit', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.5);
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

/* Stats Overlay */
.stats-overlay {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  justify-content: space-around;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 8px;
  border-radius: 8px;
  backdrop-filter: blur(4px);
  z-index: 3;
}

.stat-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-icon {
  font-size: 0.9rem;
}

.stat-value {
  font-family: 'Press Start 2P', cursive;
  font-size: 0.65rem;
  color: #fff;
}

.stat-badge.critical .stat-value {
  color: #ff5252;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Control Panel */
.control-panel {
  padding-top: 8px;
  flex-shrink: 0;
}

.physical-buttons {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
}

.physical-btn {
  flex: 1;
  max-width: 80px;
  aspect-ratio: 1;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition:
    transform 0.1s,
    box-shadow 0.1s;
  position: relative;
}

.physical-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

/* Button A - Green */
.btn-a {
  background: linear-gradient(145deg, #66bb6a, #43a047);
  box-shadow:
    0 6px 0 #2e7d32,
    0 8px 12px rgba(0, 0, 0, 0.3),
    inset 0 -3px 8px rgba(0, 0, 0, 0.2),
    inset 0 3px 8px rgba(255, 255, 255, 0.3);
}

.btn-a:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow:
    0 2px 0 #2e7d32,
    0 4px 8px rgba(0, 0, 0, 0.2),
    inset 0 -1px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 4px rgba(255, 255, 255, 0.3);
}

/* Button B - Blue */
.btn-b {
  background: linear-gradient(145deg, #42a5f5, #1e88e5);
  box-shadow:
    0 6px 0 #1565c0,
    0 8px 12px rgba(0, 0, 0, 0.3),
    inset 0 -3px 8px rgba(0, 0, 0, 0.2),
    inset 0 3px 8px rgba(255, 255, 255, 0.3);
}

.btn-b:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow:
    0 2px 0 #1565c0,
    0 4px 8px rgba(0, 0, 0, 0.2),
    inset 0 -1px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 4px rgba(255, 255, 255, 0.3);
}

/* Button C - Orange */
.btn-c {
  background: linear-gradient(145deg, #ffa726, #fb8c00);
  box-shadow:
    0 6px 0 #ef6c00,
    0 8px 12px rgba(0, 0, 0, 0.3),
    inset 0 -3px 8px rgba(0, 0, 0, 0.2),
    inset 0 3px 8px rgba(255, 255, 255, 0.3);
}

.btn-c:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow:
    0 2px 0 #ef6c00,
    0 4px 8px rgba(0, 0, 0, 0.2),
    inset 0 -1px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 4px rgba(255, 255, 255, 0.3);
}

.btn-label {
  font-family: 'Press Start 2P', cursive;
  font-size: 1.1rem;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.btn-action {
  font-family: 'Outfit', sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Restart Button (below controls - retro pin reset style) */
.restart-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.restart-btn:active {
  transform: translateY(0);
}

.restart-icon {
  font-size: 1rem;
}

.restart-text {
  font-family: 'Press Start 2P', cursive;
  font-size: 0.6rem;
  color: #c8f7c5;
}

/* Time Display */
.time-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 12px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.1);
}

.time-icon {
  font-size: 1.2rem;
}

.time-text {
  font-family: 'Press Start 2P', cursive;
  font-size: 0.65rem;
  color: #5d4037;
  cursor: pointer;
  user-select: none;
}

/* Revive Overlay */
.revive-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.revive-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: linear-gradient(145deg, #e91e63, #c2185b);
  border: none;
  border-radius: 50%;
  width: 120px;
  height: 120px;
  cursor: pointer;
  box-shadow:
    0 6px 0 #880e4f,
    0 8px 16px rgba(0, 0, 0, 0.4);
  transition:
    transform 0.1s,
    box-shadow 0.1s;
}

.revive-btn:active {
  transform: translateY(4px);
  box-shadow:
    0 2px 0 #880e4f,
    0 4px 8px rgba(0, 0, 0, 0.3);
}

.revive-icon {
  font-size: 2rem;
}

.revive-text {
  font-family: 'Press Start 2P', cursive;
  font-size: 0.7rem;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Notification Prompt (outside device frame) */
.notification-prompt {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
}

.notification-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(145deg, #e91e63, #c2185b);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  box-shadow:
    0 4px 0 #880e4f,
    0 6px 12px rgba(0, 0, 0, 0.3);
  transition:
    transform 0.1s,
    box-shadow 0.1s;
}

.notification-btn:active {
  transform: translateY(2px);
  box-shadow:
    0 2px 0 #880e4f,
    0 3px 6px rgba(0, 0, 0, 0.2);
}

.notification-btn .btn-icon {
  font-size: 1rem;
}

.notification-btn .btn-text {
  font-family: 'Outfit', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
}

/* Toast Notification */
.notification-toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.95);
  color: #fff;
  padding: 16px 24px;
  border-radius: 12px;
  font-family: 'Outfit', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  z-index: 9999;
  opacity: 0;
  transition:
    opacity 0.3s ease,
    bottom 0.3s ease;
  max-width: 90vw;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  pointer-events: none;
}

.notification-toast.show {
  opacity: 1;
  bottom: 40px;
  pointer-events: auto;
}

/* Notification Indicator */
.notification-indicator {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 40;
  background: #ef4444;
  color: #fff;
  border-radius: 9999px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  flex-direction: column;
  gap: 0;
  padding: 0;
}

.indicator-icon {
  font-size: 0.75rem;
  line-height: 1;
  margin-bottom: -2px;
}

.indicator-count {
  font-size: 0.75rem;
  line-height: 1;
  font-family: 'Press Start 2P', cursive;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.notification-indicator {
  animation: pulse 1.5s infinite;
}

/* Auto-Save Indicator */
.auto-save-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: none;
}

.save-dot {
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  animation: flashSave 1s ease-out;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.8);
}

@keyframes flashSave {
  0% {
    opacity: 1;
    transform: scale(1.5);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
}

/* Responsive */
@media (max-height: 700px) {
  .device-frame {
    height: 95vh;
  }

  .brand-logo {
    margin-bottom: 8px;
  }

  .control-panel {
    padding-top: 12px;
  }
}

/* Debug Button */
.debug-btn {
  position: fixed;
  bottom: 16px;
  right: 16px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  z-index: 50;
}

.debug-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.debug-btn:active {
  transform: scale(0.95);
}

.debug-icon {
  font-size: 1.5rem;
}

/* Debug Modal */
.debug-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(4px);
}

.debug-modal {
  background: #1a1a1a;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid #333;
}

.debug-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #333;
  background: #252525;
}

.debug-modal-header h3 {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.debug-close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.debug-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.debug-close-btn:focus-visible {
  outline: 2px solid #4caf50;
  outline-offset: 2px;
}

.debug-modal-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.debug-section {
  margin-bottom: 20px;
}

.debug-section:last-child {
  margin-bottom: 0;
}

.debug-section h4 {
  margin: 0 0 12px 0;
  font-family: 'Outfit', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffd54f;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.debug-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.debug-section-header h4 {
  margin: 0;
}

.debug-refresh-btn {
  background: rgba(76, 175, 80, 0.2);
  border: 1px solid #4caf50;
  border-radius: 4px;
  cursor: pointer;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  height: 28px;
  width: 28px;
}

.debug-refresh-btn:hover {
  background: rgba(76, 175, 80, 0.3);
  transform: rotate(180deg);
}

.debug-refresh-btn:focus-visible {
  outline: 2px solid #4caf50;
  outline-offset: 2px;
}

.debug-refresh-icon {
  font-size: 0.9rem;
  display: block;
}

.debug-json {
  background: #0d0d0d;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px;
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: #4caf50;
  overflow-x: auto;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  line-height: 1.4;
}

.debug-state {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.debug-state-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #252525;
  border-radius: 6px;
  border: 1px solid #333;
}

.debug-label {
  font-family: 'Outfit', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: #bbb;
}

.debug-value {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #4caf50;
  font-weight: 600;
}

/* Scrollbar styles for debug modal */
.debug-modal-content::-webkit-scrollbar {
  width: 8px;
}

.debug-modal-content::-webkit-scrollbar-track {
  background: #1a1a1a;
  border-radius: 4px;
}

.debug-modal-content::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

.debug-modal-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.debug-json::-webkit-scrollbar {
  height: 8px;
}

.debug-json::-webkit-scrollbar-track {
  background: #0d0d0d;
  border-radius: 4px;
}

.debug-json::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}

.debug-json::-webkit-scrollbar-thumb:hover {
  background: #444;
}
</style>
