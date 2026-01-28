<template>
  <div ref="containerRef" class="pet-scene" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { usePetStore } from '../stores/petStore'

const props = defineProps<{
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
}>()

const petStore = usePetStore()
const containerRef = ref<HTMLDivElement>()

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let petGroup: THREE.Group
let animationId: number
let clock: THREE.Clock
let particles: THREE.Points[] = []
let poopMeshes: THREE.Mesh[] = []
let ambientLight: THREE.AmbientLight
let directionalLight: THREE.DirectionalLight
let sleepLight: THREE.PointLight
let zzzParticles: THREE.Points[] = []
let ground: THREE.Mesh
let backgroundCurrent: THREE.Color
let backgroundTarget: THREE.Color
let groundCurrent: THREE.Color
let groundTarget: THREE.Color

// Get pet color based on evolution type
function getPetColor(): number {
  switch (petStore.evolutionType) {
    case 'perfect': return 0xFFD700 // Gold
    case 'good': return 0xFF69B4 // Hot pink
    case 'normal': return 0xFFB6C1 // Light pink
    case 'bad': return 0x808080 // Gray
    default: return 0xFFB6C1
  }
}

// Time of day type
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

// Get current time of day from prop
function getTimeOfDay(): TimeOfDay {
  return props.timeOfDay
}

// Get background color based on time of day
function getBackgroundColor(): number {
  if (petStore.isSleeping) return 0x1a1a2e // Night when sleeping

  const timeOfDay = getTimeOfDay()

  switch (timeOfDay) {
    case 'morning':
      return 0xFFE4B5 // Mellow yellow/sunrise
    case 'afternoon':
      return 0x87CEEB // Sky blue
    case 'evening':
      return 0xFF6B6B // Warm orange/sunset
    case 'night':
      return 0x1a1a2e // Dark blue
    default:
      return 0x87CEEB
  }
}

// Get ground color based on time of day
function getGroundColor(): number {
  if (petStore.isSleeping) return 0x2d4a3e // Dark green when sleeping

  const timeOfDay = getTimeOfDay()

  switch (timeOfDay) {
    case 'morning':
      return 0x98D8AA // Fresh morning green
    case 'afternoon':
      return 0x90EE90 // Bright green
    case 'evening':
      return 0x7CB342 // Warm evening green
    case 'night':
      return 0x2d4a3e // Dark green
    default:
      return 0x90EE90
  }
}

// Get light intensity based on time of day
function getLightIntensity(): { ambient: number; directional: number } {
  if (petStore.isSleeping) {
    return { ambient: 0.1, directional: 0.1 }
  }

  const timeOfDay = getTimeOfDay()

  switch (timeOfDay) {
    case 'morning':
      return { ambient: 0.5, directional: 0.6 }
    case 'afternoon':
      return { ambient: 0.6, directional: 0.8 }
    case 'evening':
      return { ambient: 0.4, directional: 0.5 }
    case 'night':
      return { ambient: 0.2, directional: 0.3 }
    default:
      return { ambient: 0.6, directional: 0.8 }
  }
}

// Create egg
function createEgg(): THREE.Group {
  const group = new THREE.Group()
  const v = 0.5

  // Creamy pastel egg
  const eggMaterial = new THREE.MeshLambertMaterial({ color: 0xFFF5EE })
  const spotMaterial = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 })
  const highlightMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF })

  // Create adorable egg shape from voxels
  for (let y = -2; y <= 4; y++) {
    const radius = y < 0 ? 2.2 : (y > 2 ? 1.0 : 1.8)
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        const dist = Math.sqrt(x * x + z * z)
        if (dist <= radius) {
          const voxel = new THREE.Mesh(
            new THREE.BoxGeometry(v, v, v),
            eggMaterial
          )
          voxel.position.set(x * v, y * v, z * v)
          group.add(voxel)
        }
      }
    }
  }

  // Cute heart spots
  const spotMaterial2 = new THREE.MeshLambertMaterial({ color: 0xFF69B4 })
  const spots = [
    [1, 2, 2], [-1, 1, 2], [0, 0, 2],
    [1, 1, 2], [-1, 2, 2], [0, 1, 2]
  ]
  spots.forEach(([x, y, z]) => {
    const spot = new THREE.Mesh(
      new THREE.BoxGeometry(v * 0.35, v * 0.35, v * 0.35),
      Math.random() > 0.5 ? spotMaterial : spotMaterial2
    )
    spot.position.set(x * v, y * v, z * v)
    group.add(spot)
  })

  // Shine highlight
  const highlight = new THREE.Mesh(
    new THREE.BoxGeometry(v * 0.5, v * 0.3, v * 0.2),
    highlightMaterial
  )
  highlight.position.set(v * 0.8, v * 2.5, v * 2.1)
  group.add(highlight)

  // Tiny blush marks on egg (so cute!)
  const blushMaterial = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 })
  const leftBlush = new THREE.Mesh(
    new THREE.BoxGeometry(v * 0.4, v * 0.15, v * 0.15),
    blushMaterial
  )
  leftBlush.position.set(-v * 1.5, v * 1, v * 2.1)
  group.add(leftBlush)

  const rightBlush = new THREE.Mesh(
    new THREE.BoxGeometry(v * 0.4, v * 0.15, v * 0.15),
    blushMaterial
  )
  rightBlush.position.set(v * 1.5, v * 1, v * 2.1)
  group.add(rightBlush)

  // Cute crack hint
  const crackMaterial = new THREE.MeshLambertMaterial({ color: 0xDDD5D0 })
  const crack1 = new THREE.Mesh(new THREE.BoxGeometry(v * 0.1, v * 0.6, v * 0.1), crackMaterial)
  crack1.position.set(0, v * 3.5, v * 2.1)
  group.add(crack1)

  const crack2 = new THREE.Mesh(new THREE.BoxGeometry(v * 0.4, v * 0.1, v * 0.1), crackMaterial)
  crack2.position.set(-v * 0.2, v * 3.8, v * 2.1)
  group.add(crack2)

  group.scale.set(0.7, 0.7, 0.7)
  return group
}

// Create baby pet
function createBabyPet(): THREE.Group {
  const group = new THREE.Group()
  const v = 0.5
  const color = getPetColor()

  const bodyMaterial = new THREE.MeshLambertMaterial({ color })
  const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 })
  const eyeHighlightMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
  const blushMaterial = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 })

  // Chibi body - larger head area
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 2; y++) {
      for (let z = -1; z <= 1; z++) {
        const dist = Math.sqrt(x * x + y * y * 0.7 + z * z)
        if (dist <= 1.5) {
          const voxel = new THREE.Mesh(
            new THREE.BoxGeometry(v, v, v),
            bodyMaterial
          )
          voxel.position.set(x * v, y * v, z * v)
          group.add(voxel)
        }
      }
    }
  }

  // HUGE sparkly eyes
  const eyeWhiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
  const eyeSize = v * 1.2

  // Left eye
  const leftEyeWhite = new THREE.Mesh(new THREE.BoxGeometry(eyeSize, eyeSize, v * 0.3), eyeWhiteMaterial)
  leftEyeWhite.position.set(-v * 0.7, v * 0.8, v * 1.3)
  group.add(leftEyeWhite)

  const leftPupil = new THREE.Mesh(new THREE.BoxGeometry(eyeSize * 0.5, eyeSize * 0.6, v * 0.35), eyeMaterial)
  leftPupil.position.set(-v * 0.7, v * 0.75, v * 1.35)
  group.add(leftPupil)

  const leftHighlight = new THREE.Mesh(new THREE.BoxGeometry(v * 0.3, v * 0.3, v * 0.1), eyeHighlightMaterial)
  leftHighlight.position.set(-v * 0.5, v * 1.0, v * 1.4)
  group.add(leftHighlight)

  // Right eye
  const rightEyeWhite = new THREE.Mesh(new THREE.BoxGeometry(eyeSize, eyeSize, v * 0.3), eyeWhiteMaterial)
  rightEyeWhite.position.set(v * 0.7, v * 0.8, v * 1.3)
  group.add(rightEyeWhite)

  const rightPupil = new THREE.Mesh(new THREE.BoxGeometry(eyeSize * 0.5, eyeSize * 0.6, v * 0.35), eyeMaterial)
  rightPupil.position.set(v * 0.7, v * 0.75, v * 1.35)
  group.add(rightPupil)

  const rightHighlight = new THREE.Mesh(new THREE.BoxGeometry(v * 0.3, v * 0.3, v * 0.1), eyeHighlightMaterial)
  rightHighlight.position.set(v * 0.9, v * 1.0, v * 1.4)
  group.add(rightHighlight)

  // Rosy cheeks
  const leftBlush = new THREE.Mesh(new THREE.BoxGeometry(v * 0.5, v * 0.2, v * 0.2), blushMaterial)
  leftBlush.position.set(-v * 1.1, v * 0.3, v * 1.2)
  group.add(leftBlush)

  const rightBlush = new THREE.Mesh(new THREE.BoxGeometry(v * 0.5, v * 0.2, v * 0.2), blushMaterial)
  rightBlush.position.set(v * 1.1, v * 0.3, v * 1.2)
  group.add(rightBlush)

  // Tiny cute beak
  const beakGeometry = new THREE.BoxGeometry(v * 0.3, v * 0.25, v * 0.25)
  const beakMaterial = new THREE.MeshLambertMaterial({ color: 0xFFA500 })
  const beak = new THREE.Mesh(beakGeometry, beakMaterial)
  beak.position.set(0, v * 0.4, v * 1.4)
  group.add(beak)

  // Tiny flubby wings
  const wingGeometry = new THREE.BoxGeometry(v * 0.3, v * 0.5, v * 0.3)
  const leftWing = new THREE.Mesh(wingGeometry, bodyMaterial)
  leftWing.position.set(-v * 1.2, 0, 0)
  group.add(leftWing)

  const rightWing = new THREE.Mesh(wingGeometry, bodyMaterial)
  rightWing.position.set(v * 1.2, 0, 0)
  group.add(rightWing)

  // Tiny feet
  const footGeometry = new THREE.BoxGeometry(v * 0.4, v * 0.2, v * 0.4)
  const leftFoot = new THREE.Mesh(footGeometry, bodyMaterial)
  leftFoot.position.set(-v * 0.4, -v * 1.2, v * 0.3)
  group.add(leftFoot)

  const rightFoot = new THREE.Mesh(footGeometry, bodyMaterial)
  rightFoot.position.set(v * 0.4, -v * 1.2, v * 0.3)
  group.add(rightFoot)

  // Small top tuft
  const tuftMaterial = new THREE.MeshLambertMaterial({ color: 0xFFE4B5 })
  const tuft = new THREE.Mesh(new THREE.BoxGeometry(v * 0.3, v * 0.3, v * 0.3), tuftMaterial)
  tuft.position.set(0, v * 1.8, 0)
  group.add(tuft)

  group.scale.set(0.6, 0.6, 0.6)
  return group
}

// Create child pet
function createChildPet(): THREE.Group {
  const group = new THREE.Group()
  const v = 0.5
  const color = getPetColor()

  const bodyMaterial = new THREE.MeshLambertMaterial({ color })
  const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 })
  const eyeHighlightMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
  const blushMaterial = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 })
  const bellyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFF0F5 })

  // Chibi round body - bigger head, smaller body
  for (let x = -2; x <= 2; x++) {
    for (let y = -2; y <= 3; y++) {
      for (let z = -2; z <= 2; z++) {
        const dist = Math.sqrt(x * x + y * y * 0.6 + z * z)
        if (dist <= 2.2 && dist >= 0.8) {
          const voxel = new THREE.Mesh(
            new THREE.BoxGeometry(v, v, v),
            bodyMaterial
          )
          voxel.position.set(x * v, y * v, z * v)
          group.add(voxel)
        }
      }
    }
  }

  // Soft cream belly
  for (let x = -1; x <= 1; x++) {
    for (let y = -2; y <= 0; y++) {
      for (let z = 0; z <= 1; z++) {
        const dist = Math.sqrt(x * x + y * y)
        if (dist <= 1.5) {
          const voxel = new THREE.Mesh(
            new THREE.BoxGeometry(v, v, v),
            bellyMaterial
          )
          voxel.position.set(x * v, y * v, z * v + v * 2.1)
          group.add(voxel)
        }
      }
    }
  }

  // GIANT sparkly anime eyes
  const eyeWhiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
  const eyeSize = v * 1.5

  // Left eye
  const leftEyeWhite = new THREE.Mesh(new THREE.BoxGeometry(eyeSize, eyeSize, v * 0.3), eyeWhiteMaterial)
  leftEyeWhite.position.set(-v * 0.8, v * 1.2, v * 2.2)
  group.add(leftEyeWhite)

  const leftPupil = new THREE.Mesh(new THREE.BoxGeometry(eyeSize * 0.5, eyeSize * 0.7, v * 0.35), eyeMaterial)
  leftPupil.position.set(-v * 0.8, v * 1.15, v * 2.25)
  group.add(leftPupil)

  const leftHighlight1 = new THREE.Mesh(new THREE.BoxGeometry(v * 0.4, v * 0.4, v * 0.1), eyeHighlightMaterial)
  leftHighlight1.position.set(-v * 0.5, v * 1.45, v * 2.35)
  group.add(leftHighlight1)

  const leftHighlight2 = new THREE.Mesh(new THREE.BoxGeometry(v * 0.2, v * 0.2, v * 0.1), eyeHighlightMaterial)
  leftHighlight2.position.set(-v * 1.0, v * 0.9, v * 2.35)
  group.add(leftHighlight2)

  // Right eye
  const rightEyeWhite = new THREE.Mesh(new THREE.BoxGeometry(eyeSize, eyeSize, v * 0.3), eyeWhiteMaterial)
  rightEyeWhite.position.set(v * 0.8, v * 1.2, v * 2.2)
  group.add(rightEyeWhite)

  const rightPupil = new THREE.Mesh(new THREE.BoxGeometry(eyeSize * 0.5, eyeSize * 0.7, v * 0.35), eyeMaterial)
  rightPupil.position.set(v * 0.8, v * 1.15, v * 2.25)
  group.add(rightPupil)

  const rightHighlight1 = new THREE.Mesh(new THREE.BoxGeometry(v * 0.4, v * 0.4, v * 0.1), eyeHighlightMaterial)
  rightHighlight1.position.set(v * 0.5, v * 1.45, v * 2.35)
  group.add(rightHighlight1)

  const rightHighlight2 = new THREE.Mesh(new THREE.BoxGeometry(v * 0.2, v * 0.2, v * 0.1), eyeHighlightMaterial)
  rightHighlight2.position.set(v * 1.1, v * 0.9, v * 2.35)
  group.add(rightHighlight2)

  // Extra rosy cheeks
  const leftBlush = new THREE.Mesh(new THREE.BoxGeometry(v * 0.7, v * 0.3, v * 0.2), blushMaterial)
  leftBlush.position.set(-v * 1.4, v * 0.7, v * 2.0)
  group.add(leftBlush)

  const rightBlush = new THREE.Mesh(new THREE.BoxGeometry(v * 0.7, v * 0.3, v * 0.2), blushMaterial)
  rightBlush.position.set(v * 1.4, v * 0.7, v * 2.0)
  group.add(rightBlush)

  // Cute tiny smile (shaped like a 'w')
  const smileMaterial = new THREE.MeshLambertMaterial({ color: 0xFF69B4 })
  const leftSmile = new THREE.Mesh(new THREE.BoxGeometry(v * 0.25, v * 0.15, v * 0.15), smileMaterial)
  leftSmile.position.set(-v * 0.3, v * 0.5, v * 2.3)
  group.add(leftSmile)

  const rightSmile = new THREE.Mesh(new THREE.BoxGeometry(v * 0.25, v * 0.15, v * 0.15), smileMaterial)
  rightSmile.position.set(v * 0.3, v * 0.5, v * 2.3)
  group.add(rightSmile)

  // Cute tiny arms
  const armGeometry = new THREE.BoxGeometry(v * 0.4, v * 0.8, v * 0.4)
  const leftArm = new THREE.Mesh(armGeometry, bodyMaterial)
  leftArm.position.set(-v * 1.8, v * 0.2, 0)
  leftArm.rotation.z = 0.3
  group.add(leftArm)

  const rightArm = new THREE.Mesh(armGeometry, bodyMaterial)
  rightArm.position.set(v * 1.8, v * 0.2, 0)
  rightArm.rotation.z = -0.3
  group.add(rightArm)

  // Tiny round feet
  const footGeometry = new THREE.BoxGeometry(v * 0.6, v * 0.3, v * 0.6)
  const leftFoot = new THREE.Mesh(footGeometry, bodyMaterial)
  leftFoot.position.set(-v * 0.7, -v * 2.2, v * 0.5)
  group.add(leftFoot)

  const rightFoot = new THREE.Mesh(footGeometry, bodyMaterial)
  rightFoot.position.set(v * 0.7, -v * 2.2, v * 0.5)
  group.add(rightFoot)

  // Cute hair tuft
  const tuftMaterial = new THREE.MeshLambertMaterial({ color: 0xFFE4B5 })
  const tuft1 = new THREE.Mesh(new THREE.BoxGeometry(v * 0.3, v * 0.3, v * 0.3), tuftMaterial)
  tuft1.position.set(-v * 0.3, v * 2.7, 0)
  group.add(tuft1)

  const tuft2 = new THREE.Mesh(new THREE.BoxGeometry(v * 0.3, v * 0.4, v * 0.3), tuftMaterial)
  tuft2.position.set(v * 0.3, v * 2.8, 0)
  group.add(tuft2)

  const tuft3 = new THREE.Mesh(new THREE.BoxGeometry(v * 0.3, v * 0.3, v * 0.3), tuftMaterial)
  tuft3.position.set(0, v * 2.9, 0)
  group.add(tuft3)

  group.scale.set(0.75, 0.75, 0.75)
  return group
}

// Create adult pet
function createAdultPet(): THREE.Group {
  const group = new THREE.Group()
  const v = 0.5
  const color = getPetColor()

  const bodyMaterial = new THREE.MeshLambertMaterial({ color })
  const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 })
  const eyeHighlightMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
  const blushMaterial = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 })
  const bellyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFF0F5 })

  // Cute chubby body
  for (let x = -2; x <= 2; x++) {
    for (let y = -3; y <= 3; y++) {
      for (let z = -2; z <= 2; z++) {
        const dist = Math.sqrt(x * x + y * y * 0.65 + z * z)
        if (dist <= 2.5 && dist >= 1.5) {
          const voxel = new THREE.Mesh(
            new THREE.BoxGeometry(v, v, v),
            bodyMaterial
          )
          voxel.position.set(x * v, y * v, z * v)
          group.add(voxel)
        }
      }
    }
  }

  // Soft belly patch
  for (let x = -1; x <= 1; x++) {
    for (let y = -2; y <= 0; y++) {
      for (let z = 0; z <= 1; z++) {
        const dist = Math.sqrt(x * x + y * y)
        if (dist <= 1.5) {
          const voxel = new THREE.Mesh(
            new THREE.BoxGeometry(v, v, v),
            bellyMaterial
          )
          voxel.position.set(x * v, y * v, z * v + v * 2.5)
          group.add(voxel)
        }
      }
    }
  }

  // Big beautiful eyes
  const eyeWhiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
  const eyeSize = v * 1.3

  // Left eye
  const leftEyeWhite = new THREE.Mesh(new THREE.BoxGeometry(eyeSize, eyeSize, v * 0.3), eyeWhiteMaterial)
  leftEyeWhite.position.set(-v * 0.9, v * 1.5, v * 2.5)
  group.add(leftEyeWhite)

  const leftPupil = new THREE.Mesh(new THREE.BoxGeometry(eyeSize * 0.5, eyeSize * 0.65, v * 0.35), eyeMaterial)
  leftPupil.position.set(-v * 0.9, v * 1.45, v * 2.55)
  group.add(leftPupil)

  const leftHighlight1 = new THREE.Mesh(new THREE.BoxGeometry(v * 0.35, v * 0.35, v * 0.1), eyeHighlightMaterial)
  leftHighlight1.position.set(-v * 0.6, v * 1.7, v * 2.65)
  group.add(leftHighlight1)

  const leftHighlight2 = new THREE.Mesh(new THREE.BoxGeometry(v * 0.2, v * 0.2, v * 0.1), eyeHighlightMaterial)
  leftHighlight2.position.set(-v * 1.1, v * 1.2, v * 2.65)
  group.add(leftHighlight2)

  // Right eye
  const rightEyeWhite = new THREE.Mesh(new THREE.BoxGeometry(eyeSize, eyeSize, v * 0.3), eyeWhiteMaterial)
  rightEyeWhite.position.set(v * 0.9, v * 1.5, v * 2.5)
  group.add(rightEyeWhite)

  const rightPupil = new THREE.Mesh(new THREE.BoxGeometry(eyeSize * 0.5, eyeSize * 0.65, v * 0.35), eyeMaterial)
  rightPupil.position.set(v * 0.9, v * 1.45, v * 2.55)
  group.add(rightPupil)

  const rightHighlight1 = new THREE.Mesh(new THREE.BoxGeometry(v * 0.35, v * 0.35, v * 0.1), eyeHighlightMaterial)
  rightHighlight1.position.set(v * 0.6, v * 1.7, v * 2.65)
  group.add(rightHighlight1)

  const rightHighlight2 = new THREE.Mesh(new THREE.BoxGeometry(v * 0.2, v * 0.2, v * 0.1), eyeHighlightMaterial)
  rightHighlight2.position.set(v * 1.2, v * 1.2, v * 2.65)
  group.add(rightHighlight2)

  // Sweet rosy cheeks
  const leftBlush = new THREE.Mesh(new THREE.BoxGeometry(v * 0.6, v * 0.25, v * 0.2), blushMaterial)
  leftBlush.position.set(-v * 1.5, v * 1.1, v * 2.3)
  group.add(leftBlush)

  const rightBlush = new THREE.Mesh(new THREE.BoxGeometry(v * 0.6, v * 0.25, v * 0.2), blushMaterial)
  rightBlush.position.set(v * 1.5, v * 1.1, v * 2.3)
  group.add(rightBlush)

  // Happy smile
  const smileMaterial = new THREE.MeshLambertMaterial({ color: 0xFF69B4 })
  const smile = new THREE.Mesh(new THREE.BoxGeometry(v * 0.6, v * 0.15, v * 0.15), smileMaterial)
  smile.position.set(0, v * 0.9, v * 2.6)
  group.add(smile)

  // Cute stubby arms with hands
  const armGeometry = new THREE.BoxGeometry(v * 0.5, v * 1.0, v * 0.5)
  const handGeometry = new THREE.BoxGeometry(v * 0.6, v * 0.4, v * 0.6)

  const leftArm = new THREE.Mesh(armGeometry, bodyMaterial)
  leftArm.position.set(-v * 1.8, v * 0.5, 0)
  leftArm.rotation.z = 0.4
  group.add(leftArm)

  const leftHand = new THREE.Mesh(handGeometry, bodyMaterial)
  leftHand.position.set(-v * 2.2, v * 0.1, 0)
  group.add(leftHand)

  const rightArm = new THREE.Mesh(armGeometry, bodyMaterial)
  rightArm.position.set(v * 1.8, v * 0.5, 0)
  rightArm.rotation.z = -0.4
  group.add(rightArm)

  const rightHand = new THREE.Mesh(handGeometry, bodyMaterial)
  rightHand.position.set(v * 2.2, v * 0.1, 0)
  group.add(rightHand)

  // Cute feet
  const footGeometry = new THREE.BoxGeometry(v * 0.7, v * 0.35, v * 0.7)
  const leftFoot = new THREE.Mesh(footGeometry, bodyMaterial)
  leftFoot.position.set(-v * 0.8, -v * 2.8, v * 0.5)
  group.add(leftFoot)

  const rightFoot = new THREE.Mesh(footGeometry, bodyMaterial)
  rightFoot.position.set(v * 0.8, -v * 2.8, v * 0.5)
  group.add(rightFoot)

  // Adorable hair tuft
  const tuftMaterial = new THREE.MeshLambertMaterial({ color: 0xFFE4B5 })
  for (let i = -1; i <= 1; i++) {
    const tuft = new THREE.Mesh(new THREE.BoxGeometry(v * 0.3, v * 0.5, v * 0.3), tuftMaterial)
    tuft.position.set(i * v * 0.5, v * 3.5, 0)
    group.add(tuft)
  }

  return group
}

// Create elder pet
function createElderPet(): THREE.Group {
  const group = new THREE.Group()
  const v = 0.5

  // Elder pets are wiser
  const baseColor = getPetColor()
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: baseColor })
  const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 })
  const eyeHighlightMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
  const blushMaterial = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 })
  const glassesMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
  const bellyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFF0F5 })

  // Wise round body
  for (let x = -2; x <= 2; x++) {
    for (let y = -3; y <= 3; y++) {
      for (let z = -2; z <= 2; z++) {
        const dist = Math.sqrt(x * x + y * y * 0.7 + z * z)
        if (dist <= 2.4 && dist >= 1.5) {
          const voxel = new THREE.Mesh(
            new THREE.BoxGeometry(v, v, v),
            bodyMaterial
          )
          voxel.position.set(x * v, y * v, z * v)
          group.add(voxel)
        }
      }
    }
  }

  // Soft belly
  for (let x = -1; x <= 1; x++) {
    for (let y = -2; y <= 0; y++) {
      for (let z = 0; z <= 1; z++) {
        const dist = Math.sqrt(x * x + y * y)
        if (dist <= 1.5) {
          const voxel = new THREE.Mesh(
            new THREE.BoxGeometry(v, v, v),
            bellyMaterial
          )
          voxel.position.set(x * v, y * v, z * v + v * 2.4)
          group.add(voxel)
        }
      }
    }
  }

  // Kind wise eyes
  const eyeWhiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
  const eyeSize = v * 1.2

  // Left eye
  const leftEyeWhite = new THREE.Mesh(new THREE.BoxGeometry(eyeSize, eyeSize, v * 0.3), eyeWhiteMaterial)
  leftEyeWhite.position.set(-v * 0.9, v * 1.4, v * 2.4)
  group.add(leftEyeWhite)

  const leftPupil = new THREE.Mesh(new THREE.BoxGeometry(eyeSize * 0.5, eyeSize * 0.6, v * 0.35), eyeMaterial)
  leftPupil.position.set(-v * 0.9, v * 1.35, v * 2.45)
  group.add(leftPupil)

  const leftHighlight = new THREE.Mesh(new THREE.BoxGeometry(v * 0.3, v * 0.3, v * 0.1), eyeHighlightMaterial)
  leftHighlight.position.set(-v * 0.65, v * 1.6, v * 2.55)
  group.add(leftHighlight)

  // Right eye
  const rightEyeWhite = new THREE.Mesh(new THREE.BoxGeometry(eyeSize, eyeSize, v * 0.3), eyeWhiteMaterial)
  rightEyeWhite.position.set(v * 0.9, v * 1.4, v * 2.4)
  group.add(rightEyeWhite)

  const rightPupil = new THREE.Mesh(new THREE.BoxGeometry(eyeSize * 0.5, eyeSize * 0.6, v * 0.35), eyeMaterial)
  rightPupil.position.set(v * 0.9, v * 1.35, v * 2.45)
  group.add(rightPupil)

  const rightHighlight = new THREE.Mesh(new THREE.BoxGeometry(v * 0.3, v * 0.3, v * 0.1), eyeHighlightMaterial)
  rightHighlight.position.set(v * 1.15, v * 1.6, v * 2.55)
  group.add(rightHighlight)

  // Cute round glasses (makes them look like a wise grandparent)
  const leftGlass = new THREE.Mesh(new THREE.BoxGeometry(v * 0.8, v * 0.8, v * 0.2), glassesMaterial)
  leftGlass.position.set(-v * 0.9, v * 1.4, v * 2.7)
  group.add(leftGlass)

  const rightGlass = new THREE.Mesh(new THREE.BoxGeometry(v * 0.8, v * 0.8, v * 0.2), glassesMaterial)
  rightGlass.position.set(v * 0.9, v * 1.4, v * 2.7)
  group.add(rightGlass)

  // Glasses bridge
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(v * 0.5, v * 0.15, v * 0.15), glassesMaterial)
  bridge.position.set(0, v * 1.4, v * 2.7)
  group.add(bridge)

  // Sweet rosy cheeks
  const leftBlush = new THREE.Mesh(new THREE.BoxGeometry(v * 0.5, v * 0.2, v * 0.2), blushMaterial)
  leftBlush.position.set(-v * 1.4, v * 1.0, v * 2.2)
  group.add(leftBlush)

  const rightBlush = new THREE.Mesh(new THREE.BoxGeometry(v * 0.5, v * 0.2, v * 0.2), blushMaterial)
  rightBlush.position.set(v * 1.4, v * 1.0, v * 2.2)
  group.add(rightBlush)

  // Warm gentle smile
  const smileMaterial = new THREE.MeshLambertMaterial({ color: 0xFF69B4 })
  const smile = new THREE.Mesh(new THREE.BoxGeometry(v * 0.5, v * 0.12, v * 0.12), smileMaterial)
  smile.position.set(0, v * 0.85, v * 2.5)
  group.add(smile)

  // Gentle arms
  const armGeometry = new THREE.BoxGeometry(v * 0.45, v * 0.9, v * 0.45)
  const leftArm = new THREE.Mesh(armGeometry, bodyMaterial)
  leftArm.position.set(-v * 1.7, v * 0.3, 0)
  leftArm.rotation.z = 0.3
  group.add(leftArm)

  const rightArm = new THREE.Mesh(armGeometry, bodyMaterial)
  rightArm.position.set(v * 1.7, v * 0.3, 0)
  rightArm.rotation.z = -0.3
  group.add(rightArm)

  // Cozy feet
  const footGeometry = new THREE.BoxGeometry(v * 0.65, v * 0.3, v * 0.65)
  const leftFoot = new THREE.Mesh(footGeometry, bodyMaterial)
  leftFoot.position.set(-v * 0.8, -v * 2.7, v * 0.5)
  group.add(leftFoot)

  const rightFoot = new THREE.Mesh(footGeometry, bodyMaterial)
  rightFoot.position.set(v * 0.8, -v * 2.7, v * 0.5)
  group.add(rightFoot)

  // Wise hair tuft (smaller, more refined)
  const tuftMaterial = new THREE.MeshLambertMaterial({ color: 0xD3D3D3 })
  const tuft1 = new THREE.Mesh(new THREE.BoxGeometry(v * 0.25, v * 0.4, v * 0.25), tuftMaterial)
  tuft1.position.set(0, v * 3.2, 0)
  group.add(tuft1)

  // Slightly smaller and dignified
  group.scale.set(0.85, 0.85, 0.85)

  return group
}

// Create appropriate pet based on life stage
function createPetForStage() {
  switch (petStore.lifeStage) {
    case 'egg': return createEgg()
    case 'baby': return createBabyPet()
    case 'child': return createChildPet()
    case 'adult': return createAdultPet()
    case 'elder': return createElderPet()
    default: return createEgg()
  }
}

// Create evolution particles
function createEvolutionParticles() {
  const particleCount = 100
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)

  const color = new THREE.Color(getPetColor())

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = 0
    positions[i * 3 + 1] = 0
    positions[i * 3 + 2] = 0

    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.2,
    vertexColors: true,
    transparent: true,
    opacity: 1
  })

  const particles = new THREE.Points(geometry, material)
  return { particles, positions: positions as Float32Array }
}

// Create poop mesh
function createPoop(): THREE.Mesh {
  const v = 0.3
  const poopMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
  const poopGroup = new THREE.Group()

  // Create a cute poop shape
  for (let y = 0; y <= 3; y++) {
    const radius = y < 2 ? 1 : (y === 2 ? 0.7 : 0.4)
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const dist = Math.sqrt(x * x + z * z)
        if (dist <= radius) {
          const voxel = new THREE.Mesh(
            new THREE.BoxGeometry(v, v, v),
            poopMaterial
          )
          voxel.position.set(x * v, y * v, z * v)
          poopGroup.add(voxel)
        }
      }
    }
  }

  poopGroup.scale.set(0.5, 0.5, 0.5)
  return poopGroup
}

// Create sleeping ZZZ particles
function createZZZParticles() {
  const particleCount = 5
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = 0
    positions[i * 3 + 1] = 0
    positions[i * 3 + 2] = 0
    sizes[i] = 0.3 + i * 0.1
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.PointsMaterial({
    color: 0x4169E1,
    size: 0.5,
    transparent: true,
    opacity: 0.8
  })

  const zzz = new THREE.Points(geometry, material)
  return { zzz, positions: positions as Float32Array, baseY: 0 }
}

function init() {
  if (!containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = 280

  // Scene
  scene = new THREE.Scene()

  // Initialize background colors with time-based color
  const bgColor = getBackgroundColor()
  backgroundCurrent = new THREE.Color(bgColor)
  backgroundTarget = new THREE.Color(bgColor)
  scene.background = backgroundCurrent

  // Initialize ground colors with time-based color
  const groundColor = getGroundColor()
  groundCurrent = new THREE.Color(groundColor)
  groundTarget = new THREE.Color(groundColor)

  // Camera
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
  camera.position.set(0, 1, 8)

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  containerRef.value.appendChild(renderer.domElement)

  // Lighting with time-based intensity
  const lightIntensity = getLightIntensity()
  ambientLight = new THREE.AmbientLight(0xffffff, lightIntensity.ambient)
  scene.add(ambientLight)

  directionalLight = new THREE.DirectionalLight(0xffffff, lightIntensity.directional)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  // Sleep light (initially off)
  sleepLight = new THREE.PointLight(0xFFD700, 0, 5)
  sleepLight.position.set(2, 2, 3)
  scene.add(sleepLight)

  // Create pet
  petGroup = createPetForStage()
  scene.add(petGroup)

  // Ground with time-based color
  const groundGeometry = new THREE.PlaneGeometry(20, 20)
  const groundMaterial = new THREE.MeshLambertMaterial({ color: groundCurrent })
  ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -1.5
  scene.add(ground)

  clock = new THREE.Clock()

  // Watch for life stage changes
  watch(() => petStore.lifeStage, () => {
    scene.remove(petGroup)
    petGroup = createPetForStage()
    scene.add(petGroup)

    // Add evolution particles
    if (petStore.lifeStage !== 'egg') {
      const { particles: newParticles, positions } = createEvolutionParticles()
      scene.add(newParticles)
      particles.push({ points: newParticles, positions, startTime: clock.getElapsedTime() })
    }
  })

  // Watch for poop changes
  watch(() => petStore.poopCount, (newCount, oldCount) => {
    if (newCount > oldCount) {
      // Add poop
      const poopToAdd = newCount - oldCount
      for (let i = 0; i < poopToAdd; i++) {
        const poop = createPoop()
        // Random position on ground
        const x = (Math.random() - 0.5) * 6
        const z = (Math.random() - 0.5) * 2
        poop.position.set(x, -1.3, z)
        scene.add(poop)
        poopMeshes.push(poop)
      }
    } else if (newCount < oldCount) {
      // Remove all poop (clean action)
      poopMeshes.forEach(poop => scene.remove(poop))
      poopMeshes = []
    }
  })

  // Watch for sleep state changes
  watch(() => petStore.isSleeping, (isSleeping) => {
    if (isSleeping) {
      // Turn on sleep light (warm glow near pet)
      sleepLight.intensity = 1.5
      // Clear ZZZ particles when waking up (handled in animate)
    } else {
      // Turn off sleep light
      sleepLight.intensity = 0
      // Clear ZZZ particles
      zzzParticles.forEach(z => scene.remove(z.zzz))
      zzzParticles = []
    }
    // Update target colors (will transition smoothly in animate)
    backgroundTarget.setHex(getBackgroundColor())
    groundTarget.setHex(getGroundColor())
    const intensities = getLightIntensity()
    ambientLight.intensity = intensities.ambient
    directionalLight.intensity = intensities.directional
  })

  animate()
  window.addEventListener('resize', handleResize)
}

function handleResize() {
  if (!containerRef.value || !camera || !renderer) return

  const width = containerRef.value.clientWidth
  camera.aspect = width / 280
  camera.updateProjectionMatrix()
  renderer.setSize(width, 280)
}

function animate() {
  animationId = requestAnimationFrame(animate)

  const time = clock.getElapsedTime()

  // Smoothly transition background color
  backgroundTarget.setHex(getBackgroundColor())
  backgroundCurrent.lerp(backgroundTarget, 0.02) // Smooth transition

  // Smoothly transition ground color
  groundTarget.setHex(getGroundColor())
  groundCurrent.lerp(groundTarget, 0.02) // Smooth transition
  ;(ground.material as THREE.MeshLambertMaterial).color.copy(groundCurrent)

  if (petGroup) {
    // Sleep animation
    if (petStore.isSleeping && petStore.lifeStage !== 'egg') {
      petGroup.position.y = Math.sin(time * 1) * 0.05 // Gentle breathing
      petGroup.rotation.y = Math.sin(time * 0.3) * 0.05 // Slight sway

      // Spawn ZZZ particles periodically
      if (Math.random() < 0.02 && zzzParticles.length < 3) {
        const { zzz, positions, baseY } = createZZZParticles()
        zzz.position.set(1, 2, 0)
        scene.add(zzz)
        zzzParticles.push({ zzz, positions, baseY: 2, startTime: time })
      }
    }
    // Hatching animation
    else if (petStore.isHatching) {
      petGroup.rotation.y += 0.2
      petGroup.scale.x = 1 + Math.sin(time * 10) * 0.1
      petGroup.scale.z = 1 + Math.sin(time * 10) * 0.1
    }
    // Egg wobble
    else if (petStore.lifeStage === 'egg') {
      petGroup.rotation.z = Math.sin(time * 2) * 0.05
    }
    // Idle animation
    else if (petStore.currentAction === 'idle') {
      petGroup.position.y = Math.sin(time * 2) * 0.1
      petGroup.rotation.y = Math.sin(time * 0.5) * 0.1
    }
    // Eating animation
    else if (petStore.currentAction === 'eating') {
      petGroup.position.y = Math.abs(Math.sin(time * 8)) * 0.3
      petGroup.rotation.z = Math.sin(time * 8) * 0.1
    }
    // Playing animation
    else if (petStore.currentAction === 'playing') {
      petGroup.position.y = Math.abs(Math.sin(time * 6)) * 0.8
      petGroup.rotation.y += 0.1
    }

    // Mood-based animations
    if ((petStore.mood === 'sick' || petStore.mood === 'hungry') && petStore.lifeStage !== 'egg' && !petStore.isSleeping) {
      petGroup.rotation.z = Math.sin(time * 3) * 0.1
    }

    if (!petStore.isAlive && petStore.lifeStage !== 'egg') {
      petGroup.rotation.x = Math.PI / 2
      petGroup.position.y = -1
    }
  }

  // Animate evolution particles
  particles = particles.filter(p => {
    const elapsed = time - p.startTime
    if (elapsed > 2) {
      scene.remove(p.points)
      return false
    }

    for (let i = 0; i < p.positions.length / 3; i++) {
      const i3 = i * 3
      p.positions[i3] = Math.cos(elapsed * 3 + i) * (elapsed * 2)
      p.positions[i3 + 1] = Math.sin(elapsed * 3 + i) * (elapsed * 2) + 2
      p.positions[i3 + 2] = Math.sin(elapsed * 2 + i) * (elapsed * 2)
    }
    p.points.geometry.attributes.position.needsUpdate = true
    ;(p.points.material as THREE.PointsMaterial).opacity = 1 - (elapsed / 2)

    return true
  })

  // Animate ZZZ particles
  zzzParticles = zzzParticles.filter(z => {
    const elapsed = time - z.startTime
    if (elapsed > 3) {
      scene.remove(z.zzz)
      return false
    }

    // Float upward and fade
    for (let i = 0; i < z.positions.length / 3; i++) {
      const i3 = i * 3
      z.positions[i3] = Math.sin(elapsed + i) * 0.5 + 1 // x drift
      z.positions[i3 + 1] = z.baseY + elapsed * 0.5 + i * 0.3 // y up
      z.positions[i3 + 2] = 0 // z
    }
    z.zzz.geometry.attributes.position.needsUpdate = true
    ;(z.zzz.material as THREE.PointsMaterial).opacity = 1 - (elapsed / 3)

    return true
  })

  renderer.render(scene, camera)
}

onMounted(() => {
  init()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(animationId)
})
</script>

<style scoped>
.pet-scene {
  width: 100%;
  height: 280px;
  border-radius: 16px;
  overflow: hidden;
}
</style>
