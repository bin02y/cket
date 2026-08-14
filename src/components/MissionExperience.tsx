import { useState } from 'react'
import { Icon } from './Icon'
import { KtxDataPanel } from './KtxDataPanel'
import { TemperatureChart } from './TemperatureChart'
import { useSimulationPlayback } from '../hooks/useSimulationPlayback'

type MissionExperienceProps = {
  mission: 1 | 2
  isCompleted: boolean
  onComplete: () => Promise<string | null>
  onBack: () => void
}

const cycleStages = [
  { name: '압축', english: 'COMPRESS', value: '고온·고압', detail: '압축기가 냉매 기체를 힘껏 눌러 온도와 압력을 높여요.', icon: 'gauge' as const },
  { name: '응축', english: 'CONDENSE', value: '열 방출', detail: '뜨거운 냉매가 바깥으로 열을 내보내며 액체로 바뀌어요.', icon: 'wind' as const },
  { name: '팽창', english: 'EXPAND', value: '압력 하강', detail: '좁은 팽창밸브를 통과한 냉매의 압력과 온도가 뚝 떨어져요.', icon: 'thermometer' as const },
  { name: '증발', english: 'EVAPORATE', value: '실내 냉각', detail: '차가운 냉매가 객실의 열을 흡수해 시원한 바람을 만들어요.', icon: 'snowflake' as const },
]

const controlMoments = [
  { name: '출발', value: '29.8°C', detail: '승객이 탑승한 객실의 온도와 외부 열 부하를 센서가 확인해요.' },
  { name: '급속 냉각', value: '26.7°C', detail: '초기에는 풍량을 빠르게 높여 목표 온도까지 도달 시간을 줄여요.' },
  { name: '미세 제어', value: '24.4°C', detail: '목표에 가까워지면 출력을 세밀하게 낮춰 과냉각을 막아요.' },
  { name: '안정 운전', value: '24.0°C', detail: '승객과 외기 변화를 감지하며 쾌적 온도를 안정적으로 유지해요.' },
]

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

function RefrigerationFilm({ activeStage, isPlaying }: { activeStage: number; isPlaying: boolean }) {
  return (
    <div className={`refrigeration-film${isPlaying ? ' is-playing' : ''}`} aria-label={`냉동 사이클 ${cycleStages[activeStage].name} 단계 시각화`} role="img">
      <div className="cycle-pipe cycle-pipe--horizontal" />
      <div className="cycle-pipe cycle-pipe--vertical" />
      {cycleStages.map((stage, index) => (
        <div className={`cycle-unit cycle-unit--${index}${activeStage === index ? ' is-active' : ''}`} key={stage.name}>
          <span className="cycle-unit__index">0{index + 1}</span>
          <Icon name={stage.icon} />
          <strong>{stage.name}</strong>
          <small>{stage.english}</small>
        </div>
      ))}
      <div className="refrigerant-dot refrigerant-dot--one" />
      <div className="refrigerant-dot refrigerant-dot--two" />
      <div className="film-caption">
        <span>STEP {activeStage + 1}</span>
        <strong>{cycleStages[activeStage].value}</strong>
      </div>
    </div>
  )
}

function ControlFilm({ progress, activeMoment, isPlaying }: { progress: number; activeMoment: number; isPlaying: boolean }) {
  const cabinTemperature = Math.max(24, 29.8 - progress * 0.065).toFixed(1)

  return (
    <div className={`control-film${isPlaying ? ' is-playing' : ''}`} aria-label="KTX 객실 초고속 냉방 제어 실험 시각화" role="img">
      <div className="control-film__sky"><i /><i /><i /></div>
      <div className="control-film__train">
        <span className="control-film__window" />
        <span className="control-film__window" />
        <span className="control-film__window" />
        <div className="air-duct">
          <i /><i /><i /><i /><i />
        </div>
      </div>
      <div className="control-film__temperature">
        <span>COACH 04</span>
        <strong>{cabinTemperature}<small>°C</small></strong>
        <em>{activeMoment >= 2 ? '정밀 제어 중' : '급속 냉각 중'}</em>
      </div>
      <div className="control-film__status">
        <i /> SENSOR SYNC · {Math.round(progress)}%
      </div>
    </div>
  )
}

export function MissionExperience({ mission, isCompleted, onComplete, onBack }: MissionExperienceProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const { progress, isPlaying, togglePlayback, reset, seek } = useSimulationPlayback()
  const activeIndex = Math.min(Math.floor(progress / 25), 3)
  const isCycleMission = mission === 1
  const chapters = isCycleMission ? cycleStages : controlMoments
  const totalSeconds = isCycleMission ? 200 : 240
  const currentSeconds = totalSeconds * (progress / 100)
  const title = isCycleMission ? '냉동 사이클을 조립하라' : '초고속 냉방을 제어하라'
  const description = isCycleMission
    ? '냉매가 순환하며 객실의 열을 밖으로 옮기는 네 가지 순간을 따라가 보세요.'
    : '고정 출력과 센서 기반 스마트 제어의 온도 변화를 비교해 보세요.'

  async function finishMission() {
    if (isCompleted) {
      onBack()
      return
    }
    setIsSaving(true)
    setSaveError('')
    const error = await onComplete()
    setIsSaving(false)
    if (error) {
      setSaveError(error)
      return
    }
    onBack()
  }

  return (
    <main id="main-content" className="page experience-page">
      <button className="back-button" type="button" onClick={onBack}>
        <Icon name="chevronLeft" /> 아카데미 미션
      </button>

      <header className="experience-header">
        <div>
          <span className="section-label">MISSION 0{mission} · INTERACTIVE FILM</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <span className="experience-header__status"><i /> 가상 실험 연결됨</span>
      </header>

      <div className="experience-layout">
        <section className="simulation-player" aria-label={`${title} 영상 시각화 플레이어`}>
          <div className="simulation-player__screen">
            <div className="film-topbar">
              <span>REC · ECO TECH LAB</span>
              <span>KTX / COACH 04</span>
            </div>
            {isCycleMission ? (
              <RefrigerationFilm activeStage={activeIndex} isPlaying={isPlaying} />
            ) : (
              <ControlFilm progress={progress} activeMoment={activeIndex} isPlaying={isPlaying} />
            )}
            {progress >= 100 ? (
              <div className="film-complete" role="status">
                <span><Icon name="check" /></span>
                <strong>교육 영상 확인 완료</strong>
                <small>{isCompleted ? '이미 포인트가 적립된 미션입니다.' : `미션 ${mission} 기본 포인트를 받을 준비가 됐어요.`}</small>
                {saveError ? <p className="mission-save-error" role="alert">{saveError}</p> : null}
                <button type="button" onClick={finishMission} disabled={isSaving}>{isSaving ? '저장 중...' : isCompleted ? '미션 목록으로' : '완료하고 포인트 받기'} {!isSaving ? <Icon name="arrow" /> : null}</button>
              </div>
            ) : null}
          </div>

          <div className="player-controls">
            <button className="player-control-button" type="button" onClick={togglePlayback} aria-label={isPlaying ? '영상 일시정지' : '영상 재생'}>
              <Icon name={isPlaying ? 'pause' : 'play'} />
            </button>
            <div className="player-timeline">
              <input
                aria-label="영상 재생 위치"
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progress}
                onChange={(event) => seek(Number(event.currentTarget.value))}
                style={{ backgroundSize: `${progress}% 100%` }}
              />
              <div><span>{formatTime(currentSeconds)} / {formatTime(totalSeconds)}</span><span>{Math.round(progress)}%</span></div>
            </div>
            <button className="player-reset-button" type="button" onClick={reset} aria-label="영상 처음부터 보기">
              <Icon name="rotate" />
            </button>
          </div>
        </section>

        <KtxDataPanel mission={mission} progress={progress} />
      </div>

      <section className="chapter-panel" aria-labelledby="chapter-title">
        <div className="chapter-panel__heading">
          <div>
            <span className="section-label">CHAPTER GUIDE</span>
            <h2 id="chapter-title">{isCycleMission ? '냉기가 만들어지는 4단계' : '냉방 제어의 4가지 순간'}</h2>
          </div>
          <span>단계를 눌러 바로 확인하세요</span>
        </div>
        <div className="chapter-tabs" role="tablist" aria-label="영상 챕터">
          {chapters.map((chapter, index) => (
            <button
              className="chapter-tab"
              type="button"
              role="tab"
              aria-selected={activeIndex === index}
              onClick={() => seek(index * 25 + 0.1)}
              key={chapter.name}
            >
              <span>0{index + 1}</span>
              <strong>{chapter.name}</strong>
              <small>{chapter.value}</small>
            </button>
          ))}
        </div>
        <div className="chapter-insight" role="tabpanel">
          <span><Icon name={isCycleMission ? cycleStages[activeIndex].icon : 'sparkle'} /></span>
          <div>
            <small>지금 알아둘 포인트</small>
            <p>{chapters[activeIndex].detail}</p>
          </div>
        </div>
      </section>

      {mission === 2 ? <TemperatureChart progress={progress} /> : (
        <section className="cycle-summary" aria-label="냉동 사이클 핵심 요약">
          <div><Icon name="snowflake" /><span><small>열을 만드는 장치?</small><strong>아니요, 열을 옮기는 기술!</strong></span></div>
          <p>에어컨은 차가움을 새로 만드는 대신, 객실 안의 열을 냉매에 실어 밖으로 이동시킵니다.</p>
        </section>
      )}
    </main>
  )
}
