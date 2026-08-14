import { useState } from 'react'
import type { MissionId } from '../types'
import { Icon } from './Icon'

type QuickBoothExperienceProps = {
  boothId: 2 | 5
  isCompleted: boolean
  onComplete: () => Promise<string | null>
  onBack: () => void
}

const boothContent = {
  2: {
    title: '무더운 여름에서 살아남기',
    description: '창문을 열면 선선한 바람이 들어오는 더운 방입니다. 가장 먼저 어떤 행동을 할까요?',
    icon: 'wind' as const,
    choices: [
      { label: '창문을 열고 부채를 사용한다', correct: true, feedback: '좋은 선택이에요! 자연 바람과 부채로 전력 사용을 줄이면서 시원함을 만들었습니다.' },
      { label: '에어컨을 18°C로 강하게 켠다', correct: false, feedback: '지나치게 낮은 온도는 전력 사용과 온실가스 배출을 늘려요. 먼저 자연 바람과 부채를 활용해 보세요.' },
    ],
  },
  5: {
    title: '녹는 빙하 위에서 펭귄을 구해내라!',
    description: '펭귄 앞의 빙하가 갈라지고 수면이 빠르게 높아지고 있습니다. 어디로 안내할까요?',
    icon: 'snowflake' as const,
    choices: [
      { label: '단단한 빙하를 연결한 안전 통로로 이동한다', correct: true, feedback: '구조 성공! 갈라진 지점을 피해 펭귄이 안전한 서식지로 이동했습니다.' },
      { label: '현재 빙하 위에서 물이 빠질 때까지 기다린다', correct: false, feedback: '수면은 계속 높아지고 있어 위험해요. 균열이 없는 단단한 빙하로 빠르게 이동해야 합니다.' },
    ],
  },
} as const

export function QuickBoothExperience({ boothId, isCompleted, onComplete, onBack }: QuickBoothExperienceProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const content = boothContent[boothId]
  const selectedChoice = selectedIndex === null ? null : content.choices[selectedIndex]

  async function completeBooth() {
    setIsSaving(true)
    setSaveError('')
    const error = await onComplete()
    setIsSaving(false)
    if (error) setSaveError(error)
    else onBack()
  }

  return (
    <main id="main-content" className="page quick-booth-page">
      <button className="back-button" type="button" onClick={onBack}><Icon name="chevronLeft" /> 부스 안내</button>
      <section className="quick-booth-card" aria-labelledby="quick-booth-title">
        <span className="quick-booth-card__icon"><Icon name={content.icon} /></span>
        <h1 id="quick-booth-title">{content.title}</h1>
        <p>{content.description}</p>

        <div className="quick-booth-choices" aria-label="행동 선택">
          {content.choices.map((choice, index) => (
            <button className={selectedIndex === index ? 'is-selected' : ''} type="button" key={choice.label} onClick={() => setSelectedIndex(index)}>
              <span>{index + 1}</span>{choice.label}
            </button>
          ))}
        </div>

        {selectedChoice ? (
          <div className={`quick-booth-feedback ${selectedChoice.correct ? 'is-success' : 'is-danger'}`} role="status">
            <Icon name={selectedChoice.correct ? 'check' : 'warning'} />
            <p><strong>{selectedChoice.correct ? '올바른 선택입니다' : '다시 생각해 보세요'}</strong>{selectedChoice.feedback}</p>
          </div>
        ) : null}

        {saveError ? <p className="experience-save-error" role="alert">{saveError}</p> : null}
        <div className="quick-booth-actions">
          {isCompleted ? <button className="primary-button" type="button" onClick={onBack}>부스 안내로</button> : selectedChoice?.correct ? <button className="primary-button" type="button" disabled={isSaving} onClick={completeBooth}>{isSaving ? '스탬프 발급 중...' : '스탬프 받기'} <Icon name="arrow" /></button> : <button className="primary-button" type="button" disabled>{selectedChoice ? '다른 선택을 골라보세요' : '행동을 선택해 주세요'}</button>}
        </div>
        {isCompleted ? <p className="quick-booth-completed"><Icon name="check" /> 이미 스탬프를 받은 부스입니다.</p> : null}
      </section>
    </main>
  )
}
