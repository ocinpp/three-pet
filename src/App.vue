<template>
  <div class="app-container">
    <div class="game-card">
      <h1 class="title">Three Pet</h1>

      <!-- 3D Scene -->
      <PetScene class="scene-container" :time-of-day="currentTimeOfDay" />

      <!-- Life Stage Display -->
      <div class="life-stage-display">
        <div class="stage-badge" :class="petStore.lifeStage">
          {{ getStageEmoji() }} {{ capitalize(petStore.lifeStage) }}
        </div>
        <div v-if="petStore.evolutionType && petStore.lifeStage !== 'egg'" class="evolution-badge" :class="petStore.evolutionType">
          {{ getEvolutionLabel() }}
        </div>
        <div class="time-badge" :class="currentTimeOfDay" @click="cycleTimeOfDay">
          {{ getTimeOfDayEmoji() }} {{ capitalize(currentTimeOfDay) }}
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-container">
        <div class="stat-row">
          <span class="stat-label">Hunger</span>
          <div class="stat-bar-bg">
            <div
              class="stat-bar-fill"
              :style="{ width: petStore.hunger + '%', backgroundColor: getBarColor(petStore.hunger) }"
            />
          </div>
          <span class="stat-value">{{ Math.round(petStore.hunger) }}%</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Happiness</span>
          <div class="stat-bar-bg">
            <div
              class="stat-bar-fill"
              :style="{ width: petStore.happiness + '%', backgroundColor: getBarColor(petStore.happiness) }"
            />
          </div>
          <span class="stat-value">{{ Math.round(petStore.happiness) }}%</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Energy</span>
          <div class="stat-bar-bg">
            <div
              class="stat-bar-fill energy"
              :style="{ width: petStore.energy + '%' }"
            />
          </div>
          <span class="stat-value">{{ Math.round(petStore.energy) }}%</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Health</span>
          <div class="stat-bar-bg">
            <div
              class="stat-bar-fill health"
              :style="{ width: petStore.health + '%' }"
            />
          </div>
          <span class="stat-value">{{ Math.round(petStore.health) }}%</span>
        </div>
      </div>

      <!-- Status Message -->
      <div class="status-message" :class="petStore.mood">
        {{ getStatusMessage() }}
      </div>

      <!-- Notification Permission -->
      <button
        v-if="!petStore.notificationEnabled && canRequestNotification()"
        @click="requestNotificationPermission"
        class="notification-btn"
      >
        <span class="btn-icon">🔔</span>
        <span>Enable Notifications</span>
      </button>

      <!-- Actions -->
      <div class="actions-container">
        <button
          @click="petStore.feed()"
          :disabled="!petStore.isAlive || petStore.isSleeping"
          class="action-btn feed"
        >
          <span class="btn-icon">🍖</span>
          <span>Feed</span>
        </button>

        <button
          @click="petStore.play()"
          :disabled="!petStore.isAlive || petStore.isSleeping"
          class="action-btn play"
        >
          <span class="btn-icon">🎮</span>
          <span>Play</span>
        </button>

        <button
          @click="petStore.clean()"
          :disabled="!petStore.isAlive || petStore.isSleeping || petStore.poopCount === 0"
          class="action-btn clean"
        >
          <span class="btn-icon">🧹</span>
          <span>Clean {{ petStore.poopCount > 0 ? `(${petStore.poopCount})` : '' }}</span>
        </button>

        <button
          @click="petStore.sleep()"
          :disabled="!petStore.isAlive"
          class="action-btn sleep"
          :class="{ active: petStore.isSleeping }"
        >
          <span class="btn-icon">{{ petStore.isSleeping ? '⏰' : '😴' }}</span>
          <span>{{ petStore.isSleeping ? 'Wake' : 'Sleep' }}</span>
        </button>

        <button
          v-if="!petStore.isAlive"
          @click="petStore.revive()"
          class="action-btn revive"
        >
          <span class="btn-icon">💖</span>
          <span>Revive</span>
        </button>
      </div>

      <!-- Pet Info -->
      <div class="pet-info" v-if="petStore.isAlive">
        <span>Age: {{ petStore.age }}s</span>
        <span>Mood: {{ petStore.mood }}</span>
        <span v-if="petStore.isSleeping" class="sleep-indicator">💤 Sleeping</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { usePetStore } from './stores/petStore'
import PetScene from './components/PetScene.vue'

const petStore = usePetStore()

// Time of day tracking
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
const timesOfDay: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night']
const currentTimeOfDay = ref<TimeOfDay>(getTimeOfDay())
let timeUpdateInterval: number | null = null

// Get current time of day based on hour
function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()

  if (hour >= 6 && hour < 11) return 'morning'    // 6am - 11am
  if (hour >= 11 && hour < 16) return 'afternoon' // 11am - 4pm
  if (hour >= 16 && hour < 19) return 'evening'   // 4pm - 7pm
  return 'night'                                     // 7pm - 6am
}

// Get emoji for time of day
function getTimeOfDayEmoji(): string {
  switch (currentTimeOfDay.value) {
    case 'morning': return '🌅'
    case 'afternoon': return '☀️'
    case 'evening': return '🌆'
    case 'night': return '🌙'
    default: return '☀️'
  }
}

// Cycle through time of day for testing
function cycleTimeOfDay() {
  const currentIndex = timesOfDay.indexOf(currentTimeOfDay.value)
  const nextIndex = (currentIndex + 1) % timesOfDay.length
  currentTimeOfDay.value = timesOfDay[nextIndex]
}

// Check if browser supports notifications
function canRequestNotification(): boolean {
  return 'Notification' in window && Notification.permission === 'default'
}

// Request notification permission
async function requestNotificationPermission() {
  await petStore.requestNotificationPermission()
}

// Update time every minute
onMounted(() => {
  timeUpdateInterval = window.setInterval(() => {
    currentTimeOfDay.value = getTimeOfDay()
  }, 60000) // Update every minute
})

onUnmounted(() => {
  if (timeUpdateInterval !== null) {
    clearInterval(timeUpdateInterval)
  }
})

function getBarColor(value: number): string {
  if (value > 60) return '#10b981' // green
  if (value > 30) return '#f59e0b' // orange
  return '#ef4444' // red
}

function getStatusMessage(): string {
  if (!petStore.isAlive) return '💀 Your pet has passed away...'
  if (petStore.lifeStage === 'egg') return '🥚 Waiting to hatch...'
  if (petStore.isHatching) return '✨ Your pet is evolving!'
  if (petStore.mood === 'happy') return '😊 Your pet is happy!'
  if (petStore.mood === 'hungry') return '😋 Your pet is hungry!'
  if (petStore.mood === 'sick') return '🤒 Your pet is not feeling well...'
  if (petStore.mood === 'sleepy') return '😴 Your pet is sleepy...'
  if (petStore.mood === 'sad') return '😢 Your pet is feeling sad...'
  if (petStore.mood === 'dirty') return '🤢 Your pet needs cleaning!'
  return '😐 Your pet is doing okay'
}

function getStageEmoji(): string {
  switch (petStore.lifeStage) {
    case 'egg': return '🥚'
    case 'baby': return '🐣'
    case 'child': return '🐥'
    case 'adult': return '🐔'
    case 'elder': return '🦄'
    default: return '❓'
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getEvolutionLabel(): string {
  switch (petStore.evolutionType) {
    case 'perfect': return '⭐ Perfect Care!'
    case 'good': return '💖 Well Cared For'
    case 'normal': return '👍 Normal Growth'
    case 'bad': return '😔 Neglected'
    default: return ''
  }
}
</script>

<style scoped>
.app-container {
  padding: 16px;
}

.game-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.title {
  text-align: center;
  font-size: 1.5rem;
  color: #667eea;
  margin-bottom: 12px;
  font-weight: 700;
}

.scene-container {
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 12px;
}

.life-stage-display {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.stage-badge {
  padding: 4px 10px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stage-badge.egg {
  background: linear-gradient(135deg, #fef3c7, #fbbf24);
  color: #92400e;
}

.stage-badge.baby {
  background: linear-gradient(135deg, #fce7f3, #f9a8d4);
  color: #9f1239;
}

.stage-badge.child {
  background: linear-gradient(135deg, #dbeafe, #60a5fa);
  color: #1e3a8a;
}

.stage-badge.adult {
  background: linear-gradient(135deg, #d1fae5, #34d399);
  color: #065f46;
}

.stage-badge.elder {
  background: linear-gradient(135deg, #e0e7ff, #818cf8);
  color: #3730a3;
}

.evolution-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.75rem;
}

.evolution-badge.perfect {
  background: linear-gradient(135deg, #fef08a, #fbbf24);
  color: #854d0e;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
}

.evolution-badge.good {
  background: linear-gradient(135deg, #fce7f3, #f472b6);
  color: #9f1239;
}

.evolution-badge.normal {
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  color: #4b5563;
}

.evolution-badge.bad {
  background: linear-gradient(135deg, #fee2e2, #fca5a5);
  color: #991b1b;
}

.time-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.75rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  user-select: none;
}

.time-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.time-badge.morning {
  background: linear-gradient(135deg, #fef3c7, #fcd34d);
  color: #92400e;
}

.time-badge.afternoon {
  background: linear-gradient(135deg, #dbeafe, #60a5fa);
  color: #1e3a8a;
}

.time-badge.evening {
  background: linear-gradient(135deg, #fed7aa, #fb923c);
  color: #9a3412;
}

.time-badge.night {
  background: linear-gradient(135deg, #1e3a5f, #0f172a);
  color: #e2e8f0;
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-label {
  font-weight: 600;
  color: #4b5563;
  min-width: 65px;
  font-size: 0.8rem;
}

.stat-bar-bg {
  flex: 1;
  height: 18px;
  background: #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  transition: width 0.5s ease, background-color 0.5s ease;
  border-radius: 12px;
}

.stat-bar-fill.health {
  background: linear-gradient(90deg, #10b981, #059669);
}

.stat-bar-fill.energy {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.stat-value {
  min-width: 45px;
  text-align: right;
  font-weight: 600;
  color: #4b5563;
  font-size: 0.9rem;
}

.status-message {
  text-align: center;
  padding: 8px;
  border-radius: 10px;
  margin-bottom: 10px;
  font-weight: 600;
  font-size: 0.9rem;
}

.status-message.happy {
  background: #d1fae5;
  color: #065f46;
}

.status-message.hungry {
  background: #fef3c7;
  color: #92400e;
}

.status-message.sick {
  background: #fee2e2;
  color: #991b1b;
}

.status-message.sleepy {
  background: #e0e7ff;
  color: #3730a3;
}

.status-message.sad {
  background: #f3e8ff;
  color: #6b21a8;
}

.status-message.dirty {
  background: #fef9c3;
  color: #854d0e;
}

.notification-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #34d399, #10b981);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.notification-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.notification-btn:active {
  transform: translateY(0);
}

.actions-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn:active:not(:disabled) {
  transform: translateY(0);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.feed {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
}

.action-btn.play {
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
  color: white;
}

.action-btn.revive {
  background: linear-gradient(135deg, #f472b6, #ec4899);
  color: white;
}

.action-btn.clean {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  color: white;
}

.action-btn.sleep {
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
  color: white;
}

.action-btn.sleep.active {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
}

.btn-icon {
  font-size: 1.5rem;
}

.pet-info {
  display: flex;
  justify-content: space-around;
  padding: 8px;
  background: #f3f4f6;
  border-radius: 10px;
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.sleep-indicator {
  color: #8b5cf6;
  font-weight: 600;
}
</style>
