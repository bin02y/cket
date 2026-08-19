import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import boothOneImage from '../assets/roadview/booth-1.png'
import boothTwoImage from '../assets/roadview/booth-2.png'
import boothThreeImage from '../assets/roadview/booth-3.png'
import boothFourImage from '../assets/roadview/booth-4.png'
import type { RoadViewGateCode, RoadViewGateRewardResult } from '../types'
import { Icon } from './Icon'

type RoadView3DProps = {
  onClose: () => void
  onGatePassed: (gateCode: RoadViewGateCode) => Promise<RoadViewGateRewardResult>
}
type GateSide = 'north' | 'south' | 'east' | 'west'
type StationGate = { x: number; z: number; side: GateSide }
type RoadViewBooth = { id: number; gateCode: RoadViewGateCode; label: string; title: string; description: string; color: string; x: number; z: number; gate: StationGate; trainCar?: boolean }
type StationFacility = Omit<RoadViewBooth, 'id' | 'description' | 'gateCode'> & { gateCode: string }
type Player = { x: number; z: number; yaw: number; pitch: number }
type Movement = { forward: boolean; backward: boolean; left: boolean; right: boolean; turnLeft: boolean; turnRight: boolean; sprint: boolean }
type Collider = { x1: number; x2: number; z1: number; z2: number }
type GateRewardNotice = { gateCode: RoadViewGateCode; status: 'pending' | RoadViewGateRewardResult['status']; points: number }

const BOOTH_WIDTH = 8.4
const BOOTH_DEPTH = 5.4
const EMPTY_MOVEMENT: Movement = { forward: false, backward: false, left: false, right: false, turnLeft: false, turnRight: false, sprint: false }
const KEY_TO_MOVEMENT: Readonly<Record<string, keyof Movement>> = {
  w: 'forward',
  arrowup: 'forward',
  s: 'backward',
  arrowdown: 'backward',
  a: 'left',
  d: 'right',
  arrowleft: 'turnLeft',
  arrowright: 'turnRight',
  shift: 'sprint',
}

const BOOTHS: readonly RoadViewBooth[] = [
  { id: 1, gateCode: 'B01', label: 'BOOTH 01 · 1번 승강장', title: '빙하 위 펭귄 구조', description: '1번 승강장에서 녹는 빙하를 건너 펭귄이 안전한 곳에 도착하도록 도와주세요.', color: '#45aee8', x: -19.1, z: -5, gate: { x: -16.4, z: -5, side: 'east' } },
  { id: 2, gateCode: 'L01', label: 'EXHIBITION TRAIN · 1호차', title: '냉동공조 실험실', description: '전시 열차 1호차에서 압축·응축·팽창·증발 장치를 직접 살펴보세요.', color: '#73b62f', x: -9.4, z: -15, gate: { x: -9.4, z: -12, side: 'south' }, trainCar: true },
  { id: 3, gateCode: 'B02', label: 'BOOTH 02 · 2번 승강장', title: '무더운 여름', description: '2번 승강장에서 상황에 맞는 냉방 방법을 선택하고 에너지를 절약해 보세요.', color: '#35b981', x: 19.1, z: -5, gate: { x: 16.4, z: -5, side: 'west' } },
  { id: 4, gateCode: 'B03', label: 'BOOTH 03 · 3번 승강장', title: '동물들을 구하라', description: '3번 승강장에서 생활 속 친환경 선택으로 기후 위기의 동물들을 지켜주세요.', color: '#ae7cff', x: -19.1, z: 5, gate: { x: -16.4, z: 5, side: 'east' } },
  { id: 5, gateCode: 'E01', label: 'EXHIBITION TRAIN · 2호차', title: '초고속 냉동사이클', description: '전시 열차 2호차에서 KTX 초고속 환경의 냉방을 유지하는 냉동공조 기술을 배워보세요.', color: '#e69a35', x: 0, z: -15, gate: { x: 0, z: -12, side: 'south' }, trainCar: true },
  { id: 6, gateCode: 'B04', label: 'BOOTH 04 · 4번 승강장', title: '나비효과', description: '4번 승강장에서 작은 생활 습관이 지구의 미래를 어떻게 바꾸는지 확인해 보세요.', color: '#82e76d', x: 19.1, z: 5, gate: { x: 16.4, z: 5, side: 'west' } },
  { id: 7, gateCode: 'R01', label: 'EXHIBITION TRAIN · 3호차', title: '굿즈샵', description: '전시 열차 3호차에서 체험으로 모은 포인트로 에코 익스프레스 굿즈를 만나보세요.', color: '#e45575', x: 9.4, z: -15, gate: { x: 9.4, z: -12, side: 'south' }, trainCar: true },
] as const

const FACILITIES: readonly StationFacility[] = [
  { gateCode: 'F01', label: 'FACILITY 01', title: '화장실', color: '#e0bd35', x: -19.1, z: 15, gate: { x: -16.4, z: 15, side: 'east' } },
  { gateCode: 'F02', label: 'FACILITY 02', title: '안내센터', color: '#4b9fd3', x: 19.1, z: 15, gate: { x: 16.4, z: 15, side: 'west' } },
] as const
const ZONES: readonly (RoadViewBooth | StationFacility)[] = [...BOOTHS, ...FACILITIES]
const BOOTH_IMAGES: Readonly<Partial<Record<number, { src: string; alt: string }>>> = {
  1: { src: boothOneImage, alt: '녹는 빙하 위에서 펭귄을 구하는 1번 부스 안내 이미지' },
  3: { src: boothTwoImage, alt: '무더운 여름에 냉방 방법을 선택하는 2번 부스 안내 이미지' },
  4: { src: boothThreeImage, alt: '기후 위기에서 동물을 구하는 3번 부스 안내 이미지' },
  6: { src: boothFourImage, alt: '생활 속 선택으로 지구를 지키는 4번 부스 안내 이미지' },
}

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
    const shellWalls = [
      { x1: zone.x - halfWidth, x2: zone.x + halfWidth, z1: zone.z - halfDepth - 0.18, z2: zone.z - halfDepth + 0.28 },
      { x1: zone.x - halfWidth, x2: zone.x + halfWidth, z1: zone.z + halfDepth - 0.28, z2: zone.z + halfDepth + 0.18 },
      { x1: backX - 0.22, x2: backX + 0.22, z1: zone.z - halfDepth, z2: zone.z + halfDepth },
    ]
    if (zone.gateCode === 'F02') return shellWalls
    return [
      ...shellWalls,
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

function addIntegratedBoothShell(parent: THREE.Object3D, material: THREE.Material) {
  const wallThickness = 0.34
  const height = 5.16
  const outer = new THREE.Shape()
  outer.moveTo(-BOOTH_WIDTH / 2, 0)
  outer.lineTo(BOOTH_WIDTH / 2, 0)
  outer.lineTo(BOOTH_WIDTH / 2, height)
  outer.lineTo(-BOOTH_WIDTH / 2, height)
  outer.closePath()
  const interior = new THREE.Path()
  interior.moveTo(-BOOTH_WIDTH / 2 + wallThickness, wallThickness)
  interior.lineTo(-BOOTH_WIDTH / 2 + wallThickness, height - wallThickness)
  interior.lineTo(BOOTH_WIDTH / 2 - wallThickness, height - wallThickness)
  interior.lineTo(BOOTH_WIDTH / 2 - wallThickness, wallThickness)
  interior.closePath()
  outer.holes.push(interior)

  const continuousFrame = new THREE.ExtrudeGeometry(outer, {
    depth: BOOTH_DEPTH,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.08,
    bevelThickness: 0.08,
    curveSegments: 4,
  })
  continuousFrame.translate(0, 0, -BOOTH_DEPTH / 2)
  const back = new THREE.BoxGeometry(BOOTH_WIDTH, height, wallThickness)
  back.translate(0, height / 2, -BOOTH_DEPTH / 2 + wallThickness / 2)
  const frameGeometry = continuousFrame.index ? continuousFrame.toNonIndexed() : continuousFrame
  const backGeometry = back.index ? back.toNonIndexed() : back
  const geometry = mergeGeometries([frameGeometry, backGeometry], false)
  if (frameGeometry !== continuousFrame) continuousFrame.dispose()
  if (backGeometry !== back) back.dispose()
  frameGeometry.dispose(); backGeometry.dispose()
  geometry.computeVertexNormals()
  const shell = new THREE.Mesh(geometry, material)
  shell.castShadow = true; shell.receiveShadow = true; parent.add(shell)
  return { interiorBackZ: -BOOTH_DEPTH / 2 + wallThickness + 0.06, height }
}

function addIntegratedDoorFacade(parent: THREE.Object3D, material: THREE.Material) {
  const facadeHeight = 4.86
  const openingWidth = 2.08
  const openingHeight = 3.05
  const sideWidth = (BOOTH_WIDTH - openingWidth) / 2
  const depth = 0.24
  const frontZ = BOOTH_DEPTH / 2 - depth / 2
  const left = new THREE.BoxGeometry(sideWidth, facadeHeight, depth)
  left.translate(-(openingWidth + sideWidth) / 2, facadeHeight / 2, frontZ)
  const right = new THREE.BoxGeometry(sideWidth, facadeHeight, depth)
  right.translate((openingWidth + sideWidth) / 2, facadeHeight / 2, frontZ)
  const header = new THREE.BoxGeometry(openingWidth, facadeHeight - openingHeight, depth)
  header.translate(0, openingHeight + (facadeHeight - openingHeight) / 2, frontZ)
  const geometry = mergeGeometries([left, right, header], false)
  left.dispose(); right.dispose(); header.dispose()
  geometry.computeVertexNormals()
  const facade = new THREE.Mesh(geometry, material)
  facade.castShadow = true; facade.receiveShadow = true; parent.add(facade)
}

function createGate(zone: RoadViewBooth) {
  const group = new THREE.Group()
  group.position.set(zone.gate.x, 0, zone.gate.z)
  if (zone.gate.side === 'north') group.rotation.y = Math.PI
  else if (zone.gate.side === 'east') group.rotation.y = Math.PI / 2
  else if (zone.gate.side === 'west') group.rotation.y = -Math.PI / 2
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
  return group
}

function createTrainDoor(zone: RoadViewBooth) {
  const group = new THREE.Group(); group.position.set(zone.gate.x, 0, zone.gate.z)
  if (zone.gate.side === 'north') group.rotation.y = Math.PI
  else if (zone.gate.side === 'east') group.rotation.y = Math.PI / 2
  else if (zone.gate.side === 'west') group.rotation.y = -Math.PI / 2
  const frame = new THREE.MeshStandardMaterial({ color: '#e8eff2', metalness: 0.68, roughness: 0.22 })
  const doorMaterial = new THREE.MeshPhysicalMaterial({ color: '#f8fbfc', metalness: 0.38, roughness: 0.25, clearcoat: 0.72, clearcoatRoughness: 0.2 })
  const windowMaterial = new THREE.MeshPhysicalMaterial({ color: '#83c6df', transparent: true, opacity: 0.58, metalness: 0.2, roughness: 0.08, side: THREE.DoubleSide })
  addRoundedBox(group, [0.2, 3.5, 0.3], [-1.52, 1.75, 0], frame, 0.06)
  addRoundedBox(group, [0.2, 3.5, 0.3], [1.52, 1.75, 0], frame, 0.06)
  addRoundedBox(group, [3.2, 0.2, 0.3], [0, 3.42, 0], frame, 0.06)
  const leftDoor = addRoundedBox(group, [1.38, 3.08, 0.16], [-0.7, 1.66, 0], doorMaterial, 0.05)
  const rightDoor = addRoundedBox(group, [1.38, 3.08, 0.16], [0.7, 1.66, 0], doorMaterial, 0.05)
  for (const [x, door] of [[-0.7, leftDoor], [0.7, rightDoor]] as const) {
    addRoundedBox(door, [0.78, 1.12, 0.05], [0, 0.35, 0.1], windowMaterial, 0.05)
    door.userData.closedX = x
  }
  group.userData.slidingDoors = [leftDoor, rightDoor]
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.75, 0.97),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture(zone.title, `${zone.gateCode} · TRAIN DOOR`, zone.color, 'AUTOMATIC SLIDING DOOR'), transparent: true, side: THREE.DoubleSide }),
  )
  sign.position.set(0, 4.15, 0); group.add(sign)
  return group
}

function addTrainSeat(parent: THREE.Object3D, x: number, z: number, backDirection: number, seatMaterial: THREE.Material, trimMaterial: THREE.Material) {
  addRoundedBox(parent, [0.22, 0.5, 0.22], [x, 0.4, z], trimMaterial, 0.05)
  addRoundedBox(parent, [1.04, 0.2, 0.8], [x, 0.68, z], seatMaterial, 0.12)
  addRoundedBox(parent, [1.04, 1.08, 0.18], [x, 1.18, z + backDirection * 0.34], seatMaterial, 0.12)
  for (const armX of [x - 0.58, x + 0.58]) addRoundedBox(parent, [0.12, 0.5, 0.7], [armX, 0.92, z], trimMaterial, 0.05)
}

function createTrainCarBooth(zone: RoadViewBooth) {
  const group = new THREE.Group(); group.position.set(zone.x, 0, zone.z)
  group.rotation.y = -Math.PI / 2
  const white = new THREE.MeshPhysicalMaterial({ color: '#f9fcfd', metalness: 0.22, roughness: 0.24, clearcoat: 0.8, clearcoatRoughness: 0.18 })
  const silver = new THREE.MeshStandardMaterial({ color: '#b8c7d0', metalness: 0.8, roughness: 0.2 })
  const blue = new THREE.MeshStandardMaterial({ color: '#146da6', emissive: '#0d5d91', emissiveIntensity: 0.18, metalness: 0.55, roughness: 0.24 })
  const windowMaterial = new THREE.MeshPhysicalMaterial({ color: '#9dd8ee', transparent: true, opacity: 0.58, roughness: 0.08, metalness: 0.22, side: THREE.DoubleSide })
  const seatMaterial = new THREE.MeshStandardMaterial({ color: '#244f70', metalness: 0.15, roughness: 0.55 })
  const seatTrim = new THREE.MeshStandardMaterial({ color: '#c8d5dc', metalness: 0.62, roughness: 0.24 })
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

  addRoundedBox(group, [0.06, 0.25, 9], [-halfWidth - 0.13, 0.95, 0], blue, 0.02)
  for (const z of [-3.05, 3.05]) addRoundedBox(group, [0.06, 0.25, 2.9], [halfWidth + 0.13, 0.95, z], blue, 0.02)
  for (const z of [-3.45, -2.25, 2.25, 3.45]) {
    addRoundedBox(group, [0.06, 1.0, 0.86], [-halfWidth - 0.13, 2.55, z], windowMaterial, 0.08)
    addRoundedBox(group, [0.06, 1.0, 0.86], [halfWidth + 0.13, 2.55, z], windowMaterial, 0.08)
  }
  for (const z of [-2.9, -1.45, 1.45, 2.9]) {
    const backDirection = z < 0 ? -1 : 1
    addTrainSeat(group, -1.38, z, backDirection, seatMaterial, seatTrim)
    addTrainSeat(group, 1.05, z, backDirection, seatMaterial, seatTrim)
  }
  return group
}

function createBooth(zone: RoadViewBooth) {
  if (zone.trainCar) return createTrainCarBooth(zone)
  const group = new THREE.Group(); group.position.set(zone.x, 0, zone.z)
  if (zone.gate.side === 'east') group.rotation.y = Math.PI / 2
  else if (zone.gate.side === 'west') group.rotation.y = -Math.PI / 2
  else if (zone.gate.side === 'north') group.rotation.y = Math.PI
  const accent = new THREE.Color(zone.color)
  const shell = new THREE.MeshPhysicalMaterial({ color: '#f8fbfc', metalness: 0.24, roughness: 0.25, clearcoat: 0.72, clearcoatRoughness: 0.2 })
  const panel = new THREE.MeshStandardMaterial({ color: accent.clone().lerp(new THREE.Color('#ffffff'), 0.7), emissive: accent, emissiveIntensity: 0.12, metalness: 0.16, roughness: 0.4 })
  const { interiorBackZ } = addIntegratedBoothShell(group, shell)
  addRoundedBox(group, [BOOTH_WIDTH - 0.82, 4.34, 0.08], [0, 2.55, interiorBackZ], panel, 0.04)
  const name = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 1.55),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture(zone.title, zone.label, zone.color), transparent: true, side: THREE.DoubleSide }),
  )
  name.position.set(0, 3.4, interiorBackZ + 0.07); group.add(name)
  return group
}

function createFacility(facility: StationFacility) {
  const group = new THREE.Group(); group.position.set(facility.x, 0, facility.z)
  if (facility.gate.side === 'east') group.rotation.y = Math.PI / 2
  else if (facility.gate.side === 'west') group.rotation.y = -Math.PI / 2
  const accent = new THREE.Color(facility.color)
  const shell = new THREE.MeshPhysicalMaterial({ color: '#f8fbfc', metalness: 0.2, roughness: 0.3, clearcoat: 0.65, clearcoatRoughness: 0.22 })
  const wall = new THREE.MeshStandardMaterial({ color: accent.clone().lerp(new THREE.Color('#ffffff'), 0.84), metalness: 0.08, roughness: 0.48 })
  const fixture = new THREE.MeshStandardMaterial({ color: '#dbe5e9', metalness: 0.36, roughness: 0.3 })
  const dark = new THREE.MeshStandardMaterial({ color: '#21465a', metalness: 0.18, roughness: 0.42 })
  const ceramic = new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0.04, roughness: 0.18, clearcoat: 0.82, clearcoatRoughness: 0.16 })
  const mirror = new THREE.MeshPhysicalMaterial({ color: '#bfe8f2', metalness: 0.78, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.04 })
  const halfDepth = BOOTH_DEPTH / 2; const backLocalZ = -halfDepth
  const { interiorBackZ } = addIntegratedBoothShell(group, shell)
  addRoundedBox(group, [BOOTH_WIDTH - 0.82, 4.34, 0.08], [0, 2.55, interiorBackZ], wall, 0.04)
  const englishTitle = facility.gateCode === 'F01' ? 'RESTROOM' : 'INFORMATION'
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.15, 1.46),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture(facility.title, englishTitle, facility.color, 'CKET STATION FACILITY'), transparent: true, side: THREE.DoubleSide }),
  )
  if (facility.gateCode === 'F01') {
    addIntegratedDoorFacade(group, wall)
    sign.position.set(0, 4.0, halfDepth + 0.18); sign.scale.setScalar(0.7); group.add(sign)
    const doorPivot = new THREE.Group(); doorPivot.position.set(-0.92, 0, halfDepth - 0.08); group.add(doorPivot)
    addRoundedBox(doorPivot, [1.82, 2.78, 0.12], [0.91, 1.52, 0], fixture, 0.06)
    addRoundedBox(doorPivot, [0.12, 0.12, 0.08], [1.56, 1.5, -0.1], dark, 0.03)
    group.userData.hingedDoor = doorPivot

    addRoundedBox(group, [1.72, 1.5, 0.12], [-2.35, 2.2, interiorBackZ + 0.05], fixture, 0.05)
    addRoundedBox(group, [1.5, 1.28, 0.06], [-2.35, 2.2, interiorBackZ + 0.14], mirror, 0.04)
    addRoundedBox(group, [1.55, 0.28, 0.82], [-2.35, 1.0, -1.75], ceramic, 0.12)
    addRoundedBox(group, [0.92, 0.06, 0.48], [-2.35, 1.16, -1.75], dark, 0.03)
    addRoundedBox(group, [0.2, 0.75, 0.2], [-2.35, 0.58, -1.75], fixture, 0.05)
    addRoundedBox(group, [0.12, 0.48, 0.12], [-2.35, 1.42, -2.02], fixture, 0.04)
    addRoundedBox(group, [0.5, 0.12, 0.12], [-2.12, 1.62, -2.02], fixture, 0.04)

    addRoundedBox(group, [0.78, 1.0, 0.42], [0, 1.08, backLocalZ + 0.35], ceramic, 0.16)
    addRoundedBox(group, [0.46, 0.42, 0.38], [0, 0.48, backLocalZ + 0.5], fixture, 0.12)

    const toiletBowl = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.14, 12, 32), ceramic)
    toiletBowl.rotation.x = Math.PI / 2; toiletBowl.position.set(2.25, 0.72, -1.62); toiletBowl.scale.z = 1.3; group.add(toiletBowl)
    addRoundedBox(group, [0.66, 0.5, 0.68], [2.25, 0.42, -1.62], ceramic, 0.16)
    addRoundedBox(group, [1.08, 1.08, 0.4], [2.25, 1.08, -2.18], ceramic, 0.12)
    addRoundedBox(group, [0.28, 0.12, 0.06], [2.25, 1.32, -1.96], fixture, 0.03)
    addRoundedBox(group, [0.16, 3.15, 2.15], [1.15, 1.62, -1.55], wall, 0.05)
  } else {
    sign.position.set(0, 3.42, interiorBackZ + 0.07); group.add(sign)
    addRoundedBox(group, [5.2, 1.08, 0.86], [0, 0.68, -0.7], fixture, 0.14)
    addRoundedBox(group, [4.7, 0.16, 0.94], [0, 1.24, -0.7], dark, 0.05)
    for (const x of [-1.35, 1.35]) {
      addRoundedBox(group, [0.82, 0.56, 0.12], [x, 1.7, -0.88], dark, 0.06)
      addRoundedBox(group, [0.1, 0.42, 0.1], [x, 1.43, -0.88], fixture, 0.03)
    }
  }
  return group
}

function buildMetaverseStation(scene: THREE.Scene) {
  const animated: THREE.Object3D[] = []
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 48), new THREE.MeshPhysicalMaterial({ color: '#e5ecef', metalness: 0.12, roughness: 0.3, clearcoat: 0.78, clearcoatRoughness: 0.22 }))
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor)
  const grid = new THREE.GridHelper(46, 46, '#7ea6b9', '#c1d0d8')
  grid.material.transparent = true; grid.material.opacity = 0.32; grid.position.y = 0.015; scene.add(grid)
  const structure = new THREE.MeshStandardMaterial({ color: '#f4f7f8', metalness: 0.58, roughness: 0.24 })
  const glass = new THREE.MeshPhysicalMaterial({ color: '#bde1ec', transparent: true, opacity: 0.28, roughness: 0.06, metalness: 0.08, side: THREE.DoubleSide })
  const roofPanel = new THREE.Mesh(new THREE.PlaneGeometry(43.5, 47), glass)
  roofPanel.rotation.x = Math.PI / 2; roofPanel.position.set(0, 8.52, 0); scene.add(roofPanel)
  for (const booth of BOOTHS) {
    scene.add(createBooth(booth))
    const entrance = booth.trainCar ? createTrainDoor(booth) : createGate(booth)
    scene.add(entrance); animated.push(entrance)
  }
  for (const facility of FACILITIES) {
    const builtFacility = createFacility(facility)
    scene.add(builtFacility)
    if (builtFacility.userData.hingedDoor) animated.push(builtFacility)
  }
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
  context.fillStyle = '#335469'; context.font = `900 ${Math.max(5, size * 0.014)}px system-ui, sans-serif`; context.textAlign = 'center'; context.fillText('CKET EXHIBITION TRAIN', trainX + trainWidth / 2, trainY + trainHeight * 0.18)
  for (const zone of ZONES) {
    const zoneDimensions = zoneSize(zone)
    const x = worldToMap(zone.x - zoneDimensions.width / 2); const y = worldToMap(zone.z - zoneDimensions.depth / 2)
    const width = worldToMap(zone.x + zoneDimensions.width / 2) - x; const height = worldToMap(zone.z + zoneDimensions.depth / 2) - y
    context.fillStyle = zone.trainCar ? '#ffffff' : zone.color; context.globalAlpha = zone.trainCar ? 0.95 : 0.72
    context.beginPath(); context.roundRect(x, y, width, height, Math.max(5, size * 0.014)); context.fill(); context.globalAlpha = 1
    context.strokeStyle = zone.color; context.lineWidth = zone.trainCar ? 2 : 1; context.stroke()
    context.fillStyle = '#0c2737'; context.textAlign = 'center'; context.font = `900 ${Math.max(7, size * 0.019)}px system-ui, sans-serif`; context.fillText(zone.gateCode, x + width / 2, y + height * 0.44)
    context.font = `800 ${Math.max(5, size * 0.014)}px system-ui, sans-serif`; context.fillText(zone.title, x + width / 2, y + height * 0.7, width * 0.88)
    if ('id' in zone) {
      context.fillStyle = '#143e57'
      if (zone.gate.side === 'east' || zone.gate.side === 'west') context.fillRect(worldToMap(zone.gate.x) - 2, worldToMap(zone.gate.z) - height * 0.11, 4, height * 0.22)
      else context.fillRect(worldToMap(zone.gate.x) - width * 0.14, worldToMap(zone.gate.z) - 2, width * 0.28, 4)
    }
  }
  const x = worldToMap(player.x); const y = worldToMap(player.z)
  context.fillStyle = '#fff'; context.shadowColor = '#17c9ff'; context.shadowBlur = 10; context.beginPath(); context.arc(x, y, Math.max(4, size * 0.012), 0, Math.PI * 2); context.fill()
  context.strokeStyle = '#fff'; context.lineWidth = 2; context.beginPath(); context.moveTo(x, y); context.lineTo(x - Math.sin(player.yaw) * size * 0.035, y - Math.cos(player.yaw) * size * 0.035); context.stroke(); context.shadowBlur = 0
}

export default function RoadView3D({ onClose, onGatePassed }: RoadView3DProps) {
  const sceneRef = useRef<HTMLCanvasElement>(null); const mapRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<Player>({ x: 0, z: 20.2, yaw: 0, pitch: -0.03 }); const movementRef = useRef<Movement>({ ...EMPTY_MOVEMENT })
  const overlayRef = useRef({ mapOpen: false, selectedBooth: null as RoadViewBooth | null }); const lastGateRef = useRef<number | null>(null)
  const onGatePassedRef = useRef(onGatePassed); const gateRewardCacheRef = useRef(new Map<RoadViewGateCode, GateRewardNotice>())
  const [mapOpen, setMapOpen] = useState(false)
  const [selectedBooth, setSelectedBooth] = useState<RoadViewBooth | null>(null); const [renderError, setRenderError] = useState(false)
  const [gateRewardNotice, setGateRewardNotice] = useState<GateRewardNotice | null>(null)
  onGatePassedRef.current = onGatePassed
  overlayRef.current = { mapOpen, selectedBooth }

  const claimGateReward = (booth: RoadViewBooth) => {
    const cached = gateRewardCacheRef.current.get(booth.gateCode)
    if (cached) {
      setGateRewardNotice(cached)
      return
    }

    const pending: GateRewardNotice = { gateCode: booth.gateCode, status: 'pending', points: 500 }
    gateRewardCacheRef.current.set(booth.gateCode, pending)
    setGateRewardNotice(pending)
    void onGatePassedRef.current(booth.gateCode).then((result) => {
      const notice: GateRewardNotice = { gateCode: booth.gateCode, status: result.status, points: result.status === 'error' ? 0 : result.awardedPoints }
      if (result.status === 'error') gateRewardCacheRef.current.delete(booth.gateCode)
      else gateRewardCacheRef.current.set(booth.gateCode, notice)
      setGateRewardNotice(notice)
    })
  }

  useEffect(() => {
    const root = document.documentElement
    const previousBodyOverflow = document.body.style.overflow
    const previousRootOverflow = root.style.overflow
    const previousScrollbarGutter = root.style.scrollbarGutter

    document.body.style.overflow = 'hidden'
    root.style.overflow = 'hidden'
    root.style.scrollbarGutter = 'auto'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      root.style.overflow = previousRootOverflow
      root.style.scrollbarGutter = previousScrollbarGutter
    }
  }, [])

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
    const animated = buildMetaverseStation(scene); const clock = new THREE.Clock(); const jump = { height: 0, velocity: 0 }
    let animationFrame = 0; let dragging = false; let pointerX = 0; let pointerY = 0
    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      const width = Math.max(1, Math.round(bounds.width))
      const height = Math.max(1, Math.round(bounds.height))
      const pixelRatioLimit = width < 720 ? 1.35 : 1.65
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioLimit))
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix()
    }
    const resizeTarget = canvas.parentElement ?? canvas
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(resizeTarget); resize()
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
      const movementKey = KEY_TO_MOVEMENT[key]; if (movementKey) { event.preventDefault(); movementRef.current[movementKey] = pressed }
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
        const wings = object.userData.wings as THREE.Mesh[] | undefined
        if (wings) {
          const open = Math.hypot(object.position.x - player.x, object.position.z - player.z) < 2.25
          wings[0].rotation.y = THREE.MathUtils.lerp(wings[0].rotation.y, open ? -1.15 : 0, 0.1); wings[1].rotation.y = THREE.MathUtils.lerp(wings[1].rotation.y, open ? 1.15 : 0, 0.1)
        }
        const slidingDoors = object.userData.slidingDoors as THREE.Mesh[] | undefined
        if (slidingDoors) {
          const open = Math.hypot(object.position.x - player.x, object.position.z - player.z) < 2.75
          slidingDoors.forEach((door) => { const closedX = door.userData.closedX as number; door.position.x = THREE.MathUtils.lerp(door.position.x, open ? closedX * 2.05 : closedX, 0.1) })
        }
        const hingedDoor = object.userData.hingedDoor as THREE.Group | undefined
        if (hingedDoor) {
          const open = Math.hypot(object.position.x - player.x, object.position.z - player.z) < 4.1
          hingedDoor.rotation.y = THREE.MathUtils.lerp(hingedDoor.rotation.y, open ? 1.18 : 0, 0.12)
        }
      }
      if (!overlayRef.current.mapOpen && !overlayRef.current.selectedBooth) {
        const passedBooth = crossedGate(player)
        if (!passedBooth) lastGateRef.current = null
        else if (lastGateRef.current !== passedBooth.id) { lastGateRef.current = passedBooth.id; stopMovement(); setSelectedBooth(passedBooth); claimGateReward(passedBooth) }
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
      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      const textures = new Set<THREE.Texture>()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Sprite) {
          if (object.geometry) geometries.add(object.geometry)
          const objectMaterials = Array.isArray(object.material) ? object.material : [object.material]
          objectMaterials.forEach((material) => {
            materials.add(material)
            if ('map' in material && material.map instanceof THREE.Texture) textures.add(material.map)
          })
        }
      })
      textures.forEach((texture) => texture.dispose())
      materials.forEach((material) => material.dispose())
      geometries.forEach((geometry) => geometry.dispose())
      renderer.dispose()
    }
  }, [onClose])

  const setMovement = (key: keyof Movement, pressed: boolean) => { movementRef.current[key] = pressed }
  return (
    <section className="roadview" role="dialog" aria-modal="true" aria-label="에코 익스프레스 메타버스 3D 역사">
      <canvas ref={sceneRef} className="roadview__scene" aria-label="개찰구를 통과해 안내를 확인하는 에코 익스프레스 메타버스 역사" />
      {renderError ? <div className="roadview__render-error"><strong>3D 공간을 불러오지 못했습니다.</strong><span>브라우저의 그래픽 가속을 켜고 다시 시도해 주세요.</span></div> : null}
      <div className="roadview__desktop-help" aria-hidden="true"><span><kbd>W A S D</kbd> 이동</span><span><kbd>SHIFT</kbd> 달리기</span><span><kbd>SPACE</kbd> 점프</span><span><kbd>드래그</kbd> 시점</span><span><kbd>M</kbd> 지도</span></div>
      <div className="roadview__mobile-controls" aria-label="3D 로드뷰 이동 조작">
        <div className="roadview__dpad">
          <button type="button" aria-label="앞으로 이동" onPointerDown={() => setMovement('forward', true)} onPointerUp={() => setMovement('forward', false)} onPointerCancel={() => setMovement('forward', false)}>▲</button>
          <button type="button" aria-label="왼쪽으로 회전" onPointerDown={() => setMovement('turnLeft', true)} onPointerUp={() => setMovement('turnLeft', false)} onPointerCancel={() => setMovement('turnLeft', false)}>◀</button>
          <button type="button" aria-label="뒤로 이동" onPointerDown={() => setMovement('backward', true)} onPointerUp={() => setMovement('backward', false)} onPointerCancel={() => setMovement('backward', false)}>▼</button>
          <button type="button" aria-label="오른쪽으로 회전" onPointerDown={() => setMovement('turnRight', true)} onPointerUp={() => setMovement('turnRight', false)} onPointerCancel={() => setMovement('turnRight', false)}>▶</button>
        </div>
        <div className="roadview__mobile-gate-guide"><Icon name="train" /><span><strong>AUTO GATE</strong><small>개찰구 통과 시 자동 안내</small></span></div>
      </div>
      {mapOpen ? <div className="roadview__overlay roadview__overlay--panel" onMouseDown={(event) => event.target === event.currentTarget && setMapOpen(false)}><section className="roadview__panel roadview__map-panel" role="dialog" aria-modal="true" aria-label="에코 익스프레스 역사 지도">
        <button type="button" className="roadview__map-close" onClick={() => setMapOpen(false)} aria-label="지도 닫기">×</button>
        <canvas ref={mapRef} className="roadview__map" aria-label="현재 위치와 상단 가로 3칸 전시 열차가 표시된 디귿자 역사 지도" />
      </section></div> : null}
      {selectedBooth ? <div className="roadview__overlay roadview__overlay--panel" onMouseDown={(event) => event.target === event.currentTarget && setSelectedBooth(null)}><section className="roadview__panel roadview__booth-info" role="dialog" aria-modal="true" aria-labelledby="roadview-booth-title" style={{ '--roadview-accent': selectedBooth.color } as CSSProperties}>
        <header><div><span>{selectedBooth.label}</span><h2 id="roadview-booth-title">{selectedBooth.title}</h2></div><button type="button" onClick={() => setSelectedBooth(null)} aria-label="부스 안내 닫기">×</button></header>
        {gateRewardNotice?.gateCode === selectedBooth.gateCode ? <div className={`roadview__gate-reward roadview__gate-reward--${gateRewardNotice.status}`} role="status"><Icon name={gateRewardNotice.status === 'error' ? 'warning' : 'wallet'} /><span><small>{selectedBooth.gateCode} VISIT REWARD</small><strong>{gateRewardNotice.status === 'pending' ? '500 P 적립 중…' : gateRewardNotice.status === 'completed' ? `+${gateRewardNotice.points.toLocaleString('ko-KR')} P 적립 완료` : gateRewardNotice.status === 'already_completed' ? '이미 500 P를 받은 구역이에요' : '포인트 적립을 확인하지 못했어요'}</strong></span></div> : null}
        {BOOTH_IMAGES[selectedBooth.id] ? <figure className="roadview__booth-image"><img src={BOOTH_IMAGES[selectedBooth.id]?.src} alt={BOOTH_IMAGES[selectedBooth.id]?.alt} /></figure> : <div className="roadview__booth-symbol" aria-hidden="true"><span>{selectedBooth.gateCode}</span><small>SMART GATE PASSED</small></div>}<p>{selectedBooth.description}</p>
        <button type="button" className="roadview__panel-action" onClick={() => setSelectedBooth(null)}>메타버스 역사로 돌아가기</button>
      </section></div> : null}
    </section>
  )
}
