<script setup lang="ts">
import { useNotificationStore } from '../stores/notificationStore'

const notificationStore = useNotificationStore()

function getIcon(type: string): string {
  const icons = {
    hungry: '😋',
    sick: '🤒',
    sleepy: '😴',
    sad: '😢',
    dirty: '🤢',
    dead: '💀',
    evolved: '✨',
  }
  return icons[type] || '🔔'
}

function getStyles(type: string): { borderColor: string; backgroundColor: string } {
  const styles: Record<string, { borderColor: string; backgroundColor: string }> = {
    hungry: { borderColor: '#facc15', backgroundColor: '#fef9c3' },
    sick: { borderColor: '#f87171', backgroundColor: '#fee2e2' },
    sleepy: { borderColor: '#818cf8', backgroundColor: '#e0e7ff' },
    sad: { borderColor: '#c084fc', backgroundColor: '#f3e8ff' },
    dirty: { borderColor: '#a3e635', backgroundColor: '#ecfccb' },
    dead: { borderColor: '#1f2937', backgroundColor: '#f3f4f6' },
    evolved: { borderColor: '#facc15', backgroundColor: '#fef9c3' },
  }
  return styles[type] || { borderColor: '#60a5fa', backgroundColor: '#dbeafe' }
}
</script>

<template>
  <div class="notification-container">
    <TransitionGroup name="notification">
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        class="notification-card"
        :style="getStyles(notification.type)"
        @click="notificationStore.dismissNotification(notification.id)"
      >
        <div class="notification-content">
          <span class="notification-icon">{{ getIcon(notification.type) }}</span>
          <div class="notification-text">
            <p class="notification-title">{{ notification.title }}</p>
            <p class="notification-message">{{ notification.message }}</p>
            <p class="notification-time">
              {{ new Date(notification.timestamp).toLocaleTimeString() }}
            </p>
          </div>
          <button
            class="notification-close"
            @click.stop="notificationStore.dismissNotification(notification.id)"
          >
            ✕
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notification-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 320px;
}

.notification-card {
  padding: 16px;
  border-radius: 8px;
  border: 2px solid;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.notification-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.notification-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.notification-text {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 700;
  font-size: 0.875rem;
  margin: 0 0 4px 0;
  font-family: 'Outfit', sans-serif;
}

.notification-message {
  font-size: 0.75rem;
  color: #4b5563;
  margin: 0 0 8px 0;
  line-height: 1.4;
  font-family: 'Outfit', sans-serif;
}

.notification-time {
  font-size: 0.625rem;
  color: #9ca3af;
  margin: 0;
}

.notification-close {
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.2s;
}

.notification-close:hover {
  color: #4b5563;
}

/* Transition animations */
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
</style>
