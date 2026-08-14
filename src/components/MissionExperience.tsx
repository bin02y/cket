import { useState } from 'react'
import { Icon } from './Icon'
import { KtxDataPanel } from './KtxDataPanel'
import { useSimulationPlayback } from '../hooks/useSimulationPlayback'

type MissionExperienceProps = {
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

export function MissionExperience({ isCompleted, onComplete, onBack }: MissionExperienceProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const { progress, isPlaying, togglePlayback, reset, seek } = useSimulationPlayback()
  const activeIndex = Math.min(Math.floor(progress / 25), 3)
  const chapters = cycleStages
  const totalSeconds = 200
  const currentSeconds = totalSeconds * (progress / 100)
  const title = '냉동 사이클을 조립하라'
  const description = '냉매가 순환하며 객실의 열을 밖으로 옮기는 네 가지 순간을 따라가 보세요.'

  async function finishBooth() {
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
        <Icon name="chevronLeft" /> 부스 안내
      </button>

      <header className="experience-header">
        <div>
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
            <RefrigerationFilm activeStage={activeIndex} isPlaying={isPlaying} />
            {progress >= 100 ? (
              <div className="film-complete" role="status">
                <span><Icon name="check" /></span>
                <strong>교육 영상 확인 완료</strong>
                <small>{isCompleted ? '이미 스탬프가 발급된 체험입니다.' : '첫 번째 스탬프를 받을 준비가 됐어요.'}</small>
                {saveError ? <p className="mission-save-error" role="alert">{saveError}</p> : null}
                <button type="button" onClick={finishBooth} disabled={isSaving}>{isSaving ? '스탬프 발급 중...' : isCompleted ? '부스 안내로' : '스탬프 받고 완료'} {!isSaving ? <Icon name="arrow" /> : null}</button>
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

        <KtxDataPanel progress={progress} />
      </div>

      <section className="chapter-panel" aria-labelledby="chapter-title">
        <div className="chapter-panel__heading">
          <div>
            <h2 id="chapter-title">냉기가 만들어지는 4단계</h2>
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
          <span><Icon name={cycleStages[activeIndex].icon} /></span>
          <div>
            <small>지금 알아둘 포인트</small>
            <p>{chapters[activeIndex].detail}</p>
          </div>
        </div>
      </section>

      <section className="cycle-summary" aria-label="냉동 사이클 핵심 요약">
        <div><Icon name="snowflake" /><span><small>열을 만드는 장치?</small><strong>아니요, 열을 옮기는 기술!</strong></span></div>
        <p>에어컨은 차가움을 새로 만드는 대신, 객실 안의 열을 냉매에 실어 밖으로 이동시킵니다.</p>
      </section>
    </main>
  )
}
