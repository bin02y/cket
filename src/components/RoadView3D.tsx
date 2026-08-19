import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Icon } from './Icon'

type RoadView3DProps = {
  onClose: () => void
}

type RoadViewBooth = {
  id: number
  gateCode: string
  label: string
  title: string
  description: string
  color: string
  wall: string
  room: StationRoom
  gate: StationGate
}

type GateSide = 'top' | 'bottom'

type StationGate = {
  x: number
  y: number
  side: GateSide
}

type StationRoom = {
  x1: number
  y1: number
  x2: number
  y2: number
}

type StationFacility = {
  label: string
  title: string
  color: string
  wall: string
  room: StationRoom
  gate: StationGate
}

type Player = {
  x: number
  y: number
  angle: number
}

type Movement = {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  turnLeft: boolean
  turnRight: boolean
}

const BOOTHS: readonly RoadViewBooth[] = [
  { id: 1, gateCode: 'B01', label: 'BOOTH 01 · 1번 승강장', title: '빙하 위 펭귄 구조', description: '1번 승강장에서 녹는 빙하를 건너 펭귄이 안전한 곳에 도착하도록 도와주세요.', color: '#54c7ff', wall: '2', room: { x1: 2, y1: 2, x2: 7, y2: 5 }, gate: { x: 4.5, y: 5, side: 'bottom' } },
  { id: 2, gateCode: 'L01', label: 'CENTER 01 · 실험역', title: '냉동공조 실험실', description: '열차 냉방을 책임지는 압축·응축·팽창·증발 장치를 실험역에서 만나보세요.', color: '#c7ef54', wall: '3', room: { x1: 11, y1: 2, x2: 17, y2: 5 }, gate: { x: 14, y: 5, side: 'bottom' } },
  { id: 3, gateCode: 'B02', label: 'BOOTH 02 · 2번 승강장', title: '무더운 여름', description: '2번 승강장에서 상황에 맞는 냉방 방법을 선택하고 에너지를 절약해 보세요.', color: '#58d697', wall: '4', room: { x1: 21, y1: 2, x2: 26, y2: 5 }, gate: { x: 23.5, y: 5, side: 'bottom' } },
  { id: 4, gateCode: 'B03', label: 'BOOTH 03 · 3번 승강장', title: '동물들을 구하라', description: '3번 승강장에서 생활 속 친환경 선택으로 기후 위기의 동물들을 지켜주세요.', color: '#a983f5', wall: '5', room: { x1: 2, y1: 10, x2: 7, y2: 13 }, gate: { x: 4.5, y: 13, side: 'bottom' } },
  { id: 5, gateCode: 'E01', label: 'CENTER 02 · 교육역', title: '초고속 냉동사이클', description: '교육역에서 KTX 초고속 환경의 냉방을 유지하는 냉동공조 기술을 배워보세요.', color: '#ffad55', wall: '6', room: { x1: 11, y1: 10, x2: 17, y2: 13 }, gate: { x: 14, y: 13, side: 'bottom' } },
  { id: 6, gateCode: 'B04', label: 'BOOTH 04 · 4번 승강장', title: '나비효과', description: '4번 승강장에서 작은 생활 습관이 지구의 미래를 어떻게 바꾸는지 확인해 보세요.', color: '#9ee683', wall: '7', room: { x1: 21, y1: 10, x2: 26, y2: 13 }, gate: { x: 23.5, y: 13, side: 'bottom' } },
  { id: 7, gateCode: 'R01', label: 'CENTER 03 · 리워드역', title: '굿즈샵', description: '리워드역에서 체험으로 모은 포인트로 에코 익스프레스 굿즈를 만나보세요.', color: '#ff6681', wall: '8', room: { x1: 11, y1: 18, x2: 17, y2: 21 }, gate: { x: 14, y: 18, side: 'top' } },
] as const

const FACILITIES: readonly StationFacility[] = [
  { label: 'FACILITY 01', title: '화장실', color: '#f0d44f', wall: '9', room: { x1: 2, y1: 18, x2: 7, y2: 21 }, gate: { x: 4.5, y: 18, side: 'top' } },
  { label: 'FACILITY 02', title: '안내센터', color: '#70bde8', wall: 'a', room: { x1: 21, y1: 18, x2: 26, y2: 21 }, gate: { x: 23.5, y: 18, side: 'top' } },
] as const

const MAP_WIDTH = 29
const MAP_HEIGHT = 24

function buildStationMap() {
  const grid = Array.from({ length: MAP_HEIGHT }, () => Array.from({ length: MAP_WIDTH }, () => '0'))
  for (let x = 0; x < MAP_WIDTH; x += 1) {
    grid[0][x] = '1'
    grid[MAP_HEIGHT - 1][x] = '1'
  }
  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    grid[y][0] = '1'
    grid[y][MAP_WIDTH - 1] = '1'
  }

  for (const zone of [...BOOTHS, ...FACILITIES]) {
    const { x1, y1, x2, y2 } = zone.room
    for (let x = x1; x <= x2; x += 1) {
      grid[y1][x] = zone.wall
      grid[y2][x] = zone.wall
    }
    for (let y = y1; y <= y2; y += 1) {
      grid[y][x1] = zone.wall
      grid[y][x2] = zone.wall
    }
    const gateY = Math.round(zone.gate.y)
    const gateLeft = Math.floor(zone.gate.x)
    grid[gateY][gateLeft - 1] = '0'
    grid[gateY][gateLeft] = '0'
    grid[gateY][gateLeft + 1] = '0'
  }

  return grid.map((row) => row.join(''))
}

const MAP = buildStationMap()

const WALL_COLORS: Record<string, [number, number, number]> = {
  '1': [28, 48, 70],
  '2': [20, 105, 139],
  '3': [22, 128, 101],
  '4': [151, 91, 58],
  '5': [34, 118, 93],
  '6': [147, 123, 44],
  '7': [52, 80, 145],
  '8': [151, 53, 76],
  '9': [125, 112, 42],
  'a': [50, 103, 137],
}

const FOV = Math.PI / 3
const EMPTY_MOVEMENT: Movement = { forward: false, backward: false, left: false, right: false, turnLeft: false, turnRight: false }

function normalizeAngle(angle: number) {
  let normalized = angle
  while (normalized > Math.PI) normalized -= Math.PI * 2
  while (normalized < -Math.PI) normalized += Math.PI * 2
  return normalized
}

function mapCell(x: number, y: number) {
  const row = MAP[Math.floor(y)]
  return row?.[Math.floor(x)] ?? '1'
}

function isWalkable(x: number, y: number) {
  const radius = 0.22
  return mapCell(x - radius, y - radius) === '0'
    && mapCell(x + radius, y - radius) === '0'
    && mapCell(x - radius, y + radius) === '0'
    && mapCell(x + radius, y + radius) === '0'
}

function nearestGate(player: Player) {
  let result: RoadViewBooth | null = null
  let nearestDistance = 2.5
  for (const booth of BOOTHS) {
    const dx = booth.gate.x - player.x
    const dy = booth.gate.y - player.y
    const distance = Math.hypot(dx, dy)
    const angle = Math.abs(normalizeAngle(Math.atan2(dy, dx) - player.angle))
    if (angle > FOV * 0.72) continue
    if (distance < nearestDistance) {
      result = booth
      nearestDistance = distance
    }
  }
  return result
}

function crossedGate(player: Player) {
  return BOOTHS.find((booth) => {
    const horizontalMatch = Math.abs(player.x - booth.gate.x) < 0.68
    if (!horizontalMatch) return false
    if (booth.gate.side === 'bottom') return player.y < booth.gate.y - 0.06 && player.y > booth.gate.y - 1.05
    return player.y > booth.gate.y + 0.06 && player.y < booth.gate.y + 1.05
  }) ?? null
}

function drawRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
  context.fill()
  context.stroke()
}

function renderScene(canvas: HTMLCanvasElement, player: Player) {
  const context = canvas.getContext('2d')
  if (!context) return

  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const pixelWidth = Math.round(width * ratio)
  const pixelHeight = Math.round(height * ratio)
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth
    canvas.height = pixelHeight
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0)

  const ceiling = context.createLinearGradient(0, 0, 0, height * 0.56)
  ceiling.addColorStop(0, '#07131f')
  ceiling.addColorStop(0.72, '#173248')
  ceiling.addColorStop(1, '#27475b')
  context.fillStyle = ceiling
  context.fillRect(0, 0, width, height * 0.56)

  context.strokeStyle = 'rgba(185, 229, 239, .16)'
  context.lineWidth = Math.max(1, width / 800)
  for (let index = -3; index <= 3; index += 1) {
    context.beginPath()
    context.moveTo(width / 2 + index * width * 0.045, height * 0.48)
    context.lineTo(width / 2 + index * width * 0.19, 0)
    context.stroke()
  }
  context.fillStyle = 'rgba(211, 247, 255, .72)'
  context.fillRect(width * 0.2, height * 0.105, width * 0.18, Math.max(2, height * 0.007))
  context.fillRect(width * 0.62, height * 0.105, width * 0.18, Math.max(2, height * 0.007))

  const floor = context.createLinearGradient(0, height * 0.48, 0, height)
  floor.addColorStop(0, '#314653')
  floor.addColorStop(0.45, '#192c38')
  floor.addColorStop(1, '#07131e')
  context.fillStyle = floor
  context.fillRect(0, height * 0.5, width, height * 0.5)

  context.strokeStyle = 'rgba(80, 190, 220, .12)'
  context.lineWidth = 1
  for (let index = 1; index < 10; index += 1) {
    const y = height * 0.5 + (height * 0.5) * (index / 10) ** 1.75
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(width, y)
    context.stroke()
  }

  const platformGradient = context.createLinearGradient(0, 0, width, 0)
  platformGradient.addColorStop(0, 'rgba(255,205,66,0)')
  platformGradient.addColorStop(0.18, 'rgba(255,205,66,.82)')
  platformGradient.addColorStop(0.82, 'rgba(255,205,66,.82)')
  platformGradient.addColorStop(1, 'rgba(255,205,66,0)')
  context.fillStyle = platformGradient
  context.fillRect(0, height * 0.535, width, Math.max(2, height * 0.006))
  context.fillStyle = 'rgba(215,239,245,.13)'
  context.fillRect(0, height * 0.548, width, Math.max(1, height * 0.003))

  const columnWidth = width < 700 ? 3 : 2
  const depthBuffer: number[] = []
  for (let screenX = 0; screenX < width; screenX += columnWidth) {
    const rayAngle = player.angle - FOV / 2 + (screenX / width) * FOV
    const rayCos = Math.cos(rayAngle)
    const raySin = Math.sin(rayAngle)
    let distance = 0.03
    let cell = '0'
    while (distance < 30 && cell === '0') {
      distance += 0.035
      cell = mapCell(player.x + rayCos * distance, player.y + raySin * distance)
    }
    const correctedDistance = Math.max(0.01, distance * Math.cos(rayAngle - player.angle))
    depthBuffer[Math.floor(screenX / columnWidth)] = correctedDistance
    const wallHeight = Math.min(height * 1.45, height / correctedDistance)
    const top = (height - wallHeight) / 2
    const base = WALL_COLORS[cell] ?? WALL_COLORS['1']
    const shade = Math.max(0.28, 1 - correctedDistance / 18)
    context.fillStyle = `rgb(${Math.round(base[0] * shade)},${Math.round(base[1] * shade)},${Math.round(base[2] * shade)})`
    context.fillRect(screenX, top, columnWidth + 1, wallHeight)
    if (cell !== '1') {
      context.fillStyle = `rgba(225, 244, 246, ${Math.max(0.07, 0.2 - correctedDistance / 80)})`
      context.fillRect(screenX, top + wallHeight * 0.7, columnWidth + 1, Math.max(2, wallHeight * 0.035))
      context.fillStyle = `rgba(6, 26, 39, ${Math.max(0.08, 0.24 - correctedDistance / 70)})`
      context.fillRect(screenX, top + wallHeight * 0.75, columnWidth + 1, Math.max(2, wallHeight * 0.07))
    }
    context.fillStyle = `rgba(105, 226, 255, ${Math.max(0, 0.12 - correctedDistance / 180)})`
    context.fillRect(screenX, top, 1, wallHeight)
  }

  const visibleBooths = BOOTHS.map((booth) => {
    const dx = booth.gate.x - player.x
    const dy = booth.gate.y - player.y
    return { booth, distance: Math.hypot(dx, dy), angle: normalizeAngle(Math.atan2(dy, dx) - player.angle) }
  }).filter(({ angle, distance }) => Math.abs(angle) < FOV * 0.68 && distance > 0.45)
    .sort((first, second) => second.distance - first.distance)

  for (const { booth, distance, angle } of visibleBooths) {
    const screenX = width / 2 + (Math.tan(angle) / Math.tan(FOV / 2)) * width / 2
    const depth = depthBuffer[Math.max(0, Math.min(depthBuffer.length - 1, Math.floor(screenX / columnWidth)))] ?? 30
    if (distance > depth + 0.5) continue
    const gateWidth = Math.max(74, Math.min(220, height / distance * 1.08))
    const gateHeight = gateWidth * 0.78
    const x = screenX - gateWidth / 2
    const y = height / 2 - gateHeight * 0.76
    const postWidth = Math.max(8, gateWidth * 0.1)
    const signHeight = gateHeight * 0.34

    context.save()
    context.shadowColor = booth.color
    context.shadowBlur = Math.min(28, 80 / distance)
    context.fillStyle = 'rgba(7, 23, 36, .94)'
    context.strokeStyle = booth.color
    context.lineWidth = Math.max(1.5, gateWidth / 70)
    drawRoundedRect(context, x, y, gateWidth, signHeight, Math.max(8, gateWidth / 12))
    context.shadowBlur = 0
    context.fillStyle = booth.color
    context.font = `900 ${Math.max(7, gateWidth / 15)}px system-ui, sans-serif`
    context.textAlign = 'center'
    context.fillText(`${booth.gateCode} · TICKET GATE`, screenX, y + signHeight * 0.38)
    context.fillStyle = '#ffffff'
    context.font = `800 ${Math.max(8, gateWidth / 12)}px system-ui, sans-serif`
    context.fillText(booth.title, screenX, y + signHeight * 0.73, gateWidth * 0.9)

    const postTop = y + signHeight
    const postHeight = gateHeight - signHeight
    context.fillStyle = 'rgba(9, 31, 45, .96)'
    context.strokeStyle = booth.color
    context.fillRect(x + gateWidth * 0.08, postTop, postWidth, postHeight)
    context.strokeRect(x + gateWidth * 0.08, postTop, postWidth, postHeight)
    context.fillRect(x + gateWidth * 0.82, postTop, postWidth, postHeight)
    context.strokeRect(x + gateWidth * 0.82, postTop, postWidth, postHeight)
    context.strokeStyle = 'rgba(255,255,255,.72)'
    context.lineWidth = Math.max(1, gateWidth / 100)
    context.beginPath()
    context.moveTo(screenX - gateWidth * 0.22, postTop + postHeight * 0.64)
    context.lineTo(screenX, postTop + postHeight * 0.45)
    context.lineTo(screenX + gateWidth * 0.22, postTop + postHeight * 0.64)
    context.stroke()
    context.fillStyle = 'rgba(255,255,255,.62)'
    context.font = `750 ${Math.max(6, gateWidth / 17)}px system-ui, sans-serif`
    context.fillText(`${distance.toFixed(1)}m · 통과 시 자동 안내`, screenX, y + gateHeight * 1.08)
    context.restore()
  }

  const vignette = context.createRadialGradient(width / 2, height / 2, height * 0.12, width / 2, height / 2, Math.max(width, height) * 0.68)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,7,13,.66)')
  context.fillStyle = vignette
  context.fillRect(0, 0, width, height)
}

function drawMap(canvas: HTMLCanvasElement, player: Player) {
  const context = canvas.getContext('2d')
  if (!context) return
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const size = Math.min(canvas.clientWidth, canvas.clientHeight)
  canvas.width = Math.round(size * ratio)
  canvas.height = Math.round(size * ratio)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, size, size)
  const cellSize = Math.min(size / MAP[0].length, size / MAP.length)
  const offsetX = (size - MAP[0].length * cellSize) / 2
  const offsetY = (size - MAP.length * cellSize) / 2

  context.fillStyle = '#f4f1e7'
  context.fillRect(0, 0, size, size)
  context.strokeStyle = 'rgba(74, 101, 112, .12)'
  context.lineWidth = 0.7
  for (let x = 1; x < MAP_WIDTH; x += 1) {
    context.beginPath()
    context.moveTo(offsetX + x * cellSize, offsetY)
    context.lineTo(offsetX + x * cellSize, offsetY + MAP_HEIGHT * cellSize)
    context.stroke()
  }
  for (let y = 1; y < MAP_HEIGHT; y += 1) {
    context.beginPath()
    context.moveTo(offsetX, offsetY + y * cellSize)
    context.lineTo(offsetX + MAP_WIDTH * cellSize, offsetY + y * cellSize)
    context.stroke()
  }

  const drawTrain = (worldY: number, label: string) => {
    const x = offsetX + 4.4 * cellSize
    const y = offsetY + worldY * cellSize
    const width = 20.2 * cellSize
    const height = Math.max(6, cellSize * 0.9)
    context.fillStyle = '#c9d4db'
    context.strokeStyle = '#496473'
    context.lineWidth = 1
    context.beginPath()
    context.roundRect(x, y - height / 2, width, height, height / 2)
    context.fill()
    context.stroke()
    context.fillStyle = '#146fa9'
    context.fillRect(x + height * 0.8, y - height * 0.14, width - height * 1.6, height * 0.28)
    context.fillStyle = '#17384c'
    for (let windowIndex = 0; windowIndex < 9; windowIndex += 1) {
      context.fillRect(x + height * 1.05 + windowIndex * ((width - height * 2) / 9), y - height * 0.31, Math.max(2, height * 0.44), height * 0.18)
    }
    context.fillStyle = '#102b3a'
    context.font = `800 ${Math.max(5, cellSize * 0.34)}px system-ui, sans-serif`
    context.textAlign = 'center'
    context.fillText(label, x + width / 2, y + height * 0.12)
  }

  drawTrain(7.5, 'ECO EXPRESS · PLATFORM 1')
  drawTrain(15.5, 'ECO EXPRESS · PLATFORM 2')

  const zones: readonly (RoadViewBooth | StationFacility)[] = [...BOOTHS, ...FACILITIES]
  for (const zone of zones) {
    const roomX = offsetX + zone.room.x1 * cellSize
    const roomY = offsetY + zone.room.y1 * cellSize
    const roomWidth = (zone.room.x2 - zone.room.x1) * cellSize
    const roomHeight = (zone.room.y2 - zone.room.y1) * cellSize
    context.globalAlpha = 0.86
    context.fillStyle = zone.color
    context.strokeStyle = zone.color
    context.lineWidth = 1.4
    context.beginPath()
    context.roundRect(roomX, roomY, roomWidth, roomHeight, Math.max(5, cellSize * 0.42))
    context.fill()
    context.globalAlpha = 1
    context.stroke()
    context.fillStyle = '#102736'
    context.textAlign = 'center'
    context.font = `850 ${Math.max(5.5, cellSize * 0.42)}px system-ui, sans-serif`
    context.fillText(zone.label, roomX + roomWidth / 2, roomY + roomHeight * 0.42, roomWidth * 0.88)
    context.font = `900 ${Math.max(6.5, cellSize * 0.52)}px system-ui, sans-serif`
    context.fillText(zone.title, roomX + roomWidth / 2, roomY + roomHeight * 0.7, roomWidth * 0.86)

    const gateX = offsetX + zone.gate.x * cellSize
    const gateY = offsetY + zone.gate.y * cellSize
    context.fillStyle = '#091d2b'
    context.strokeStyle = '#ffffff'
    context.lineWidth = 1
    context.fillRect(gateX - cellSize * 0.55, gateY - cellSize * 0.16, cellSize * 1.1, cellSize * 0.32)
    context.strokeRect(gateX - cellSize * 0.55, gateY - cellSize * 0.16, cellSize * 1.1, cellSize * 0.32)
  }

  context.strokeStyle = '#536c79'
  context.lineWidth = 2
  context.strokeRect(offsetX, offsetY, MAP_WIDTH * cellSize, MAP_HEIGHT * cellSize)

  const playerX = offsetX + player.x * cellSize
  const playerY = offsetY + player.y * cellSize
  context.fillStyle = '#ffffff'
  context.beginPath()
  context.arc(playerX, playerY, Math.max(4, cellSize * 0.42), 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = '#ffffff'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(playerX, playerY)
  context.lineTo(playerX + Math.cos(player.angle) * cellSize * 1.6, playerY + Math.sin(player.angle) * cellSize * 1.6)
  context.stroke()
}

export default function RoadView3D({ onClose }: RoadView3DProps) {
  const sceneRef = useRef<HTMLCanvasElement>(null)
  const mapRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<Player>({ x: 14, y: 16.4, angle: -Math.PI / 2 })
  const movementRef = useRef<Movement>({ ...EMPTY_MOVEMENT })
  const overlayRef = useRef({ introOpen: true, mapOpen: false, selectedBooth: null as RoadViewBooth | null })
  const lastGateRef = useRef<number | null>(null)
  const [introOpen, setIntroOpen] = useState(true)
  const [mapOpen, setMapOpen] = useState(false)
  const [selectedBooth, setSelectedBooth] = useState<RoadViewBooth | null>(null)
  const [nearGate, setNearGate] = useState<RoadViewBooth | null>(null)

  overlayRef.current = { introOpen, mapOpen, selectedBooth }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const appRoot = document.getElementById('root')
    const rootWasInert = appRoot?.hasAttribute('inert') ?? false
    document.body.style.overflow = 'hidden'
    appRoot?.setAttribute('inert', '')
    return () => {
      document.body.style.overflow = previousOverflow
      if (!rootWasInert) appRoot?.removeAttribute('inert')
    }
  }, [])

  useEffect(() => {
    const canvas = sceneRef.current
    if (!canvas) return
    let animationFrame = 0
    let previousTime = performance.now()
    let previousNearGateId: number | null = null
    let dragging = false
    let pointerX = 0

    const stopMovement = () => {
      movementRef.current = { ...EMPTY_MOVEMENT }
    }

    const handleKey = (event: KeyboardEvent, pressed: boolean) => {
      const key = event.key.toLowerCase()
      const overlay = overlayRef.current
      if (pressed && key === 'escape') {
        event.preventDefault()
        if (overlay.selectedBooth) setSelectedBooth(null)
        else if (overlay.mapOpen) setMapOpen(false)
        else if (overlay.introOpen) setIntroOpen(false)
        else onClose()
        return
      }
      if (pressed && key === 'm') {
        event.preventDefault()
        setMapOpen((current) => !current)
        return
      }
      const keyMap: Record<string, keyof Movement> = {
        w: 'forward', arrowup: 'forward', s: 'backward', arrowdown: 'backward',
        a: 'left', d: 'right', arrowleft: 'turnLeft', arrowright: 'turnRight',
      }
      const movementKey = keyMap[key]
      if (movementKey) {
        event.preventDefault()
        movementRef.current[movementKey] = pressed
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => handleKey(event, true)
    const handleKeyUp = (event: KeyboardEvent) => handleKey(event, false)
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      dragging = true
      pointerX = event.clientX
      canvas.setPointerCapture(event.pointerId)
    }
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging || overlayRef.current.introOpen) return
      const delta = event.clientX - pointerX
      pointerX = event.clientX
      playerRef.current.angle = normalizeAngle(playerRef.current.angle + delta * 0.006)
    }
    const handlePointerUp = (event: PointerEvent) => {
      dragging = false
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    }

    const frame = (currentTime: number) => {
      const deltaTime = Math.min(0.04, (currentTime - previousTime) / 1000)
      previousTime = currentTime
      const movement = movementRef.current
      const player = playerRef.current

      if (!overlayRef.current.introOpen && !overlayRef.current.mapOpen && !overlayRef.current.selectedBooth) {
        const turnDirection = Number(movement.turnRight) - Number(movement.turnLeft)
        player.angle = normalizeAngle(player.angle + turnDirection * deltaTime * 1.8)
        const forwardDirection = Number(movement.forward) - Number(movement.backward)
        const sideDirection = Number(movement.right) - Number(movement.left)
        const speed = deltaTime * 2.65
        const moveX = (Math.cos(player.angle) * forwardDirection + Math.cos(player.angle + Math.PI / 2) * sideDirection) * speed
        const moveY = (Math.sin(player.angle) * forwardDirection + Math.sin(player.angle + Math.PI / 2) * sideDirection) * speed
        if (isWalkable(player.x + moveX, player.y)) player.x += moveX
        if (isWalkable(player.x, player.y + moveY)) player.y += moveY
      }

      const gate = nearestGate(player)
      const nearGateId = gate?.id ?? null
      if (nearGateId !== previousNearGateId) {
        previousNearGateId = nearGateId
        setNearGate(gate)
      }

      if (!overlayRef.current.introOpen && !overlayRef.current.mapOpen && !overlayRef.current.selectedBooth) {
        const passedBooth = crossedGate(player)
        if (!passedBooth) {
          lastGateRef.current = null
        } else if (lastGateRef.current !== passedBooth.id) {
          lastGateRef.current = passedBooth.id
          movementRef.current = { ...EMPTY_MOVEMENT }
          setSelectedBooth(passedBooth)
        }
      }
      renderScene(canvas, player)
      if (overlayRef.current.mapOpen && mapRef.current) drawMap(mapRef.current, player)
      animationFrame = requestAnimationFrame(frame)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', stopMovement)
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointercancel', handlePointerUp)
    animationFrame = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', stopMovement)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [onClose])

  const setMovement = (key: keyof Movement, pressed: boolean) => {
    movementRef.current[key] = pressed
  }

  return (
    <section className="roadview" role="dialog" aria-modal="true" aria-label="에코 익스프레스 기차역 3D 로드뷰">
      <canvas ref={sceneRef} className="roadview__scene" aria-label="개찰구를 통과해 안내를 확인하는 3D 에코 익스프레스 역사" />

      <header className="roadview__topbar">
        <div className="roadview__brand">
          <span className="roadview__brand-mark" aria-hidden="true"><Icon name="map" /></span>
          <span className="roadview__brand-copy"><strong>3D ROADVIEW</strong><small>INTERACTIVE EXHIBITION</small></span>
        </div>
        <div className="roadview__top-actions">
          <button type="button" onClick={() => setMapOpen(true)} aria-label="전시장 지도 열기">지도</button>
          <button type="button" className="roadview__close" onClick={onClose} aria-label="3D 로드뷰 닫기">×</button>
        </div>
      </header>

      <div className="roadview__crosshair" aria-hidden="true"><i /><i /></div>
      <p className="roadview__location"><span /> ECO EXPRESS CENTRAL · 2 PLATFORMS · 7 GATES</p>

      {nearGate && !introOpen && !mapOpen && !selectedBooth ? (
        <div className="roadview__gate-notice" role="status"><span><Icon name="train" /></span><p><strong>{nearGate.label}</strong><small>입구 개찰구를 통과하면 안내가 자동으로 열립니다.</small></p></div>
      ) : null}

      <div className="roadview__desktop-help" aria-hidden="true">
        <span><kbd>W A S D</kbd> 이동</span><span><kbd>마우스</kbd> 시점</span><span><kbd>개찰구</kbd> 자동 안내</span><span><kbd>M</kbd> 지도</span>
      </div>

      <div className="roadview__mobile-controls" aria-label="3D 로드뷰 이동 조작">
        <div className="roadview__dpad">
          <button type="button" aria-label="앞으로 이동" onPointerDown={() => setMovement('forward', true)} onPointerUp={() => setMovement('forward', false)} onPointerCancel={() => setMovement('forward', false)}>▲</button>
          <button type="button" aria-label="왼쪽으로 회전" onPointerDown={() => setMovement('turnLeft', true)} onPointerUp={() => setMovement('turnLeft', false)} onPointerCancel={() => setMovement('turnLeft', false)}>◀</button>
          <button type="button" aria-label="뒤로 이동" onPointerDown={() => setMovement('backward', true)} onPointerUp={() => setMovement('backward', false)} onPointerCancel={() => setMovement('backward', false)}>▼</button>
          <button type="button" aria-label="오른쪽으로 회전" onPointerDown={() => setMovement('turnRight', true)} onPointerUp={() => setMovement('turnRight', false)} onPointerCancel={() => setMovement('turnRight', false)}>▶</button>
        </div>
        <div className="roadview__mobile-gate-guide"><Icon name="train" /><span><strong>{nearGate ? nearGate.gateCode : 'AUTO GATE'}</strong><small>개찰구 통과 시 자동 안내</small></span></div>
      </div>

      {introOpen ? (
        <div className="roadview__overlay">
          <section className="roadview__intro" aria-labelledby="roadview-intro-title">
            <span className="roadview__eyebrow">ECO EXPRESS CENTRAL STATION</span>
            <h2 id="roadview-intro-title">에코 익스프레스 역을<br /><em>3D로 걸어보세요</em></h2>
            <p>두 개의 열차 플랫폼을 따라 4개 체험 부스와 실험역·교육역·리워드역을 둘러보세요. 각 입구의 개찰구를 통과하면 안내가 자동으로 열립니다.</p>
            <div className="roadview__intro-controls">
              <span><kbd>W A S D</kbd><small>역사 이동</small></span><span><kbd>드래그</kbd><small>시점 이동</small></span><span><kbd>개찰구 통과</kbd><small>안내 자동 열림</small></span>
            </div>
            <button type="button" className="roadview__enter" onClick={() => setIntroOpen(false)} autoFocus>에코 익스프레스 역 입장 <span>→</span></button>
          </section>
        </div>
      ) : null}

      {mapOpen ? (
        <div className="roadview__overlay roadview__overlay--panel" onMouseDown={(event) => event.target === event.currentTarget && setMapOpen(false)}>
          <section className="roadview__panel" role="dialog" aria-modal="true" aria-labelledby="roadview-map-title">
            <header><div><span>STATION DIRECTORY</span><h2 id="roadview-map-title">에코 익스프레스 역사 지도</h2></div><button type="button" onClick={() => setMapOpen(false)} aria-label="지도 닫기">×</button></header>
            <canvas ref={mapRef} className="roadview__map" aria-label="현재 위치, 두 개 플랫폼과 일곱 개 개찰구가 표시된 기차역 지도" />
            <p className="roadview__map-legend"><i /> 현재 위치 <b /> 역 개찰구</p>
          </section>
        </div>
      ) : null}

      {selectedBooth ? (
        <div className="roadview__overlay roadview__overlay--panel" onMouseDown={(event) => event.target === event.currentTarget && setSelectedBooth(null)}>
          <section className="roadview__panel roadview__booth-info" role="dialog" aria-modal="true" aria-labelledby="roadview-booth-title" style={{ '--roadview-accent': selectedBooth.color } as CSSProperties}>
            <header><div><span>{selectedBooth.label}</span><h2 id="roadview-booth-title">{selectedBooth.title}</h2></div><button type="button" onClick={() => setSelectedBooth(null)} aria-label="부스 안내 닫기">×</button></header>
            <div className="roadview__booth-symbol" aria-hidden="true"><span>{selectedBooth.gateCode}</span><small>GATE PASSED</small></div>
            <p>{selectedBooth.description}</p>
            <button type="button" className="roadview__panel-action" onClick={() => setSelectedBooth(null)}>역사로 돌아가기</button>
          </section>
        </div>
      ) : null}
    </section>
  )
}
