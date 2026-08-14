import { Icon } from './Icon'

type KtxDataPanelProps = {
  mission: 1 | 2
  progress: number
}

const cycleReadings = [
  { label: '압축 구간', temperature: '78.0°C', pressure: '14.2 bar', airflow: '3.8 m/s' },
  { label: '응축 구간', temperature: '42.0°C', pressure: '13.7 bar', airflow: '4.1 m/s' },
  { label: '팽창 구간', temperature: '8.5°C', pressure: '3.4 bar', airflow: '3.6 m/s' },
  { label: '증발 구간', temperature: '12.0°C', pressure: '3.1 bar', airflow: '4.4 m/s' },
]

export function KtxDataPanel({ mission, progress }: KtxDataPanelProps) {
  const stageIndex = Math.min(Math.floor(progress / 25), 3)
  const cycleReading = cycleReadings[stageIndex]
  const cabinTemperature = Math.max(24, 29.8 - progress * 0.065).toFixed(1)
  const energySaving = Math.round(progress * 0.18)
  const controlError = Math.max(0.2, 2.4 - progress * 0.023).toFixed(1)

  return (
    <aside className="ktx-data-panel" aria-label="KTX 초고속 환경 가상 데이터">
      <div className="data-panel__header">
        <div>
          <span className="live-pill"><i /> VIRTUAL LIVE</span>
          <h2>KTX 350 데이터</h2>
        </div>
        <Icon name="train" />
      </div>

      <div className="speed-gauge" aria-label="열차 속도 시속 350킬로미터">
        <div className="speed-gauge__dial">
          <span className="speed-gauge__needle" style={{ transform: `rotate(${-110 + progress * 1.9}deg)` }} />
          <div><strong>350</strong><small>km/h</small></div>
        </div>
        <p>초고속 주행 모드</p>
      </div>

      {mission === 1 ? (
        <div className="sensor-grid">
          <article>
            <span>현재 구간</span>
            <strong>{cycleReading.label}</strong>
          </article>
          <article>
            <span>냉매 온도</span>
            <strong>{cycleReading.temperature}</strong>
          </article>
          <article>
            <span>배관 압력</span>
            <strong>{cycleReading.pressure}</strong>
          </article>
          <article>
            <span>토출 풍속</span>
            <strong>{cycleReading.airflow}</strong>
          </article>
        </div>
      ) : (
        <div className="sensor-grid">
          <article>
            <span>현재 객실</span>
            <strong>{cabinTemperature}°C</strong>
          </article>
          <article>
            <span>목표 온도</span>
            <strong>24.0°C</strong>
          </article>
          <article>
            <span>제어 오차</span>
            <strong>±{controlError}°C</strong>
          </article>
          <article>
            <span>에너지 절감</span>
            <strong>{energySaving}%</strong>
          </article>
        </div>
      )}

      <div className="data-source-note">
        <Icon name="gauge" />
        <p><strong>체험용 가상 센서</strong><br />실제 KTX가 아닌 교육 목적의 시뮬레이션 데이터입니다.</p>
      </div>
    </aside>
  )
}
