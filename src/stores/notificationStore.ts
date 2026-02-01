import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AppNotification {
  id: string
  type: 'hungry' | 'sick' | 'sleepy' | 'sad' | 'dirty' | 'dead' | 'evolved'
  title: string
  message: string
  timestamp: number
  read: boolean
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<AppNotification[]>([])
  const unreadCount = ref(0)

  function addNotification(type: AppNotification['type'], title: string, message: string) {
    const notification: AppNotification = {
      id: `${type}-${Date.now()}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false,
    }
    notifications.value.unshift(notification)
    unreadCount.value++

    // Auto-dismiss read notifications after 5 minutes
    setTimeout(() => {
      dismissNotification(notification.id)
    }, 300000)
  }

  function dismissNotification(id: string) {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      if (!notifications.value[index].read) {
        unreadCount.value--
      }
      notifications.value.splice(index, 1)
    }
  }

  function markAsRead(id: string) {
    const notification = notifications.value.find((n) => n.id === id)
    if (notification && !notification.read) {
      notification.read = true
      unreadCount.value--
    }
  }

  function markAllAsRead() {
    notifications.value.forEach((n) => (n.read = true))
    unreadCount.value = 0
  }

  function clearAll() {
    notifications.value = []
    unreadCount.value = 0
  }

  return {
    notifications,
    unreadCount,
    addNotification,
    dismissNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  }
})
