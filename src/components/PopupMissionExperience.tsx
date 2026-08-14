import { useEffect, useRef, useState } from 'react'
import type { ComponentProps } from 'react'
import { Icon } from './Icon'

type PopupMissionExperienceProps = {
  mission: 3 | 4
  isCompleted: boolean
  onComplete: (bonusPoints: number) => Promise<string | null>
  onBack: () => void
}

type IconName = ComponentProps<typeof Icon>['name']

type Choice = {
  label: string
  caption: string
  icon: IconName
  isCorrect: boolean
  feedback: string
}

type Scenario = {
  place: string
  title: string
  prompt: string
  bonus: number
  choices: readonly [Choice, Choice]
}

const animalScenarios: readonly Scenario[] = [
  {
    place: 'ZONE 01 · 대기실',
    title: '아무도 없는 대기실을 발견했어요',
    prompt: '다음 체험까지 2시간 동안 비어 있는 공간입니다. 냉방을 어떻게 할까요?',
    bonus: 30,
    choices: [
      { label: '전원을 끄고 퇴실', caption: '빈 공간의 불필요한 냉방을 멈춰요', icon: 'leaf', isCorrect: true, feedback: '좋아요! 사용하지 않는 공간의 냉방을 끄면 전력 낭비와 탄소 배출을 함께 줄일 수 있어요.' },
      { label: '18°C로 계속 가동', caption: '다시 들어올 때 시원하도록 유지해요', icon: 'thermometer', isCorrect: false, feedback: '빈 공간을 과도하게 냉방하면 전력 사용이 늘고, 발전 과정의 온실가스가 빙하를 더 빠르게 녹여요.' },
    ],
  },
  {
    place: 'ZONE 02 · 푸드 스테이션',
    title: '간식을 먹고 포장지가 남았어요',
    prompt: '깨끗한 플라스틱 컵과 종이 포장지를 어떻게 처리할까요?',
    bonus: 30,
    choices: [
      { label: '재질별로 분리배출', caption: '내용물을 비우고 올바른 통에 넣어요', icon: 'recycle', isCorrect: true, feedback: '정확해요! 재활용 가능한 자원이 다시 쓰이면 새로운 자원을 만드는 에너지와 탄소가 줄어들어요.' },
      { label: '한 봉투에 함께 버리기', caption: '가까운 일반 쓰레기통에 넣어요', icon: 'warning', isCorrect: false, feedback: '섞여 버린 재활용품은 선별이 어려워 소각될 가능성이 커지고, 온실가스와 자원 낭비가 늘어요.' },
    ],
  },
  {
    place: 'ZONE 03 · 귀가 플랫폼',
    title: '집으로 돌아갈 시간이 되었어요',
    prompt: '목적지가 같은 참가자들과 이동할 수 있는 셔틀이 곧 출발합니다.',
    bonus: 30,
    choices: [
      { label: '셔틀·대중교통 이용', caption: '한 번의 이동을 여러 사람과 나눠요', icon: 'train', isCorrect: true, feedback: '멋져요! 함께 이동하면 한 사람당 발생하는 탄소를 크게 줄여 야생동물의 서식지를 지키는 데 도움이 돼요.' },
      { label: '혼자 승용차로 이동', caption: '조금 더 편한 방법을 선택해요', icon: 'car', isCorrect: false, feedback: '나 홀로 차량은 사람 한 명당 배출량이 커요. 가능한 날에는 대중교통이나 함께 타기를 선택해 보세요.' },
    ],
  },
]

const butterflyScenarios: readonly Scenario[] = [
  {
    place: 'ROOM A · COOLING LAB',
    title: '조금 더운 실내, 온도를 선택하세요',
    prompt: '현재 실내는 26°C입니다. 빠르게 쾌적함을 만들면서 에너지를 지킬 방법은 무엇일까요?',
    bonus: 45,
    choices: [
      { label: '24°C + 순환 바람', caption: '적정 온도와 공기 순환을 함께 사용해요', icon: 'wind', isCorrect: true, feedback: '좋은 조합이에요! 적정 온도에 공기 순환을 더하면 체감 온도는 낮추고 과도한 전력 사용은 막을 수 있어요.' },
      { label: '18°C 강풍 설정', caption: '가장 낮은 온도로 빠르게 식혀요', icon: 'thermometer', isCorrect: false, feedback: '과도하게 낮춘 설정은 실내를 필요 이상으로 냉각하고 에너지를 낭비해요. 목표 온도는 24~26°C가 좋아요.' },
    ],
  },
  {
    place: 'ROOM B · GREEN CAFE',
    title: '다음 방에서 음료를 주문했어요',
    prompt: '앞으로 여러 번 사용할 수 있는 선택이 작은 변화의 파동을 만듭니다.',
    bonus: 45,
    choices: [
      { label: '다회용 컵 사용', caption: '사용 후 반납 스테이션에 돌려줘요', icon: 'cup', isCorrect: true, feedback: '작지만 강한 나비효과예요! 반복해서 쓰는 컵은 일회용품 생산과 폐기에서 발생하는 탄소를 줄여요.' },
      { label: '일회용 컵 사용', caption: '마신 뒤 바로 버리는 컵을 선택해요', icon: 'warning', isCorrect: false, feedback: '짧게 쓰고 버린 컵도 생산·운송·폐기 전 과정에서 탄소를 만들어요. 다음에는 다회용을 선택해 보세요.' },
    ],
  },
]

function AnimalHabitat({ health, isDanger }: { health: number; isDanger: boolean }) {
  return (
    <div className={`animal-habitat${isDanger ? ' is-danger' : ''}`} role="img" aria-label={`북극 서식지 건강도 ${health}퍼센트`}>
      <div className="habitat-sky"><i /><i /></div>
      <div className="habitat-sun" />
      <div className="habitat-ice habitat-ice--back" />
      <div className="habitat-ice habitat-ice--front" style={{ width: `${Math.max(48, health)}%` }} />
      <span className="animal-token animal-token--bear" aria-label="북극곰">🐻‍❄️</span>
      <span className="animal-token animal-token--penguin" aria-label="펭귄">🐧</span>
      <span className="animal-token animal-token--seal" aria-label="물범">🦭</span>
      <div className="habitat-status">
        <span>HABITAT HEALTH</span>
        <strong>{health}%</strong>
        <div><i style={{ width: `${health}%` }} /></div>
      </div>
      {isDanger ? <div className="climate-warning"><Icon name="warning" /> 빙하가 녹고 있어요</div> : null}
    </div>
  )
}

function ButterflyRooms({ step, answers }: { step: number; answers: readonly boolean[] }) {
  return (
    <div className="butterfly-rooms" role="img" aria-label={`나비효과 체험 ${step + 1}번째 방`}>
      <div className="butterfly-path"><i /><i /><i /><i /></div>
      <div className={`room-card room-card--a${step === 0 ? ' is-current' : ''}${answers[0] === true ? ' is-saved' : ''}${answers[0] === false ? ' is-danger' : ''}`}>
        <span>ROOM A</span>
        <Icon name="thermometer" />
        <strong>COOLING LAB</strong>
        <small>{answers[0] === undefined ? '첫 번째 선택' : answers[0] ? '24°C · ECO' : '18°C · OVER'}</small>
      </div>
      <div className="butterfly-symbol"><Icon name="butterfly" /><span>작은 선택이<br />다음 방을 바꿔요</span></div>
      <div className={`room-card room-card--b${step === 1 ? ' is-current' : ''}${answers[1] === true ? ' is-saved' : ''}${answers[1] === false ? ' is-danger' : ''}`}>
        <span>ROOM B</span>
        <Icon name="cup" />
        <strong>GREEN CAFE</strong>
        <small>{answers[1] === undefined ? '두 번째 선택' : answers[1] ? 'REUSE · ECO' : 'DISPOSABLE'}</small>
      </div>
    </div>
  )
}

type ResultModalProps = {
  mission: 3 | 4
  score: number
  maxScore: number
  success: boolean
  isCompleted: boolean
  isSaving: boolean
  saveError: string
  onClaim: () => void
  onRetry: () => void
  onBack: () => void
}

function ResultModal({ mission, score, maxScore, success, isCompleted, isSaving, saveError, onClaim, onRetry, onBack }: ResultModalProps) {
  const modalRef = useRef<HTMLElement>(null)

  useEffect(() => {
    modalRef.current?.focus()
  }, [])

  return (
    <div className="mission-result-backdrop" role="presentation">
      <section ref={modalRef} tabIndex={-1} className={`mission-result-modal${success ? '' : ' is-retry'}`} role="dialog" aria-modal="true" aria-labelledby="mission-result-title">
        <div className="mission-result-modal__symbol"><Icon name={success ? 'check' : 'warning'} /></div>
        <h2 id="mission-result-title">{success ? '지구를 위한 선택, 모두 성공!' : '한 번 더 지구의 신호를 읽어볼까요?'}</h2>
        <p>{success ? '이 부스의 모든 친환경 선택을 찾아 동물과 지구의 내일을 지켰어요.' : '놓친 선택을 다시 살펴보면 더 많은 ECO POINT와 건강한 지구를 만들 수 있어요.'}</p>
        <div className="mission-result-score">
          <span>{success ? 'TOTAL ECO POINT' : '추가 ECO POINT'}</span>
          <strong>+{success ? 120 + score : score} P</strong>
          <small>{success ? `기본 120 P + 선택 보너스 ${score} P` : `선택 보너스 최대 ${maxScore} P`}</small>
        </div>
        <div className="reward-preview">
          <Icon name="shop" />
          <p><strong>포인트를 모아 리워드 스테이션으로!</strong><br />하단 리워드 탭에서 친환경 굿즈를 바로 확인할 수 있어요.</p>
        </div>
        {saveError ? <p className="mission-save-error" role="alert">{saveError}</p> : null}
        <div className="mission-result-actions">
          <button className="secondary-button" type="button" onClick={onRetry} disabled={isSaving}><Icon name="rotate" /> 다시 도전</button>
          <button className="primary-button" type="button" disabled={isSaving} onClick={success && !isCompleted ? onClaim : onBack}>{isSaving ? '스탬프 발급 중...' : success && !isCompleted ? '스탬프 받고 완료' : '부스 안내로'} {!isSaving ? <Icon name="arrow" /> : null}</button>
        </div>
      </section>
    </div>
  )
}

export function PopupMissionExperience({ mission, isCompleted, onComplete, onBack }: PopupMissionExperienceProps) {
  const scenarios = mission === 3 ? animalScenarios : butterflyScenarios
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [showResult, setShowResult] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const scenario = scenarios[step]
  const hasAnswered = answers[step] !== undefined
  const currentCorrect = answers[step] === true
  const correctCount = answers.filter(Boolean).length
  const score = scenarios.reduce((total, item, index) => total + (answers[index] ? item.bonus : 0), 0)
  const maxScore = scenarios.reduce((total, item) => total + item.bonus, 0)
  const health = Math.max(35, 100 - answers.filter((answer) => !answer).length * 28)

  function choose(isCorrect: boolean) {
    if (hasAnswered) return
    setAnswers((current) => [...current, isCorrect])
  }

  function continueMission() {
    if (!hasAnswered) return
    if (step < scenarios.length - 1) {
      setStep((current) => current + 1)
      return
    }
    setShowResult(true)
  }

  function retryMission() {
    setStep(0)
    setAnswers([])
    setShowResult(false)
    setSaveError('')
  }

  async function claimMission() {
    setIsSaving(true)
    setSaveError('')
    const error = await onComplete(score)
    setIsSaving(false)
    if (error) {
      setSaveError(error)
      return
    }
    onBack()
  }

  return (
    <main id="main-content" className="page popup-experience-page">
      <button className="back-button" type="button" onClick={onBack}><Icon name="chevronLeft" /> 부스 안내</button>

      <header className="popup-experience-header">
        <div>
          <h1>{mission === 3 ? '기후 위기에서 동물들을 구하라' : '나비효과로부터 지구를 지켜라'}</h1>
          <p>{mission === 3 ? '일상 속 세 번의 선택으로 빙하와 야생동물의 서식지를 회복하세요.' : '두 개의 방에서 내린 작은 선택이 지구에 어떤 파동을 만드는지 확인하세요.'}</p>
        </div>
        <div className="popup-score-chip" aria-label={`현재 추가 에코 포인트 ${score}점`}><Icon name="leaf" /><span><small>BONUS</small><strong>+{score} P</strong></span></div>
      </header>

      <div className="popup-progress" aria-label={`${scenarios.length}단계 중 ${step + 1}단계`}>
        {scenarios.map((item, index) => (
          <div className={`${index === step ? 'is-current' : ''}${answers[index] === true ? ' is-success' : ''}${answers[index] === false ? ' is-danger' : ''}`} key={item.place}>
            <span>{answers[index] === true ? <Icon name="check" /> : index + 1}</span>
            <small>{item.place.split(' · ')[0]}</small>
          </div>
        ))}
      </div>

      <div className="popup-experience-layout">
        <section className="climate-scene-card" aria-label="선택에 따른 환경 변화">
          <div className="climate-scene-card__topbar"><span>LIVE ECO SIMULATION</span><span>{mission === 3 ? 'ARCTIC ZONE' : 'BUTTERFLY HOUSE'}</span></div>
          {mission === 3 ? <AnimalHabitat health={health} isDanger={hasAnswered && !currentCorrect} /> : <ButterflyRooms step={step} answers={answers} />}
          <div className="climate-impact-strip">
            <span><Icon name={health >= 80 ? 'leaf' : 'warning'} /></span>
            <div><small>지구 상태</small><strong>{health >= 80 ? '회복 가능한 안정 상태' : '온실효과 심화 경고'}</strong></div>
            <em>{health}%</em>
          </div>
        </section>

        <section className="choice-panel" aria-labelledby="choice-title">
          <div className="choice-panel__step"><span>STEP {step + 1}</span><strong>{scenario.place}</strong></div>
          <h2 id="choice-title">{scenario.title}</h2>
          <p>{scenario.prompt}</p>
          <div className="choice-list">
            {scenario.choices.map((choice) => {
              const selected = hasAnswered && choice.isCorrect === currentCorrect
              const resultClass = hasAnswered && selected ? (choice.isCorrect ? ' is-correct' : ' is-wrong') : ''
              return (
                <button
                  className={`choice-button${resultClass}`}
                  type="button"
                  onClick={() => choose(choice.isCorrect)}
                  disabled={hasAnswered}
                  aria-pressed={selected}
                  key={choice.label}
                >
                  <span className="choice-button__icon"><Icon name={choice.icon} /></span>
                  <span><strong>{choice.label}</strong><small>{choice.caption}</small></span>
                  {selected ? <Icon name={choice.isCorrect ? 'check' : 'warning'} /> : null}
                </button>
              )
            })}
          </div>
          {hasAnswered ? (
            <div className={`choice-feedback${currentCorrect ? ' is-correct' : ' is-wrong'}`} role="status" aria-live="polite">
              <span><Icon name={currentCorrect ? 'check' : 'warning'} /></span>
              <p><strong>{currentCorrect ? `좋은 선택! +${scenario.bonus} ECO POINT` : '기후 경고! 다시 기억해 주세요'}</strong>{scenario.choices.find((choice) => choice.isCorrect === currentCorrect)?.feedback}</p>
            </div>
          ) : null}
          <button className="choice-next-button" type="button" onClick={continueMission} disabled={!hasAnswered}>
            {step === scenarios.length - 1 ? '체험 결과 확인' : '다음 선택으로'} <Icon name="arrow" />
          </button>
        </section>
      </div>

      <section className="eco-ripple-card" aria-label="선택 영향 요약">
        <div><Icon name={mission === 3 ? 'paw' : 'butterfly'} /></div>
        <p><span>MY ECO RIPPLE</span><strong>{correctCount === 0 ? '첫 친환경 선택을 기다리고 있어요' : `${correctCount}개의 좋은 선택이 지구에 퍼지고 있어요`}</strong></p>
        <em>{correctCount} / {scenarios.length}</em>
      </section>

      {showResult ? <ResultModal mission={mission} score={score} maxScore={maxScore} success={correctCount === scenarios.length} isCompleted={isCompleted} isSaving={isSaving} saveError={saveError} onClaim={claimMission} onRetry={retryMission} onBack={onBack} /> : null}
    </main>
  )
}
