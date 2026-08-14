import { Icon } from './Icon'
import type { TabId } from '../types'

type PlaceholderTab = Exclude<TabId, 'home' | 'booths'>

const sectionCopy: Record<PlaceholderTab, { eyebrow: string; title: string; body: string; phase: string }> = {
  missions: {
    eyebrow: 'MISSION LINE',
    title: '에코 미션',
    body: '공조 기술 아카데미와 팝업 부스 미션이 이곳에서 차례로 열립니다.',
    phase: 'PHASE 2 · 3',
  },
  wallet: {
    eyebrow: 'ECO WALLET',
    title: '포인트 지갑',
    body: '미션으로 모은 포인트와 나의 에코 활동 내역을 한눈에 확인하게 됩니다.',
    phase: 'PHASE 4',
  },
  shop: {
    eyebrow: 'REWARD STATION',
    title: '굿즈 숍',
    body: '지구를 위한 일상에 힘을 더해 줄 친환경 리워드가 도착할 예정입니다.',
    phase: 'PHASE 5',
  },
  my: {
    eyebrow: 'MY ECO PROFILE',
    title: '나의 에코 리포트',
    body: '나의 ECO LEVEL과 실천 기록, 계정 정보를 안전하게 관리할 수 있습니다.',
    phase: 'PHASE 6',
  },
}

type SectionPlaceholderProps = {
  section: PlaceholderTab
  onBackHome: () => void
}

export function SectionPlaceholder({ section, onBackHome }: SectionPlaceholderProps) {
  const copy = sectionCopy[section]

  return (
    <main id="main-content" className="page placeholder-page">
      <section className="placeholder-card">
        <div className="placeholder-card__icon"><Icon name={section} /></div>
        <span className="section-label">{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
        <span className="phase-chip">{copy.phase}에서 만나요</span>
        <button className="secondary-button" type="button" onClick={onBackHome}>
          홈으로 돌아가기 <Icon name="arrow" />
        </button>
      </section>
    </main>
  )
}
