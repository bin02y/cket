import { Icon } from './Icon'
import type { MissionId } from '../types'

type HomeDashboardProps = {
  participantName: string
  balance: number
  completedMissions: ReadonlySet<MissionId>
  onOpenMissions: () => void
}

const routeStops = ['탑승', '아카데미', '팝업 부스', '에코 피니시']

export function HomeDashboard({ participantName, balance, completedMissions, onOpenMissions }: HomeDashboardProps) {
  const completedCount = completedMissions.size
  const progress = (completedCount / 4) * 100
  const passportReady = completedCount > 0

  return (
    <main id="main-content" className="page home-page">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <span className="eyebrow"><span className="status-dot" /> SEOUL · ECO LINE</span>
          <p className="hero__welcome">반가워요, {participantName}님!</p>
          <h1 id="hero-title">지구의 내일로 향하는<br /><em>에코 익스프레스</em></h1>
          <p className="hero__description">KTX 초고속 공조 기술을 배우고, 일상 속 ESG 미션으로 더 시원한 지구를 만들어 보세요.</p>
          <button className="primary-button" type="button" onClick={onOpenMissions}>
            미션 여정 살펴보기 <Icon name="arrow" />
          </button>
        </div>

        <div className="hero__scene" aria-label="푸른 하늘과 풀밭을 달리는 에코 익스프레스 일러스트레이션" role="img">
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
          <span className="scene-label"><Icon name="train" /> NEXT STOP · ECO FUTURE</span>
        </div>
      </section>

      <section className="dashboard-grid" aria-label="나의 에코 익스프레스 현황">
        <article className="card journey-card">
          <div className="section-heading">
            <div>
              <span className="section-label">MY JOURNEY</span>
              <h2>오늘의 미션 여정</h2>
            </div>
            <span className="progress-number"><strong>{completedCount}</strong> / 4</span>
          </div>
          <div className="progress-track" aria-label={`전체 미션 4개 중 ${completedCount}개 완료`}>
            <span className="progress-track__fill" style={{ width: `${Math.max(completedCount === 0 ? 4 : progress, 4)}%` }} />
          </div>
          <div className="route-stops">
            {routeStops.map((stop, index) => (
              <div className={`route-stop${index === Math.min(completedCount, 3) ? ' route-stop--current' : ''}${index < completedCount ? ' route-stop--completed' : ''}`} key={stop}>
                <span className="route-stop__dot">{index < completedCount ? <Icon name="check" /> : index === Math.min(completedCount, 3) ? <Icon name="train" /> : index + 1}</span>
                <span>{stop}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card passport-card">
          <div className="passport-card__icon"><Icon name="sparkle" /></div>
          <div>
            <span className="section-label">ECO PASSPORT</span>
            <h2>{passportReady ? `${completedCount}번째 스탬프 도착!` : '첫 스탬프를 준비해요'}</h2>
            <p>{passportReady ? `${balance} ECO POINT와 함께 에코 여정이 기록되고 있어요.` : '미션을 완료하면 ECO POINT와 나만의 에코 스탬프를 받을 수 있어요.'}</p>
          </div>
          <span className="passport-card__stamp">{passportReady ? 'STAMPED' : 'READY'}</span>
        </article>
      </section>

      <section className="mission-preview" aria-labelledby="mission-preview-title">
        <div className="section-heading section-heading--wide">
          <div>
            <span className="section-label">NEXT EXPERIENCE</span>
            <h2 id="mission-preview-title">곧 만날 에코 미션</h2>
          </div>
          <button className="text-button" type="button" onClick={onOpenMissions}>전체 보기 <Icon name="arrow" /></button>
        </div>
        <div className="mission-preview__grid">
          <article className="mission-card mission-card--academy">
            <div className="mission-card__visual">
              <span className="mission-card__number">01</span>
              <div className="cooling-orbit"><span /><span /><span /><Icon name="sparkle" /></div>
            </div>
            <div className="mission-card__body">
              <span className="mission-type">ACADEMY · 공조 기술</span>
              <h3>냉동 사이클을 조립하라</h3>
              <p>압축·응축·팽창·증발의 흐름을 직관적인 영상으로 만나보세요.</p>
              <span className="coming-badge">체험 오픈 · 100P</span>
            </div>
          </article>
          <article className="mission-card mission-card--popup">
            <div className="mission-card__visual">
              <span className="mission-card__number">03</span>
              <div className="planet"><span className="planet__land" /><Icon name="leaf" /></div>
            </div>
            <div className="mission-card__body">
              <span className="mission-type">POP-UP · ESG 액션</span>
              <h3>기후 위기에서 동물을 구하라</h3>
              <p>나의 작은 선택으로 빙하와 숲, 그곳의 친구들을 지켜주세요.</p>
              <span className="coming-badge">체험 오픈 · 최대 210P</span>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
