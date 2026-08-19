import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Icon } from './Icon'

type RoadView3DProps = { onClose: () => void }
type GateSide = 'north' | 'south' | 'east' | 'west'
type StationGate = { x: number; z: number; side: GateSide }
type RoadViewBooth = { id: number; gateCode: string; label: string; title: string; description: string; color: string; x: number; z: number; gate: StationGate; trainCar?: boolean }
type StationFacility = Omit<RoadViewBooth, 'id' | 'description'>
type Player = { x: number; z: number; yaw: number; pitch: number }
type Movement = { forward: boolean; backward: boolean; left: boolean; right: boolean; turnLeft: boolean; turnRight: boolean; sprint: boolean }
type Collider = { x1: number; x2: number; z1: number; z2: number }

const BOOTH_WIDTH = 8.4
const BOOTH_DEPTH = 5.4
const EMPTY_MOVEMENT: Movement = { forward: false, backward: false, left: false, right: false, turnLeft: false, turnRight: false, sprint: false }

const BOOTHS: readonly RoadViewBooth[] = [
  { id: 1, gateCode: 'B01', label: 'BOOTH 01 · 1번 승강장', title: '빙하 위 펭귄 구조', description: '1번 승강장에서 녹는 빙하를 건너 펭귄이 안전한 곳에 도착하도록 도와주세요.', color: '#45aee8', x: -18, z: -5, gate: { x: -15.3, z: -5, side: 'east' } },
  { id: 2, gateCode: 'L01', label: 'EXHIBITION TRAIN · 1호차', title: '냉동공조 실험실', description: '전시 열차 1호차에서 압축·응축·팽창·증발 장치를 직접 살펴보세요.', color: '#73b62f', x: -9.4, z: -15, gate: { x: -9.4, z: -12, side: 'south' }, trainCar: true },
  { id: 3, gateCode: 'B02', label: 'BOOTH 02 · 2번 승강장', title: '무더운 여름', description: '2번 승강장에서 상황에 맞는 냉방 방법을 선택하고 에너지를 절약해 보세요.', color: '#35b981', x: 18, z: -5, gate: { x: 15.3, z: -5, side: 'west' } },
  { id: 4, gateCode: 'B03', label: 'BOOTH 03 · 3번 승강장', title: '동물들을 구하라', description: '3번 승강장에서 생활 속 친환경 선택으로 기후 위기의 동물들을 지켜주세요.', color: '#ae7cff', x: -18, z: 5, gate: { x: -15.3, z: 5, side: 'east' } },
  { id: 5, gateCode: 'E01', label: 'EXHIBITION TRAIN · 2호차', title: '초고속 냉동사이클', description: '전시 열차 2호차에서 KTX 초고속 환경의 냉방을 유지하는 냉동공조 기술을 배워보세요.', color: '#e69a35', x: 0, z: -15, gate: { x: 0, z: -12, side: 'south' }, trainCar: true },
  { id: 6, gateCode: 'B04', label: 'BOOTH 04 · 4번 승강장', title: '나비효과', description: '4번 승강장에서 작은 생활 습관이 지구의 미래를 어떻게 바꾸는지 확인해 보세요.', color: '#82e76d', x: 18, z: 5, gate: { x: 15.3, z: 5, side: 'west' } },
  { id: 7, gateCode: 'R01', label: 'EXHIBITION TRAIN · 3호차', title: '굿즈샵', description: '전시 열차 3호차에서 체험으로 모은 포인트로 에코 익스프레스 굿즈를 만나보세요.', color: '#e45575', x: 9.4, z: -15, gate: { x: 9.4, z: -12, side: 'south' }, trainCar: true },
] as const

const FACILITIES: readonly StationFacility[] = [
  { gateCode: 'F01', label: 'FACILITY 01', title: '화장실', color: '#e0bd35', x: -18, z: 15, gate: { x: -15.3, z: 15, side: 'east' } },
  { gateCode: 'F02', label: 'FACILITY 02', title: '안내센터', color: '#4b9fd3', x: 18, z: 15, gate: { x: 15.3, z: 15, side: 'west' } },
] as const
const ZONES: readonly (RoadViewBooth | StationFacility)[] = [...BOOTHS, ...FACILITIES]

function zoneSize(zone: RoadViewBooth | StationFacility) {
  if (zone.trainCar) return { width: 9.2, depth: 5.6 }
  if (zone.gate.side === 'east' || zone.gate.side === 'west') return { width: BOOTH_DEPTH, depth: BOOTH_WIDTH }
  return { width: BOOTH_WIDTH, depth: BOOTH_DEPTH }
}

const COLLIDERS: readonly Collider[] = ZONES.flatMap((zone) => {
  const size = zoneSize(zone)
  const halfWidth = size.width / 2
  const halfDepth = size.depth / 2
  if (zone.gate.side === 'east' || zone.gate.side === 'west') {
    const backX = zone.gate.side === 'east' ? zone.x - halfWidth : zone.x + halfWidth
    return [
      { x1: zone.x - halfWidth, x2: zone.x + halfWidth, z1: zone.z - halfDepth - 0.18, z2: zone.z - halfDepth + 0.28 },
      { x1: zone.x - halfWidth, x2: zone.x + halfWidth, z1: zone.z + halfDepth - 0.28, z2: zone.z + halfDepth + 0.18 },
      { x1: backX - 0.22, x2: backX + 0.22, z1: zone.z - halfDepth, z2: zone.z + halfDepth },
      { x1: zone.gate.x - 0.2, x2: zone.gate.x + 0.2, z1: zone.z - halfDepth, z2: zone.z - 1.42 },
      { x1: zone.gate.x - 0.2, x2: zone.gate.x + 0.2, z1: zone.z + 1.42, z2: zone.z + halfDepth },
    ]
  }
  const backZ = zone.gate.side === 'south' ? zone.z - halfDepth : zone.z + halfDepth
  return [
    { x1: zone.x - halfWidth - 0.18, x2: zone.x - halfWidth + 0.28, z1: zone.z - halfDepth, z2: zone.z + halfDepth },
    { x1: zone.x + halfWidth - 0.28, x2: zone.x + halfWidth + 0.18, z1: zone.z - halfDepth, z2: zone.z + halfDepth },
    { x1: zone.x - halfWidth, x2: zone.x + halfWidth, z1: backZ - 0.22, z2: backZ + 0.22 },
    { x1: zone.x - halfWidth, x2: zone.x - 1.42, z1: zone.gate.z - 0.2, z2: zone.gate.z + 0.2 },
    { x1: zone.x + 1.42, x2: zone.x + halfWidth, z1: zone.gate.z - 0.2, z2: zone.gate.z + 0.2 },
  ]
})

function isWalkable(x: number, z: number) {
  const radius = 0.32
  if (x < -21.8 || x > 21.8 || z < -21.8 || z > 21.8) return false
  return !COLLIDERS.some((wall) => x + radius > wall.x1 && x - radius < wall.x2 && z + radius > wall.z1 && z - radius < wall.z2)
}

function nearestGate(player: Player) {
  let result: RoadViewBooth | null = null
  let nearestDistance = 10
  for (const booth of BOOTHS) {
    const dx = booth.gate.x - player.x
    const dz = booth.gate.z - player.z
    const distance = Math.hypot(dx, dz)
    const lookingTowardGate = (dx / distance) * -Math.sin(player.yaw) + (dz / distance) * -Math.cos(player.yaw)
    if (lookingTowardGate < 0.58) continue
    if (distance < nearestDistance) { result = booth; nearestDistance = distance }
  }
  return result
}

function crossedGate(player: Player) {
  return BOOTHS.find((booth) => {
    if (booth.gate.side === 'east' || booth.gate.side === 'west') {
      if (Math.abs(player.z - booth.gate.z) > 1.08) return false
      if (booth.gate.side === 'east') return player.x < booth.gate.x - 0.24 && player.x > booth.gate.x - 1.6
      return player.x > booth.gate.x + 0.24 && player.x < booth.gate.x + 1.6
    }
    if (Math.abs(player.x - booth.gate.x) > 1.08) return false
    if (booth.gate.side === 'south') return player.z < booth.gate.z - 0.24 && player.z > booth.gate.z - 1.6
    return player.z > booth.gate.z + 0.24 && player.z < booth.gate.z + 1.6
  }) ?? null
}

function makeLabelTexture(title: string, subtitle: string, accent: string, footer = 'PASS THROUGH THE SMART GATE') {
  const canvas = document.createElement('canvas')
  canvas.width = 1024; canvas.height = 360
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)
  const gradient = context.createLinearGradient(0, 0, 1024, 360)
  gradient.addColorStop(0, 'rgba(3,18,34,.96)'); gradient.addColorStop(1, 'rgba(10,37,55,.9)')
  context.fillStyle = gradient; context.beginPath(); context.roundRect(16, 16, 992, 328, 54); context.fill()
  context.strokeStyle = accent; context.lineWidth = 10; context.stroke()
  context.fillStyle = accent; context.font = '800 52px system-ui, sans-serif'; context.textAlign = 'center'; context.fillText(subtitle, 512, 122)
  context.fillStyle = '#fff'; context.font = '900 74px system-ui, sans-serif'; context.fillText(title, 512, 225, 870)
  context.fillStyle = 'rgba(255,255,255,.58)'; context.font = '700 30px system-ui, sans-serif'; context.fillText(footer, 512, 292)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4
  return texture
}

function addRoundedBox(parent: THREE.Object3D, size: [number, number, number], position: [number, number, number], material: THREE.Material, radius = 0.12) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius), material)
  mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh)
  return mesh
}

function createGate(zone: RoadViewBooth | StationFacility) {
  const group = new THREE.Group()
  group.position.set(zone.gate.x, 0, zone.gate.z)
  if (zone.gate.side === 'east' || zone.gate.side === 'west') group.rotation.y = Math.PI / 2
  const accent = new THREE.Color(zone.color)
  const darkMaterial = new THREE.MeshStandardMaterial({ color: '#d7e1e7', metalness: 0.72, roughness: 0.2 })
  const glowMaterial = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.72, metalness: 0.35, roughness: 0.25 })
  const glassMaterial = new THREE.MeshPhysicalMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.35, transparent: true, opacity: 0.45, roughness: 0.08, metalness: 0.15, side: THREE.DoubleSide })
  for (const x of [-1.35, 1.35]) {
    addRoundedBox(group, [0.46, 1.45, 0.62], [x, 0.72, 0], darkMaterial, 0.16)
    addRoundedBox(group, [0.33, 0.12, 0.46], [x, 1.37, 0], glowMaterial, 0.06)
    const scanner = new THREE.Mesh(new THREE.CircleGeometry(0.09, 24), new THREE.MeshBasicMaterial({ color: '#dffff8' }))
    scanner.rotation.x = -Math.PI / 2; scanner.position.set(x, 1.45, 0); group.add(scanner)
  }
  const leftWing = new THREE.Mesh(new RoundedBoxGeometry(0.82, 0.72, 0.05, 3, 0.06), glassMaterial)
  leftWing.position.set(-0.66, 0.8, 0)
  const rightWing = leftWing.clone(); rightWing.position.x = 0.66
  group.add(leftWing, rightWing); group.userData.wings = [leftWing, rightWing]
  addRoundedBox(group, [3.65, 0.2, 0.24], [0, 2.55, 0], glowMaterial, 0.08)
  const gateLabel = zone.trainCar ? `${zone.gateCode} · TRAIN DOOR` : `${zone.gateCode} · SMART GATE`
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeLabelTexture(zone.title, gateLabel, zone.color, zone.trainCar ? 'BOARD THROUGH THE TRAIN DOOR' : undefined), transparent: true, depthWrite: false }))
  sign.scale.set(zone.trainCar ? 2.75 : 3.9, zone.trainCar ? 0.97 : 1.37, 1); sign.position.set(0, 3.35, 0); group.add(sign)
  const gateLight = new THREE.PointLight(accent, 3.2, 8, 2)
  gateLight.position.set(0, 2.25, zone.gate.side === 'south' ? 0.6 : -0.6); group.add(gateLight); group.userData.light = gateLight
  return group
}

function createTrainCarBooth(zone: RoadViewBooth | StationFacility) {
  const group = new THREE.Group(); group.position.set(zone.x, 0, zone.z)
  group.rotation.y = -Math.PI / 2
  const accent = new THREE.Color(zone.color)
  const white = new THREE.MeshPhysicalMaterial({ color: '#f9fcfd', metalness: 0.22, roughness: 0.24, clearcoat: 0.8, clearcoatRoughness: 0.18 })
  const silver = new THREE.MeshStandardMaterial({ color: '#b8c7d0', metalness: 0.8, roughness: 0.2 })
  const blue = new THREE.MeshStandardMaterial({ color: '#146da6', emissive: '#0d5d91', emissiveIntensity: 0.18, metalness: 0.55, roughness: 0.24 })
  const windowMaterial = new THREE.MeshPhysicalMaterial({ color: '#9dd8ee', transparent: true, opacity: 0.58, roughness: 0.08, metalness: 0.22, side: THREE.DoubleSide })
  const accentMaterial = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.42, metalness: 0.2, roughness: 0.34 })
  const seatMaterial = new THREE.MeshStandardMaterial({ color: '#244f70', metalness: 0.15, roughness: 0.55 })
  const halfWidth = 2.8; const halfDepth = 4.6

  addRoundedBox(group, [5.8, 0.3, 9.4], [0, 0.16, 0], silver, 0.14)
  addRoundedBox(group, [5.8, 0.34, 9.4], [0, 4.28, 0], white, 0.18)
  addRoundedBox(group, [0.24, 4.05, 9.2], [-halfWidth, 2.18, 0], white, 0.1)
  addRoundedBox(group, [5.6, 4.05, 0.26], [0, 2.18, -halfDepth], white, 0.1)
  addRoundedBox(group, [5.6, 4.05, 0.26], [0, 2.18, halfDepth], white, 0.1)
  const sideSectionDepth = (9.2 - 2.6) / 2
  const sideOffset = (9.2 + 2.6) / 4
  addRoundedBox(group, [0.24, 4.05, sideSectionDepth], [halfWidth, 2.18, -sideOffset], white, 0.1)
  addRoundedBox(group, [0.24, 4.05, sideSectionDepth], [halfWidth, 2.18, sideOffset], white, 0.1)
  addRoundedBox(group, [0.24, 0.82, 2.6], [halfWidth, 3.78, 0], white, 0.08)

  for (const sideX of [-halfWidth - 0.13, halfWidth + 0.13]) {
    addRoundedBox(group, [0.06, 0.25, 9], [sideX, 0.95, 0], blue, 0.02)
  }
  for (const z of [-3.45, -2.25, 2.25, 3.45]) {
    addRoundedBox(group, [0.06, 1.0, 0.86], [-halfWidth - 0.13, 2.55, z], windowMaterial, 0.08)
    addRoundedBox(group, [0.06, 1.0, 0.86], [halfWidth + 0.13, 2.55, z], windowMaterial, 0.08)
  }
  for (const z of [-2.9, -1.45, 1.45, 2.9]) {
    addRoundedBox(group, [1.15, 0.48, 0.72], [-1.38, 0.62, z], seatMaterial, 0.14)
    addRoundedBox(group, [1.15, 0.48, 0.72], [1.05, 0.62, z], seatMaterial, 0.14)
  }
  addRoundedBox(group, [0.1, 0.12, 7.8], [0, 0.36, 0], accentMaterial, 0.03)
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(2.35, 0.82),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture(zone.gateCode, 'EXHIBITION CAR', zone.color, 'WELCOME ABOARD'), transparent: true, side: THREE.DoubleSide }),
  )
  display.rotation.y = Math.PI / 2
  display.position.set(-halfWidth + 0.14, 3.1, 0)
  group.add(display)
  return group
}

function createBooth(zone: RoadViewBooth | StationFacility) {
  if (zone.trainCar) return createTrainCarBooth(zone)
  const group = new THREE.Group(); group.position.set(zone.x, 0, zone.z)
  if (zone.gate.side === 'east') group.rotation.y = Math.PI / 2
  else if (zone.gate.side === 'west') group.rotation.y = -Math.PI / 2
  else if (zone.gate.side === 'north') group.rotation.y = Math.PI
  const accent = new THREE.Color(zone.color)
  const shell = new THREE.MeshPhysicalMaterial({ color: '#f8fbfc', metalness: 0.24, roughness: 0.25, clearcoat: 0.72, clearcoatRoughness: 0.2 })
  const panel = new THREE.MeshStandardMaterial({ color: accent.clone().lerp(new THREE.Color('#ffffff'), 0.7), emissive: accent, emissiveIntensity: 0.12, metalness: 0.16, roughness: 0.4 })
  const glow = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.62, metalness: 0.22, roughness: 0.3 })
  const halfWidth = BOOTH_WIDTH / 2; const halfDepth = BOOTH_DEPTH / 2
  const backLocalZ = -halfDepth
  addRoundedBox(group, [BOOTH_WIDTH + 0.3, 0.32, BOOTH_DEPTH + 0.3], [0, 0.12, 0], shell, 0.14)
  addRoundedBox(group, [BOOTH_WIDTH, 4.9, 0.3], [0, 2.52, backLocalZ], panel, 0.1)
  addRoundedBox(group, [0.3, 4.9, BOOTH_DEPTH], [-halfWidth, 2.52, 0], shell, 0.1)
  addRoundedBox(group, [0.3, 4.9, BOOTH_DEPTH], [halfWidth, 2.52, 0], shell, 0.1)
  addRoundedBox(group, [BOOTH_WIDTH + 0.2, 0.3, BOOTH_DEPTH + 0.2], [0, 5.02, 0], shell, 0.12)
  for (const x of [-3.2, -1.6, 0, 1.6, 3.2]) addRoundedBox(group, [0.08, 0.1, BOOTH_DEPTH - 0.5], [x, 4.84, 0], glow, 0.025)
  addRoundedBox(group, [BOOTH_WIDTH - 0.7, 0.08, 1.25], [0, 0.34, backLocalZ * 0.58], glow, 0.03)
  const portal = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.055, 12, 72), new THREE.MeshBasicMaterial({ color: accent }))
  portal.position.set(0, 2.45, backLocalZ * 0.78); portal.userData.spin = 1; group.add(portal)
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 1), new THREE.MeshStandardMaterial({ color: '#dffffa', emissive: accent, emissiveIntensity: 1.25, metalness: 0.65, roughness: 0.18 }))
  core.position.copy(portal.position); core.userData.float = true; core.userData.baseY = core.position.y; group.add(core)
  const name = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeLabelTexture(zone.title, zone.label, zone.color), transparent: true, depthWrite: false }))
  name.scale.set(4.4, 1.55, 1); name.position.set(0, 3.4, backLocalZ * 0.91); group.add(name)
  return group
}

function buildMetaverseStation(scene: THREE.Scene) {
  const animated: THREE.Object3D[] = []
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 48), new THREE.MeshPhysicalMaterial({ color: '#e5ecef', metalness: 0.12, roughness: 0.3, clearcoat: 0.78, clearcoatRoughness: 0.22 }))
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor)
  const grid = new THREE.GridHelper(46, 46, '#7ea6b9', '#c1d0d8')
  grid.material.transparent = true; grid.material.opacity = 0.32; grid.position.y = 0.015; scene.add(grid)
  const blueLine = new THREE.MeshStandardMaterial({ color: '#1676ad', emissive: '#1676ad', emissiveIntensity: 0.24, metalness: 0.4, roughness: 0.25 })
  const greenLine = new THREE.MeshStandardMaterial({ color: '#3ca87b', emissive: '#3ca87b', emissiveIntensity: 0.2, metalness: 0.32, roughness: 0.28 })
  for (const x of [-7.1, 7.1]) addRoundedBox(scene, [0.08, 0.035, 46], [x, 0.045, 0], x < 0 ? blueLine : greenLine, 0.02)
  const structure = new THREE.MeshStandardMaterial({ color: '#f4f7f8', metalness: 0.58, roughness: 0.24 })
  const glass = new THREE.MeshPhysicalMaterial({ color: '#bde1ec', transparent: true, opacity: 0.28, roughness: 0.06, metalness: 0.08, side: THREE.DoubleSide })
  for (const x of [-21, 21]) for (let z = -21; z <= 21; z += 7) addRoundedBox(scene, [0.38, 8.8, 0.48], [x, 4.4, z], structure, 0.1)
  for (let z = -21; z <= 21; z += 7) {
    addRoundedBox(scene, [44, 0.3, 0.38], [0, 8.7, z], structure, 0.1)
    const roofPanel = new THREE.Mesh(new THREE.PlaneGeometry(43.5, 6.5), glass)
    roofPanel.rotation.x = Math.PI / 2; roofPanel.position.set(0, 8.52, z + 3.35); scene.add(roofPanel)
  }
  for (const zone of ZONES) { scene.add(createBooth(zone)); const gate = createGate(zone); scene.add(gate); animated.push(gate) }
  const rail = new THREE.MeshStandardMaterial({ color: '#8da1ad', metalness: 0.9, roughness: 0.18 })
  addRoundedBox(scene, [40, 0.1, 0.14], [0, 0.11, -17.3], rail, 0.03)
  addRoundedBox(scene, [40, 0.1, 0.14], [0, 0.11, -12.7], rail, 0.03)
  for (const x of [-4.7, 4.7]) addRoundedBox(scene, [1.7, 3.4, 5.1], [x, 2.15, -15], structure, 0.34)
  const positions = new Float32Array(130 * 3)
  for (let index = 0; index < 130; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * 43; positions[index * 3 + 1] = 1.1 + Math.random() * 7; positions[index * 3 + 2] = (Math.random() - 0.5) * 45
  }
  const particleGeometry = new THREE.BufferGeometry(); particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: '#6d9aad', size: 0.028, transparent: true, opacity: 0.28, sizeAttenuation: true }))
  scene.add(particles); animated.push(particles)
  return animated
}

function drawMap(canvas: HTMLCanvasElement, player: Player) {
  const context = canvas.getContext('2d'); if (!context) return
  const ratio = Math.min(window.devicePixelRatio || 1, 2); const size = Math.min(canvas.clientWidth, canvas.clientHeight)
  canvas.width = Math.round(size * ratio); canvas.height = Math.round(size * ratio); context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, size, size); context.fillStyle = '#f8faf9'; context.fillRect(0, 0, size, size)
  const padding = size * 0.075; const mapSize = size - padding * 2; const worldToMap = (value: number) => padding + ((value + 23) / 46) * mapSize
  context.strokeStyle = 'rgba(42,76,92,.12)'; context.lineWidth = 1
  for (let index = 0; index <= 12; index += 1) {
    const point = padding + mapSize * index / 12
    context.beginPath(); context.moveTo(point, padding); context.lineTo(point, size - padding); context.stroke()
    context.beginPath(); context.moveTo(padding, point); context.lineTo(size - padding, point); context.stroke()
  }
  const trainX = worldToMap(-14.1); const trainY = worldToMap(-18.15)
  const trainWidth = worldToMap(14.1) - trainX; const trainHeight = worldToMap(-11.85) - trainY
  context.fillStyle = '#fdfefe'; context.strokeStyle = '#6c8796'; context.lineWidth = 1.5
  context.beginPath(); context.roundRect(trainX, trainY, trainWidth, trainHeight, trainHeight * 0.34); context.fill(); context.stroke()
  context.fillStyle = '#1874aa'; context.fillRect(trainX + 5, trainY + trainHeight * 0.72, trainWidth - 10, trainHeight * 0.12)
  context.fillStyle = '#335469'; context.font = `900 ${Math.max(5, size * 0.014)}px system-ui, sans-serif`; context.textAlign = 'center'; context.fillText('ECO EXPRESS EXHIBITION TRAIN', trainX + trainWidth / 2, trainY + trainHeight * 0.18)
  for (const zone of ZONES) {
    const zoneDimensions = zoneSize(zone)
    const x = worldToMap(zone.x - zoneDimensions.width / 2); const y = worldToMap(zone.z - zoneDimensions.depth / 2)
    const width = worldToMap(zone.x + zoneDimensions.width / 2) - x; const height = worldToMap(zone.z + zoneDimensions.depth / 2) - y
    context.fillStyle = zone.trainCar ? '#ffffff' : zone.color; context.globalAlpha = zone.trainCar ? 0.95 : 0.72
    context.beginPath(); context.roundRect(x, y, width, height, Math.max(5, size * 0.014)); context.fill(); context.globalAlpha = 1
    context.strokeStyle = zone.color; context.lineWidth = zone.trainCar ? 2 : 1; context.stroke()
    context.fillStyle = '#0c2737'; context.textAlign = 'center'; context.font = `900 ${Math.max(7, size * 0.019)}px system-ui, sans-serif`; context.fillText(zone.gateCode, x + width / 2, y + height * 0.44)
    context.font = `800 ${Math.max(5, size * 0.014)}px system-ui, sans-serif`; context.fillText(zone.title, x + width / 2, y + height * 0.7, width * 0.88)
    context.fillStyle = '#143e57'
    if (zone.gate.side === 'east' || zone.gate.side === 'west') context.fillRect(worldToMap(zone.gate.x) - 2, worldToMap(zone.gate.z) - height * 0.11, 4, height * 0.22)
    else context.fillRect(worldToMap(zone.gate.x) - width * 0.14, worldToMap(zone.gate.z) - 2, width * 0.28, 4)
  }
  const x = worldToMap(player.x); const y = worldToMap(player.z)
  context.fillStyle = '#fff'; context.shadowColor = '#17c9ff'; context.shadowBlur = 10; context.beginPath(); context.arc(x, y, Math.max(4, size * 0.012), 0, Math.PI * 2); context.fill()
  context.strokeStyle = '#fff'; context.lineWidth = 2; context.beginPath(); context.moveTo(x, y); context.lineTo(x - Math.sin(player.yaw) * size * 0.035, y - Math.cos(player.yaw) * size * 0.035); context.stroke(); context.shadowBlur = 0
}

export default function RoadView3D({ onClose }: RoadView3DProps) {
  const sceneRef = useRef<HTMLCanvasElement>(null); const mapRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<Player>({ x: 0, z: -7.5, yaw: 0, pitch: -0.03 }); const movementRef = useRef<Movement>({ ...EMPTY_MOVEMENT })
  const overlayRef = useRef({ mapOpen: false, selectedBooth: null as RoadViewBooth | null }); const lastGateRef = useRef<number | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [selectedBooth, setSelectedBooth] = useState<RoadViewBooth | null>(null); const [nearGate, setNearGate] = useState<RoadViewBooth | null>(null); const [renderError, setRenderError] = useState(false)
  overlayRef.current = { mapOpen, selectedBooth }

  useEffect(() => { const previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = previousOverflow } }, [])

  useEffect(() => {
    const canvas = sceneRef.current; if (!canvas) return
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }) } catch { setRenderError(true); return }
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.22
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#e8f1f4'); scene.fog = new THREE.Fog('#e8f1f4', 30, 72)
    const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 120); camera.rotation.order = 'YXZ'
    scene.add(new THREE.HemisphereLight('#ffffff', '#b8cad2', 2.25))
    const sun = new THREE.DirectionalLight('#ffffff', 3.1); sun.position.set(-12, 18, 10); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -26; sun.shadow.camera.right = 26; sun.shadow.camera.top = 26; sun.shadow.camera.bottom = -26; scene.add(sun)
    for (const [x, z, color] of [[-18, -8, '#dff5ff'], [18, -8, '#dff5ff'], [-18, 8, '#eef8ff'], [18, 8, '#eef8ff']] as const) {
      const light = new THREE.PointLight(color, 3.2, 22, 2); light.position.set(x, 4.8, z); scene.add(light)
    }
    const animated = buildMetaverseStation(scene); const clock = new THREE.Clock(); const jump = { height: 0, velocity: 0 }
    let animationFrame = 0; let previousNearGateId: number | null = null; let dragging = false; let pointerX = 0; let pointerY = 0
    const resize = () => {
      const width = canvas.clientWidth; const height = canvas.clientHeight
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 720 ? 1.4 : 1.8)); renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix()
    }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas); resize()
    const stopMovement = () => { movementRef.current = { ...EMPTY_MOVEMENT } }
    const handleKey = (event: KeyboardEvent, pressed: boolean) => {
      const key = event.key.toLowerCase(); const overlay = overlayRef.current
      if (pressed && key === 'escape') {
        event.preventDefault(); if (overlay.selectedBooth) setSelectedBooth(null); else if (overlay.mapOpen) setMapOpen(false); else onClose(); return
      }
      if (pressed && key === 'm') { event.preventDefault(); setMapOpen((current) => !current); return }
      if (pressed && key === ' ' && !event.repeat && !overlay.mapOpen && !overlay.selectedBooth && jump.height === 0) {
        event.preventDefault(); jump.velocity = 6.2; return
      }
      const keyMap: Record<string, keyof Movement> = { w: 'forward', arrowup: 'forward', s: 'backward', arrowdown: 'backward', a: 'left', d: 'right', arrowleft: 'turnLeft', arrowright: 'turnRight', shift: 'sprint' }
      const movementKey = keyMap[key]; if (movementKey) { event.preventDefault(); movementRef.current[movementKey] = pressed }
    }
    const handleKeyDown = (event: KeyboardEvent) => handleKey(event, true); const handleKeyUp = (event: KeyboardEvent) => handleKey(event, false)
    const handlePointerDown = (event: PointerEvent) => { if (event.pointerType === 'mouse' && event.button !== 0) return; dragging = true; pointerX = event.clientX; pointerY = event.clientY; canvas.setPointerCapture(event.pointerId) }
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging || overlayRef.current.mapOpen || overlayRef.current.selectedBooth) return
      const player = playerRef.current; player.yaw -= (event.clientX - pointerX) * 0.0042; player.pitch = THREE.MathUtils.clamp(player.pitch - (event.clientY - pointerY) * 0.0028, -0.42, 0.42)
      pointerX = event.clientX; pointerY = event.clientY
    }
    const handlePointerUp = (event: PointerEvent) => { dragging = false; if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId) }
    const frame = () => {
      const delta = Math.min(clock.getDelta(), 0.04); const elapsed = clock.elapsedTime; const player = playerRef.current; const movement = movementRef.current
      if (!overlayRef.current.mapOpen && !overlayRef.current.selectedBooth) {
        player.yaw += (Number(movement.turnLeft) - Number(movement.turnRight)) * delta * 1.9
        const forward = Number(movement.forward) - Number(movement.backward); const side = Number(movement.right) - Number(movement.left); const magnitude = Math.hypot(forward, side) || 1; const speed = (movement.sprint ? 8.6 : 5.15) * delta
        const moveX = (-Math.sin(player.yaw) * forward + Math.cos(player.yaw) * side) / magnitude * speed; const moveZ = (-Math.cos(player.yaw) * forward - Math.sin(player.yaw) * side) / magnitude * speed
        if (isWalkable(player.x + moveX, player.z)) player.x += moveX; if (isWalkable(player.x, player.z + moveZ)) player.z += moveZ
      }
      if (jump.height > 0 || jump.velocity > 0) {
        jump.velocity -= 15.5 * delta; jump.height += jump.velocity * delta
        if (jump.height < 0) { jump.height = 0; jump.velocity = 0 }
      }
      const walking = movement.forward || movement.backward || movement.left || movement.right
      const bob = walking && jump.height === 0 ? Math.sin(elapsed * (movement.sprint ? 13 : 8)) * (movement.sprint ? 0.035 : 0.018) : 0
      camera.position.set(player.x, 1.68 + jump.height + bob, player.z); camera.rotation.set(player.pitch, player.yaw, 0)
      for (const object of animated) {
        if (object.type === 'Points') object.rotation.y = elapsed * 0.012
        if (object.children.some((child) => child.userData.ring)) { object.rotation.y = elapsed * 0.25; object.children.forEach((child, index) => { child.rotation.z = elapsed * (0.2 + index * 0.12) }) }
        const wings = object.userData.wings as THREE.Mesh[] | undefined
        if (wings) {
          const open = Math.hypot(object.position.x - player.x, object.position.z - player.z) < 2.25
          wings[0].rotation.y = THREE.MathUtils.lerp(wings[0].rotation.y, open ? -1.15 : 0, 0.1); wings[1].rotation.y = THREE.MathUtils.lerp(wings[1].rotation.y, open ? 1.15 : 0, 0.1)
          const light = object.userData.light as THREE.PointLight; light.intensity = 2.7 + Math.sin(elapsed * 3.2) * 0.5
        }
      }
      scene.traverse((object) => {
        if (object.userData.spin) object.rotation.z += delta * 0.28 * object.userData.spin
        if (object.userData.float) object.position.y = object.userData.baseY + Math.sin(elapsed * 1.7 + object.position.x) * 0.12
      })
      const gate = nearestGate(player); const nearGateId = gate?.id ?? null
      if (nearGateId !== previousNearGateId) { previousNearGateId = nearGateId; setNearGate(gate) }
      if (!overlayRef.current.mapOpen && !overlayRef.current.selectedBooth) {
        const passedBooth = crossedGate(player)
        if (!passedBooth) lastGateRef.current = null
        else if (lastGateRef.current !== passedBooth.id) { lastGateRef.current = passedBooth.id; stopMovement(); setSelectedBooth(passedBooth) }
      }
      if (overlayRef.current.mapOpen && mapRef.current) drawMap(mapRef.current, player)
      renderer.render(scene, camera); animationFrame = requestAnimationFrame(frame)
    }
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp); window.addEventListener('blur', stopMovement)
    canvas.addEventListener('pointerdown', handlePointerDown); canvas.addEventListener('pointermove', handlePointerMove); canvas.addEventListener('pointerup', handlePointerUp); canvas.addEventListener('pointercancel', handlePointerUp)
    animationFrame = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(animationFrame); resizeObserver.disconnect(); window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); window.removeEventListener('blur', stopMovement)
      canvas.removeEventListener('pointerdown', handlePointerDown); canvas.removeEventListener('pointermove', handlePointerMove); canvas.removeEventListener('pointerup', handlePointerUp); canvas.removeEventListener('pointercancel', handlePointerUp)
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Sprite) {
          object.geometry?.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => { if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose(); material.dispose() })
        }
      }); renderer.dispose()
    }
  }, [onClose])

  const setMovement = (key: keyof Movement, pressed: boolean) => { movementRef.current[key] = pressed }
  return (
    <section className="roadview" role="dialog" aria-modal="true" aria-label="에코 익스프레스 메타버스 3D 역사">
      <canvas ref={sceneRef} className="roadview__scene" aria-label="개찰구를 통과해 안내를 확인하는 에코 익스프레스 메타버스 역사" />
      {renderError ? <div className="roadview__render-error"><strong>3D 공간을 불러오지 못했습니다.</strong><span>브라우저의 그래픽 가속을 켜고 다시 시도해 주세요.</span></div> : null}
      <header className="roadview__topbar">
        <div className="roadview__brand"><button type="button" className="roadview__brand-mark" onClick={() => setMapOpen(true)} aria-label="역사 지도 열기"><Icon name="map" /></button></div>
        <div className="roadview__top-actions"><button type="button" className="roadview__close" onClick={onClose} aria-label="3D 로드뷰 닫기">×</button></div>
      </header>
      {nearGate && !mapOpen && !selectedBooth ? <div className="roadview__gate-notice" role="status"><span><Icon name="train" /></span><p><strong>{nearGate.label}</strong><small>{nearGate.gateCode} {nearGate.trainCar ? '객차 출입문' : '스마트 개찰구'}을 통과하면 안내가 자동으로 열립니다.</small></p></div> : null}
      <div className="roadview__desktop-help" aria-hidden="true"><span><kbd>W A S D</kbd> 이동</span><span><kbd>SHIFT</kbd> 달리기</span><span><kbd>SPACE</kbd> 점프</span><span><kbd>드래그</kbd> 시점</span><span><kbd>M</kbd> 지도</span></div>
      <div className="roadview__mobile-controls" aria-label="3D 로드뷰 이동 조작">
        <div className="roadview__dpad">
          <button type="button" aria-label="앞으로 이동" onPointerDown={() => setMovement('forward', true)} onPointerUp={() => setMovement('forward', false)} onPointerCancel={() => setMovement('forward', false)}>▲</button>
          <button type="button" aria-label="왼쪽으로 회전" onPointerDown={() => setMovement('turnLeft', true)} onPointerUp={() => setMovement('turnLeft', false)} onPointerCancel={() => setMovement('turnLeft', false)}>◀</button>
          <button type="button" aria-label="뒤로 이동" onPointerDown={() => setMovement('backward', true)} onPointerUp={() => setMovement('backward', false)} onPointerCancel={() => setMovement('backward', false)}>▼</button>
          <button type="button" aria-label="오른쪽으로 회전" onPointerDown={() => setMovement('turnRight', true)} onPointerUp={() => setMovement('turnRight', false)} onPointerCancel={() => setMovement('turnRight', false)}>▶</button>
        </div>
        <div className="roadview__mobile-gate-guide"><Icon name="train" /><span><strong>{nearGate ? nearGate.gateCode : 'AUTO GATE'}</strong><small>개찰구 통과 시 자동 안내</small></span></div>
      </div>
      {mapOpen ? <div className="roadview__overlay roadview__overlay--panel" onMouseDown={(event) => event.target === event.currentTarget && setMapOpen(false)}><section className="roadview__panel" role="dialog" aria-modal="true" aria-labelledby="roadview-map-title">
        <header><div><span>METAVERSE STATION DIRECTORY</span><h2 id="roadview-map-title">에코 익스프레스 역사 지도</h2></div><button type="button" onClick={() => setMapOpen(false)} aria-label="지도 닫기">×</button></header>
        <canvas ref={mapRef} className="roadview__map" aria-label="현재 위치와 상단 가로 3칸 전시 열차가 표시된 디귿자 역사 지도" /><p className="roadview__map-legend"><i /> 현재 위치 <b /> 객차 출입문</p>
      </section></div> : null}
      {selectedBooth ? <div className="roadview__overlay roadview__overlay--panel" onMouseDown={(event) => event.target === event.currentTarget && setSelectedBooth(null)}><section className="roadview__panel roadview__booth-info" role="dialog" aria-modal="true" aria-labelledby="roadview-booth-title" style={{ '--roadview-accent': selectedBooth.color } as CSSProperties}>
        <header><div><span>{selectedBooth.label}</span><h2 id="roadview-booth-title">{selectedBooth.title}</h2></div><button type="button" onClick={() => setSelectedBooth(null)} aria-label="부스 안내 닫기">×</button></header>
        <div className="roadview__booth-symbol" aria-hidden="true"><span>{selectedBooth.gateCode}</span><small>SMART GATE PASSED</small></div><p>{selectedBooth.description}</p>
        <button type="button" className="roadview__panel-action" onClick={() => setSelectedBooth(null)}>메타버스 역사로 돌아가기</button>
      </section></div> : null}
    </section>
  )
}
