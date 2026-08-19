import type { TabId } from '../types'
import { Icon } from './Icon'

const headerContent: Record<TabId, { eyebrow: string; title: string; step: string }> = {
  home: { eyebrow: 'JOURNEY DASHBOARD', title: '오늘의 여정', step: '01' },
  education: { eyebrow: 'HVAC ACADEMY', title: '교육', step: '02' },
  experiment: { eyebrow: 'VIRTUAL LAB', title: '실험', step: '03' },
  booths: { eyebrow: 'EXHIBITION GUIDE', title: '부스', step: '04' },
  shop: { eyebrow: 'REWARD STATION', title: '리워드', step: '05' },
  my: { eyebrow: 'MY ECO RECORD', title: '나의 기록', step: '06' },
}

type AppHeaderProps = {
  activeTab: TabId
}

export function AppHeader({ activeTab }: AppHeaderProps) {
  const content = headerContent[activeTab]

  return (
    <header className="app-header">
      <a className="app-header__context" href="#main-content" aria-label={`${content.title} 본문으로 이동`}>
        <span className="app-header__icon"><Icon name={activeTab} /></span>
        <span><small>{content.eyebrow}</small><strong>{content.title}</strong></span>
      </a>
      <span className="app-header__step"><i /> {content.step} / 06</span>
    </header>
  )
}
