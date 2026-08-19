import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

type RoadView3DProps = {
  onClose: () => void
}

type RoadViewBooth = {
  id: number
  label: string
  title: string
  description: string
  color: string
  x: number
  y: number
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

const MAP = [
  '111111111111111111111111',
  '100000000000000000000001',
  '100222000000333000444001',
  '100222000000333000444001',
  '100000000000000000000001',
  '100000000000000000000001',
  '100011110000001111000001',
  '100010000000000001000001',
  '100010000000000001000001',
  '100000000000000000000001',
  '100000000000000000000001',
  '100010000000000001000001',
  '100010000000000001000001',
  '100011110000001111000001',
  '100000000000000000000001',
  '100555000000666000777001',
  '100555000000666000777001',
  '100000000000000000000001',
  '100000000000000000000001',
  '111111111111111111111111',
] as const

const BOOTHS: readonly RoadViewBooth[] = [
  { id: 1, label: 'HALL 01', title: '초고속 냉동사이클', description: 'KTX 초고속 환경에서 냉방을 유지하는 냉동공조 기술을 만나보세요.', color: '#3abff8', x: 4.5, y: 4.6 },
  { id: 2, label: 'BOOTH 01', title: '빙하 위 펭귄 구조', description: '녹는 빙하를 건너 펭귄이 안전한 곳에 도착하도록 도와주세요.', color: '#64e9ff', x: 13.5, y: 4.6 },
  { id: 3, label: 'BOOTH 02', title: '무더운 여름', description: '상황에 맞는 냉방 방법을 선택하고 에너지를 절약해 보세요.', color: '#ffb86b', x: 20.5, y: 4.6 },
  { id: 4, label: 'BOOTH 03', title: '동물들을 구하라', description: '생활 속 친환경 선택으로 기후 위기의 동물들을 지켜주세요.', color: '#55e6a5', x: 4.5, y: 14.4 },
  { id: 5, label: 'BOOTH 04', title: '나비효과', description: '작은 생활 습관이 지구의 미래를 어떻게 바꾸는지 확인해 보세요.', color: '#ffe173', x: 13.5, y: 14.4 },
  { id: 6, label: 'REWARD', title: '굿즈샵', description: '체험으로 모은 포인트로 에코 익스프레스 굿즈를 만나보세요.', color: '#7aa7ff', x: 20.5, y: 14.4 },
] as const

const WALL_COLORS: Record<string, [number, number, number]> = {
  '1': [28, 48, 70],
  '2': [20, 105, 139],
  '3': [22, 128, 101],
  '4': [151, 91, 58],
  '5': [34, 118, 93],
  '6': [147, 123, 44],
  '7': [52, 80, 145],
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

function nearestBooth(player: Player) {
  let result: RoadViewBooth | null = null
  let nearestDistance = 2.15
  for (const booth of BOOTHS) {
    const distance = Math.hypot(booth.x - player.x, booth.y - player.y)
    if (distance < nearestDistance) {
      result = booth
      nearestDistance = distance
    }
  }
  return result
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

  const sky = context.createLinearGradient(0, 0, 0, height * 0.56)
  sky.addColorStop(0, '#07192b')
  sky.addColorStop(1, '#173955')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height * 0.56)

  const floor = context.createLinearGradient(0, height * 0.48, 0, height)
  floor.addColorStop(0, '#183143')
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
    context.fillStyle = `rgba(105, 226, 255, ${Math.max(0, 0.12 - correctedDistance / 180)})`
    context.fillRect(screenX, top, 1, wallHeight)
  }

  const visibleBooths = BOOTHS.map((booth) => {
    const dx = booth.x - player.x
    const dy = booth.y - player.y
    return { booth, distance: Math.hypot(dx, dy), angle: normalizeAngle(Math.atan2(dy, dx) - player.angle) }
  }).filter(({ angle, distance }) => Math.abs(angle) < FOV * 0.68 && distance > 0.45)
    .sort((first, second) => second.distance - first.distance)

  for (const { booth, distance, angle } of visibleBooths) {
    const screenX = width / 2 + (Math.tan(angle) / Math.tan(FOV / 2)) * width / 2
    const depth = depthBuffer[Math.max(0, Math.min(depthBuffer.length - 1, Math.floor(screenX / columnWidth)))] ?? 30
    if (distance > depth + 0.5) continue
    const cardWidth = Math.max(54, Math.min(148, height / distance * 0.75))
    const cardHeight = cardWidth * 0.72
    const x = screenX - cardWidth / 2
    const y = height / 2 - cardHeight * 0.72

    context.save()
    context.shadowColor = booth.color
    context.shadowBlur = Math.min(28, 80 / distance)
    context.fillStyle = 'rgba(7, 23, 36, .88)'
    context.strokeStyle = booth.color
    context.lineWidth = Math.max(1.5, cardWidth / 46)
    drawRoundedRect(context, x, y, cardWidth, cardHeight, Math.max(8, cardWidth / 10))
    context.shadowBlur = 0
    context.fillStyle = booth.color
    context.font = `800 ${Math.max(7, cardWidth / 10)}px system-ui, sans-serif`
    context.textAlign = 'center'
    context.fillText(booth.label, screenX, y + cardHeight * 0.32)
    context.fillStyle = '#ffffff'
    context.font = `800 ${Math.max(8, cardWidth / 9)}px system-ui, sans-serif`
    context.fillText(booth.title, screenX, y + cardHeight * 0.62, cardWidth * 0.86)
    context.fillStyle = 'rgba(255,255,255,.68)'
    context.font = `700 ${Math.max(6, cardWidth / 13)}px system-ui, sans-serif`
    context.fillText(`${distance.toFixed(1)}m`, screenX, y + cardHeight * 0.84)
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

  context.fillStyle = '#071522'
  context.fillRect(0, 0, size, size)
  MAP.forEach((row, y) => {
    Array.from(row).forEach((cell, x) => {
      if (cell === '0') return
      const color = WALL_COLORS[cell] ?? WALL_COLORS['1']
      context.fillStyle = `rgba(${color.join(',')},.72)`
      context.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize - 0.5, cellSize - 0.5)
    })
  })

  for (const booth of BOOTHS) {
    context.fillStyle = booth.color
    context.beginPath()
    context.arc(offsetX + booth.x * cellSize, offsetY + booth.y * cellSize, Math.max(3, cellSize * 0.35), 0, Math.PI * 2)
    context.fill()
  }

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
  const playerRef = useRef<Player>({ x: 12, y: 10, angle: -Math.PI / 2 })
  const movementRef = useRef<Movement>({ ...EMPTY_MOVEMENT })
  const overlayRef = useRef({ introOpen: true, mapOpen: false, selectedBooth: null as RoadViewBooth | null })
  const [introOpen, setIntroOpen] = useState(true)
  const [mapOpen, setMapOpen] = useState(false)
  const [selectedBooth, setSelectedBooth] = useState<RoadViewBooth | null>(null)
  const [nearBooth, setNearBooth] = useState<RoadViewBooth | null>(null)

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
    let previousNearId: number | null = null
    let dragging = false
    let pointerX = 0

    const stopMovement = () => {
      movementRef.current = { ...EMPTY_MOVEMENT }
    }

    const interact = () => {
      const booth = nearestBooth(playerRef.current)
      if (booth) setSelectedBooth(booth)
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
      if (pressed && key === 'e') {
        event.preventDefault()
        interact()
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

      const booth = nearestBooth(player)
      const nearId = booth?.id ?? null
      if (nearId !== previousNearId) {
        previousNearId = nearId
        setNearBooth(booth)
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
    <section className="roadview" role="dialog" aria-modal="true" aria-label="에코 익스프레스 3D 로드뷰">
      <canvas ref={sceneRef} className="roadview__scene" aria-label="이동 가능한 3D 에코 익스프레스 전시장" />

      <header className="roadview__topbar">
        <div className="roadview__brand">
          <span className="roadview__brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span className="roadview__brand-copy"><strong>3D ROADVIEW</strong><small>INTERACTIVE EXHIBITION</small></span>
        </div>
        <div className="roadview__top-actions">
          <button type="button" onClick={() => setMapOpen(true)} aria-label="전시장 지도 열기">지도</button>
          <button type="button" className="roadview__close" onClick={onClose} aria-label="3D 로드뷰 닫기">×</button>
        </div>
      </header>

      <div className="roadview__crosshair" aria-hidden="true"><i /><i /></div>
      <p className="roadview__location"><span /> INTERACTIVE EXHIBITION · 6 ZONES</p>

      {nearBooth && !introOpen && !mapOpen && !selectedBooth ? (
        <button type="button" className="roadview__prompt" onClick={() => setSelectedBooth(nearBooth)}>
          <kbd>E</kbd><span><strong>{nearBooth.title}</strong> 안내 보기</span>
        </button>
      ) : null}

      <div className="roadview__desktop-help" aria-hidden="true">
        <span><kbd>W A S D</kbd> 이동</span><span><kbd>마우스</kbd> 시점</span><span><kbd>E</kbd> 안내</span><span><kbd>M</kbd> 지도</span>
      </div>

      <div className="roadview__mobile-controls" aria-label="3D 로드뷰 이동 조작">
        <div className="roadview__dpad">
          <button type="button" aria-label="앞으로 이동" onPointerDown={() => setMovement('forward', true)} onPointerUp={() => setMovement('forward', false)} onPointerCancel={() => setMovement('forward', false)}>▲</button>
          <button type="button" aria-label="왼쪽으로 회전" onPointerDown={() => setMovement('turnLeft', true)} onPointerUp={() => setMovement('turnLeft', false)} onPointerCancel={() => setMovement('turnLeft', false)}>◀</button>
          <button type="button" aria-label="뒤로 이동" onPointerDown={() => setMovement('backward', true)} onPointerUp={() => setMovement('backward', false)} onPointerCancel={() => setMovement('backward', false)}>▼</button>
          <button type="button" aria-label="오른쪽으로 회전" onPointerDown={() => setMovement('turnRight', true)} onPointerUp={() => setMovement('turnRight', false)} onPointerCancel={() => setMovement('turnRight', false)}>▶</button>
        </div>
        <button type="button" className="roadview__interact" onClick={() => nearBooth && setSelectedBooth(nearBooth)} disabled={!nearBooth}>E<small>안내</small></button>
      </div>

      {introOpen ? (
        <div className="roadview__overlay">
          <section className="roadview__intro" aria-labelledby="roadview-intro-title">
            <span className="roadview__eyebrow">CLIMATE TECH · DIGITAL TWIN</span>
            <h2 id="roadview-intro-title">전시장을 자유롭게<br /><em>3D로 걸어보세요</em></h2>
            <p>냉동공조 기술부터 환경 체험, 굿즈샵까지 6개 공간을 로드뷰로 먼저 둘러볼 수 있습니다.</p>
            <div className="roadview__intro-controls">
              <span><kbd>W A S D</kbd><small>이동</small></span><span><kbd>드래그</kbd><small>시점 이동</small></span><span><kbd>E</kbd><small>부스 안내</small></span>
            </div>
            <button type="button" className="roadview__enter" onClick={() => setIntroOpen(false)} autoFocus>전시장 입장하기 <span>→</span></button>
          </section>
        </div>
      ) : null}

      {mapOpen ? (
        <div className="roadview__overlay roadview__overlay--panel" onMouseDown={(event) => event.target === event.currentTarget && setMapOpen(false)}>
          <section className="roadview__panel" role="dialog" aria-modal="true" aria-labelledby="roadview-map-title">
            <header><div><span>FLOOR GUIDE</span><h2 id="roadview-map-title">에코 익스프레스 전시장</h2></div><button type="button" onClick={() => setMapOpen(false)} aria-label="지도 닫기">×</button></header>
            <canvas ref={mapRef} className="roadview__map" aria-label="현재 위치와 6개 부스가 표시된 전시장 지도" />
            <p className="roadview__map-legend"><i /> 현재 위치 <b /> 체험 부스</p>
          </section>
        </div>
      ) : null}

      {selectedBooth ? (
        <div className="roadview__overlay roadview__overlay--panel" onMouseDown={(event) => event.target === event.currentTarget && setSelectedBooth(null)}>
          <section className="roadview__panel roadview__booth-info" role="dialog" aria-modal="true" aria-labelledby="roadview-booth-title" style={{ '--roadview-accent': selectedBooth.color } as CSSProperties}>
            <header><div><span>{selectedBooth.label}</span><h2 id="roadview-booth-title">{selectedBooth.title}</h2></div><button type="button" onClick={() => setSelectedBooth(null)} aria-label="부스 안내 닫기">×</button></header>
            <div className="roadview__booth-symbol" aria-hidden="true"><span>{String(selectedBooth.id).padStart(2, '0')}</span></div>
            <p>{selectedBooth.description}</p>
            <button type="button" className="roadview__panel-action" onClick={() => setSelectedBooth(null)}>로드뷰로 돌아가기</button>
          </section>
        </div>
      ) : null}
    </section>
  )
}
