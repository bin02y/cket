import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Icon } from './Icon'

type RoadView3DProps = { onClose: () => void }
type GateSide = 'north' | 'south'
type StationGate = { x: number; z: number; side: GateSide }
type RoadViewBooth = { id: number; gateCode: string; label: string; title: string; description: string; color: string; x: number; z: number; gate: StationGate }
type StationFacility = Omit<RoadViewBooth, 'id' | 'description'>
type Player = { x: number; z: number; yaw: number; pitch: number }
type Movement = { forward: boolean; backward: boolean; left: boolean; right: boolean; turnLeft: boolean; turnRight: boolean }
type Collider = { x1: number; x2: number; z1: number; z2: number }

const BOOTH_WIDTH = 8.4
const BOOTH_DEPTH = 5.4
const EMPTY_MOVEMENT: Movement = { forward: false, backward: false, left: false, right: false, turnLeft: false, turnRight: false }

const BOOTHS: readonly RoadViewBooth[] = [
  { id: 1, gateCode: 'B01', label: 'BOOTH 01 · 1번 승강장', title: '빙하 위 펭귄 구조', description: '1번 승강장에서 녹는 빙하를 건너 펭귄이 안전한 곳에 도착하도록 도와주세요.', color: '#45c6ff', x: -14, z: -16, gate: { x: -14, z: -13.3, side: 'south' } },
  { id: 2, gateCode: 'L01', label: 'CENTER 01 · 실험역', title: '냉동공조 실험실', description: '열차 냉방을 책임지는 압축·응축·팽창·증발 장치를 실험역에서 만나보세요.', color: '#bce84f', x: 0, z: -16, gate: { x: 0, z: -13.3, side: 'south' } },
  { id: 3, gateCode: 'B02', label: 'BOOTH 02 · 2번 승강장', title: '무더운 여름', description: '2번 승강장에서 상황에 맞는 냉방 방법을 선택하고 에너지를 절약해 보세요.', color: '#49e19a', x: 14, z: -16, gate: { x: 14, z: -13.3, side: 'south' } },
  { id: 4, gateCode: 'B03', label: 'BOOTH 03 · 3번 승강장', title: '동물들을 구하라', description: '3번 승강장에서 생활 속 친환경 선택으로 기후 위기의 동물들을 지켜주세요.', color: '#ae7cff', x: -14, z: 0, gate: { x: -14, z: 2.7, side: 'south' } },
  { id: 5, gateCode: 'E01', label: 'CENTER 02 · 교육역', title: '초고속 냉동사이클', description: '교육역에서 KTX 초고속 환경의 냉방을 유지하는 냉동공조 기술을 배워보세요.', color: '#ffae48', x: 0, z: 0, gate: { x: 0, z: 2.7, side: 'south' } },
  { id: 6, gateCode: 'B04', label: 'BOOTH 04 · 4번 승강장', title: '나비효과', description: '4번 승강장에서 작은 생활 습관이 지구의 미래를 어떻게 바꾸는지 확인해 보세요.', color: '#82e76d', x: 14, z: 0, gate: { x: 14, z: 2.7, side: 'south' } },
  { id: 7, gateCode: 'R01', label: 'CENTER 03 · 리워드역', title: '굿즈샵', description: '리워드역에서 체험으로 모은 포인트로 에코 익스프레스 굿즈를 만나보세요.', color: '#ff5f83', x: 0, z: 16, gate: { x: 0, z: 13.3, side: 'north' } },
] as const

const FACILITIES: readonly StationFacility[] = [
  { gateCode: 'F01', label: 'FACILITY 01', title: '화장실', color: '#f1d64d', x: -14, z: 16, gate: { x: -14, z: 13.3, side: 'north' } },
  { gateCode: 'F02', label: 'FACILITY 02', title: '안내센터', color: '#64bff2', x: 14, z: 16, gate: { x: 14, z: 13.3, side: 'north' } },
] as const
const ZONES: readonly (RoadViewBooth | StationFacility)[] = [...BOOTHS, ...FACILITIES]

const COLLIDERS: readonly Collider[] = ZONES.flatMap((zone) => {
  const halfWidth = BOOTH_WIDTH / 2
  const halfDepth = BOOTH_DEPTH / 2
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
    const lookingTowardGate = (dx / distance) * Math.sin(player.yaw) + (dz / distance) * -Math.cos(player.yaw)
    if (lookingTowardGate < 0.58) continue
    if (distance < nearestDistance) { result = booth; nearestDistance = distance }
  }
  return result
}

function crossedGate(player: Player) {
  return BOOTHS.find((booth) => {
    if (Math.abs(player.x - booth.gate.x) > 1.08) return false
    if (booth.gate.side === 'south') return player.z < booth.gate.z - 0.24 && player.z > booth.gate.z - 1.6
    return player.z > booth.gate.z + 0.24 && player.z < booth.gate.z + 1.6
  }) ?? null
}

function makeLabelTexture(title: string, subtitle: string, accent: string) {
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
  context.fillStyle = 'rgba(255,255,255,.58)'; context.font = '700 30px system-ui, sans-serif'; context.fillText('PASS THROUGH THE SMART GATE', 512, 292)
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
  const accent = new THREE.Color(zone.color)
  const darkMaterial = new THREE.MeshStandardMaterial({ color: '#071b2e', metalness: 0.82, roughness: 0.22 })
  const glowMaterial = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.7, metalness: 0.35, roughness: 0.25 })
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
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeLabelTexture(zone.title, `${zone.gateCode} · SMART GATE`, zone.color), transparent: true, depthWrite: false }))
  sign.scale.set(3.9, 1.37, 1); sign.position.set(0, 3.35, 0); group.add(sign)
  const gateLight = new THREE.PointLight(accent, 3.2, 8, 2)
  gateLight.position.set(0, 2.25, zone.gate.side === 'south' ? 0.6 : -0.6); group.add(gateLight); group.userData.light = gateLight
  return group
}

function createBooth(zone: RoadViewBooth | StationFacility) {
  const group = new THREE.Group(); group.position.set(zone.x, 0, zone.z)
  const accent = new THREE.Color(zone.color)
  const shell = new THREE.MeshStandardMaterial({ color: '#0a2237', metalness: 0.62, roughness: 0.28 })
  const panel = new THREE.MeshStandardMaterial({ color: accent.clone().multiplyScalar(0.34), emissive: accent, emissiveIntensity: 0.4, metalness: 0.3, roughness: 0.38 })
  const glow = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.55, metalness: 0.22, roughness: 0.3 })
  const halfWidth = BOOTH_WIDTH / 2; const halfDepth = BOOTH_DEPTH / 2
  const backLocalZ = zone.gate.side === 'south' ? -halfDepth : halfDepth
  addRoundedBox(group, [BOOTH_WIDTH + 0.3, 0.32, BOOTH_DEPTH + 0.3], [0, 0.12, 0], shell, 0.14)
  addRoundedBox(group, [BOOTH_WIDTH, 4.9, 0.3], [0, 2.52, backLocalZ], panel, 0.1)
  addRoundedBox(group, [0.3, 4.9, BOOTH_DEPTH], [-halfWidth, 2.52, 0], shell, 0.1)
  addRoundedBox(group, [0.3, 4.9, BOOTH_DEPTH], [halfWidth, 2.52, 0], shell, 0.1)
  addRoundedBox(group, [BOOTH_WIDTH + 0.2, 0.3, BOOTH_DEPTH + 0.2], [0, 5.02, 0], shell, 0.12)
  for (const x of [-3.2, -1.6, 0, 1.6, 3.2]) addRoundedBox(group, [0.08, 0.1, BOOTH_DEPTH - 0.5], [x, 4.84, 0], glow, 0.025)
  addRoundedBox(group, [BOOTH_WIDTH - 0.7, 0.08, 1.25], [0, 0.34, backLocalZ * 0.58], glow, 0.03)
  const portal = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.055, 12, 72), new THREE.MeshBasicMaterial({ color: accent }))
  portal.position.set(0, 2.45, backLocalZ * 0.78); portal.userData.spin = zone.gate.side === 'south' ? 1 : -1; group.add(portal)
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 1), new THREE.MeshStandardMaterial({ color: '#dffffa', emissive: accent, emissiveIntensity: 1.25, metalness: 0.65, roughness: 0.18 }))
  core.position.copy(portal.position); core.userData.float = true; core.userData.baseY = core.position.y; group.add(core)
  const name = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeLabelTexture(zone.title, zone.label, zone.color), transparent: true, depthWrite: false }))
  name.scale.set(4.4, 1.55, 1); name.position.set(0, 3.4, backLocalZ * 0.91); group.add(name)
  return group
}

function createTrain(accent: string) {
  const train = new THREE.Group()
  const body = new THREE.MeshStandardMaterial({ color: '#dfeaf0', metalness: 0.72, roughness: 0.24 })
  const band = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.5, metalness: 0.55, roughness: 0.22 })
  const windowMaterial = new THREE.MeshStandardMaterial({ color: '#071725', emissive: '#3fc7ef', emissiveIntensity: 0.32, metalness: 0.55, roughness: 0.08 })
  for (let index = 0; index < 4; index += 1) {
    const car = new THREE.Group(); car.position.x = (index - 1.5) * 5.55
    addRoundedBox(car, [5.35, 1.8, 2.05], [0, 0, 0], body, 0.48)
    addRoundedBox(car, [5.38, 0.2, 2.08], [0, -0.42, 0], band, 0.06)
    for (let windowIndex = -2; windowIndex <= 2; windowIndex += 1) {
      addRoundedBox(car, [0.62, 0.48, 0.04], [windowIndex * 0.9, 0.26, 1.03], windowMaterial, 0.08)
      addRoundedBox(car, [0.62, 0.48, 0.04], [windowIndex * 0.9, 0.26, -1.03], windowMaterial, 0.08)
    }
    train.add(car)
  }
  return train
}

function buildMetaverseStation(scene: THREE.Scene) {
  const animated: THREE.Object3D[] = []
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 48), new THREE.MeshPhysicalMaterial({ color: '#10283a', metalness: 0.28, roughness: 0.2, clearcoat: 0.85, clearcoatRoughness: 0.18 }))
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor)
  const grid = new THREE.GridHelper(46, 46, '#32d8e6', '#1a5368')
  grid.material.transparent = true; grid.material.opacity = 0.2; grid.position.y = 0.015; scene.add(grid)
  const cyan = new THREE.MeshStandardMaterial({ color: '#45ddec', emissive: '#31cdda', emissiveIntensity: 1.5, metalness: 0.3, roughness: 0.25 })
  const green = new THREE.MeshStandardMaterial({ color: '#5de5ad', emissive: '#42cc98', emissiveIntensity: 1.3, metalness: 0.3, roughness: 0.25 })
  for (const x of [-7.1, 7.1]) addRoundedBox(scene, [0.08, 0.035, 46], [x, 0.045, 0], x < 0 ? cyan : green, 0.02)
  const structure = new THREE.MeshStandardMaterial({ color: '#102c43', metalness: 0.82, roughness: 0.25 })
  const glass = new THREE.MeshPhysicalMaterial({ color: '#60d9ed', transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.15, side: THREE.DoubleSide })
  for (const x of [-21, 21]) for (let z = -21; z <= 21; z += 7) addRoundedBox(scene, [0.38, 8.8, 0.48], [x, 4.4, z], structure, 0.1)
  for (let z = -21; z <= 21; z += 7) {
    addRoundedBox(scene, [44, 0.3, 0.38], [0, 8.7, z], structure, 0.1)
    const roofPanel = new THREE.Mesh(new THREE.PlaneGeometry(43.5, 6.5), glass)
    roofPanel.rotation.x = Math.PI / 2; roofPanel.position.set(0, 8.52, z + 3.35); scene.add(roofPanel)
  }
  for (const zone of ZONES) { scene.add(createBooth(zone)); const gate = createGate(zone); scene.add(gate); animated.push(gate) }
  const rail = new THREE.MeshStandardMaterial({ color: '#526777', metalness: 0.92, roughness: 0.18 })
  for (const z of [-8, 8]) {
    addRoundedBox(scene, [46, 0.14, 0.13], [0, 6.05, z - 1.12], rail, 0.03)
    addRoundedBox(scene, [46, 0.14, 0.13], [0, 6.05, z + 1.12], rail, 0.03)
  }
  const trainOne = createTrain('#1688ce'); trainOne.position.set(0, 6.25, -8); trainOne.userData.trainIndex = 0
  const trainTwo = createTrain('#1bb68b'); trainTwo.position.set(0, 6.25, 8); trainTwo.userData.trainIndex = 1
  scene.add(trainOne, trainTwo); animated.push(trainOne, trainTwo)
  const holoGroup = new THREE.Group(); holoGroup.position.set(-7, 1.2, 8)
  const holoMaterial = new THREE.MeshBasicMaterial({ color: '#72f6d1', transparent: true, opacity: 0.72 })
  for (const [radius, y, tilt] of [[1.65, 0, 0], [1.2, 0.72, 0.55], [0.78, 1.35, -0.65]] as const) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.035, 10, 72), holoMaterial)
    ring.position.y = y; ring.rotation.x = Math.PI / 2 + tilt; ring.userData.ring = true; holoGroup.add(ring)
  }
  scene.add(holoGroup); animated.push(holoGroup)
  const positions = new Float32Array(260 * 3)
  for (let index = 0; index < 260; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * 43; positions[index * 3 + 1] = 1.1 + Math.random() * 7; positions[index * 3 + 2] = (Math.random() - 0.5) * 45
  }
  const particleGeometry = new THREE.BufferGeometry(); particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: '#9afae2', size: 0.035, transparent: true, opacity: 0.55, sizeAttenuation: true }))
  scene.add(particles); animated.push(particles)
  return animated
}

function drawMap(canvas: HTMLCanvasElement, player: Player) {
  const context = canvas.getContext('2d'); if (!context) return
  const ratio = Math.min(window.devicePixelRatio || 1, 2); const size = Math.min(canvas.clientWidth, canvas.clientHeight)
  canvas.width = Math.round(size * ratio); canvas.height = Math.round(size * ratio); context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, size, size); context.fillStyle = '#f2f2e9'; context.fillRect(0, 0, size, size)
  const padding = size * 0.075; const mapSize = size - padding * 2; const worldToMap = (value: number) => padding + ((value + 23) / 46) * mapSize
  context.strokeStyle = 'rgba(42,76,92,.12)'; context.lineWidth = 1
  for (let index = 0; index <= 12; index += 1) {
    const point = padding + mapSize * index / 12
    context.beginPath(); context.moveTo(point, padding); context.lineTo(point, size - padding); context.stroke()
    context.beginPath(); context.moveTo(padding, point); context.lineTo(size - padding, point); context.stroke()
  }
  const drawTrain = (z: number, color: string, label: string) => {
    const x = worldToMap(-18); const y = worldToMap(z); const width = worldToMap(18) - x; const height = Math.max(8, size * 0.025)
    context.fillStyle = '#d8e1e5'; context.strokeStyle = '#526b78'; context.beginPath(); context.roundRect(x, y - height / 2, width, height, height / 2); context.fill(); context.stroke()
    context.fillStyle = color; context.fillRect(x + height, y - height * 0.12, width - height * 2, height * 0.24)
    context.fillStyle = '#17384c'; context.font = `800 ${Math.max(5, size * 0.014)}px system-ui, sans-serif`; context.textAlign = 'center'; context.fillText(label, x + width / 2, y + height * 0.1)
  }
  drawTrain(-8, '#1477b4', 'SKY LINE 01'); drawTrain(8, '#149a78', 'SKY LINE 02')
  for (const zone of ZONES) {
    const x = worldToMap(zone.x - BOOTH_WIDTH / 2); const y = worldToMap(zone.z - BOOTH_DEPTH / 2)
    const width = worldToMap(zone.x + BOOTH_WIDTH / 2) - x; const height = worldToMap(zone.z + BOOTH_DEPTH / 2) - y
    context.fillStyle = zone.color; context.globalAlpha = 0.83; context.beginPath(); context.roundRect(x, y, width, height, Math.max(5, size * 0.014)); context.fill(); context.globalAlpha = 1
    context.fillStyle = '#0c2737'; context.textAlign = 'center'; context.font = `900 ${Math.max(7, size * 0.019)}px system-ui, sans-serif`; context.fillText(zone.gateCode, x + width / 2, y + height * 0.44)
    context.font = `800 ${Math.max(5, size * 0.014)}px system-ui, sans-serif`; context.fillText(zone.title, x + width / 2, y + height * 0.7, width * 0.88)
    context.fillStyle = '#061927'; context.fillRect(worldToMap(zone.gate.x) - width * 0.14, worldToMap(zone.gate.z) - 2, width * 0.28, 4)
  }
  const x = worldToMap(player.x); const y = worldToMap(player.z)
  context.fillStyle = '#fff'; context.shadowColor = '#17c9ff'; context.shadowBlur = 10; context.beginPath(); context.arc(x, y, Math.max(4, size * 0.012), 0, Math.PI * 2); context.fill()
  context.strokeStyle = '#fff'; context.lineWidth = 2; context.beginPath(); context.moveTo(x, y); context.lineTo(x + Math.sin(player.yaw) * size * 0.035, y - Math.cos(player.yaw) * size * 0.035); context.stroke(); context.shadowBlur = 0
}

export default function RoadView3D({ onClose }: RoadView3DProps) {
  const sceneRef = useRef<HTMLCanvasElement>(null); const mapRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<Player>({ x: 0, z: 4, yaw: Math.PI, pitch: -0.04 }); const movementRef = useRef<Movement>({ ...EMPTY_MOVEMENT })
  const overlayRef = useRef({ introOpen: true, mapOpen: false, selectedBooth: null as RoadViewBooth | null }); const lastGateRef = useRef<number | null>(null)
  const [introOpen, setIntroOpen] = useState(true); const [mapOpen, setMapOpen] = useState(false)
  const [selectedBooth, setSelectedBooth] = useState<RoadViewBooth | null>(null); const [nearGate, setNearGate] = useState<RoadViewBooth | null>(null); const [renderError, setRenderError] = useState(false)
  overlayRef.current = { introOpen, mapOpen, selectedBooth }

  useEffect(() => { const previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = previousOverflow } }, [])

  useEffect(() => {
    const canvas = sceneRef.current; if (!canvas) return
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }) } catch { setRenderError(true); return }
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.22
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#061322'); scene.fog = new THREE.Fog('#061322', 24, 67)
    const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 120); camera.rotation.order = 'YXZ'
    scene.add(new THREE.HemisphereLight('#9de9ff', '#07101d', 1.55))
    const sun = new THREE.DirectionalLight('#d9f7ff', 2.6); sun.position.set(-12, 18, 10); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -26; sun.shadow.camera.right = 26; sun.shadow.camera.top = 26; sun.shadow.camera.bottom = -26; scene.add(sun)
    for (const [x, z, color] of [[-18, -8, '#42caff'], [18, -8, '#53e9a7'], [-18, 8, '#9d79ff'], [18, 8, '#ff9e50']] as const) {
      const light = new THREE.PointLight(color, 5, 21, 2); light.position.set(x, 4.8, z); scene.add(light)
    }
    const animated = buildMetaverseStation(scene); const clock = new THREE.Clock()
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
        event.preventDefault(); if (overlay.selectedBooth) setSelectedBooth(null); else if (overlay.mapOpen) setMapOpen(false); else if (overlay.introOpen) setIntroOpen(false); else onClose(); return
      }
      if (pressed && key === 'm') { event.preventDefault(); setMapOpen((current) => !current); return }
      const keyMap: Record<string, keyof Movement> = { w: 'forward', arrowup: 'forward', s: 'backward', arrowdown: 'backward', a: 'left', d: 'right', arrowleft: 'turnLeft', arrowright: 'turnRight' }
      const movementKey = keyMap[key]; if (movementKey) { event.preventDefault(); movementRef.current[movementKey] = pressed }
    }
    const handleKeyDown = (event: KeyboardEvent) => handleKey(event, true); const handleKeyUp = (event: KeyboardEvent) => handleKey(event, false)
    const handlePointerDown = (event: PointerEvent) => { if (event.pointerType === 'mouse' && event.button !== 0) return; dragging = true; pointerX = event.clientX; pointerY = event.clientY; canvas.setPointerCapture(event.pointerId) }
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging || overlayRef.current.introOpen) return
      const player = playerRef.current; player.yaw -= (event.clientX - pointerX) * 0.0042; player.pitch = THREE.MathUtils.clamp(player.pitch - (event.clientY - pointerY) * 0.0028, -0.42, 0.42)
      pointerX = event.clientX; pointerY = event.clientY
    }
    const handlePointerUp = (event: PointerEvent) => { dragging = false; if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId) }
    const frame = () => {
      const delta = Math.min(clock.getDelta(), 0.04); const elapsed = clock.elapsedTime; const player = playerRef.current; const movement = movementRef.current
      if (!overlayRef.current.introOpen && !overlayRef.current.mapOpen && !overlayRef.current.selectedBooth) {
        player.yaw += (Number(movement.turnLeft) - Number(movement.turnRight)) * delta * 1.9
        const forward = Number(movement.forward) - Number(movement.backward); const side = Number(movement.right) - Number(movement.left); const magnitude = Math.hypot(forward, side) || 1; const speed = 5.15 * delta
        const moveX = (Math.sin(player.yaw) * forward + Math.cos(player.yaw) * side) / magnitude * speed; const moveZ = (-Math.cos(player.yaw) * forward + Math.sin(player.yaw) * side) / magnitude * speed
        if (isWalkable(player.x + moveX, player.z)) player.x += moveX; if (isWalkable(player.x, player.z + moveZ)) player.z += moveZ
      }
      camera.position.set(player.x, 1.68 + Math.sin(elapsed * 8) * (movement.forward || movement.backward ? 0.018 : 0), player.z); camera.rotation.set(player.pitch, player.yaw, 0)
      for (const object of animated) {
        if (object.userData.trainIndex !== undefined) object.position.x = Math.sin(elapsed * 0.24 + object.userData.trainIndex * Math.PI) * 11
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
      if (!overlayRef.current.introOpen && !overlayRef.current.mapOpen && !overlayRef.current.selectedBooth) {
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
        <div className="roadview__brand"><span className="roadview__brand-mark" aria-hidden="true"><Icon name="map" /></span><span className="roadview__brand-copy"><strong>ECO METAVERSE</strong><small>IMMERSIVE STATION 01</small></span></div>
        <div className="roadview__top-actions"><button type="button" onClick={() => setMapOpen(true)} aria-label="전시장 지도 열기">역사 지도</button><button type="button" className="roadview__close" onClick={onClose} aria-label="3D 로드뷰 닫기">×</button></div>
      </header>
      <div className="roadview__crosshair" aria-hidden="true"><i /><i /></div>
      <p className="roadview__location"><span /> ECO EXPRESS METAVERSE · SKY PLATFORM · 7 SMART GATES</p>
      {nearGate && !introOpen && !mapOpen && !selectedBooth ? <div className="roadview__gate-notice" role="status"><span><Icon name="train" /></span><p><strong>{nearGate.label}</strong><small>{nearGate.gateCode} 스마트 개찰구를 통과하면 안내가 자동으로 열립니다.</small></p></div> : null}
      <div className="roadview__desktop-help" aria-hidden="true"><span><kbd>W A S D</kbd> 이동</span><span><kbd>드래그</kbd> 시점</span><span><kbd>SMART GATE</kbd> 자동 안내</span><span><kbd>M</kbd> 지도</span></div>
      <div className="roadview__mobile-controls" aria-label="3D 로드뷰 이동 조작">
        <div className="roadview__dpad">
          <button type="button" aria-label="앞으로 이동" onPointerDown={() => setMovement('forward', true)} onPointerUp={() => setMovement('forward', false)} onPointerCancel={() => setMovement('forward', false)}>▲</button>
          <button type="button" aria-label="왼쪽으로 회전" onPointerDown={() => setMovement('turnLeft', true)} onPointerUp={() => setMovement('turnLeft', false)} onPointerCancel={() => setMovement('turnLeft', false)}>◀</button>
          <button type="button" aria-label="뒤로 이동" onPointerDown={() => setMovement('backward', true)} onPointerUp={() => setMovement('backward', false)} onPointerCancel={() => setMovement('backward', false)}>▼</button>
          <button type="button" aria-label="오른쪽으로 회전" onPointerDown={() => setMovement('turnRight', true)} onPointerUp={() => setMovement('turnRight', false)} onPointerCancel={() => setMovement('turnRight', false)}>▶</button>
        </div>
        <div className="roadview__mobile-gate-guide"><Icon name="train" /><span><strong>{nearGate ? nearGate.gateCode : 'AUTO GATE'}</strong><small>개찰구 통과 시 자동 안내</small></span></div>
      </div>
      {introOpen ? <div className="roadview__overlay"><section className="roadview__intro" aria-labelledby="roadview-intro-title">
        <span className="roadview__eyebrow">ECO EXPRESS · IMMERSIVE STATION</span><h2 id="roadview-intro-title">미래형 에코 역사를<br /><em>직접 걸어보세요</em></h2>
        <p>실제 3D 공간으로 구현된 메타버스 역사입니다. 움직이는 스카이 트레인과 빛나는 전시관을 둘러보고, 스마트 개찰구를 통과해 각 부스의 이야기를 만나보세요.</p>
        <div className="roadview__intro-controls"><span><kbd>W A S D</kbd><small>자유롭게 이동</small></span><span><kbd>화면 드래그</kbd><small>360° 시점 이동</small></span><span><kbd>SMART GATE</kbd><small>안내 자동 열림</small></span></div>
        <div className="roadview__quality"><span>REAL 3D</span><span>SKY TRAIN</span><span>AUTO GATE</span></div>
        <button type="button" className="roadview__enter" onClick={() => setIntroOpen(false)} autoFocus>메타버스 역사 입장 <span>→</span></button>
      </section></div> : null}
      {mapOpen ? <div className="roadview__overlay roadview__overlay--panel" onMouseDown={(event) => event.target === event.currentTarget && setMapOpen(false)}><section className="roadview__panel" role="dialog" aria-modal="true" aria-labelledby="roadview-map-title">
        <header><div><span>METAVERSE STATION DIRECTORY</span><h2 id="roadview-map-title">에코 익스프레스 역사 지도</h2></div><button type="button" onClick={() => setMapOpen(false)} aria-label="지도 닫기">×</button></header>
        <canvas ref={mapRef} className="roadview__map" aria-label="현재 위치, 두 개의 스카이 라인과 일곱 개 스마트 개찰구가 표시된 역사 지도" /><p className="roadview__map-legend"><i /> 현재 위치 <b /> 스마트 개찰구</p>
      </section></div> : null}
      {selectedBooth ? <div className="roadview__overlay roadview__overlay--panel" onMouseDown={(event) => event.target === event.currentTarget && setSelectedBooth(null)}><section className="roadview__panel roadview__booth-info" role="dialog" aria-modal="true" aria-labelledby="roadview-booth-title" style={{ '--roadview-accent': selectedBooth.color } as CSSProperties}>
        <header><div><span>{selectedBooth.label}</span><h2 id="roadview-booth-title">{selectedBooth.title}</h2></div><button type="button" onClick={() => setSelectedBooth(null)} aria-label="부스 안내 닫기">×</button></header>
        <div className="roadview__booth-symbol" aria-hidden="true"><span>{selectedBooth.gateCode}</span><small>SMART GATE PASSED</small></div><p>{selectedBooth.description}</p>
        <button type="button" className="roadview__panel-action" onClick={() => setSelectedBooth(null)}>메타버스 역사로 돌아가기</button>
      </section></div> : null}
    </section>
  )
}
