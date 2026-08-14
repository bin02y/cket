import { useState } from 'react'
import type { MissionId } from '../types'
import { Icon } from './Icon'
import { MissionExperience } from './MissionExperience'
import { PopupMissionExperience } from './PopupMissionExperience'
import { QuickBoothExperience } from './QuickBoothExperience'

type BoothGuideProps = {
  completedBooths: ReadonlySet<MissionId>
  onBoothComplete: (boothId: MissionId, bonusPoints?: number) => Promise<string | null>
  onOpenShop: () => void
}

type EnvironmentBooth = {
  id: MissionId
  number: string
  title: string
  description: string
  icon: 'snowflake' | 'wind' | 'paw' | 'butterfly'
  theme: 'ice' | 'summer' | 'nature' | 'butterfly'
}

const environmentBooths: readonly EnvironmentBooth[] = [
  {
    id: 5,
    number: '01',
    title: '녹는 빙하 위에서 펭귄을 구해내라!',
    description: '점점 높아지는 수면과 갈라지는 빙하를 살피며 펭귄이 안전한 곳으로 이동하도록 도와주세요.',
    icon: 'snowflake',
    theme: 'ice',
  },
  {
    id: 2,
    number: '02',
    title: '무더운 여름에서 살아남기',
    description: '더운 방에서 에어컨과 부채 중 상황에 맞는 냉방 방법을 선택해 에너지를 아껴보세요.',
    icon: 'wind',
    theme: 'summer',
  },
  {
    id: 3,
    number: '03',
    title: '기후 위기에서 동물들을 구하라',
    description: '에어컨 끄고 나가기, 쓰레기 분리수거 같은 선택으로 빙하와 동물들을 지켜주세요.',
    icon: 'paw',
    theme: 'nature',
  },
  {
    id: 4,
    number: '04',
    title: '나비효과로부터 지구를 지켜라',
    description: '두 개의 방을 살펴보고 에어컨 온도와 생활 습관이 만든 서로 다른 미래를 확인하세요.',
    icon: 'butterfly',
    theme: 'butterfly',
  },
]

export function BoothGuide({ completedBooths, onBoothComplete, onOpenShop }: BoothGuideProps) {
  const [activeBooth, setActiveBooth] = useState<MissionId | null>(null)

  if (activeBooth === 1) {
    return <MissionExperience isCompleted={completedBooths.has(1)} onComplete={() => onBoothComplete(1)} onBack={() => setActiveBooth(null)} />
  }

  if (activeBooth === 2 || activeBooth === 5) {
    return <QuickBoothExperience boothId={activeBooth} isCompleted={completedBooths.has(activeBooth)} onComplete={() => onBoothComplete(activeBooth)} onBack={() => setActiveBooth(null)} />
  }

  if (activeBooth === 3 || activeBooth === 4) {
    return <PopupMissionExperience mission={activeBooth} isCompleted={completedBooths.has(activeBooth)} onComplete={(bonus) => onBoothComplete(activeBooth, bonus)} onBack={() => setActiveBooth(null)} />
  }

  return (
    <main id="main-content" className="page booth-page">
      <section className="booth-hero" aria-labelledby="booth-hero-title">
        <div className="booth-hero__copy">
          <h1 id="booth-hero-title">배우고 선택하며<br /><em>지구를 지키는 여정</em></h1>
          <p className="booth-hero__description">달리는 열차 속 공조 기술부터 환경 부스, 리워드관까지 순서대로 즐겨보세요.</p>
        </div>
        <div className="booth-hero__map" aria-label="1관, 2관 환경 부스, 리워드관으로 이어지는 체험 동선" role="img">
          <div className="booth-map__rail" />
          <span className="booth-map__station booth-map__station--one"><i>1</i><strong>1관</strong><small>냉동사이클</small></span>
          <span className="booth-map__station booth-map__station--two"><i>2</i><strong>2관</strong><small>환경 부스</small></span>
          <span className="booth-map__station booth-map__station--three"><i><Icon name="shop" /></i><strong>리워드관</strong><small>굿즈 교환</small></span>
          <span className="booth-map__train"><Icon name="train" /></span>
        </div>
      </section>

      <nav className="booth-route" aria-label="전시관 체험 순서">
        <span><i>01</i><strong>1관</strong><small>초고속 냉동사이클</small></span>
        <Icon name="arrow" />
        <span><i>02</i><strong>2관</strong><small>환경 부스 4종</small></span>
        <Icon name="arrow" />
        <span><i>03</i><strong>리워드관</strong><small>포인트 굿즈 교환</small></span>
      </nav>

      <section className="booth-hall booth-hall--train" aria-labelledby="hall-one-title">
        <div className="booth-hall__visual" aria-hidden="true">
          <span className="booth-hall__number">01</span>
          <div className="booth-mini-train"><i /><i /><i /></div>
          <div className="booth-mini-rail" />
          <span className="booth-speed-chip"><Icon name="gauge" /> 350 km/h</span>
        </div>
        <div className="booth-hall__content">
          <h2 id="hall-one-title">달리는 열차 속에서 장비를 조정하여 살아남아라!</h2>
          <strong>초고속 냉동사이클 체험</strong>
          <p>초고속 환경에서 냉방이 유지되는 원리를 냉동 사이클 키트를 직접 제작하며 배우는 교육 프로그램입니다.</p>
          <div className="booth-hall__meta">
            <span><Icon name="snowflake" /> 냉동 사이클 핵심 원리</span>
            <span><Icon name="train" /> KTX 초고속 환경</span>
          </div>
          <button className="primary-button" type="button" onClick={() => setActiveBooth(1)}>{completedBooths.has(1) ? '체험 다시 보기' : '체험 시작하기'} <Icon name="arrow" /></button>
        </div>
      </section>

      <section className="environment-hall" aria-labelledby="environment-hall-title">
        <header className="environment-hall__heading">
          <div><h2 id="environment-hall-title">환경 부스 체험관</h2><p>네 가지 상황에서 나의 선택이 환경과 동물에게 어떤 변화를 만드는지 확인해 보세요.</p></div>
          <span className="environment-hall__count"><strong>4</strong> BOOTHS</span>
        </header>
        <div className="environment-booth-grid">
          {environmentBooths.map((booth) => {
            const isCompleted = completedBooths.has(booth.id)
            return (
              <article className={`environment-booth environment-booth--${booth.theme}`} key={booth.id}>
                <div className="environment-booth__topline"><span>BOOTH {booth.number}</span><em>{isCompleted ? <><Icon name="check" /> 스탬프 완료</> : '체험 가능'}</em></div>
                <span className="environment-booth__icon"><Icon name={booth.icon} /></span>
                <h3>{booth.title}</h3>
                <p>{booth.description}</p>
                <button type="button" onClick={() => setActiveBooth(booth.id)}>{isCompleted ? '체험 다시 보기' : '체험 시작하기'} <Icon name="arrow" /></button>
              </article>
            )
          })}
        </div>
      </section>

      <section className="reward-hall" aria-labelledby="reward-hall-title">
        <div className="reward-hall__icon"><Icon name="shop" /><i /><i /></div>
        <div><h2 id="reward-hall-title">체험 포인트를 원하는 굿즈로</h2><p>부스에서 모은 ECO POINT를 확인하고 일상 속 친환경 실천을 돕는 굿즈로 교환하세요.</p></div>
        <button className="primary-button" type="button" onClick={onOpenShop}>리워드관 입장 <Icon name="arrow" /></button>
      </section>
    </main>
  )
}
