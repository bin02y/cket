import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import aerodynamicRoofFinalImage from '../assets/academy/aerodynamic-roof-final.webp'
import kitFinalImage from '../assets/academy/kit-final-4way.webp'
import vibrationFinalImage from '../assets/academy/vibration-final.webp'
import boothOneImage from '../assets/roadview/booth-1.webp'
import boothTwoImage from '../assets/roadview/booth-2.webp'
import boothThreeImage from '../assets/roadview/booth-3.webp'
import boothFourImage from '../assets/roadview/booth-4.webp'
import ultraFastRefrigerationVideo from '../assets/roadview/ultra-fast-refrigeration-cycle-720p.mp4'
import { rewardProducts } from '../data/rewards'
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
type BoothImage = { src: string; alt: string }

const BOOTH_WIDTH = 8.4
const BOOTH_DEPTH = 5.4
const STATION_WIDTH = 64
const STATION_DEPTH = 64
const STATION_HEIGHT = 8.5
const PERIMETER_WALL_THICKNESS = 0.24
const SIDE_ZONE_X = STATION_WIDTH / 2 - PERIMETER_WALL_THICKNESS - BOOTH_DEPTH / 2
const SIDE_GATE_X = SIDE_ZONE_X - BOOTH_DEPTH / 2
const TRAIN_CENTER_Z = -(STATION_DEPTH / 2 - PERIMETER_WALL_THICKNESS - 2.96)
const TRAIN_GATE_Z = TRAIN_CENTER_Z + 3
const TRAIN_BODY_BASE_Y = 0.28
const TRAIN_ROOF_TOP_Y = 4.45
const TRAIN_WINDOW_CENTER_Y = 2.55
const TRAIN_SEAT_LOCAL_XS = [-1.38, 1.05] as const
const TRAIN_SEAT_LOCAL_ZS = [-2.9, -1.45, 1.45, 2.9] as const
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
  { id: 1, gateCode: 'B01', label: 'BOOTH 01', title: '녹는 빙하 위에서 펭귄을 구해내라', description: '녹는 빙하를 건너 펭귄이 안전한 곳에 도착하도록 도와주세요.', color: '#45aee8', x: -SIDE_ZONE_X, z: -5, gate: { x: -SIDE_GATE_X, z: -5, side: 'east' } },
  { id: 2, gateCode: 'L01', label: 'KIT', title: '교육용 키트', description: '전시 열차 1호차에서 압축·응축·팽창·증발 장치를 직접 살펴보세요.', color: '#73b62f', x: -9.4, z: TRAIN_CENTER_Z, gate: { x: -9.4, z: TRAIN_GATE_Z, side: 'south' }, trainCar: true },
  { id: 3, gateCode: 'B02', label: 'BOOTH 02', title: '무더운 여름에서 살아남기', description: '상황에 맞는 냉방 방법을 선택하고 에너지를 절약해 보세요.', color: '#35b981', x: SIDE_ZONE_X, z: -5, gate: { x: SIDE_GATE_X, z: -5, side: 'west' } },
  { id: 4, gateCode: 'B03', label: 'BOOTH 03', title: '기후위기에서 동물들을 구하라', description: '생활 속 친환경 선택으로 기후 위기의 동물들을 지켜주세요.', color: '#ae7cff', x: -SIDE_ZONE_X, z: 5, gate: { x: -SIDE_GATE_X, z: 5, side: 'east' } },
  { id: 5, gateCode: 'E01', label: 'EDU', title: '초고속 냉동사이클', description: '전시 열차 2호차에서 KTX 초고속 환경의 냉방을 유지하는 냉동공조 기술을 배워보세요.', color: '#e69a35', x: 0, z: TRAIN_CENTER_Z, gate: { x: 0, z: TRAIN_GATE_Z, side: 'south' }, trainCar: true },
  { id: 6, gateCode: 'B04', label: 'BOOTH 04', title: '나비효과로부터 지구를 지켜라', description: '작은 생활 습관이 지구의 미래를 어떻게 바꾸는지 확인해 보세요.', color: '#82e76d', x: SIDE_ZONE_X, z: 5, gate: { x: SIDE_GATE_X, z: 5, side: 'west' } },
  { id: 7, gateCode: 'R01', label: 'SHOP', title: '굿즈샵', description: '전시 열차 3호차에서 체험으로 모은 포인트로 에코 익스프레스 굿즈를 만나보세요.', color: '#e45575', x: 9.4, z: TRAIN_CENTER_Z, gate: { x: 9.4, z: TRAIN_GATE_Z, side: 'south' }, trainCar: true },
] as const

const FACILITIES: readonly StationFacility[] = [
  { gateCode: 'F01', label: 'FACILITY 01', title: '화장실', color: '#e0bd35', x: -SIDE_ZONE_X, z: 15, gate: { x: -SIDE_GATE_X, z: 15, side: 'east' } },
  { gateCode: 'F02', label: 'FACILITY 02', title: '안내센터', color: '#4b9fd3', x: SIDE_ZONE_X, z: 15, gate: { x: SIDE_GATE_X, z: 15, side: 'west' } },
] as const
const ZONES: readonly (RoadViewBooth | StationFacility)[] = [...BOOTHS, ...FACILITIES]
const TRAIN_NOSE_COLLIDER: Collider = { x1: -20.72, x2: -14, z1: TRAIN_CENTER_Z - 2.96, z2: TRAIN_CENTER_Z + 2.96 }
const TRAIN_SEAT_COLLIDERS: readonly Collider[] = BOOTHS.filter((booth) => booth.trainCar).flatMap((booth) =>
  TRAIN_SEAT_LOCAL_ZS.flatMap((localZ) =>
    TRAIN_SEAT_LOCAL_XS.map((localX) => {
      const worldX = booth.x - localZ
      const worldZ = booth.z + localX
      return { x1: worldX - 0.46, x2: worldX + 0.46, z1: worldZ - 0.66, z2: worldZ + 0.66 }
    }),
  ),
)
const BOOTH_IMAGES: Readonly<Partial<Record<number, BoothImage>>> = {
  1: { src: boothOneImage, alt: '녹는 빙하 위에서 펭귄을 구하는 1번 부스 안내 이미지' },
  3: { src: boothTwoImage, alt: '무더운 여름에 냉방 방법을 선택하는 2번 부스 안내 이미지' },
  4: { src: boothThreeImage, alt: '기후 위기에서 동물을 구하는 3번 부스 안내 이미지' },
  6: { src: boothFourImage, alt: '생활 속 선택으로 지구를 지키는 4번 부스 안내 이미지' },
}
const EDUCATIONAL_KIT_IMAGES: readonly BoothImage[] = [
  { src: kitFinalImage, alt: '빨간색과 파란색 냉매 배관, 압축기와 4-way 밸브가 조립된 교육용 키트 완성품' },
  { src: vibrationFinalImage, alt: '일반 고정 지지대와 방진 마운트를 나란히 배치한 진동 비교 교육용 키트 완성품' },
  { src: aerodynamicRoofFinalImage, alt: '고속 열차 지붕의 공기 저항을 비교하는 공기역학 교육용 키트 완성품' },
]
const GOODS_IMAGES: readonly BoothImage[] = rewardProducts.map((reward) => ({ src: reward.image, alt: reward.imageAlt }))

function pickRandomImage(images: readonly BoothImage[]) {
  return images[Math.floor(Math.random() * images.length)]
}

function boothImageForVisit(booth: RoadViewBooth) {
  if (booth.gateCode === 'L01') return pickRandomImage(EDUCATIONAL_KIT_IMAGES)
  if (booth.gateCode === 'R01') return pickRandomImage(GOODS_IMAGES)
  return BOOTH_IMAGES[booth.id] ?? null
}

function zoneDisplayLabel(zone: RoadViewBooth | StationFacility) {
  if (zone.gateCode === 'F01') return 'RESTROOM'
  if (zone.gateCode === 'F02') return 'INFORMATION'
  return zone.label
}

function zoneSize(zone: RoadViewBooth | StationFacility) {
  if (zone.trainCar) return { width: 9.2, depth: 5.6 }
  if (zone.gate.side === 'east' || zone.gate.side === 'west') return { width: BOOTH_DEPTH, depth: BOOTH_WIDTH }
  return { width: BOOTH_WIDTH, depth: BOOTH_DEPTH }
}

const COLLIDERS: readonly Collider[] = [...ZONES.flatMap((zone) => {
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
    if (zone.gateCode === 'F01') {
      const doorwayOffset = 2.05
      const doorwayHalfWidth = 0.98
      const lowerDoorCenter = zone.z - doorwayOffset
      const upperDoorCenter = zone.z + doorwayOffset
      return [
        ...shellWalls,
        { x1: zone.gate.x - 0.2, x2: zone.gate.x + 0.2, z1: zone.z - halfDepth, z2: lowerDoorCenter - doorwayHalfWidth },
        { x1: zone.gate.x - 0.2, x2: zone.gate.x + 0.2, z1: lowerDoorCenter + doorwayHalfWidth, z2: upperDoorCenter - doorwayHalfWidth },
        { x1: zone.gate.x - 0.2, x2: zone.gate.x + 0.2, z1: upperDoorCenter + doorwayHalfWidth, z2: zone.z + halfDepth },
        { x1: backX, x2: zone.gate.x + 0.05, z1: zone.z - 0.14, z2: zone.z + 0.14 },
        { x1: zone.x + 0.72, x2: zone.x + 0.92, z1: zone.z - 4.05, z2: zone.z - 1.35 },
        { x1: zone.x + 0.72, x2: zone.x + 0.92, z1: zone.z + 1.35, z2: zone.z + 4.05 },
      ]
    }
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
}), TRAIN_NOSE_COLLIDER, ...TRAIN_SEAT_COLLIDERS]

function isWalkable(x: number, z: number) {
  const radius = 0.32
  const horizontalLimit = STATION_WIDTH / 2 - PERIMETER_WALL_THICKNESS - radius - 0.05
  const verticalLimit = STATION_DEPTH / 2 - PERIMETER_WALL_THICKNESS - radius - 0.05
  if (x < -horizontalLimit || x > horizontalLimit || z < -verticalLimit || z > verticalLimit) return false
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
  context.fillStyle = accent; context.font = '500 52px Paperlogy, sans-serif'; context.textAlign = 'center'; context.fillText(subtitle, 512, 122)
  context.fillStyle = '#fff'; context.font = '700 74px Paperlogy, sans-serif'; context.fillText(title, 512, 225, 870)
  context.fillStyle = 'rgba(255,255,255,.58)'; context.font = '300 30px Paperlogy, sans-serif'; context.fillText(footer, 512, 292)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4
  return texture
}

function makeTrainMarkTexture(primary: string, secondary = '') {
  const canvas = document.createElement('canvas')
  canvas.width = 512; canvas.height = 180
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#1d4f96'; context.font = 'italic 900 112px Arial, sans-serif'; context.textAlign = 'center'
  context.fillText(primary, 256, 116)
  if (secondary) {
    context.fillStyle = '#244a79'; context.font = '700 28px Arial, sans-serif'; context.fillText(secondary, 256, 158)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4
  return texture
}

function makeTrainBoothSignTexture(title: string, subtitle: string, accent: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024; canvas.height = 360
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)

  context.save(); context.beginPath(); context.roundRect(16, 16, 992, 328, 42); context.clip()
  context.fillStyle = '#f8fafc'; context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#174d98'; context.fillRect(0, 0, canvas.width, 62)

  context.fillStyle = accent; context.font = '700 48px Paperlogy, sans-serif'; context.textAlign = 'center'
  context.fillText(subtitle, 512, 135)
  context.fillStyle = '#173655'; context.font = '800 78px Paperlogy, sans-serif'
  context.fillText(title, 512, 235, 860)

  context.restore()
  context.beginPath(); context.roundRect(16, 16, 992, 328, 42)
  context.strokeStyle = '#244f99'; context.lineWidth = 10; context.stroke()
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

function makeRestroomTileTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512; canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)
  context.fillStyle = '#bfc3c2'; context.fillRect(0, 0, canvas.width, canvas.height)
  const rows = 10; const rowHeight = canvas.height / rows
  for (let row = 0; row < rows; row += 1) {
    const brickWidth = row % 3 === 0 ? 128 : 96
    const offset = row % 2 === 0 ? -brickWidth / 2 : 0
    for (let x = offset; x < canvas.width; x += brickWidth) {
      const shade = 72 + ((row * 17 + x / brickWidth * 11) % 48)
      context.fillStyle = `rgb(${shade},${shade + 5},${shade + 8})`
      context.fillRect(x + 4, row * rowHeight + 4, brickWidth - 8, rowHeight - 8)
      context.fillStyle = `rgba(255,255,255,${row % 2 === 0 ? 0.08 : 0.04})`
      context.fillRect(x + 8, row * rowHeight + 8, brickWidth - 16, 5)
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2.4, 1.6); texture.anisotropy = 4
  return texture
}

function makeRestroomPictogramTexture(gender: 'men' | 'women') {
  const canvas = document.createElement('canvas')
  canvas.width = 512; canvas.height = 768
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#f4f7f8'; context.textAlign = 'center'
  context.font = '700 42px Paperlogy, sans-serif'; context.fillText(gender === 'men' ? '남자화장실' : '여자화장실', 256, 62)
  context.beginPath(); context.arc(256, 182, 62, 0, Math.PI * 2); context.fill()
  if (gender === 'men') {
    context.beginPath(); context.roundRect(116, 286, 280, 250, 26); context.fill()
    context.fillRect(178, 500, 68, 196); context.fillRect(266, 500, 68, 196)
  } else {
    context.beginPath(); context.moveTo(256, 278); context.lineTo(142, 532); context.lineTo(370, 532); context.closePath(); context.fill()
    context.fillRect(204, 510, 44, 186); context.fillRect(264, 510, 44, 186)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4
  return texture
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
    addRoundedBox(group, [0.62, 0.1, 0.76], [x, 0.05, 0], darkMaterial, 0.03)
    addRoundedBox(group, [0.46, 1.42, 0.62], [x, 0.81, 0], darkMaterial, 0.14)
    addRoundedBox(group, [0.33, 0.12, 0.46], [x, 1.48, 0], glowMaterial, 0.06)
    const scanner = new THREE.Mesh(new THREE.CircleGeometry(0.09, 24), new THREE.MeshBasicMaterial({ color: '#dffff8' }))
    scanner.rotation.x = -Math.PI / 2; scanner.position.set(x, 1.55, 0); group.add(scanner)
  }
  const leftWing = new THREE.Mesh(new RoundedBoxGeometry(0.82, 0.72, 0.05, 3, 0.06), glassMaterial)
  leftWing.position.set(-0.66, 0.87, 0)
  const rightWing = leftWing.clone(); rightWing.position.x = 0.66
  group.add(leftWing, rightWing); group.userData.wings = [leftWing, rightWing]
  return group
}

function createTrainDoor(zone: RoadViewBooth) {
  const group = new THREE.Group(); group.position.set(zone.gate.x, 0, zone.gate.z)
  if (zone.gate.side === 'north') group.rotation.y = Math.PI
  else if (zone.gate.side === 'east') group.rotation.y = Math.PI / 2
  else if (zone.gate.side === 'west') group.rotation.y = -Math.PI / 2
  const frame = new THREE.MeshStandardMaterial({ color: '#355171', metalness: 0.6, roughness: 0.24 })
  const doorMaterial = new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0.22, roughness: 0.3, clearcoat: 0.65, clearcoatRoughness: 0.22 })
  const windowMaterial = new THREE.MeshPhysicalMaterial({ color: '#253a42', transparent: true, opacity: 0.92, metalness: 0.25, roughness: 0.1, side: THREE.DoubleSide })
  addRoundedBox(group, [0.2, 3.5, 0.3], [-1.52, 1.75 + TRAIN_BODY_BASE_Y, 0], frame, 0.06)
  addRoundedBox(group, [0.2, 3.5, 0.3], [1.52, 1.75 + TRAIN_BODY_BASE_Y, 0], frame, 0.06)
  addRoundedBox(group, [3.2, 0.2, 0.3], [0, 3.42 + TRAIN_BODY_BASE_Y, 0], frame, 0.06)
  const doorOffset = 0.73
  const doorCenterY = 1.72 + TRAIN_BODY_BASE_Y
  const leftDoor = addRoundedBox(group, [1.5, 3.36, 0.16], [-doorOffset, doorCenterY, -0.28], doorMaterial, 0.02)
  const rightDoor = addRoundedBox(group, [1.5, 3.36, 0.16], [doorOffset, doorCenterY, -0.28], doorMaterial, 0.02)
  for (const [x, door] of [[-doorOffset, leftDoor], [doorOffset, rightDoor]] as const) {
    addRoundedBox(door, [0.78, 1.12, 0.05], [0, TRAIN_WINDOW_CENTER_Y - door.position.y, 0.1], windowMaterial, 0.05)
    door.userData.closedX = x
    door.userData.openX = Math.sign(x) * 2.3
  }
  group.userData.slidingDoors = [leftDoor, rightDoor]
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.05, 1.07),
    new THREE.MeshBasicMaterial({ map: makeTrainBoothSignTexture(zone.title, zone.label, zone.color), transparent: true, side: THREE.DoubleSide }),
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

function createIntegratedTrainShell() {
  const group = new THREE.Group()
  group.position.set(0, 0, TRAIN_CENTER_Z)
  const shellMaterial = new THREE.MeshPhysicalMaterial({ color: '#f9fafb', metalness: 0.16, roughness: 0.3, clearcoat: 0.72, clearcoatRoughness: 0.2 })
  const blue = new THREE.MeshStandardMaterial({ color: '#244f99', metalness: 0.42, roughness: 0.28 })
  const windowMaterial = new THREE.MeshPhysicalMaterial({ color: '#263c43', transparent: true, opacity: 0.94, metalness: 0.3, roughness: 0.14, clearcoat: 0.8, clearcoatRoughness: 0.08 })
  const roofTrim = new THREE.MeshStandardMaterial({ color: '#aeb9bd', metalness: 0.62, roughness: 0.3 })
  const headlightMaterial = new THREE.MeshBasicMaterial({ color: '#f6ffff' })
  const trainLength = 28.2
  const halfLength = trainLength / 2
  const halfDepth = 2.8
  const openingWidth = 3.32
  const wallHeight = 3.94
  const wallCenterY = TRAIN_BODY_BASE_Y + wallHeight / 2
  const geometries: THREE.BoxGeometry[] = []
  const addShellPart = (size: [number, number, number], position: [number, number, number]) => {
    const geometry = new THREE.BoxGeometry(...size)
    geometry.translate(...position)
    geometries.push(geometry)
  }

  addShellPart([trainLength, 0.3, 5.8], [0, TRAIN_BODY_BASE_Y + 0.15, 0])
  addShellPart([trainLength, 0.34, 5.8], [0, 4.28, 0])
  addShellPart([trainLength, wallHeight, 0.24], [0, wallCenterY, -halfDepth])
  addShellPart([0.26, wallHeight, 5.6], [halfLength, wallCenterY, 0])

  const doorCenters = [-9.4, 0, 9.4]
  const frontSections = [
    [-halfLength, doorCenters[0] - openingWidth / 2],
    [doorCenters[0] + openingWidth / 2, doorCenters[1] - openingWidth / 2],
    [doorCenters[1] + openingWidth / 2, doorCenters[2] - openingWidth / 2],
    [doorCenters[2] + openingWidth / 2, halfLength],
  ] as const
  for (const [start, end] of frontSections) {
    addShellPart([end - start, wallHeight, 0.24], [(start + end) / 2, wallCenterY, halfDepth])
  }

  const geometry = mergeGeometries(geometries, false)
  geometries.forEach((part) => part.dispose())
  geometry.computeVertexNormals()
  const shell = new THREE.Mesh(geometry, shellMaterial)
  shell.castShadow = true
  shell.receiveShadow = true
  group.add(shell)

  const stripeHeight = 0.72
  const stripeCenterY = TRAIN_ROOF_TOP_Y - stripeHeight / 2
  addRoundedBox(group, [trainLength + 0.08, stripeHeight, 0.06], [0, stripeCenterY, -halfDepth - 0.13], blue, 0.02)
  addRoundedBox(group, [trainLength + 0.08, stripeHeight, 0.06], [0, stripeCenterY, halfDepth + 0.13], blue, 0.02)
  const noseShape = new THREE.Shape()
  noseShape.moveTo(-20.6, 0.28)
  noseShape.quadraticCurveTo(-20.45, 0.72, -19.55, 1.42)
  noseShape.quadraticCurveTo(-17.4, 3.78, -14.1, TRAIN_ROOF_TOP_Y - 0.08)
  noseShape.lineTo(-14.1, 0.28)
  noseShape.closePath()
  const noseGeometry = new THREE.ExtrudeGeometry(noseShape, { depth: 5.56, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.08, bevelThickness: 0.08, curveSegments: 12 })
  noseGeometry.translate(0, 0, -2.78)
  const nose = new THREE.Mesh(noseGeometry, shellMaterial)
  nose.castShadow = true; nose.receiveShadow = true; group.add(nose)

  const blueNoseShape = new THREE.Shape()
  blueNoseShape.moveTo(-19.35, 1.7)
  blueNoseShape.quadraticCurveTo(-17.35, 3.95, -14.08, TRAIN_ROOF_TOP_Y)
  blueNoseShape.lineTo(-14.08, TRAIN_ROOF_TOP_Y - stripeHeight)
  blueNoseShape.quadraticCurveTo(-17.15, 3.5, -18.82, 1.48)
  blueNoseShape.closePath()
  const blueNose = new THREE.Mesh(new THREE.ShapeGeometry(blueNoseShape, 12), blue)
  blueNose.position.z = halfDepth + 0.14; group.add(blueNose)
  for (const z of [-1.72, 1.72]) {
    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 10), headlightMaterial)
    headlight.scale.set(0.48, 0.72, 1); headlight.position.set(-20.12, 1.03, z); group.add(headlight)
  }

  for (const x of [-12.56, -6.15, -3.25, 3.25, 6.15, 12.56]) {
    for (const z of [-halfDepth - 0.17, halfDepth + 0.17]) addRoundedBox(group, [1.72, 0.76, 0.06], [x, TRAIN_WINDOW_CENTER_Y, z], windowMaterial, 0.12)
  }
  const ktxMark = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.87), new THREE.MeshBasicMaterial({ map: makeTrainMarkTexture('KTX', 'CKET EXPRESS'), transparent: true }))
  ktxMark.position.set(-16.45, 2.5, halfDepth + 0.2); group.add(ktxMark)

  for (const x of [-10.8, -1.2, 8.4]) addRoundedBox(group, [3.45, 0.28, 1.5], [x, 4.58, 0], roofTrim, 0.08)
  return group
}

function createTrainCarBooth(zone: RoadViewBooth) {
  const group = new THREE.Group(); group.position.set(zone.x, TRAIN_BODY_BASE_Y, zone.z)
  group.rotation.y = -Math.PI / 2
  const seatMaterial = new THREE.MeshStandardMaterial({ color: '#244f70', metalness: 0.15, roughness: 0.55 })
  const seatTrim = new THREE.MeshStandardMaterial({ color: '#c8d5dc', metalness: 0.62, roughness: 0.24 })
  for (const z of TRAIN_SEAT_LOCAL_ZS) {
    const backDirection = z < 0 ? -1 : 1
    for (const x of TRAIN_SEAT_LOCAL_XS) addTrainSeat(group, x, z, backDirection, seatMaterial, seatTrim)
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
    new THREE.MeshBasicMaterial({ map: makeTrainBoothSignTexture(zone.title, zone.label, zone.color), transparent: true, side: THREE.DoubleSide }),
  )
  name.position.set(0, 3.4, interiorBackZ + 0.07); group.add(name)
  return group
}

function addRestroomStall(parent: THREE.Object3D, x: number, partition: THREE.Material, door: THREE.Material, ceramic: THREE.Material, metal: THREE.Material) {
  const stallWidth = 0.9
  const stallCenterZ = -1.84
  const stallDepth = 1.48
  for (const sideX of [x - stallWidth / 2, x + stallWidth / 2]) addRoundedBox(parent, [0.06, 2.08, stallDepth], [sideX, 1.25, stallCenterZ], partition, 0.015)
  addRoundedBox(parent, [stallWidth - 0.1, 1.74, 0.07], [x, 1.18, -1.1], door, 0.02)
  addRoundedBox(parent, [0.12, 0.08, 0.04], [x + stallWidth * 0.28, 1.18, -1.05], metal, 0.02)
  addRoundedBox(parent, [0.5, 0.56, 0.3], [x, 0.63, -2.34], ceramic, 0.1)
  const bowl = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.07, 10, 24), ceramic)
  bowl.rotation.x = Math.PI / 2; bowl.scale.z = 1.24; bowl.position.set(x, 0.48, -2.03); parent.add(bowl)
  addRoundedBox(parent, [0.38, 0.24, 0.5], [x, 0.36, -2.05], ceramic, 0.1)
}

function addRestroomUrinal(parent: THREE.Object3D, x: number, ceramic: THREE.Material, metal: THREE.Material) {
  addRoundedBox(parent, [0.5, 0.76, 0.3], [x, 0.92, 0.67], ceramic, 0.12)
  addRoundedBox(parent, [0.56, 0.13, 0.46], [x, 0.59, 0.47], ceramic, 0.06)
  addRoundedBox(parent, [0.06, 0.3, 0.06], [x, 1.42, 0.49], metal, 0.02)
  addRoundedBox(parent, [0.14, 0.08, 0.08], [x, 1.56, 0.44], metal, 0.025)
}

function addRestroomSink(parent: THREE.Object3D, wallX: number, direction: -1 | 1, z: number, ceramic: THREE.Material, metal: THREE.Material, mirror: THREE.Material) {
  const basinX = wallX + direction * 0.48
  addRoundedBox(parent, [0.68, 0.17, 0.66], [basinX, 0.92, z], ceramic, 0.08)
  addRoundedBox(parent, [0.18, 0.72, 0.18], [basinX, 0.49, z], metal, 0.04)
  addRoundedBox(parent, [0.06, 0.48, 0.72], [wallX + direction * 0.12, 2.02, z], mirror, 0.02)
  addRoundedBox(parent, [0.07, 0.28, 0.07], [wallX + direction * 0.42, 1.24, z], metal, 0.025)
  addRoundedBox(parent, [0.22, 0.06, 0.07], [wallX + direction * 0.5, 1.35, z], metal, 0.02)
}

function createRestroomFacility(facility: StationFacility) {
  const group = new THREE.Group(); group.position.set(facility.x, 0, facility.z)
  if (facility.gate.side === 'east') group.rotation.y = Math.PI / 2
  else if (facility.gate.side === 'west') group.rotation.y = -Math.PI / 2

  const facade = new THREE.MeshStandardMaterial({ color: '#303b45', metalness: 0.12, roughness: 0.68 })
  const tile = new THREE.MeshStandardMaterial({ color: '#ffffff', map: makeRestroomTileTexture(), metalness: 0.04, roughness: 0.76 })
  const floorMaterial = new THREE.MeshStandardMaterial({ color: '#596168', metalness: 0.06, roughness: 0.8 })
  const partition = new THREE.MeshStandardMaterial({ color: '#c7ced1', metalness: 0.08, roughness: 0.62 })
  const stallDoor = new THREE.MeshStandardMaterial({ color: '#5f6a70', metalness: 0.18, roughness: 0.52 })
  const ceramic = new THREE.MeshPhysicalMaterial({ color: '#fbffff', metalness: 0.02, roughness: 0.16, clearcoat: 0.85, clearcoatRoughness: 0.12 })
  const metal = new THREE.MeshStandardMaterial({ color: '#aebbc0', metalness: 0.82, roughness: 0.18 })
  const mirror = new THREE.MeshPhysicalMaterial({ color: '#bbdce4', metalness: 0.76, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03 })
  const lightMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff' })
  const halfDepth = BOOTH_DEPTH / 2
  const { interiorBackZ } = addIntegratedBoothShell(group, facade)

  addRoundedBox(group, [BOOTH_WIDTH - 0.46, 4.45, 0.08], [0, 2.42, interiorBackZ + 0.05], tile, 0.02)
  addRoundedBox(group, [0.1, 4.45, BOOTH_DEPTH - 0.46], [-BOOTH_WIDTH / 2 + 0.27, 2.42, 0], tile, 0.02)
  addRoundedBox(group, [0.1, 4.45, BOOTH_DEPTH - 0.46], [BOOTH_WIDTH / 2 - 0.27, 2.42, 0], tile, 0.02)
  addRoundedBox(group, [0.18, 4.62, BOOTH_DEPTH - 0.28], [0, 2.31, -0.02], tile, 0.025)
  addRoundedBox(group, [3.86, 0.1, BOOTH_DEPTH - 0.5], [-2.06, 0.05, 0], floorMaterial, 0.02)
  addRoundedBox(group, [3.86, 0.1, BOOTH_DEPTH - 0.5], [2.06, 0.05, 0], floorMaterial, 0.02)
  addRoundedBox(group, [BOOTH_WIDTH - 0.44, 0.16, BOOTH_DEPTH - 0.44], [0, 4.83, 0], new THREE.MeshStandardMaterial({ color: '#f4f6f5', roughness: 0.82 }), 0.03)

  const doorwayWidth = 1.96
  const doorwayHeight = 3.5
  const doorwayCenters = [-2.05, 2.05] as const
  const openingEdges = doorwayCenters.map((center) => [center - doorwayWidth / 2, center + doorwayWidth / 2] as const)
  const facadeSegments = [
    [-BOOTH_WIDTH / 2, openingEdges[0][0]],
    [openingEdges[0][1], openingEdges[1][0]],
    [openingEdges[1][1], BOOTH_WIDTH / 2],
  ] as const
  const frontZ = halfDepth - 0.12
  for (const [start, end] of facadeSegments) addRoundedBox(group, [end - start, doorwayHeight, 0.3], [(start + end) / 2, doorwayHeight / 2, frontZ], facade, 0.025)
  addRoundedBox(group, [BOOTH_WIDTH, 1.38, 0.3], [0, doorwayHeight + 0.69, frontZ], facade, 0.025)

  for (const [index, x] of [-3.62, 3.62].entries()) {
    const gender = index === 0 ? 'men' : 'women'
    const pictogram = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 1.72),
      new THREE.MeshBasicMaterial({ map: makeRestroomPictogramTexture(gender), transparent: true, side: THREE.DoubleSide }),
    )
    pictogram.position.set(x, 2.12, halfDepth + 0.055); group.add(pictogram)
  }

  for (const x of doorwayCenters) {
    addRoundedBox(group, [0.12, 3.5, 1.36], [x - doorwayWidth / 2, 1.75, 1.94], tile, 0.015)
    addRoundedBox(group, [0.12, 3.5, 1.36], [x + doorwayWidth / 2, 1.75, 1.94], tile, 0.015)
  }

  addRoundedBox(group, [2.7, 3.9, 0.18], [-2.7, 1.95, 0.82], tile, 0.025)
  addRoundedBox(group, [2.7, 3.9, 0.18], [2.7, 1.95, 0.82], tile, 0.025)
  for (const x of [-3.58, -2.58, -1.58, -0.58, 0.58, 1.58, 2.58, 3.58]) addRestroomStall(group, x, partition, stallDoor, ceramic, metal)
  for (const x of [-3.65, -2.85, -2.05, -1.25]) addRestroomUrinal(group, x, ceramic, metal)
  for (const z of [-0.05, -0.75]) {
    addRestroomSink(group, -3.96, 1, z, ceramic, metal, mirror)
    addRestroomSink(group, 3.96, -1, z, ceramic, metal, mirror)
  }
  for (const x of [-3.25, -2.45, -1.65]) addRoundedBox(group, [0.08, 1.38, 0.72], [x, 1.16, 0.45], partition, 0.02)

  for (const x of doorwayCenters) {
    for (const z of [-0.72, 1.15]) {
      const light = new THREE.Mesh(new THREE.CircleGeometry(0.15, 24), lightMaterial)
      light.rotation.x = Math.PI / 2; light.position.set(x, 4.73, z); group.add(light)
    }
    const pointLight = new THREE.PointLight('#f4fbff', 0.65, 5.2, 2)
    pointLight.position.set(x, 4.46, 0.18); group.add(pointLight)
  }
  return group
}

function createFacility(facility: StationFacility) {
  if (facility.gateCode === 'F01') return createRestroomFacility(facility)
  const group = new THREE.Group(); group.position.set(facility.x, 0, facility.z)
  if (facility.gate.side === 'east') group.rotation.y = Math.PI / 2
  else if (facility.gate.side === 'west') group.rotation.y = -Math.PI / 2
  const accent = new THREE.Color(facility.color)
  const shell = new THREE.MeshPhysicalMaterial({ color: '#f8fbfc', metalness: 0.2, roughness: 0.3, clearcoat: 0.65, clearcoatRoughness: 0.22 })
  const wall = new THREE.MeshStandardMaterial({ color: accent.clone().lerp(new THREE.Color('#ffffff'), 0.84), metalness: 0.08, roughness: 0.48 })
  const fixture = new THREE.MeshStandardMaterial({ color: '#dbe5e9', metalness: 0.36, roughness: 0.3 })
  const dark = new THREE.MeshStandardMaterial({ color: '#21465a', metalness: 0.18, roughness: 0.42 })
  const { interiorBackZ } = addIntegratedBoothShell(group, shell)
  addRoundedBox(group, [BOOTH_WIDTH - 0.82, 4.34, 0.08], [0, 2.55, interiorBackZ], wall, 0.04)
  const englishTitle = zoneDisplayLabel(facility)
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.15, 1.46),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture(facility.title, englishTitle, facility.color, ''), transparent: true, side: THREE.DoubleSide }),
  )
  sign.position.set(0, 3.42, interiorBackZ + 0.07); group.add(sign)
  addRoundedBox(group, [5.2, 1.08, 0.86], [0, 0.68, -0.7], fixture, 0.14)
  addRoundedBox(group, [4.7, 0.16, 0.94], [0, 1.24, -0.7], dark, 0.05)
  for (const x of [-1.35, 1.35]) {
    addRoundedBox(group, [0.82, 0.56, 0.12], [x, 1.7, -0.88], dark, 0.06)
    addRoundedBox(group, [0.1, 0.42, 0.1], [x, 1.43, -0.88], fixture, 0.03)
  }
  return group
}

function buildMetaverseStation(scene: THREE.Scene) {
  const animated: THREE.Object3D[] = []
  const envelopeMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0, roughness: 0.92, side: THREE.DoubleSide })
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(STATION_WIDTH, STATION_DEPTH), envelopeMaterial)
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor)
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(STATION_WIDTH, STATION_DEPTH), envelopeMaterial)
  ceiling.rotation.x = Math.PI / 2; ceiling.position.set(0, STATION_HEIGHT, 0); ceiling.castShadow = false; ceiling.receiveShadow = false; scene.add(ceiling)
  const addEnvelopeWall = (size: [number, number, number], position: [number, number, number]) => {
    const wall = addRoundedBox(scene, size, position, envelopeMaterial, 0.04)
    wall.castShadow = false
    wall.receiveShadow = false
  }
  addEnvelopeWall([STATION_WIDTH, STATION_HEIGHT, PERIMETER_WALL_THICKNESS], [0, STATION_HEIGHT / 2, -STATION_DEPTH / 2 + PERIMETER_WALL_THICKNESS / 2])
  addEnvelopeWall([STATION_WIDTH, STATION_HEIGHT, PERIMETER_WALL_THICKNESS], [0, STATION_HEIGHT / 2, STATION_DEPTH / 2 - PERIMETER_WALL_THICKNESS / 2])
  addEnvelopeWall([PERIMETER_WALL_THICKNESS, STATION_HEIGHT, STATION_DEPTH], [-STATION_WIDTH / 2 + PERIMETER_WALL_THICKNESS / 2, STATION_HEIGHT / 2, 0])
  addEnvelopeWall([PERIMETER_WALL_THICKNESS, STATION_HEIGHT, STATION_DEPTH], [STATION_WIDTH / 2 - PERIMETER_WALL_THICKNESS / 2, STATION_HEIGHT / 2, 0])
  scene.add(createIntegratedTrainShell())
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
  const trackLength = 46
  const trackCenterX = -1
  const ballast = new THREE.MeshStandardMaterial({ color: '#7d8588', metalness: 0.02, roughness: 0.98 })
  const sleeperMaterial = new THREE.MeshStandardMaterial({ color: '#5f554c', metalness: 0.04, roughness: 0.9 })
  const fasteningMaterial = new THREE.MeshStandardMaterial({ color: '#30383c', metalness: 0.72, roughness: 0.3 })
  const rail = new THREE.MeshStandardMaterial({ color: '#56656d', metalness: 0.92, roughness: 0.16 })
  addRoundedBox(scene, [trackLength, 0.08, 5.92], [trackCenterX, 0.04, TRAIN_CENTER_Z], ballast, 0.025)
  const sleeperCount = 48
  const sleeperGeometry = new RoundedBoxGeometry(0.24, 0.12, 5.34, 2, 0.025)
  const sleepers = new THREE.InstancedMesh(sleeperGeometry, sleeperMaterial, sleeperCount)
  const sleeperMatrix = new THREE.Matrix4()
  for (let index = 0; index < sleeperCount; index += 1) {
    const x = trackCenterX - trackLength / 2 + 0.48 + index * ((trackLength - 0.96) / (sleeperCount - 1))
    sleeperMatrix.makeTranslation(x, 0.12, TRAIN_CENTER_Z); sleepers.setMatrixAt(index, sleeperMatrix)
  }
  sleepers.castShadow = true; sleepers.receiveShadow = true; sleepers.instanceMatrix.needsUpdate = true; scene.add(sleepers)
  for (const z of [TRAIN_CENTER_Z - 2.3, TRAIN_CENTER_Z + 2.3]) {
    addRoundedBox(scene, [trackLength, 0.08, 0.42], [trackCenterX, 0.19, z], fasteningMaterial, 0.025)
    addRoundedBox(scene, [trackLength, 0.14, 0.18], [trackCenterX, 0.28, z], rail, 0.035)
  }
  return animated
}

function drawMap(canvas: HTMLCanvasElement, player: Player) {
  const context = canvas.getContext('2d'); if (!context) return
  const ratio = Math.min(window.devicePixelRatio || 1, 2); const size = Math.min(canvas.clientWidth, canvas.clientHeight)
  canvas.width = Math.round(size * ratio); canvas.height = Math.round(size * ratio); context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, size, size); context.fillStyle = '#f8faf9'; context.fillRect(0, 0, size, size)
  const worldXToMap = (value: number) => ((value + STATION_WIDTH / 2) / STATION_WIDTH) * size
  const worldZToMap = (value: number) => ((value + STATION_DEPTH / 2) / STATION_DEPTH) * size
  const trainX = worldXToMap(-14.1); const trainY = worldZToMap(TRAIN_CENTER_Z - 3.15)
  const trainWidth = worldXToMap(14.1) - trainX; const trainHeight = worldZToMap(TRAIN_CENTER_Z + 3.15) - trainY
  context.fillStyle = '#fdfefe'; context.strokeStyle = '#6c8796'; context.lineWidth = 1.5
  context.fillRect(trainX, trainY, trainWidth, trainHeight); context.strokeRect(trainX, trainY, trainWidth, trainHeight)
  context.fillStyle = '#1874aa'; context.fillRect(trainX + 5, trainY + trainHeight * 0.72, trainWidth - 10, trainHeight * 0.12)
  context.fillStyle = '#335469'; context.font = `300 ${Math.max(5, size * 0.014)}px Paperlogy, sans-serif`; context.textAlign = 'center'; context.fillText('CKET EXHIBITION TRAIN', trainX + trainWidth / 2, trainY + trainHeight * 0.18)
  for (const zone of ZONES) {
    const zoneDimensions = zoneSize(zone)
    const x = worldXToMap(zone.x - zoneDimensions.width / 2); const y = worldZToMap(zone.z - zoneDimensions.depth / 2)
    const width = worldXToMap(zone.x + zoneDimensions.width / 2) - x; const height = worldZToMap(zone.z + zoneDimensions.depth / 2) - y
    context.fillStyle = zone.trainCar ? '#ffffff' : zone.color; context.globalAlpha = zone.trainCar ? 0.95 : 0.72
    context.fillRect(x, y, width, height); context.globalAlpha = 1
    context.strokeStyle = zone.color; context.lineWidth = zone.trainCar ? 2 : 1; context.strokeRect(x, y, width, height)
    context.fillStyle = '#0c2737'; context.textAlign = 'center'; context.font = `700 ${Math.max(7, size * 0.019)}px Paperlogy, sans-serif`; context.fillText(zoneDisplayLabel(zone), x + width / 2, y + height * 0.44, width * 0.9)
    context.font = `500 ${Math.max(5, size * 0.014)}px Paperlogy, sans-serif`; context.fillText(zone.title, x + width / 2, y + height * 0.7, width * 0.88)
    if ('id' in zone) {
      context.fillStyle = '#143e57'
      if (zone.gate.side === 'east' || zone.gate.side === 'west') context.fillRect(worldXToMap(zone.gate.x) - 2, worldZToMap(zone.gate.z) - height * 0.11, 4, height * 0.22)
      else context.fillRect(worldXToMap(zone.gate.x) - width * 0.14, worldZToMap(zone.gate.z) - 2, width * 0.28, 4)
    }
  }
  const x = worldXToMap(player.x); const y = worldZToMap(player.z)
  const markerRadius = Math.max(9, size * 0.022)
  context.save(); context.translate(x, y)
  context.shadowColor = 'rgba(15,113,238,.34)'; context.shadowBlur = markerRadius * 0.7
  context.fillStyle = '#0878e8'; context.beginPath(); context.arc(0, 0, markerRadius, 0, Math.PI * 2); context.fill()
  context.shadowColor = 'transparent'; context.fillStyle = '#ffffff'; context.beginPath(); context.arc(0, 0, markerRadius * 0.82, 0, Math.PI * 2); context.fill()
  context.fillStyle = '#1677ee'; context.beginPath(); context.arc(0, 0, markerRadius * 0.56, 0, Math.PI * 2); context.fill()
  context.restore()
}

export default function RoadView3D({ onClose, onGatePassed }: RoadView3DProps) {
  const sceneRef = useRef<HTMLCanvasElement>(null); const mapRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<Player>({ x: 0, z: 20.2, yaw: 0, pitch: -0.03 }); const movementRef = useRef<Movement>({ ...EMPTY_MOVEMENT })
  const overlayRef = useRef({ mapOpen: false, selectedBooth: null as RoadViewBooth | null }); const lastGateRef = useRef<number | null>(null)
  const onGatePassedRef = useRef(onGatePassed); const gateRewardCacheRef = useRef(new Map<RoadViewGateCode, GateRewardNotice>())
  const [mapOpen, setMapOpen] = useState(false)
  const [selectedBooth, setSelectedBooth] = useState<RoadViewBooth | null>(null); const [renderError, setRenderError] = useState(false)
  const [selectedBoothImage, setSelectedBoothImage] = useState<BoothImage | null>(null)
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
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#ffffff'); scene.fog = new THREE.Fog('#ffffff', 40, 100)
    const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 120); camera.rotation.order = 'YXZ'
    scene.add(new THREE.HemisphereLight('#ffffff', '#ffffff', 2.25))
    const sun = new THREE.DirectionalLight('#ffffff', 3.1); sun.position.set(-12, 18, 10); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -36; sun.shadow.camera.right = 36; sun.shadow.camera.top = 36; sun.shadow.camera.bottom = -36; scene.add(sun)
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
        const wings = object.userData.wings as THREE.Mesh[] | undefined
        if (wings) {
          const open = Math.hypot(object.position.x - player.x, object.position.z - player.z) < 2.25
          wings[0].rotation.y = THREE.MathUtils.lerp(wings[0].rotation.y, open ? -1.15 : 0, 0.1); wings[1].rotation.y = THREE.MathUtils.lerp(wings[1].rotation.y, open ? 1.15 : 0, 0.1)
        }
        const slidingDoors = object.userData.slidingDoors as THREE.Mesh[] | undefined
        if (slidingDoors) {
          const open = Math.hypot(object.position.x - player.x, object.position.z - player.z) < 2.75
          slidingDoors.forEach((door) => {
            const closedX = door.userData.closedX as number
            const openX = door.userData.openX as number
            const targetX = open ? openX : closedX
            door.position.x = THREE.MathUtils.lerp(door.position.x, targetX, 0.16)
            if (Math.abs(door.position.x - targetX) < 0.01) door.position.x = targetX
          })
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
        else if (lastGateRef.current !== passedBooth.id) { lastGateRef.current = passedBooth.id; stopMovement(); setSelectedBoothImage(boothImageForVisit(passedBooth)); setSelectedBooth(passedBooth); claimGateReward(passedBooth) }
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
        <canvas ref={mapRef} className="roadview__map" aria-label="현재 위치와 상단 가로 3칸 전시 열차가 표시된 디귿자 역사 지도" />
      </section></div> : null}
      {selectedBooth ? <div className="roadview__overlay roadview__overlay--panel" onMouseDown={(event) => event.target === event.currentTarget && setSelectedBooth(null)}><section className="roadview__panel roadview__booth-info" role="dialog" aria-modal="true" aria-label={`${selectedBooth.title} 방문 미디어와 포인트 획득 결과`} style={{ '--roadview-accent': selectedBooth.color } as CSSProperties}>
        {selectedBooth.gateCode === 'E01' ? <figure className="roadview__booth-image roadview__booth-video"><video src={ultraFastRefrigerationVideo} aria-label="초고속 냉동공조 소개 영상" autoPlay loop playsInline preload="metadata" onClick={(event) => void event.currentTarget.play()} /></figure> : selectedBoothImage ? <figure className="roadview__booth-image roadview__booth-image--contain"><img src={selectedBoothImage.src} alt={selectedBoothImage.alt} decoding="async" /></figure> : null}
        {gateRewardNotice?.gateCode === selectedBooth.gateCode ? <div className={`roadview__gate-reward roadview__gate-reward--${gateRewardNotice.status}`} role="status"><Icon name={gateRewardNotice.status === 'error' ? 'warning' : 'wallet'} /><span><small>{selectedBooth.gateCode} VISIT REWARD</small><strong>{gateRewardNotice.status === 'pending' ? '500 P 적립 중…' : gateRewardNotice.status === 'completed' ? `+${gateRewardNotice.points.toLocaleString('ko-KR')} P 적립 완료` : gateRewardNotice.status === 'already_completed' ? '이미 500 P를 받은 구역이에요' : '포인트 적립을 확인하지 못했어요'}</strong></span></div> : null}
      </section></div> : null}
    </section>
  )
}
