import type { MissionId } from '../types'
import { Icon } from './Icon'

type HomeDashboardProps = {
  balance: number
  completedBooths: ReadonlySet<MissionId>
}

export function HomeDashboard({ balance, completedBooths }: HomeDashboardProps) {
  const completedCount = completedBooths.size
  const passportReady = completedCount === 5

  return (
    <main id="main-content" className="page home-page">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <h1 id="hero-title">지구의 내일로 향하는<br /><em>에코 익스프레스</em></h1>
        </div>

      </section>

      <section className="dashboard-grid" aria-label="나의 에코 익스프레스 현황">
        <article className={`card passport-card${passportReady ? ' passport-card--issued' : ''}`}>
          <div className="passport-card__icon"><Icon name="stamp" /></div>
          <div className="passport-card__copy">
            <h2>{passportReady ? 'ECO PASSPORT 발급 완료!' : `${completedCount}/5 스탬프`}</h2>
            <p>{passportReady ? `모든 체험을 완주했습니다. ${balance.toLocaleString('ko-KR')} ECO POINT와 함께 여정을 기억하세요.` : '모든 스탬프를 모으면 ECO PASSPORT를 받아요.'}</p>
          </div>
          <span className="passport-card__stamp"><Icon name={passportReady ? 'check' : 'stamp'} /><small>{passportReady ? 'ISSUED' : 'STAMP'}</small></span>
        </article>
      </section>
    </main>
  )
}
