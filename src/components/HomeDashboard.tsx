import type { MissionId } from '../types'
import { Icon } from './Icon'

type HomeDashboardProps = {
  balance: number
  completedBooths: ReadonlySet<MissionId>
  onOpenBooths: () => void
}

const routeStops = ['1관', '빙하', '여름', '동물', '나비효과']

export function HomeDashboard({ balance, completedBooths, onOpenBooths }: HomeDashboardProps) {
  const completedCount = completedBooths.size
  const progress = (completedCount / 5) * 100
  const passportReady = completedCount === 5

  return (
    <main id="main-content" className="page home-page">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <h1 id="hero-title">지구의 내일로 향하는<br /><em>에코 익스프레스</em></h1>
          <p className="hero__description">KTX 초고속 냉동 공조 기술을 배우고<br />전시관에서 체험활동을 통해 더 시원한 지구를 만들어 보세요.</p>
          <button className="primary-button" type="button" onClick={onOpenBooths}>부스 체험 시작하기 <Icon name="arrow" /></button>
        </div>

        <div className="hero__scene" aria-label="푸른 하늘과 초원을 달리는 에코 익스프레스 일러스트레이션" role="img">
          <div className="sun" />
          <div className="cloud cloud--one" />
          <div className="cloud cloud--two" />
          <div className="hill hill--back" />
          <div className="hill hill--front" />
          <div className="train">
            <span className="train__light" />
            <span className="train__window train__window--one" />
            <span className="train__window train__window--two" />
            <span className="train__window train__window--three" />
            <span className="train__stripe" />
          </div>
          <div className="rail" />
          <div className="speed-line speed-line--one" />
          <div className="speed-line speed-line--two" />
        </div>
      </section>

      <section className="dashboard-grid" aria-label="나의 에코 익스프레스 현황">
        <article className="card journey-card">
          <div className="section-heading">
            <h2>오늘의 스탬프 여정</h2>
            <span className="progress-number"><strong>{completedCount}</strong> / 5</span>
          </div>
          <div className="progress-track" aria-label={`전체 스탬프 5개 중 ${completedCount}개 완료`}>
            <span className="progress-track__fill" style={{ width: `${Math.max(completedCount === 0 ? 4 : progress, 4)}%` }} />
          </div>
          <div className="route-stops">
            {routeStops.map((stop, index) => (
              <div className={`${index < completedCount ? 'route-stop route-stop--completed' : 'route-stop'}`} key={stop}>
                <span className="route-stop__dot">{index < completedCount ? <Icon name="check" /> : index + 1}</span>
                <span>{stop}</span>
              </div>
            ))}
          </div>
        </article>

        <article className={`card passport-card${passportReady ? ' passport-card--issued' : ''}`}>
          <div className="passport-card__icon"><Icon name={passportReady ? 'check' : 'sparkle'} /></div>
          <div>
            <h2>{passportReady ? 'ECO PASSPORT 발급 완료!' : `${completedCount} / 5 스탬프`}</h2>
            <p>{passportReady ? `모든 체험을 완주했습니다. ${balance.toLocaleString('ko-KR')} ECO POINT와 함께 여정을 기억하세요.` : `스탬프 ${5 - completedCount}개를 더 모으면 ECO PASSPORT를 받을 수 있어요.`}</p>
          </div>
          <span className="passport-card__stamp">{passportReady ? 'PASSPORT' : 'COLLECTING'}</span>
        </article>
      </section>

      <section className="mission-preview" aria-labelledby="booth-preview-title">
        <div className="section-heading section-heading--wide">
          <h2 id="booth-preview-title">추천 체험 부스</h2>
          <button className="text-button" type="button" onClick={onOpenBooths}>전체 보기 <Icon name="arrow" /></button>
        </div>
        <div className="mission-preview__grid">
          <article className="mission-card mission-card--academy">
            <div className="mission-card__visual"><span className="mission-card__number">01</span><div className="cooling-orbit"><span /><span /><span /><Icon name="sparkle" /></div></div>
            <div className="mission-card__body"><h3>초고속 냉동사이클 체험</h3><p>압축·응축·팽창·증발의 흐름을 KTX 환경의 영상 데이터로 만나보세요.</p><span className="coming-badge">스탬프 1개 · 100P</span></div>
          </article>
          <article className="mission-card mission-card--popup">
            <div className="mission-card__visual"><span className="mission-card__number">03</span><div className="planet"><span className="planet__land" /><Icon name="leaf" /></div></div>
            <div className="mission-card__body"><h3>기후 위기에서 동물들을 구하라</h3><p>작은 생활 습관을 선택해 빙하와 그곳의 동물 친구들을 지켜주세요.</p><span className="coming-badge">스탬프 1개 · 최대 210P</span></div>
          </article>
        </div>
      </section>
    </main>
  )
}
