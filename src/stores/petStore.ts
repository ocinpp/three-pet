import { defineStore } from 'pinia'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  GROWTH_TIMING,
  DECAY_RATES,
  THRESHOLDS,
  CARE,
  EVOLUTION_QUALITY,
  ACTIONS,
  HATCHING,
  POOP,
  SLEEP,
} from '../constants/pet'

export const usePetStore = defineStore('pet', () => {
  // Types
  type LifeStage = 'egg' | 'baby' | 'child' | 'adult' | 'elder'
  type EvolutionType = 'perfect' | 'good' | 'normal' | 'bad'

  // State
  const hunger = ref(100)
  const happiness = ref(100)
  const health = ref(100)
  const energy = ref(100)
  const age = ref(0)
  const lifeStage = ref<LifeStage>('egg')
  const evolutionType = ref<EvolutionType>('normal')
  const isAlive = ref(true)
  const isHatching = ref(false)
  const currentAction = ref<'idle' | 'eating' | 'playing'>('idle')
  const isSleeping = ref(false)
  const poopCount = ref(0)

  // Care quality tracking (for evolution)
  const totalCareScore = ref(0)
  const careSamples = ref(0)

  // Offline time tracking
  const lastActiveTime = ref(Date.now())
  const notificationEnabled = ref(false)

  // Track last notification for each type to avoid spam
  const lastNotificationTime = ref<Record<string, number>>({
    hungry: 0,
    sick: 0,
    sleepy: 0,
    sad: 0,
    dirty: 0,
    dead: 0,
    evolved: 0,
  })

  let tickInterval: number | null = null

  // Request notification permission
  async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    // Check if already granted
    if (Notification.permission === 'granted') {
      notificationEnabled.value = true
      return true
    }

    // Request permission
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      notificationEnabled.value = permission === 'granted'
      return notificationEnabled.value
    }

    return false
  }

  // Initialize notification status on load
  function initNotifications() {
    if ('Notification' in window && Notification.permission === 'granted') {
      notificationEnabled.value = true
    }
  }

  // Send notification with cooldown to avoid spam
  function sendNotification(type: string, title: string, body: string, cooldownMs = 60000) {
    if (!notificationEnabled.value) return

    const now = Date.now()
    const lastSent = lastNotificationTime.value[type] || 0

    // Check cooldown (default 1 minute)
    if (now - lastSent < cooldownMs) return

    // Send notification
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: type, // Prevents duplicate notifications
      })
      lastNotificationTime.value[type] = now
    }
  }

  // Check and send notifications based on pet state
  function checkAndSendNotifications() {
    if (!isAlive.value) {
      sendNotification('dead', '💀 Your Pet Passed Away', 'Your pet needs you to revive them!')
      return
    }

    if (health.value < THRESHOLDS.HEALTH_LOW) {
      sendNotification(
        'sick',
        '🤒 Your Pet is Sick!',
        `Health: ${Math.round(health.value)}% - Please take care!`
      )
    }

    if (hunger.value < THRESHOLDS.HUNGER_HIGH) {
      sendNotification(
        'hungry',
        '😋 Your Pet is Hungry!',
        `Hunger: ${Math.round(hunger.value)}% - Time to feed!`
      )
    }

    if (energy.value < THRESHOLDS.ENERGY_LOW && !isSleeping.value) {
      sendNotification(
        'sleepy',
        '😴 Your Pet is Sleepy',
        `Energy: ${Math.round(energy.value)}% - Let them rest!`
      )
    }

    if (happiness.value < THRESHOLDS.HAPPINESS_LOW) {
      sendNotification(
        'sad',
        '😢 Your Pet is Sad',
        `Happiness: ${Math.round(happiness.value)}% - Play with them!`
      )
    }

    if (poopCount.value >= 2) {
      sendNotification(
        'dirty',
        '🤢 Your Pet Needs Cleaning!',
        `${poopCount.value} poop(s) - Clean up time!`
      )
    }
  }

  // Save state to localStorage
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

  // Load state from localStorage
  function loadState() {
    const saved = localStorage.getItem('three-pet-state')
    if (saved) {
      try {
        const state = JSON.parse(saved)
        hunger.value = state.hunger ?? 100
        happiness.value = state.happiness ?? 100
        health.value = state.health ?? 100
        energy.value = state.energy ?? 100
        age.value = state.age ?? 0
        lifeStage.value = state.lifeStage ?? 'egg'
        evolutionType.value = state.evolutionType ?? 'normal'
        isAlive.value = state.isAlive ?? true
        isSleeping.value = state.isSleeping ?? false
        poopCount.value = state.poopCount ?? 0
        totalCareScore.value = state.totalCareScore ?? 0
        careSamples.value = state.careSamples ?? 0
        lastActiveTime.value = state.lastActiveTime ?? Date.now()
        return true
      } catch (e) {
        console.error('Failed to load state:', e)
        return false
      }
    }
    return false
  }

  // Process offline time - simulate ticks that should have happened
  function processOfflineTime() {
    const now = Date.now()
    const elapsedMs = now - lastActiveTime.value
    const elapsedSeconds = Math.floor(elapsedMs / 1000)

    // If more than 1 second has passed, simulate the missed ticks
    if (elapsedSeconds > 1) {
      // Cap offline time at 1 hour (3600 seconds) to prevent excessive aging
      const maxOfflineSeconds = 3600
      const secondsToSimulate = Math.min(elapsedSeconds, maxOfflineSeconds)

      console.log(
        `Processing ${secondsToSimulate} seconds of offline time (was ${elapsedSeconds}s total)...`
      )

      // Simulate each second that passed
      for (let i = 0; i < secondsToSimulate; i++) {
        tick()
      }
    }

    // Update last active time
    lastActiveTime.value = now
  }

  // Handle page visibility change
  function handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden, save current state
      saveState()
    } else {
      // Page is visible again, load and process offline time
      const hadState = loadState()
      if (hadState) {
        processOfflineTime()
      }
      lastActiveTime.value = Date.now()
    }
  }

  // Actions
  function feed() {
    if (!isAlive.value) return
    hunger.value = Math.min(100, hunger.value + ACTIONS.FEED_HUNGER)
    happiness.value = Math.min(100, happiness.value + ACTIONS.FEED_HAPPINESS)
    currentAction.value = 'eating'
    setTimeout(() => (currentAction.value = 'idle'), ACTIONS.ACTION_DURATION)
  }

  function play() {
    if (!isAlive.value) return
    if (isSleeping.value) return // Can't play while sleeping
    if (hunger.value < THRESHOLDS.HUNGER_LOW) return // Too hungry to play
    happiness.value = Math.min(100, happiness.value + ACTIONS.PLAY_HAPPINESS)
    hunger.value = Math.max(0, hunger.value - ACTIONS.PLAY_HUNGER_COST)
    currentAction.value = 'playing'
    setTimeout(() => (currentAction.value = 'idle'), ACTIONS.ACTION_DURATION)
  }

  function sleep() {
    if (!isAlive.value) return
    if (isSleeping.value) {
      // Wake up
      isSleeping.value = false
    } else {
      // Go to sleep
      isSleeping.value = true
    }
  }

  function clean() {
    if (!isAlive.value) return
    poopCount.value = 0
    happiness.value = Math.min(100, happiness.value + 10)
  }

  function revive() {
    hunger.value = 100
    happiness.value = 100
    health.value = 100
    energy.value = 100
    age.value = 0
    lifeStage.value = 'egg'
    evolutionType.value = 'normal'
    isAlive.value = true
    isHatching.value = false
    isSleeping.value = false
    currentAction.value = 'idle'
    poopCount.value = 0
    totalCareScore.value = 0
    careSamples.value = 0
  }

  function reset() {
    // Full game reset - same as revive but also clears localStorage
    localStorage.removeItem('three-pet-state')
    hunger.value = 100
    happiness.value = 100
    health.value = 100
    energy.value = 100
    age.value = 0
    lifeStage.value = 'egg'
    evolutionType.value = 'normal'
    isAlive.value = true
    isHatching.value = false
    isSleeping.value = false
    currentAction.value = 'idle'
    poopCount.value = 0
    totalCareScore.value = 0
    careSamples.value = 0
    lastActiveTime.value = Date.now()
  }

  // Calculate evolution type based on care quality
  function calculateEvolution(): EvolutionType {
    if (careSamples.value === 0) return 'normal'
    const avgCare = totalCareScore.value / careSamples.value

    if (avgCare >= EVOLUTION_QUALITY.PERFECT_MIN) return 'perfect'
    if (avgCare >= EVOLUTION_QUALITY.GOOD_MIN) return 'good'
    if (avgCare >= EVOLUTION_QUALITY.NORMAL_MIN) return 'normal'
    return 'bad'
  }

  // Evolve to next life stage
  function evolve() {
    const stages: LifeStage[] = ['egg', 'baby', 'child', 'adult', 'elder']
    const currentIndex = stages.indexOf(lifeStage.value)

    if (currentIndex < stages.length - 1) {
      evolutionType.value = calculateEvolution()
      const nextStage = stages[currentIndex + 1]
      lifeStage.value = nextStage
      isHatching.value = true

      // Send evolution notification
      sendNotification(
        'evolved',
        `✨ Your Pet Evolved to ${capitalize(nextStage)}!`,
        `Great job! Your pet is now a ${nextStage}!`,
        300000 // 5 minute cooldown for evolution
      )

      // Hatching animation duration
      setTimeout(() => {
        isHatching.value = false
      }, HATCHING.ANIMATION_DURATION)
    }
  }

  // Helper to capitalize strings
  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  // Decay over time
  function tick() {
    if (!isAlive.value) return

    // Egg doesn't decay, just waits to hatch
    if (lifeStage.value === 'egg') {
      if (age.value >= GROWTH_TIMING.EGG_HATCH) {
        evolve()
      }
      age.value += 1
      return
    }

    // Sleeping mode
    if (isSleeping.value) {
      // Recover energy while sleeping
      energy.value = Math.min(100, energy.value + SLEEP.ENERGY_RECOVERY)
      health.value = Math.min(100, health.value + DECAY_RATES.HEALTH_REGEN)

      // Wake up if energy is full
      if (energy.value >= 100) {
        isSleeping.value = false
      }

      age.value += 1
      return
    }

    // Stats decay
    hunger.value = Math.max(0, hunger.value - DECAY_RATES.HUNGER)
    happiness.value = Math.max(0, happiness.value - DECAY_RATES.HAPPINESS)
    energy.value = Math.max(0, energy.value - DECAY_RATES.ENERGY)

    // Track care quality (sample at intervals)
    if (age.value % CARE.SAMPLE_INTERVAL === 0) {
      const currentCare = (hunger.value + happiness.value + health.value + energy.value) / 4
      totalCareScore.value += currentCare
      careSamples.value += 1
    }

    // Health decreases if needs are neglected
    if (
      hunger.value < THRESHOLDS.HUNGER_LOW ||
      happiness.value < THRESHOLDS.HAPPINESS_LOW ||
      energy.value < THRESHOLDS.ENERGY_LOW
    ) {
      health.value = Math.max(0, health.value - DECAY_RATES.HEALTH_DECAY)
    } else {
      health.value = Math.min(100, health.value + DECAY_RATES.HEALTH_REGEN)
    }

    // Poop spawning (only after hatching)
    if (age.value > GROWTH_TIMING.EGG_HATCH && poopCount.value < POOP.MAX_POOP) {
      if (Math.random() < POOP.POOP_CHANCE) {
        poopCount.value += 1
        happiness.value = Math.max(0, happiness.value - 5)
      }
    }

    // Too much poop makes pet sick
    if (poopCount.value >= POOP.MAX_POOP) {
      health.value = Math.max(0, health.value - DECAY_RATES.HEALTH_DECAY)
    }

    // Age increases
    age.value += 1

    // Life stage evolution based on age (slow pacing: 5 min to elder)
    // Egg: 0-30s, Baby: 30s-90s, Child: 90s-210s, Adult: 210s-390s, Elder: 390s+
    if (lifeStage.value === 'baby' && age.value >= GROWTH_TIMING.BABY_EVOLVE) {
      evolve()
    } else if (lifeStage.value === 'child' && age.value >= GROWTH_TIMING.CHILD_EVOLVE) {
      evolve()
    } else if (lifeStage.value === 'adult' && age.value >= GROWTH_TIMING.ADULT_EVOLVE) {
      evolve()
    }

    // Death condition
    if (health.value <= THRESHOLDS.HEALTH_CRITICAL) {
      isAlive.value = false
      isSleeping.value = false // Wake up if dying
    }

    // Check and send notifications (only when page is hidden to avoid annoying user)
    if (document.hidden) {
      checkAndSendNotifications()
    }
  }

  // Computed
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

  // Lifecycle - start the game loop
  onMounted(() => {
    // Initialize notification status
    initNotifications()

    // Try to load saved state on startup
    loadState()
    // Process any offline time that passed
    processOfflineTime()

    // Tick every second (1 game minute = 1 real second for demo)
    tickInterval = window.setInterval(() => {
      tick()
      // Update last active time every tick
      lastActiveTime.value = Date.now()
    }, 1000)

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Save state before the page is closed/unloaded
    window.addEventListener('beforeunload', saveState)
  })

  onUnmounted(() => {
    if (tickInterval !== null) {
      clearInterval(tickInterval)
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('beforeunload', saveState)
  })

  return {
    hunger,
    happiness,
    health,
    energy,
    age,
    lifeStage,
    evolutionType,
    isAlive,
    isHatching,
    currentAction,
    isSleeping,
    poopCount,
    mood,
    notificationEnabled,
    feed,
    play,
    sleep,
    clean,
    revive,
    reset,
    requestNotificationPermission,
  }
})
