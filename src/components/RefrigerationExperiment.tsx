import { useState } from 'react'
import { Icon } from './Icon'

const experimentStages = [
  {
    name: '압축',
    english: 'COMPRESS',
    icon: 'gauge' as const,
    temperature: '65°C',
    pressure: '고압',
    description: '압축기가 냉매 기체를 강하게 눌러 온도와 압력을 높입니다.',
    insight: '냉매가 뜨거워져 객실 밖으로 열을 내보낼 준비를 해요.',
  },
  {
    name: '응축',
    english: 'CONDENSE',
    icon: 'wind' as const,
    temperature: '38°C',
    pressure: '고압',
    description: '뜨거운 냉매가 외부 공기로 열을 내보내며 액체로 바뀝니다.',
    insight: '열을 방출한 냉매는 다음 냉각 단계를 향해 이동해요.',
  },
  {
    name: '팽창',
    english: 'EXPAND',
    icon: 'thermometer' as const,
    temperature: '5°C',
    pressure: '저압',
    description: '팽창밸브를 통과하며 냉매의 압력과 온도가 빠르게 낮아집니다.',
    insight: '차가워진 냉매가 객실의 열을 흡수할 준비를 마쳐요.',
  },
  {
    name: '증발',
    english: 'EVAPORATE',
    icon: 'snowflake' as const,
    temperature: '12°C',
    pressure: '저압',
    description: '냉매가 객실의 열을 흡수해 기체가 되면서 시원한 바람을 만듭니다.',
    insight: '에어컨은 차가움을 만드는 대신 실내의 열을 밖으로 옮겨요.',
  },
] as const

export function RefrigerationExperiment() {
  const [activeStage, setActiveStage] = useState(0)
  const stage = experimentStages[activeStage]

  return (
    <section className="experiment-lab" aria-labelledby="experiment-lab-title">
      <header className="experiment-lab__heading">
        <div>
          <span>VIRTUAL HVAC LAB</span>
          <h2 id="experiment-lab-title">냉동사이클 가상 실험</h2>
          <p>네 단계를 눌러 냉매의 온도와 압력이 어떻게 달라지는지 확인해 보세요.</p>
        </div>
        <strong><i /> 실험 연결됨</strong>
      </header>

      <div className="experiment-lab__layout">
        <div className="experiment-cycle" role="tablist" aria-label="냉동사이클 실험 단계">
          <div className="experiment-cycle__track" aria-hidden="true"><i /><i /></div>
          {experimentStages.map((item, index) => (
            <button
              className={index === activeStage ? 'is-active' : ''}
              type="button"
              role="tab"
              aria-selected={index === activeStage}
              aria-controls="experiment-stage-panel"
              onClick={() => setActiveStage(index)}
              key={item.name}
            >
              <span>0{index + 1}</span>
              <Icon name={item.icon} />
              <strong>{item.name}</strong>
              <small>{item.english}</small>
            </button>
          ))}
        </div>

        <article id="experiment-stage-panel" className="experiment-reading" role="tabpanel">
          <div className="experiment-reading__topline"><span>STEP 0{activeStage + 1}</span><em>{stage.english}</em></div>
          <div className="experiment-reading__icon"><Icon name={stage.icon} /></div>
          <h3>{stage.name} 단계</h3>
          <p>{stage.description}</p>
          <div className="experiment-reading__values">
            <span><small>냉매 온도</small><strong>{stage.temperature}</strong></span>
            <span><small>냉매 압력</small><strong>{stage.pressure}</strong></span>
          </div>
          <div className="experiment-reading__insight"><Icon name="sparkle" /><p><small>실험 포인트</small>{stage.insight}</p></div>
        </article>
      </div>
    </section>
  )
}
